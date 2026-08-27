"use client";

import React from "react";
import type { editor } from "monaco-editor";
import Editor from "@monaco-editor/react";
import { defineFormatyThemes, resolveFormatyTheme } from "@/lib/utils/monacoThemes";
import { applyLargeFileOptions, pinNoopJsonWorker, isHugeInput } from "@/lib/monaco/largeFile";

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
  /** Bypass the huge-input hardening (caller takes responsibility for the
   *  performance cost at > HUGE_INPUT_BYTES). */
  disableLargeMode?: boolean;
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
  disableLargeMode = false,
}: JsonEditorProps) {
  const editorRef = React.useRef<editor.IStandaloneCodeEditor | null>(null);
  const resolvedTheme = resolveFormatyTheme(monacoTheme);
  const huge = !disableLargeMode && isHugeInput(value);
  // The huge-mode options include `lightbulb` whose enum is private in the
  // published types. Cast once to the loose shape; the `applyLargeFileOptions`
  // helper does the same on mount.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hugeOptions: Record<string, any> = huge
    ? {
        largeFileOptimizations: true,
        bracketPairColorization: { enabled: false },
        guides: { indentation: false, bracketPairs: false, highlightActiveIndentation: false },
        codeLens: false,
        lightbulb: { enabled: "off" },
      }
    : {};
  /** Keep the latest handler without re-registering the Monaco keybinding: the
   *  editor mounts once, but the onCtrlEnter closure must stay fresh (otherwise
   *  Cmd/Ctrl+Enter would run against stale state from mount time). */
  const onCtrlEnterRef = React.useRef(onCtrlEnter);
  onCtrlEnterRef.current = onCtrlEnter;
  /** On macOS KeyMod.CtrlCmd only matches Cmd, so plain Ctrl+Enter would fall
   *  through to Monaco's default newline insert. Bind bare Ctrl there too. */
  const isMac = React.useMemo(
    () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform),
    [],
  );

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
          if (huge) {
            // Disable the language worker so the JSON service does not
            // re-tokenize a >2 MB model on every keystroke.
            pinNoopJsonWorker();
          }
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
          ...hugeOptions,
        }}
        onChange={(next) => onChange(next ?? "")}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          if (huge) {
            applyLargeFileOptions(editor, monaco);
          }
          const onCtrlEnter = () => {
            onCtrlEnterRef.current?.();
          };
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onCtrlEnter);
          // macOS: also consume plain Ctrl+Enter so it executes instead of
          // inserting a newline (CtrlCmd only matches Cmd there).
          if (isMac) {
            editor.addCommand(monaco.KeyMod.Ctrl | monaco.KeyCode.Enter, onCtrlEnter);
          }
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
