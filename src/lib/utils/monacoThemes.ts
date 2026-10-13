import type { Monaco } from "@monaco-editor/react";

/**
 * Formaty editor themes ("Ink and Amber"). Backgrounds are transparent so the panel colour
 * shows through. Shared by JsonEditor and JsonDiffEditor so both define/use the same themes.
 */
/**
 * Token colours (hex, no #) shared by the Monaco themes below and by the static highlighter
 * (lib/highlight.ts). Each is at least 4.5:1 on the panel (#141312 dark, #FFFFFF light) and the
 * set separates by lightness as well as hue: key (lightest) > string > number > keyword > punct > comment.
 * keyword also colours true/false/null.
 */
export const TOKEN_COLORS = {
  dark: { key: "F0C674", string: "9CCFA4", number: "EA9A62", keyword: "D98FA6", comment: "8A8379", punct: "A39D94" },
  light: { key: "7A5200", string: "1F6F43", number: "C2410C", keyword: "A12E5B", comment: "736D64", punct: "5E5A55" },
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
      { token: "keyword.json", foreground: D.keyword },
      { token: "comment", foreground: D.comment, fontStyle: "italic" },
      { token: "delimiter", foreground: D.punct },
      { token: "type", foreground: D.keyword },
      { token: "tag", foreground: D.key },
      { token: "attribute.name", foreground: D.number },
    ],
    colors: {
      "editor.background": "#00000000",
      "editorGutter.background": "#00000000",
      "editor.foreground": "#F2F0ED",
      "editor.lineHighlightBackground": "#FFFFFF08",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#F2B54447",
      "editor.inactiveSelectionBackground": "#F2B54424",
      "editor.selectionHighlightBackground": "#F2B54424",
      "editor.wordHighlightBackground": "#F2B5441F",
      "editorCursor.foreground": "#F2B544",
      "editorLineNumber.foreground": "#6B665F",
      "editorLineNumber.activeForeground": "#A8A39C",
      "editorIndentGuide.background1": "#FFFFFF0A",
      "editorIndentGuide.activeBackground1": "#FFFFFF1F",
      "editorBracketHighlight.foreground1": "#F0C674",
      "editorBracketHighlight.foreground2": "#EA9A62",
      "editorBracketHighlight.foreground3": "#9CCFA4",
      "editorWidget.background": "#1A1917",
      "editorWidget.border": "#2A2826",
      "diffEditor.insertedTextBackground": "#7BD39A26",
      "diffEditor.insertedLineBackground": "#7BD39A14",
      "diffEditor.removedTextBackground": "#F7A58E26",
      "diffEditor.removedLineBackground": "#F7A58E14",
      "scrollbarSlider.background": "#F2F0ED2E",
      "scrollbarSlider.hoverBackground": "#F2F0ED52",
      "scrollbarSlider.activeBackground": "#F2F0ED70",
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
      { token: "keyword.json", foreground: L.keyword },
      { token: "comment", foreground: L.comment, fontStyle: "italic" },
      { token: "delimiter", foreground: L.punct },
      { token: "type", foreground: L.keyword },
      { token: "tag", foreground: L.key },
      { token: "attribute.name", foreground: L.number },
    ],
    colors: {
      "editor.background": "#00000000",
      "editorGutter.background": "#00000000",
      "editor.foreground": "#1A1816",
      "editor.lineHighlightBackground": "#1A18160A",
      "editor.lineHighlightBorder": "#00000000",
      "editor.selectionBackground": "#F2B54466",
      "editor.inactiveSelectionBackground": "#F2B54433",
      "editor.selectionHighlightBackground": "#F2B54433",
      "editor.wordHighlightBackground": "#F2B54433",
      "editorCursor.foreground": "#B45309",
      "editorLineNumber.foreground": "#B5B0A8",
      "editorLineNumber.activeForeground": "#5E5A55",
      "editorIndentGuide.background1": "#1A18160D",
      "editorIndentGuide.activeBackground1": "#1A181624",
      "editorBracketHighlight.foreground1": "#7A5200",
      "editorBracketHighlight.foreground2": "#C2410C",
      "editorBracketHighlight.foreground3": "#1F6F43",
      "editorWidget.background": "#FFFFFF",
      "editorWidget.border": "#E7E5E1",
      "diffEditor.insertedTextBackground": "#17703A24",
      "diffEditor.insertedLineBackground": "#17703A12",
      "diffEditor.removedTextBackground": "#B3331A24",
      "diffEditor.removedLineBackground": "#B3331A12",
      "scrollbarSlider.background": "#1A181626",
      "scrollbarSlider.hoverBackground": "#1A181644",
      "scrollbarSlider.activeBackground": "#1A18165C",
    },
  });
}

/** Map a caller-supplied base theme name to the matching Formaty theme. */
export function resolveFormatyTheme(base: string): string {
  return base === "vs-dark" ? "formaty-dark" : "formaty-light";
}
