import type { CSSProperties } from "react";
import { highlight, type HighlightLang, type Kind } from "@/lib/highlight";
import { TOKEN_COLORS } from "@/lib/utils/monacoThemes";

const L = TOKEN_COLORS.light;
const D = TOKEN_COLORS.dark;
const KINDS = ["key", "string", "number", "keyword", "comment", "punct"] as const;

/** One custom property per token kind: the playground editor's colour for the page's current theme. */
const VARS = Object.fromEntries(KINDS.map((k) => [`--tok-${k}`, `light-dark(#${L[k]}, #${D[k]})`])) as CSSProperties;

const CLASS: Record<Exclude<Kind, "plain">, string> = {
  key: "text-[var(--tok-key)]",
  string: "text-[var(--tok-string)]",
  number: "text-[var(--tok-number)]",
  keyword: "text-[var(--tok-keyword)]",
  comment: "text-[var(--tok-comment)] italic",
  punct: "text-[var(--tok-punct)]",
};

/** Text with the playground's token colours, without Monaco. Render inside a `<pre>` or `<code>`. */
export function Highlighted({ code, lang }: { code: string; lang: HighlightLang }) {
  return (
    <span style={VARS}>
      {highlight(code, lang).map((t, i) =>
        t.kind === "plain" ? t.text : (
          <span key={i} className={CLASS[t.kind]}>
            {t.text}
          </span>
        ),
      )}
    </span>
  );
}
