"use client";

import React from "react";
import type { editor } from "monaco-editor";
import Editor from "@monaco-editor/react";
import { defineFormatyThemes, resolveFormatyTheme } from "@/lib/utils/monacoThemes";

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
  fontSize?: number;
  onCursorChange?: (line: number, column: number) => void;
  wordWrap?: "on" | "off";
  onEditorMount?: (api: {
    find(): void;
    focus(): void;
    collapseAll(): void;
    expandAll(): void;
    goToLine(line: number, column?: number): void;
  }) => void;
  /** Fired on Cmd/Ctrl+Enter - registered as a Monaco keybinding so the editor
   *  does not insert a newline when the app consumes the shortcut. */
  onCtrlEnter?: () => void;
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
  fontSize = 13,
  onCursorChange,
  wordWrap = "on",
  onEditorMount,
  onCtrlEnter,
}: JsonEditorProps) {
  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);
  const resolvedTheme = resolveFormatyTheme(monacoTheme);
  /** Keep the latest handler without re-registering the Monaco keybinding: the
   *  editor mounts once, but the onCtrlEnter closure must stay fresh (otherwise
   *  Cmd/Ctrl+Enter would run against stale state from mount time). */
  const onCtrlEnterRef = React.useRef(onCtrlEnter);
  onCtrlEnterRef.current = onCtrlEnter;

  return (
    <div
      role="presentation"
      className={`relative h-full min-h-0 overflow-hidden border border-[var(--workspace-border)] bg-[var(--workspace-panel)] cursor-text ${className ?? ""}`}
      onClick={() => editorRef.current?.focus()}
    >
      <Editor
        height="100%"
        loading={null}
        defaultLanguage={language}
        theme={resolvedTheme}
        value={value}
        language={language}
        beforeMount={(monaco) => {
          defineFormatyThemes(monaco);
        }}
        options={{
          minimap: { enabled: false },
          fontFamily: "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          fontSize,
          lineHeight: 20,
          automaticLayout: true,
          padding: { top: 6, bottom: 6 },
          scrollBeyondLastLine: false,
          wordWrap,
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
            useShadows: false,
          },
          readOnly,
          lineNumbers: hideLineNumbers ? "off" : "on",
          glyphMargin: !hideLineNumbers,
          folding: !hideLineNumbers,
          lineDecorationsWidth: hideLineNumbers ? 0 : 10,
          lineNumbersMinChars: hideLineNumbers ? 0 : 3,
          renderLineHighlight: readOnly ? "none" : "line",
          hover: { enabled: passiveReadOnly ? "off" : "on" },
          links: !passiveReadOnly,
          contextmenu: !passiveReadOnly,
          occurrencesHighlight: passiveReadOnly ? "off" : "singleFile",
          selectionHighlight: !passiveReadOnly,
          quickSuggestions: !passiveReadOnly,
          suggestOnTriggerCharacters: !passiveReadOnly,
          parameterHints: { enabled: !passiveReadOnly },
        }}
        onChange={(next) => onChange(next ?? "")}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
            onCtrlEnterRef.current?.();
          });
          if (onEditorMount) {
            onEditorMount({
              find: () => editor.trigger("keyboard", "actions.find", null),
              focus: () => editor.focus(),
              collapseAll: () => editor.trigger("keyboard", "editor.foldAll", null),
              expandAll: () => editor.trigger("keyboard", "editor.unfoldAll", null),
              goToLine: (line: number, column = 1) => {
                editor.revealLineInCenter(line);
                editor.setPosition({ lineNumber: line, column });
                editor.focus();
              },
            });
          }
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
