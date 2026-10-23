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
  /** Accessible name of the text area. */
  ariaLabel?: string;
  /** Fired after a paste has landed, with the full text now in the editor. */
  onPaste?: (text: string) => void;
  /** Plain-text surface for lists: no suggestions, hovers, links, folding or highlights, and 12px of left padding. */
  plain?: boolean;
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
  ariaLabel,
  onPaste,
  plain = false,
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
  const onPasteRef = React.useRef(onPaste);
  onPasteRef.current = onPaste;
  /** On macOS KeyMod.CtrlCmd only matches Cmd, so plain Ctrl+Enter would fall
   *  through to Monaco's default newline insert. Bind bare Ctrl there too. */
  const isMac = React.useMemo(
    () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform),
    [],
  );
  /** Texts this editor sent through onChange that the parent has not echoed back yet. The
   *  library syncs `value` in a passive effect, so an echo can land a keystroke late; writing
   *  it back reverted the text for a frame and threw the caret to the end (fast Enter). */
  const emittedRef = React.useRef<string[]>([]);
  const syncingRef = React.useRef(false);
  const valueRef = React.useRef(value);
  valueRef.current = value;

  React.useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const i = emittedRef.current.indexOf(value);
    if (i >= 0) {
      emittedRef.current = emittedRef.current.slice(i + 1);
      return;
    }
    if (value === ed.getValue()) return;
    syncingRef.current = true;
    if (readOnly) ed.setValue(value);
    else {
      ed.executeEdits("", [{ range: ed.getModel()!.getFullModelRange(), text: value, forceMoveMarkers: true }]);
      ed.pushUndoStop();
    }
    syncingRef.current = false;
  }, [value, readOnly]);

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
        defaultValue={value}
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
          // Below 8 Monaco reads this as a multiple of fontSize; a fixed 20px squeezed the lines at larger font sizes.
          lineHeight: 1.6,
          automaticLayout: true,
          padding: { top: 6, bottom: 6 },
          scrollBeyondLastLine: false,
          // Monaco's sticky-scroll widget re-renders code on top of the
          // viewport while scrolling, which visually overlaps text inside
          // the fixed-height workspace panes.
          stickyScroll: { enabled: false },
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
          ...(ariaLabel ? { ariaLabel } : {}),
          ...(plain
            ? {
                lineDecorationsWidth: 12,
                folding: false,
                glyphMargin: false,
                overviewRulerLanes: 0,
                overviewRulerBorder: false,
                hideCursorInOverviewRuler: true,
                renderLineHighlight: "none" as const,
                hover: { enabled: "off" as const },
                links: false,
                occurrencesHighlight: "off" as const,
                selectionHighlight: false,
                quickSuggestions: false,
                suggestOnTriggerCharacters: false,
                wordBasedSuggestions: "off" as const,
                parameterHints: { enabled: false },
                unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false },
              }
            : {}),
          ...hugeOptions,
        }}
        onChange={(next = "") => {
          if (syncingRef.current) return;
          // Capped so a parent that never echoes cannot grow it without bound.
          emittedRef.current = [...emittedRef.current.slice(-49), next];
          onChange(next);
        }}
        onMount={(editor, monaco) => {
          editorRef.current = editor;
          // Models default to CRLF on Windows, so values read back (Copy, Download, hashes) would differ by OS.
          // Guarded: the EOL change is a content event the parent must not see as an edit.
          syncingRef.current = true;
          editor.getModel()?.setEOL(monaco.editor.EndOfLineSequence.LF);
          syncingRef.current = false;
          // A value that changed between create and mount missed the sync effect.
          if (editor.getValue() !== valueRef.current) editor.setValue(valueRef.current);
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
          editor.onDidPaste(() => onPasteRef.current?.(editor.getValue()));
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
