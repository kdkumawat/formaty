"use client";

import React, { useCallback, useEffect, useState } from "react";
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
}

const QUERY_LANGUAGES: Array<{ id: QueryLanguage; label: string; placeholder: string }> = [
  { id: "jsonpath", label: "JSONPath", placeholder: "$.users[?(@.age > 25)]" },
  { id: "jmespath", label: "JMESPath", placeholder: "users[?age > `25`]" },
];

export function QueryView({
  data,
  className = "",
  isDark = false,
  fontSize = 13,
  monacoTheme = "vs-dark",
}: QueryViewProps) {
  const [queryLang, setQueryLang] = useState<QueryLanguage>("jsonpath");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

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
      setResult(
        typeof out === "string"
          ? out
          : formatJson(out, { indentation: 2 })
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query failed");
      setResult("");
    }
  }, [data, query, queryLang]);

  useEffect(() => {
    run();
  }, [run]);

  const linkBtnClass =
    "btn btn-xs btn-ghost rounded p-1 border-0 hover:bg-[var(--workspace-panel)] hover:underline hover:text-primary";

  const textareaClass = isDark
    ? "border-[#3c3c3c] bg-[#252526] text-[#d4d4d4] placeholder-[#6e6e6e]"
    : "border-[#d4d4d4] bg-[#f3f3f3] text-[#333] placeholder-[#6e6e6e]";

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      <div className="flex shrink-0 flex-col gap-1 px-2 py-1.5 border-b border-[var(--workspace-border)]">
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">Query</span>
          {QUERY_LANGUAGES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`${linkBtnClass} ${queryLang === id ? "text-primary" : ""}`}
              onClick={() => setQueryLang(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <textarea
          rows={2}
          className={`w-full shrink-0 rounded border p-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary ${textareaClass}`}
          placeholder={QUERY_LANGUAGES.find((l) => l.id === queryLang)?.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          spellCheck={false}
        />
        {error && <div className="text-xs text-error">{error}</div>}
      </div>
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <JsonEditor
          value={result}
          onChange={() => {}}
          className="flex-1 min-h-0"
          readOnly
          passiveReadOnly
          language="json"
          monacoTheme={monacoTheme}
          panelTone="output"
          fontSize={fontSize}
        />
      </div>
    </div>
  );
}
