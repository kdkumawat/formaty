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
  const resolvedTheme = `${monacoTheme}-${panelTone}`;
  const isDarkTheme = monacoTheme === "vs-dark";

  return (
    <div
      className={`relative h-[52vh] min-h-[360px] overflow-hidden rounded-box border ${
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
          monaco.editor.defineTheme("vs-dark-input", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
              "editor.background": "#252526",
            },
          });
          monaco.editor.defineTheme("vs-dark-output", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
              "editor.background": "#1e1e1e",
            },
          });
          monaco.editor.defineTheme("vs-input", {
            base: "vs",
            inherit: true,
            rules: [],
            colors: {
              "editor.background": "#f3f3f3",
            },
          });
          monaco.editor.defineTheme("vs-output", {
            base: "vs",
            inherit: true,
            rules: [],
            colors: {
              "editor.background": "#ffffff",
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
