"use client";

import { DiffEditor } from "@monaco-editor/react";

interface JsonDiffEditorProps {
  original: string;
  modified: string;
  language?: string;
  monacoTheme?: string;
  className?: string;
  fontSize?: number;
}

export function JsonDiffEditor({
  original,
  modified,
  language = "json",
  monacoTheme = "vs-dark",
  className,
  fontSize = 13,
}: JsonDiffEditorProps) {
  return (
    <div
      className={`relative h-full min-h-0 overflow-hidden border border-base-300 bg-base-100 ${className ?? ""}`}
    >
      <DiffEditor
        height="100%"
        original={original}
        modified={modified}
        language={language}
        theme={monacoTheme}
        options={{
          readOnly: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderSideBySide: true,
          minimap: { enabled: false },
          wordWrap: "on",
          fontSize,
          originalEditable: false,
          diffWordWrap: "on",
          ignoreTrimWhitespace: false,
        }}
      />
    </div>
  );
}
