"use client";

import { useMemo } from "react";

interface Props {
  value: string;
  language?: string;
  className?: string;
  /** If true, wrap long lines; otherwise horizontal scroll. */
  wrap?: boolean;
}

/**
 * Plain-text fallback for inputs that exceed the hard memory budget for
 * Monaco. Renders the value inside a `<pre>` with no editor, no
 * tokenization, no language workers — just a scrollable block.
 */
export function ReadOnlyTextViewer({ value, language, className, wrap = false }: Props) {
  const lang = useMemo(() => (language ? `language-${language}` : "language-text"), [language]);
  return (
    <pre
      className={className}
      lang={lang}
      style={{
        margin: 0,
        padding: "0.75rem 1rem",
        fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
        fontSize: "12px",
        lineHeight: 1.5,
        whiteSpace: wrap ? "pre-wrap" : "pre",
        overflow: "auto",
        height: "100%",
        width: "100%",
        background: "var(--workspace-panel, transparent)",
        color: "var(--workspace-text, inherit)",
        boxSizing: "border-box",
      }}
    >
      {value}
    </pre>
  );
}
