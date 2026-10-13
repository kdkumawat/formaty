"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, Chip, Segmented, Tooltip } from "@/components/kit";
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
  /** Restore a previously shared query (share links keep queryText). */
  initialQuery?: string;
  /** Report query edits up so share links can preserve them. */
  onQueryChange?: (q: string) => void;
  /** Pipe the query result into List Compare for ID extraction / SQL. */
  onOpenInListCompare?: (text: string) => void;
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
  fontSize = 13,
  monacoTheme = "vs-dark",
  onResultChange,
  initialQuery,
  onQueryChange,
  onOpenInListCompare,
}: QueryViewProps) {
  const [queryLang, setQueryLang] = useState<QueryLanguage>("jsonpath");
  const [query, setQuery] = useState(initialQuery ?? "");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  // Lift the query text so shared links can preserve it.
  useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  // Apply a query restored from a share link (fires once, before user edits).
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

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

  const textareaClass =
    "border-[var(--workspace-border)] bg-[var(--workspace-background)] text-[var(--workspace-text)] placeholder:text-[var(--workspace-text-muted)]";

  return (
    <div className={`flex h-full flex-col overflow-hidden ${className}`}>
      <div className="flex shrink-0 flex-col gap-2 border-b border-[var(--workspace-border)] px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Segmented
            aria-label="Query language"
            value={queryLang}
            onChange={setQueryLang}
            options={QUERY_LANGUAGES.map(({ id, label }) => ({ value: id, label }))}
          />
          <span className="flex-1" />
          {result.trim() && (
            <>
              <span className="hidden shrink-0 text-[12px] text-[var(--workspace-text-muted)] md:inline">
                Copy or download the result from the header above
              </span>
              {onOpenInListCompare && (
                <Tooltip content="Open the result in Compare to extract IDs and generate SQL">
                  <Button variant="secondary" onClick={() => onOpenInListCompare(result)}>
                    Open in Compare
                  </Button>
                </Tooltip>
              )}
            </>
          )}
        </div>
        <textarea
          rows={2}
          aria-label="Query"
          className={`w-full shrink-0 resize-none rounded-md border p-2 font-mono text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${textareaClass}`}
          placeholder={QUERY_LANGUAGES.find((l) => l.id === queryLang)?.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center gap-1">
          {SAMPLES[queryLang].map((smp) => (
            <Chip key={smp.q} on={false} className="font-mono" onClick={() => setQuery(smp.q)}>
              {smp.label}
            </Chip>
          ))}
          {history.length > 0 && (
            <>
              <span className="mx-1 h-4 w-px bg-[var(--workspace-border)]" aria-hidden />
              {history.slice(0, 4).map((h) => (
                <Tooltip content={h} key={h}>
                  <Chip on={false} className="max-w-[8rem] font-mono" onClick={() => setQuery(h)}>
                    <span className="truncate">{h}</span>
                  </Chip>
                </Tooltip>
              ))}
            </>
          )}
        </div>
        {error && <div className="text-[13px] text-bad">{error}</div>}
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
