"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Tooltip } from "@/components/workspace/Tooltip";
import { JsonEditor } from "@/components/JsonEditor";
import { runQuery, type QueryLanguage } from "@/lib/query/runQuery";
import { formatJson } from "@/lib/json/core";
import type { JsonValue } from "@/lib/json/core";

interface QueryViewProps {
  data: JsonValue;
  className?: string;
  isDark?: boolean;
  fontSize?: number;
  monacoTheme?: string;
  /** Report the latest query result up so the global toolbar can copy it. */
  onResultChange?: (text: string) => void;
}

const QUERY_LANGUAGES: Array<{ id: QueryLanguage; label: string; placeholder: string }> = [
  { id: "jsonpath", label: "JSONPath", placeholder: "$.users[?(@.age > 25)]" },
  { id: "jmespath", label: "JMESPath", placeholder: "users[?age > `25`]" },
];

const SAMPLES: Record<QueryLanguage, { label: string; q: string }[]> = {
  jsonpath: [
    { label: "Root", q: "$" },
    { label: "All keys", q: "$..*" },
    { label: "First array item", q: "$..[0]" },
    { label: "By property", q: "$..name" },
  ],
  jmespath: [
    { label: "Identity", q: "@" },
    { label: "Keys", q: "keys(@)" },
    { label: "Values", q: "values(@)" },
  ],
};

const HISTORY_KEY = "formaty-query-history";

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, 12) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 12)));
  } catch {
    /* ignore */
  }
}

export function QueryView({
  data,
  className = "",
  isDark = false,
  fontSize = 13,
  monacoTheme = "vs-dark",
  onResultChange,
}: QueryViewProps) {
  const [queryLang, setQueryLang] = useState<QueryLanguage>("jsonpath");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const run = useCallback(() => {
    if (!query.trim()) {
      try {
        setResult(formatJson(data, { indentation: 2 }));
      } catch {
        setResult(JSON.stringify(data, null, 2));
      }
      setError(null);
      return;
    }
    try {
      const out = runQuery(data, query, queryLang);
      const text =
        typeof out === "string" ? out : formatJson(out as JsonValue, { indentation: 2 });
      setResult(text);
      setError(null);
      setHistory((prev) => {
        const next = [query, ...prev.filter((h) => h !== query)].slice(0, 12);
        saveHistory(next);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query failed");
      setResult("");
    }
  }, [data, query, queryLang]);

  useEffect(() => {
    run();
  }, [run]);

  // Lift the result up so the global toolbar copy / download / share work.
  useEffect(() => {
    onResultChange?.(result);
  }, [result, onResultChange]);

  const linkBtnClass =
    "inline-flex h-7 items-center rounded-md px-2 text-[11px] font-medium text-[var(--workspace-text-muted)] transition-colors hover:bg-primary/10 hover:text-primary";

  const textareaClass = isDark
    ? "border-[var(--workspace-border)] bg-[var(--workspace-background)] text-[var(--workspace-text)] placeholder:text-[var(--workspace-text-muted)]"
    : "border-[var(--workspace-border)] bg-[var(--workspace-background)] text-[var(--workspace-text)] placeholder:text-[var(--workspace-text-muted)]";

  return (
    <div className={`flex h-full flex-col overflow-hidden ${className}`}>
      <div className="flex shrink-0 flex-col gap-1.5 border-b border-[var(--workspace-border)] px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">
            Query
          </span>
          {QUERY_LANGUAGES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`${linkBtnClass} ${queryLang === id ? "!bg-primary/12 !text-primary" : ""}`}
              onClick={() => setQueryLang(id)}
            >
              {label}
            </button>
          ))}
          <span className="flex-1" />
          {result.trim() && (
            <span className="shrink-0 text-[10px] font-medium tabular-nums text-[var(--workspace-text-muted)]">
              Use the toolbar above to copy or use as input
            </span>
          )}
        </div>
        <textarea
          rows={2}
          className={`w-full shrink-0 resize-none rounded-lg border p-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary ${textareaClass}`}
          placeholder={QUERY_LANGUAGES.find((l) => l.id === queryLang)?.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center gap-1">
          {SAMPLES[queryLang].map((s) => (
            <button
              key={s.q}
              type="button"
              className="rounded border border-[var(--workspace-border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--workspace-text-muted)] hover:border-primary/40 hover:text-primary"
              onClick={() => setQuery(s.q)}
            >
              {s.label}
            </button>
          ))}
          {history.length > 0 && (
            <>
              <span className="mx-1 h-3 w-px bg-[var(--workspace-border)]" />
              {history.slice(0, 4).map((h) => (
                <Tooltip content={h} key={h}>
                <button
                  type="button"
                  className="max-w-[8rem] truncate rounded border border-[var(--workspace-border)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--workspace-text-muted)] hover:border-primary/40 hover:text-primary"
                  onClick={() => setQuery(h)}
                >
                  {h}
                </button>
                </Tooltip>
              ))}
            </>
          )}
        </div>
        {error && <div className="text-xs text-error">{error}</div>}
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <JsonEditor
          value={result}
          onChange={() => {}}
          className="min-h-0 flex-1"
          readOnly
          passiveReadOnly
          language="json"
          monacoTheme={monacoTheme}
          fontSize={fontSize}
        />
      </div>
    </div>
  );
}
