"use client";

import { useState, useCallback, useRef } from "react";
import { Check } from "lucide-react";
import { useIconAnimation, AnimatedCopyIcon } from "@/components/icons";
import { toast } from "@/components/Toast";
import { cn } from "@/lib/utils";

export type CodeLanguage = "json" | "yaml" | "xml" | "toml" | "csv" | "bash" | "ts" | "text";

const LANG_LABEL: Record<CodeLanguage, string> = {
  json: "JSON",
  yaml: "YAML",
  xml: "XML",
  toml: "TOML",
  csv: "CSV",
  bash: "Bash",
  ts: "TypeScript",
  text: "Text",
};

/* Sentinel markers - split-safe, never collide with user text. */
const OPEN = "§§F";
const CLOSE_2 = "§§2";
const CLOSE_3 = "§§3";
const CLOSE_4 = "§§4";
const CLOSE_5 = "§§5";
const CLOSE_6 = "§§6";
const CLOSE_KEY = "§§K";

type Tok = { t: string; c: string };
const PLAIN: Tok = { t: "", c: "" };

function colorFor(c: number): string {
  if (c === 1) return "text-sky-500 dark:text-sky-400"; // keys
  if (c === 2) return "text-emerald-600 dark:text-emerald-400"; // strings
  if (c === 3) return "text-violet-600 dark:text-violet-400"; // keywords / literals
  if (c === 4) return "text-[var(--workspace-text-muted)]"; // punctuation
  if (c === 5) return "text-amber-600 dark:text-amber-400"; // numbers
  if (c === 6) return "text-[var(--workspace-text-muted)] italic"; // comments
  return "";
}

function tokenize(code: string, lang: CodeLanguage): Tok[] {
  if (lang === "text") return [{ t: code, c: "" }];

  // JSON: "key":, "string", true/false/null, number, punctuation
  if (lang === "json") {
    const tagged = code.replace(
      /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],]/g,
      (m, str, colon, kw) => {
        if (str) return `${OPEN}${str}${colon ? CLOSE_KEY : CLOSE_2}`;
        if (kw) return `${OPEN}${kw}${CLOSE_3}`;
        if (/^[{}\[\],]$/.test(m)) return `${OPEN}${m}${CLOSE_4}`;
        return `${OPEN}${m}${CLOSE_5}`;
      },
    );
    return tagged.split(new RegExp(`(${OPEN}.*?(?:${CLOSE_KEY}|${CLOSE_2}|${CLOSE_3}|${CLOSE_4}|${CLOSE_5}))`, "s")).map((seg) => {
      if (!seg) return PLAIN;
      const m = seg.match(new RegExp(`^${OPEN}(.*?)(?:${CLOSE_KEY}|${CLOSE_2}|${CLOSE_3}|${CLOSE_4}|${CLOSE_5})$`, "s"));
      if (!m) return { t: seg, c: "" };
      const c = seg.endsWith(CLOSE_KEY) ? 1 : seg.endsWith(CLOSE_2) ? 2 : seg.endsWith(CLOSE_3) ? 3 : seg.endsWith(CLOSE_4) ? 4 : 5;
      return { t: m[1], c: colorFor(c) };
    });
  }

  // YAML: key:, "string", true/false/null/yes/no, number
  if (lang === "yaml") {
    const tagged = code.replace(
      /^(\s*-?\s*)([A-Za-z_][\w-]*)(\s*:)?|("(?:\\.|[^"\\])*"|'(?:[^'\\]|\\.)*')|\b(true|false|null|yes|no)\b|-?\d+(?:\.\d+)?/gm,
      (m, pre, key, colon, str, kw) => {
        if (key) return `${pre}${OPEN}${key}${colon ? CLOSE_KEY : CLOSE_4}`;
        if (str) return `${OPEN}${str}${CLOSE_2}`;
        if (kw) return `${OPEN}${kw}${CLOSE_3}`;
        return `${OPEN}${m}${CLOSE_5}`;
      },
    );
    return tagged.split(new RegExp(`(${OPEN}.*?(?:${CLOSE_KEY}|${CLOSE_2}|${CLOSE_3}|${CLOSE_4}|${CLOSE_5}))`, "s")).map((seg) => {
      if (!seg) return PLAIN;
      const m = seg.match(new RegExp(`^${OPEN}(.*?)(?:${CLOSE_KEY}|${CLOSE_2}|${CLOSE_3}|${CLOSE_4}|${CLOSE_5})$`, "s"));
      if (!m) return { t: seg, c: "" };
      const c = seg.endsWith(CLOSE_KEY) ? 1 : seg.endsWith(CLOSE_2) ? 2 : seg.endsWith(CLOSE_3) ? 3 : seg.endsWith(CLOSE_4) ? 4 : 5;
      return { t: m[1], c: colorFor(c) };
    });
  }

  // Bash: #comment, "string", --flag
  if (lang === "bash") {
    const tagged = code.replace(
      /(#.*$)|("(?:\\.|[^"\\])*"|'(?:[^'\\]|\\.)*')|(--?[A-Za-z][\w-]*)/gm,
      (m, c, s, f) => {
        if (c) return `${OPEN}${c}${CLOSE_6}`;
        if (s) return `${OPEN}${s}${CLOSE_2}`;
        if (f) return `${OPEN}${f}${CLOSE_4}`;
        return m;
      },
    );
    return tagged.split(new RegExp(`(${OPEN}.*?(?:${CLOSE_6}|${CLOSE_2}|${CLOSE_4}))`, "s")).map((seg) => {
      if (!seg) return PLAIN;
      const m = seg.match(new RegExp(`^${OPEN}(.*?)(?:${CLOSE_6}|${CLOSE_2}|${CLOSE_4})$`, "s"));
      if (!m) return { t: seg, c: "" };
      const c = seg.endsWith(CLOSE_6) ? 6 : seg.endsWith(CLOSE_2) ? 2 : 4;
      return { t: m[1], c: colorFor(c) };
    });
  }

  // TypeScript: //comment, "string", keyword, literal, number
  if (lang === "ts") {
    const tagged = code.replace(
      /(\/\/[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(import|export|from|const|let|var|function|return|if|else|type|interface|async|await|new|class|extends|implements|public|private|protected|static|readonly)\b|\b(true|false|null|undefined)\b|\b(\d+(?:\.\d+)?)\b/g,
      (m, comment, str, kw, lit, num) => {
        if (comment) return `${OPEN}${comment}${CLOSE_6}`;
        if (str) return `${OPEN}${str}${CLOSE_2}`;
        if (kw) return `${OPEN}${kw}${CLOSE_3}`;
        if (lit) return `${OPEN}${lit}${CLOSE_3}`;
        if (num) return `${OPEN}${num}${CLOSE_5}`;
        return m;
      },
    );
    return tagged.split(new RegExp(`(${OPEN}.*?(?:${CLOSE_6}|${CLOSE_2}|${CLOSE_3}|${CLOSE_5}))`, "s")).map((seg) => {
      if (!seg) return PLAIN;
      const m = seg.match(new RegExp(`^${OPEN}(.*?)(?:${CLOSE_6}|${CLOSE_2}|${CLOSE_3}|${CLOSE_5})$`, "s"));
      if (!m) return { t: seg, c: "" };
      const c = seg.endsWith(CLOSE_6) ? 6 : seg.endsWith(CLOSE_2) ? 2 : seg.endsWith(CLOSE_3) ? 3 : 5;
      return { t: m[1], c: colorFor(c) };
    });
  }

  return [{ t: code, c: "" }];
}

export function CodeBlock({
  code,
  language = "text",
  label,
  showCopy = true,
  className,
}: {
  code: string;
  language?: CodeLanguage;
  label?: string;
  showCopy?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copyIcon = useIconAnimation();
  const tokens = tokenize(code, language);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ type: "error", message: "Copy failed" });
    }
  }, [code]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)]",
        className,
      )}
    >
      {(label || language !== "text") && (
        <div className="flex items-center justify-between border-b border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[var(--workspace-text-muted)]">
          <span>{label ?? LANG_LABEL[language]}</span>
          {showCopy && (
            <button
              type="button"
              onClick={onCopy}
              onMouseEnter={copyIcon.bind.onFocus}
              onMouseLeave={copyIcon.bind.onBlur}
              onFocus={copyIcon.bind.onFocus}
              onBlur={copyIcon.bind.onBlur}
              aria-label={copied ? "Copied" : "Copy code"}
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--workspace-text-muted)] transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <AnimatedCopyIcon
                  ref={copyIcon.ref}
                  size={14}
                  strokeWidth={1.75}
                />
              )}
            </button>
          )}
        </div>
      )}
      <pre className="overflow-x-auto px-4 py-3 font-mono text-[11.5px] leading-relaxed text-[var(--workspace-text)]">
        <code>
          {tokens.map((tok, i) => (
            <span key={i} className={tok.c}>
              {tok.t}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

/* Side-by-side input / output sample. */
export function CodeSample({
  input,
  output,
  inputLabel = "Input",
  outputLabel = "Output",
  language = "json",
  className,
}: {
  input: string;
  output: string;
  inputLabel?: string;
  outputLabel?: string;
  language?: CodeLanguage;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3 md:grid-cols-2", className)}>
      <CodeBlock code={input} language={language} label={inputLabel} />
      <CodeBlock code={output} language={language} label={outputLabel} />
    </div>
  );
}
