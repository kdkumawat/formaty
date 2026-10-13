"use client";

import dynamic from "next/dynamic";

// Monaco lays out only the visible lines, so a 120,000 line paste stays fast (a plain
// textarea lays out every line). Loaded lazily; the box below keeps its size meanwhile.
const JsonEditor = dynamic(() => import("@/components/JsonEditor").then((m) => m.JsonEditor), { ssr: false });

/** Flat plain-text input for list panes: same pane size before and after Monaco loads. */
export function ListEditor({
  value,
  onChange,
  ariaLabel,
  placeholder,
  hint,
  fontSize = 13,
  isDark,
  wrap = true,
  onPaste,
}: {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder: string;
  /** Muted line at the bottom while the editor is empty. */
  hint?: string;
  fontSize?: number;
  isDark?: boolean;
  wrap?: boolean;
  /** Called after a paste lands, with the full text. */
  onPaste?: (text: string) => void;
}) {
  return (
    <div className="relative min-h-[96px] flex-1 bg-[var(--workspace-panel)] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--focus)]">
      <div className="absolute inset-0">
        <JsonEditor
          value={value}
          onChange={onChange}
          language="plaintext"
          plain
          hideLineNumbers
          disableLargeMode
          className="border-0!"
          ariaLabel={ariaLabel}
          monacoTheme={isDark ? "vs-dark" : "vs"}
          fontSize={fontSize}
          wordWrap={wrap ? "on" : "off"}
          onPaste={onPaste}
        />
      </div>
      {!value && (
        <>
          <p className="pointer-events-none absolute left-3 top-[7px] font-mono text-[13px] leading-5 text-[var(--workspace-text-muted)]">{placeholder}</p>
          {hint && <p className="pointer-events-none absolute inset-x-3 bottom-2 text-[12px] text-[var(--workspace-text-muted)]">{hint}</p>}
        </>
      )}
    </div>
  );
}
