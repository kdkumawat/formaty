import { isCurlCommand, parseCurl } from "@/lib/curl/parseCurl";
import { detectFormat } from "./detect";
import { parseInput } from "./index";
import { INPUT_FORMAT_LABELS, type FormatKind, type InputFormatKind } from "./types";

/** A way out offered next to a problem: read the input as `format`, or `null` to go back to Auto. */
export interface ProblemAction {
  label: string;
  format: InputFormatKind | null;
}

export interface InputProblem {
  /** Plain sentence(s) for the user. Already names the line and column when they are known. */
  message: string;
  /** Line the problem points at, for a "Go to line" button. */
  line: number | null;
  actions: ProblemAction[];
}

export interface ProblemContext {
  /** The editor text. */
  input: string;
  /** The technical failure text (an exception message). Never shown to the user. */
  raw: string;
  /** Format the input is being read as now (forced one, or the detected one). */
  format: InputFormatKind;
  /** The format picked under "Read as", or null for Auto. */
  forced: InputFormatKind | null;
}

const BACK_TO_AUTO: ProblemAction = { label: "Back to Auto", format: null };
const MAX_CHECK_CHARS = 2_000_000;

const phrase = (f: InputFormatKind) => (f === "curl" ? "a cURL command" : INPUT_FORMAT_LABELS[f]);

/** Line and column (both 1-based) of a character index. */
function locate(text: string, at: number) {
  const before = text.slice(0, at);
  const line = before.split("\n").length;
  return { line, column: at - before.lastIndexOf("\n") };
}

/* ---- JSON: find the first error ourselves, so the answer does not depend on the browser's wording ---- */

type Expect = "value" | "name" | "colon" | "next" | "end" | "string";
const NUMBER_OR_WORD = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/y;

function findJsonError(s: string): { at: number; expected: Expect } | null {
  if (s.length > MAX_CHECK_CHARS) return null;
  let i = 0;
  const n = s.length;
  const fail = (expected: Expect): never => {
    throw { at: i, expected };
  };
  const ws = () => {
    while (i < n && (s[i] === " " || s[i] === "\t" || s[i] === "\n" || s[i] === "\r")) i++;
  };
  const string = () => {
    i++;
    while (i < n && s[i] !== '"') {
      if (s[i] === "\\") i++;
      else if (s[i] < " ") fail("string");
      i++;
    }
    if (i >= n) fail("string");
    i++;
  };
  const value = (): void => {
    ws();
    const c = s[i];
    if (c === "{") {
      i++;
      ws();
      if (s[i] === "}") return void i++;
      for (;;) {
        ws();
        if (s[i] !== '"') fail("name");
        string();
        ws();
        if (s[i] !== ":") fail("colon");
        i++;
        value();
        ws();
        if (s[i] === ",") i++;
        else if (s[i] === "}") return void i++;
        else fail("next");
      }
    }
    if (c === "[") {
      i++;
      ws();
      if (s[i] === "]") return void i++;
      for (;;) {
        value();
        ws();
        if (s[i] === ",") i++;
        else if (s[i] === "]") return void i++;
        else fail("next");
      }
    }
    if (c === '"') return string();
    NUMBER_OR_WORD.lastIndex = i;
    const m = NUMBER_OR_WORD.exec(s);
    if (!m) fail("value");
    else i += m[0].length;
  };
  try {
    value();
    ws();
    if (i < n) fail("end");
    return null;
  } catch (e) {
    return e && typeof e === "object" && "at" in e ? (e as { at: number; expected: Expect }) : null; // too deep to scan: no location
  }
}

function charName(ch: string) {
  if (ch === '"') return "double quote";
  if (ch === "'") return "single quote";
  if (ch === "\n" || ch === "\r") return "line break";
  if (ch === "\t") return "tab";
  return `"${ch}"`;
}

function jsonProblem(input: string): Pick<InputProblem, "message" | "line"> | null {
  const err = findJsonError(input);
  if (!err) return null;
  if (err.at >= input.length) {
    return { message: "This JSON ends too soon. A closing bracket, brace or quote is missing.", line: locate(input, input.length).line };
  }
  const ch = input[err.at];
  const { line, column } = locate(input, err.at);
  const prev = input.slice(0, err.at).trimEnd().slice(-1);
  const afterComma = prev === "," && (ch === "}" || ch === "]");
  const hint =
    afterComma
      ? "Remove the comma before it."
      : ch === "'"
        ? "Property names and strings need double quotes."
        : err.expected === "name"
          ? "Property names must be in double quotes."
          : err.expected === "colon"
            ? "A colon is missing after the property name."
            : err.expected === "next"
              ? ch === "}" || ch === "]"
                ? "The brackets and braces do not match."
                : "A comma may be missing before it."
              : err.expected === "end"
                ? "Nothing may follow the JSON value."
                : err.expected === "string"
                  ? "Write line breaks and tabs inside a string as \\n and \\t."
                  : "A value is expected here.";
  return { message: `Unexpected ${charName(ch)} at line ${line}, column ${column}. ${hint}`, line };
}

/* ---- the other formats: translate the parser's own wording ---- */

function yamlProblem(raw: string): Pick<InputProblem, "message" | "line"> | null {
  const m = /\((\d+):(\d+)\)/.exec(raw);
  if (!m) return null;
  const [line, col] = [Number(m[1]), Number(m[2])];
  const where = `at line ${line}, column ${col}`;
  const message = /bad indentation/.test(raw)
    ? `Indentation is off ${where}. Use spaces and keep keys at the same level aligned.`
    : /duplicated mapping key/.test(raw)
      ? `A key is repeated ${where}. Each key can appear once per level.`
      : /end of the stream within a/.test(raw)
        ? `A bracket or brace is not closed ${where}. Add the missing closing character.`
        : /tab/.test(raw)
          ? `A tab character is used ${where}. YAML needs spaces for indentation.`
          : `YAML could not be read ${where}. Check the indentation and colons around it.`;
  return { message, line };
}

function tomlProblem(raw: string): Pick<InputProblem, "message" | "line"> | null {
  const m = /row (\d+), col (\d+)/.exec(raw);
  if (!m) return null;
  const [line, col] = [Number(m[1]), Number(m[2])];
  const where = `at line ${line}, column ${col}`;
  const message = /without value/.test(raw)
    ? `A key has no value ${where}. Write it as key = value.`
    : /redefine/.test(raw)
      ? `A key is defined twice ${where}. Remove or rename one of them.`
      : /Unterminated string/.test(raw)
        ? `A string is not closed ${where}. Add the closing quote.`
        : `TOML could not be read ${where}. Each line should be key = value or a [table] header.`;
  return { message, line };
}

function csvProblem(raw: string): Pick<InputProblem, "message" | "line"> | null {
  const line = Number(/\(line (\d+)\)/.exec(raw)?.[1]) || null;
  const counts = /expected (\d+) fields but parsed (\d+)/.exec(raw);
  if (counts && line) {
    const [want, got] = [Number(counts[1]), Number(counts[2])];
    return {
      message:
        got < want
          ? `Line ${line} has ${got} values but the header has ${want}. Add the missing values, or quote fields that contain commas.`
          : `Line ${line} has ${got} values but the header has ${want}. Quote any field that contains a comma.`,
      line,
    };
  }
  if (/Quoted field unterminated/.test(raw)) {
    return { message: `A quoted field is not closed${line ? ` at line ${line}` : ""}. Add the closing quote.`, line };
  }
  return null;
}

function curlProblem(raw: string): Pick<InputProblem, "message" | "line"> | null {
  if (/Could not find URL/.test(raw)) {
    return { message: "No address found in this cURL command. Add a URL that starts with http:// or https://.", line: null };
  }
  if (/Not a curl command/.test(raw)) {
    return {
      message: "This does not start with curl. Start the command with curl and an address, or choose another format under Read as.",
      line: null,
    };
  }
  return null;
}

/** True when `input` reads cleanly as `format`. Only used on the error path, so a sync parse is fine. */
function readsAs(input: string, format: InputFormatKind): boolean {
  if (input.length > MAX_CHECK_CHARS) return false;
  try {
    if (format === "curl") {
      if (!isCurlCommand(input)) return false;
      parseCurl(input);
    } else {
      parseInput(input, format as FormatKind);
    }
    return true;
  } catch {
    return false;
  }
}

function hostOf(input: string): string | null {
  try {
    return new URL(parseCurl(input).url).host;
  } catch {
    return null;
  }
}

const NOT_RECOGNISED =
  "This does not look like JSON, XML, YAML, TOML, CSV or cURL. Paste data in one of these formats, or choose one under Read as.";

/**
 * Turns any failure on the Transform side into a message in the user's terms, with the line it points at and,
 * when a format is forced, the way out. Pure: the one place where failures become words.
 */
export function explainProblem({ input, raw, format, forced }: ProblemContext): InputProblem {
  const done = (message: string, line: number | null = null, actions: ProblemAction[] = []): InputProblem => ({
    message,
    line,
    actions: forced ? [...actions, ...(actions.some((a) => a.format === null) ? [] : [BACK_TO_AUTO])] : actions,
  });
  const only = (message: string, line: number | null = null) => ({ message, line, actions: [] as ProblemAction[] });

  // Failures that have nothing to do with the format.
  if (/too large|exceeds cap/i.test(raw)) {
    return only("This input is too large to process in the browser (limit 200 MB). Split it, or remove data you do not need.");
  }
  if (/^worker\b/i.test(raw)) {
    return only("The background worker stopped while working on this. Try again, and reload the page if it keeps happening.");
  }
  if (/timed out|timeout/i.test(raw)) {
    return only("The request took longer than 30 seconds and was stopped. Check the address, or try again.");
  }
  if (/failed to fetch|networkerror|load failed|network request failed/i.test(raw)) {
    const host = format === "curl" ? hostOf(input) : null;
    return only(
      host
        ? `Could not reach ${host}. The server may be offline, the address may be wrong, or it may not allow requests from a browser (CORS).`
        : "Could not reach the server. It may be offline, the address may be wrong, or it may not allow requests from a browser (CORS).",
    );
  }
  if (/^Conversion failed/i.test(raw)) return only("Could not write this data in that output format. Try another output.");
  if (/^Operation failed/i.test(raw)) return only("Could not finish that action on this input. Check the input, or try another output.");
  if (/^Schema is required/i.test(raw)) return only("Add a JSON Schema to validate against.");
  if (/^Invalid schema/i.test(raw)) return only("That schema could not be read. Paste a JSON Schema as JSON or YAML.");

  // The format picked under "Read as" does not fit, but something else does.
  if (forced) {
    const seen = detectFormat(input);
    if (seen !== forced && readsAs(input, seen)) {
      return done(`This looks like ${phrase(seen)}, not ${phrase(forced)}.`, null, [
        { label: `Read as ${INPUT_FORMAT_LABELS[seen]}`, format: seen },
        BACK_TO_AUTO,
      ]);
    }
  }

  const trimmed = input.trimStart();
  const known =
    format === "json"
      ? !forced && !/^(?:[{["]|-?\d|true\b|false\b|null\b)/.test(trimmed)
        ? only(NOT_RECOGNISED)
        : jsonProblem(input)
      : format === "yaml"
        ? yamlProblem(raw)
        : format === "toml"
          ? tomlProblem(raw)
          : format === "csv"
            ? csvProblem(raw)
            : format === "curl"
              ? curlProblem(raw)
              : /No XML elements/.test(raw)
                ? { message: "No XML elements found. XML starts with a tag like <root>.", line: null }
                : null;
  if (known) return done(known.message, known.line);

  return done(`Could not read this as ${INPUT_FORMAT_LABELS[format]}. Check the content, or choose another format under Read as.`);
}
