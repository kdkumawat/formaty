import type { Monaco } from "@monaco-editor/react";

/**
 * Formaty editor themes (Bench: Carbon / Paper). Editor background is the `editor` token (#0D0E10 dark / #FBFBFA light). Shared by JsonEditor and JsonDiffEditor so both define/use the same themes.
 */
/**
 * Token colours (hex, no #) shared by the Monaco themes below and by the static highlighter
 * (lib/highlight.ts). Each is at least 4.5:1 on the panel (#0D0E10 dark, #FBFBFA light). Bench syntax tokens;
 * numbers are never amber. bool colours true/false/null in the Monaco themes; the static highlighter
 * (lib/highlight.ts) still maps them to keyword.
 */
export const TOKEN_COLORS = {
  dark: { key: "ECEDEF", string: "A8D88F", number: "F4A97F", bool: "7DB8FF", keyword: "C9A2FF", comment: "8A8D94", punct: "6E7178" },
  light: { key: "111214", string: "2F7A1F", number: "B4531B", bool: "1F5FBF", keyword: "6A3FC8", comment: "666A70", punct: "8A8C90" },
} as const;
const D = TOKEN_COLORS.dark;
const L = TOKEN_COLORS.light;

export function defineFormatyThemes(monaco: Monaco) {
  monaco.editor.defineTheme("formaty-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: D.key },
      { token: "string.value.json", foreground: D.string },
      { token: "string", foreground: D.string },
      { token: "number", foreground: D.number },
      { token: "keyword", foreground: D.keyword },
      { token: "keyword.json", foreground: D.bool },
      { token: "comment", foreground: D.comment, fontStyle: "italic" },
      { token: "delimiter", foreground: D.punct },
      { token: "type", foreground: D.keyword },
      { token: "tag", foreground: D.key },
      { token: "attribute.name", foreground: D.number },
      { token: "number.json", foreground: D.number },
    ],
    colors: {
      "editor.background": "#0D0E10",
      "editorGutter.background": "#0D0E10",
      "editor.foreground": "#ECEDEF",
      "editor.lineHighlightBackground": "#ECEDEF0A",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#ECEDEF1F",
      "editor.inactiveSelectionBackground": "#ECEDEF14",
      "editor.selectionHighlightBackground": "#ECEDEF14",
      "editor.wordHighlightBackground": "#ECEDEF14",
      "editorCursor.foreground": "#ECEDEF",
      "editorLineNumber.foreground": "#6E7178",
      "editorLineNumber.activeForeground": "#9B9EA4",
      "editorIndentGuide.background1": "#FFFFFF0A",
      "editorIndentGuide.activeBackground1": "#FFFFFF1F",
      "editorBracketHighlight.foreground1": "#ECEDEF",
      "editorBracketHighlight.foreground2": "#F4A97F",
      "editorBracketHighlight.foreground3": "#A8D88F",
      "editorWidget.background": "#17181B",
      "editorWidget.border": "#30333A",
      "diffEditor.insertedTextBackground": "#5FD38D1A",
      "diffEditor.insertedLineBackground": "#5FD38D14",
      "diffEditor.removedTextBackground": "#FF8A7A1A",
      "diffEditor.removedLineBackground": "#FF8A7A14",
      "scrollbarSlider.background": "#ECEDEF2E",
      "scrollbarSlider.hoverBackground": "#ECEDEF52",
      "scrollbarSlider.activeBackground": "#ECEDEF70",
    },
  });

  monaco.editor.defineTheme("formaty-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: L.key },
      { token: "string.value.json", foreground: L.string },
      { token: "string", foreground: L.string },
      { token: "number", foreground: L.number },
      { token: "keyword", foreground: L.keyword },
      { token: "keyword.json", foreground: L.bool },
      { token: "comment", foreground: L.comment, fontStyle: "italic" },
      { token: "delimiter", foreground: L.punct },
      { token: "type", foreground: L.keyword },
      { token: "tag", foreground: L.key },
      { token: "attribute.name", foreground: L.number },
      { token: "number.json", foreground: L.number },
    ],
    colors: {
      "editor.background": "#FBFBFA",
      "editorGutter.background": "#FBFBFA",
      "editor.foreground": "#111214",
      "editor.lineHighlightBackground": "#1112140A",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#1112141A",
      "editor.inactiveSelectionBackground": "#1112140F",
      "editor.selectionHighlightBackground": "#1112140F",
      "editor.wordHighlightBackground": "#1112140F",
      "editorCursor.foreground": "#111214",
      "editorLineNumber.foreground": "#8A8C90",
      "editorLineNumber.activeForeground": "#5B5E63",
      "editorIndentGuide.background1": "#1112140D",
      "editorIndentGuide.activeBackground1": "#11121424",
      "editorBracketHighlight.foreground1": "#111214",
      "editorBracketHighlight.foreground2": "#B4531B",
      "editorBracketHighlight.foreground3": "#2F7A1F",
      "editorWidget.background": "#FFFFFF",
      "editorWidget.border": "#CFCFC9",
      "diffEditor.insertedTextBackground": "#17703A14",
      "diffEditor.insertedLineBackground": "#17703A14",
      "diffEditor.removedTextBackground": "#B3331A14",
      "diffEditor.removedLineBackground": "#B3331A14",
      "scrollbarSlider.background": "#11121426",
      "scrollbarSlider.hoverBackground": "#11121444",
      "scrollbarSlider.activeBackground": "#1112145C",
    },
  });
}

/** Map a caller-supplied base theme name to the matching Formaty theme. */
export function resolveFormatyTheme(base: string): string {
  return base === "vs-dark" ? "formaty-dark" : "formaty-light";
}
