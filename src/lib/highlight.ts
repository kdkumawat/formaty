/**
 * Static syntax colouring for text shown outside Monaco (landing demo, tool pages, docs).
 * One tokenizer for every language; the kinds map onto the playground editor theme's token
 * colours (see TOKEN_COLORS in utils/monacoThemes.ts). Not a parser: good-enough lexing.
 */
export type Kind = "plain" | "key" | "string" | "number" | "keyword" | "bool" | "comment" | "punct";
export interface Token {
  text: string;
  kind: Kind;
}
export type HighlightLang = "json" | "yaml" | "xml" | "toml" | "csv" | "sql" | "code" | "bash" | "text";

/** Past this many characters the text is returned uncoloured, so typing in a big paste stays cheap. */
const MAX_CHARS = 20000;

interface Ctx {
  /** Last token that was not whitespace, before any merging. */
  prev?: Token;
  /** Newlines consumed so far. */
  line: number;
  /** Only whitespace so far on the current line. */
  lineStart: boolean;
}
type Rule = [re: RegExp, kind: Kind | ((m: string, c: Ctx) => Kind | Token[]), when?: (c: Ctx) => boolean];

const r = (src: string, flags = "") => new RegExp(src, `${flags}y`);

function scan(code: string, rules: Rule[]): Token[] {
  const out: Token[] = [];
  const ctx: Ctx = { line: 0, lineStart: true };
  const push = (t: Token) => {
    const last = out[out.length - 1];
    if (last && last.kind === t.kind) last.text += t.text;
    else out.push({ ...t });
  };
  let i = 0;
  while (i < code.length) {
    let text = "";
    let toks: Token[] | null = null;
    for (const [re, kind, when] of rules) {
      if (when && !when(ctx)) continue;
      re.lastIndex = i;
      const m = re.exec(code);
      if (!m || !m[0]) continue;
      text = m[0];
      const k = typeof kind === "function" ? kind(text, ctx) : kind;
      toks = typeof k === "string" ? [{ text, kind: k }] : k;
      break;
    }
    if (!toks) {
      text = code[i];
      toks = [{ text, kind: "plain" }];
    }
    toks.forEach(push);
    const sig = toks.filter((t) => t.text.trim()).pop();
    if (sig) ctx.prev = sig;
    i += text.length;
    const nl = text.lastIndexOf("\n");
    if (nl >= 0) {
      ctx.line += text.split("\n").length - 1;
      ctx.lineStart = /^[ \t]*$/.test(text.slice(nl + 1));
    } else if (/\S/.test(text)) ctx.lineStart = false;
  }
  return out;
}

const NUM = String.raw`-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?`;
const DQ = String.raw`"(?:\\.|[^"\\\n])*"`;
const SQ = String.raw`'(?:\\.|[^'\\\n])*'`;
const wordSet = (s: string) => new Set(s.split(" "));

const JSON_RULES: Rule[] = [
  [r(`${DQ}(?=\\s*:)`), "key"],
  [r(DQ), "string"],
  [r(NUM), "number"],
  [r(String.raw`(?:true|false|null)\b`), "bool"],
  [r(String.raw`[{}\[\],:]`), "punct"],
];

const YAML_END = String.raw`(?=[ \t]*(?:[#,\]}]|\r?\n|$))`;
const YAML_RULES: Rule[] = [
  [r(String.raw`(?<![^\s])#[^\n]*`), "comment"],
  [r(`${DQ}(?=\\s*:)|${SQ}(?=\\s*:)`), "key"],
  [r(String.raw`[^\s#:'"\-\[\]{},|>][^:#\n]*?(?=:(?:\s|$))`), "key"],
  [r(`${DQ}|${SQ}`), "string"],
  [r(`${NUM}${YAML_END}`), "number"],
  [r(`(?:true|false|null|yes|no|~)${YAML_END}`, "i"), "bool"],
  [r(String.raw`:(?=\s|$)|-(?=\s)|---|\.\.\.|[\[\]{},|>]`), "punct"],
  // A plain value after "key:" or "- ".
  [r(String.raw`[^\s#\[\]{}][^#\n]*?(?=\s+#|\s*$|\s*\n)`, "m"), "string", (c) => c.prev?.kind === "punct" && (c.prev.text === ":" || c.prev.text === "-")],
];

const TAG_RULES: Rule[] = [
  [r(String.raw`</?`), "punct"],
  [r(String.raw`/?>|=`), "punct"],
  [r(`"[^"]*"|'[^']*'`), "string"],
  [r(String.raw`[\w:.-]+`), (_, c) => (c.prev?.kind === "punct" && /^<\/?$/.test(c.prev.text) ? "key" : "number")],
];
const XML_RULES: Rule[] = [
  [r(String.raw`<!--[\s\S]*?-->`), "comment"],
  [r(String.raw`<!\[CDATA\[[\s\S]*?\]\]>`), "string"],
  [r(String.raw`<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>`, "i"), "keyword"],
  [r(String.raw`</?[\w:.-]+(?:"[^"]*"|'[^']*'|[^>"'])*>`), (m) => scan(m, TAG_RULES)],
];

const TOML_RULES: Rule[] = [
  [r(String.raw`#[^\n]*`), "comment"],
  [r(String.raw`\[\[?[^\]\n]+\]\]?`), "keyword", (c) => c.lineStart],
  [r(String.raw`"[^"\n]*"(?=[ \t]*=)|'[^'\n]*'(?=[ \t]*=)`), "key"],
  [r(String.raw`[\w.-]+(?=[ \t]*=)`), "key"],
  [r(String.raw`"""[\s\S]*?"""|'''[\s\S]*?'''|${DQ}|'[^'\n]*'`), "string"],
  [r(String.raw`\d{4}-\d\d-\d\d(?:[T ]\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)?)?`), "number"],
  [r(String.raw`[+-]?\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?`), "number"],
  [r(String.raw`(?:true|false|inf|nan)\b`), "bool"],
  [r(String.raw`[=\[\]{},]`), "punct"],
];

const CSV_END = String.raw`(?=[ \t]*(?:,|\r?\n|$))`;
const CSV_RULES: Rule[] = [
  [r(String.raw`"(?:""|[^"])*"|[^,\r\n"]+`), "key", (c) => c.line === 0],
  [r(String.raw`"(?:""|[^"])*"`), "string"],
  [r(`${NUM}${CSV_END}`), "number"],
  [r(`(?:true|false|null)${CSV_END}`), "bool"],
  [r(","), "punct"],
];

const SQL_WORDS = wordSet(
  "SELECT FROM WHERE AND OR NOT NULL IN IS AS ON JOIN LEFT RIGHT INNER OUTER GROUP BY ORDER LIMIT OFFSET HAVING DISTINCT UNION ALL " +
    "INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE ALTER ADD DROP INDEX IF EXISTS PRIMARY KEY FOREIGN REFERENCES UNIQUE DEFAULT CHECK CONSTRAINT " +
    "TRUE FALSE LIKE BETWEEN CASE WHEN THEN ELSE END ASC DESC " +
    "INTEGER INT BIGINT SMALLINT TEXT VARCHAR CHAR BOOLEAN BOOL REAL FLOAT DOUBLE DECIMAL NUMERIC DATE TIME TIMESTAMP TIMESTAMPTZ SERIAL JSON JSONB UUID BLOB",
);
const SQL_RULES: Rule[] = [
  [r(String.raw`--[^\n]*|/\*[\s\S]*?\*/`), "comment"],
  [r(String.raw`'(?:''|[^'])*'`), "string"],
  [r(String.raw`"(?:""|[^"])*"|` + "`[^`]*`"), "key"],
  [r(String.raw`[A-Za-z_]\w*`), (m) => (SQL_WORDS.has(m.toUpperCase()) ? "keyword" : "plain")],
  [r(String.raw`\d+(?:\.\d+)?`), "number"],
  [r(String.raw`[(),;.]`), "punct"],
];

const CODE_WORDS = wordSet(
  "const let var function return if else for while switch case break continue type interface struct class enum extends implements import export from default package " +
    "public private protected static final readonly abstract new this null nil undefined true false True False None async await try catch throw throws finally " +
    "def pass lambda with as in is not and or fun val func impl pub use mod mut trait message repeated optional required syntax option oneof map namespace using void get set " +
    "string number boolean any unknown never object int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 float float32 float64 double bool str bytes byte char long short " +
    "Int Long Double Float Boolean String",
);
const CODE_RULES: Rule[] = [
  [r(String.raw`//[^\n]*|/\*[\s\S]*?\*/|(?<![^\s])#[^\n]*`), "comment"],
  [r(`${DQ}|${SQ}|` + "`[^`]*`"), "string"],
  [r(String.raw`[A-Za-z_$][\w$]*`), (m) => (CODE_WORDS.has(m) || /^[A-Z][a-z]/.test(m) ? "keyword" : "plain")],
  [r(String.raw`\d+(?:\.\d+)?`), "number"],
  [r(String.raw`[{}()\[\],;:.<>]`), "punct"],
];

const BASH_RULES: Rule[] = [
  [r(String.raw`(?<![^\s])#[^\n]*`), "comment"],
  [r(`${DQ}|${SQ}`), "string"],
  [r(String.raw`(?<![^\s])--?[A-Za-z][\w-]*`), "number"],
  [r(String.raw`[A-Za-z_][\w.-]*`), (m) => (m === "curl" ? "keyword" : "plain")],
];

const RULES: Record<Exclude<HighlightLang, "text">, Rule[]> = {
  json: JSON_RULES,
  yaml: YAML_RULES,
  xml: XML_RULES,
  toml: TOML_RULES,
  csv: CSV_RULES,
  sql: SQL_RULES,
  code: CODE_RULES,
  bash: BASH_RULES,
};

/** Splits `code` into coloured runs. Joining the token texts always gives back `code`. */
export function highlight(code: string, lang: HighlightLang): Token[] {
  if (lang === "text" || code.length > MAX_CHARS) return [{ text: code, kind: "plain" }];
  return scan(code, RULES[lang]);
}

/** Highlight language for a playground output id such as `fmt:yaml`, `type:go` or `op:schema`. */
export function langForOutput(id: string): HighlightLang {
  const [group, key] = id.split(":");
  if (group === "fmt") return ["json", "xml", "yaml", "toml", "csv"].includes(key) ? (key as HighlightLang) : "text";
  if (id === "type:sql") return "sql";
  return group === "type" ? "code" : "json";
}

/** Best guess for text whose language is not known: a JSON value, a cURL command, XML, or SQL. */
export function guessLang(code: string): HighlightLang {
  const t = code.trimStart();
  if (/^[[{]/.test(t)) return "json";
  if (/^curl\b/.test(t)) return "bash";
  if (/^<[?!\w]/.test(t)) return "xml";
  if (/^(SELECT|INSERT|CREATE|UPDATE|DELETE|WITH)\b/i.test(t)) return "sql";
  return "text";
}
