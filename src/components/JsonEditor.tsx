"use client";

import Editor from "@monaco-editor/react";

interface JsonEditorProps {
  panelTone?: "input" | "output";
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
  passiveReadOnly?: boolean;
  language?: string;
  monacoTheme?: string;
  placeholder?: string;
  className?: string;
  hideLineNumbers?: boolean;
}

export function JsonEditor({
  value,
  onChange,
  readOnly = false,
  passiveReadOnly = false,
  language = "json",
  monacoTheme = "vs-dark",
  placeholder,
  className,
  hideLineNumbers = false,
  panelTone = "input",
}: JsonEditorProps) {
  const resolvedTheme = monacoTheme === "vs-dark" ? "jsonix-dark" : "jsonix-light";
  const isDarkTheme = monacoTheme === "vs-dark";

  return (
    <div
      className={`relative h-[52vh] min-h-[360px] overflow-hidden border ${
        panelTone === "output"
          ? isDarkTheme
            ? "border-[#2d2d30] bg-[#1e1e1e]"
            : "border-[#e5e5e5] bg-[#ffffff]"
          : isDarkTheme
            ? "border-[#3c3c3c] bg-[#252526]"
            : "border-[#d4d4d4] bg-[#f3f3f3]"
      } ${className ?? ""}`}
    >
      <Editor
        height="100%"
        defaultLanguage={language}
        theme={resolvedTheme}
        value={value}
        language={language}
        beforeMount={(monaco) => {
          monaco.editor.defineTheme("jsonix-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
              "editor.background": "#00000000",
              "editorGutter.background": "#00000000",
              "editor.lineHighlightBackground": "#ffffff10",
            },
          });
          monaco.editor.defineTheme("jsonix-light", {
            base: "vs",
            inherit: true,
            rules: [],
            colors: {
              "editor.background": "#00000000",
              "editorGutter.background": "#00000000",
              "editor.lineHighlightBackground": "#00000010",
            },
          });
        }}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          automaticLayout: true,
          padding: { top: 6, bottom: 6 },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          readOnly,
          lineNumbers: hideLineNumbers ? "off" : "on",
          glyphMargin: !hideLineNumbers,
          folding: !hideLineNumbers,
          lineDecorationsWidth: hideLineNumbers ? 0 : 10,
          lineNumbersMinChars: hideLineNumbers ? 0 : 3,
          renderLineHighlight: readOnly ? "none" : "line",
          hover: { enabled: !passiveReadOnly },
          links: !passiveReadOnly,
          contextmenu: !passiveReadOnly,
          occurrencesHighlight: passiveReadOnly ? "off" : "singleFile",
          selectionHighlight: !passiveReadOnly,
          quickSuggestions: !passiveReadOnly,
          suggestOnTriggerCharacters: !passiveReadOnly,
          parameterHints: { enabled: !passiveReadOnly },
        }}
        onChange={(next) => onChange(next ?? "")}
      />
      {!value.trim() && placeholder ? (
        <div className="pointer-events-none absolute left-4 top-3 text-xs text-base-content/50">
          {placeholder}
        </div>
      ) : null}
    </div>
  );
}
