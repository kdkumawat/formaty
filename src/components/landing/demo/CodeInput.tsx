"use client";

import { Highlighted } from "@/components/Highlighted";
import type { HighlightLang } from "@/lib/highlight";
import { cn } from "@/lib/utils";

const METRICS = "m-0 border-0 px-3 py-2 font-mono text-[13px] leading-[1.6] [font-variant-ligatures:none] [tab-size:8]";

/**
 * An editable code area with token colours, without Monaco. A transparent textarea sits exactly over a
 * coloured copy of its text. Both share one font, padding and wrapping rule, are sized by the copy, and
 * scroll together inside one container, so there is no scroll syncing to drift. The textarea itself never
 * scrolls (a reset guards against a sub-pixel overflow).
 */
export function CodeInput({
  value,
  onChange,
  lang,
  wrap = false,
  label,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  lang: HighlightLang;
  wrap?: boolean;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  const flow = wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre";
  return (
    <div
      className={cn(
        "relative min-h-[96px] flex-1 overflow-auto bg-[var(--workspace-panel)] focus-within:ring-2 focus-within:ring-inset focus-within:ring-[var(--focus)]",
        className,
      )}
    >
      <div className={cn("relative min-h-full", !wrap && "w-max min-w-full")}>
        <pre aria-hidden className={cn(METRICS, flow, "text-[var(--workspace-text)]")}>
          <Highlighted code={value} lang={lang} />
          {"\n"}
        </pre>
        <textarea
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            e.currentTarget.scrollTop = 0;
            e.currentTarget.scrollLeft = 0;
          }}
          wrap={wrap ? "soft" : "off"}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          placeholder={placeholder}
          className={cn(
            METRICS,
            flow,
            "absolute inset-0 size-full resize-none overflow-hidden bg-transparent text-transparent caret-[var(--workspace-text)] outline-none selection:bg-brand/30 placeholder:text-[var(--workspace-text-muted)]",
          )}
        />
      </div>
    </div>
  );
}
