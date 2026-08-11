import type { Monaco } from "@monaco-editor/react";

/**
 * Formaty editor themes. Backgrounds are transparent so the panel color
 * shows through; token colors follow the app's indigo-violet identity.
 * Shared by JsonEditor and JsonDiffEditor so both define/use the same themes.
 */
export function defineFormatyThemes(monaco: Monaco) {
  monaco.editor.defineTheme("formaty-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: "7AA2F7" },
      { token: "string.value.json", foreground: "7EE787" },
      { token: "string", foreground: "7EE787" },
      { token: "number", foreground: "FFAB70" },
      { token: "keyword", foreground: "C792EA" },
      { token: "keyword.json", foreground: "C792EA" },
      { token: "comment", foreground: "565F89", fontStyle: "italic" },
      { token: "delimiter", foreground: "C0CAF5" },
      { token: "type", foreground: "C792EA" },
      { token: "tag", foreground: "7AA2F7" },
      { token: "attribute.name", foreground: "FFAB70" },
    ],
    colors: {
      "editor.background": "#00000000",
      "editorGutter.background": "#00000000",
      "editor.foreground": "#ECECF1",
      "editor.lineHighlightBackground": "#FFFFFF0D",
      "editor.selectionBackground": "#5B5BD640",
      "editorCursor.foreground": "#7AA2F7",
      "editorLineNumber.foreground": "#4A4A58",
      "editorLineNumber.activeForeground": "#9A9AA5",
      "editorIndentGuide.background1": "#FFFFFF0A",
      "editorIndentGuide.activeBackground1": "#FFFFFF1A",
      "editorBracketHighlight.foreground1": "#7AA2F7",
      "editorBracketHighlight.foreground2": "#C792EA",
      "editorBracketHighlight.foreground3": "#7EE787",
      "editorWidget.background": "#12121A",
      "editorWidget.border": "#23232E",
      "scrollbarSlider.background": "#3A3A4A80",
      "scrollbarSlider.hoverBackground": "#3A3A4A",
    },
  });

  monaco.editor.defineTheme("formaty-light", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: "0550AE" },
      { token: "string.value.json", foreground: "0A7A2F" },
      { token: "string", foreground: "0A7A2F" },
      { token: "number", foreground: "B35900" },
      { token: "keyword", foreground: "8250DF" },
      { token: "keyword.json", foreground: "8250DF" },
      { token: "comment", foreground: "6E7781", fontStyle: "italic" },
      { token: "delimiter", foreground: "24292F" },
      { token: "type", foreground: "8250DF" },
      { token: "tag", foreground: "0550AE" },
      { token: "attribute.name", foreground: "B35900" },
    ],
    colors: {
      "editor.background": "#00000000",
      "editorGutter.background": "#00000000",
      "editor.foreground": "#181820",
      "editor.lineHighlightBackground": "#00000008",
      "editor.selectionBackground": "#5B5BD630",
      "editorCursor.foreground": "#5B5BD6",
      "editorLineNumber.foreground": "#C0C0CC",
      "editorLineNumber.activeForeground": "#5F5F6B",
      "editorIndentGuide.background1": "#0000000A",
      "editorIndentGuide.activeBackground1": "#0000001A",
      "editorBracketHighlight.foreground1": "#0550AE",
      "editorBracketHighlight.foreground2": "#8250DF",
      "editorBracketHighlight.foreground3": "#0A7A2F",
      "editorWidget.background": "#FFFFFF",
      "editorWidget.border": "#E7E7EF",
      "scrollbarSlider.background": "#D8D8E280",
      "scrollbarSlider.hoverBackground": "#D8D8E2",
    },
  });
}

/** Map a caller-supplied base theme name to the matching Formaty theme. */
export function resolveFormatyTheme(base: string): string {
  return base === "vs-dark" ? "formaty-dark" : "formaty-light";
}
