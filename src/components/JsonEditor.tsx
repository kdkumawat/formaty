"use client";

import React from "react";
import type { editor } from "monaco-editor";
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
  fontSize?: number;
  onCursorChange?: (line: number, column: number) => void;
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
  fontSize = 13,
  onCursorChange,
}: JsonEditorProps) {
  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);
  const resolvedTheme = monacoTheme === "vs-dark" ? "formaty-dark" : "formaty-light";
  const isDarkTheme = monacoTheme === "vs-dark";

  const skeleton = (
    <div className="flex h-full w-full flex-col gap-2 p-4">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="h-4 animate-pulse rounded bg-base-content/10" style={{ width: `${60 + (i % 3) * 20}%` }} />
      ))}
    </div>
  );

  return (
    <div
      role="presentation"
      className={`relative h-full min-h-0 overflow-hidden border cursor-text ${
        panelTone === "output"
          ? isDarkTheme
            ? "border-[#2d2d30] bg-[#1e1e1e]"
            : "border-[#e5e5e5] bg-[#ffffff]"
          : isDarkTheme
            ? "border-[#3c3c3c] bg-[#252526]"
            : "border-[#d4d4d4] bg-[#f3f3f3]"
      } ${className ?? ""}`}
      onClick={() => editorRef.current?.focus()}
    >
      <Editor
        height="100%"
        loading={skeleton}
        defaultLanguage={language}
        theme={resolvedTheme}
        value={value}
        language={language}
        beforeMount={(monaco) => {
          monaco.editor.defineTheme("formaty-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [],
            colors: {
              "editor.background": "#00000000",
              "editorGutter.background": "#00000000",
              "editor.lineHighlightBackground": "#ffffff10",
            },
          });
          monaco.editor.defineTheme("formaty-light", {
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
          fontSize,
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
        onMount={(editor) => {
          editorRef.current = editor;
          if (onCursorChange) {
            editor.onDidChangeCursorPosition((e) => {
              onCursorChange(e.position.lineNumber, e.position.column);
            });
            const pos = editor.getPosition();
            if (pos) onCursorChange(pos.lineNumber, pos.column);
          }
        }}
      />
      {!value.trim() && placeholder ? (
        <div className="pointer-events-none absolute left-4 top-3 text-xs text-base-content/50">
          {placeholder}
        </div>
      ) : null}
    </div>
  );
}
