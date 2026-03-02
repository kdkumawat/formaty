"use client";

import Editor from "@monaco-editor/react";

interface JsonEditorProps {
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
}: JsonEditorProps) {
  return (
    <div
      className={`relative h-[52vh] min-h-[360px] overflow-hidden rounded-box border border-base-300 bg-base-100 ${className ?? ""}`}
    >
      <Editor
        height="100%"
        defaultLanguage={language}
        theme={monacoTheme}
        value={value}
        language={language}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          automaticLayout: true,
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
