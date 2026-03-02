"use client";

import { DiffEditor } from "@monaco-editor/react";

interface JsonDiffEditorProps {
  original: string;
  modified: string;
  language?: string;
  monacoTheme?: string;
  className?: string;
}

export function JsonDiffEditor({
  original,
  modified,
  language = "json",
  monacoTheme = "vs-dark",
  className,
}: JsonDiffEditorProps) {
  return (
    <div
      className={`relative h-[52vh] min-h-[360px] overflow-hidden rounded-box border border-base-300 bg-base-100 ${className ?? ""}`}
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
          fontSize: 13,
          originalEditable: false,
          diffWordWrap: "on",
          ignoreTrimWhitespace: false,
        }}
      />
    </div>
  );
}
