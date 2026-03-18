"use client";

import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { DiffEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

export interface JsonDiffEditorRef {
  pasteIntoFocusedEditor: (text: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

interface JsonDiffEditorProps {
  original: string;
  modified: string;
  language?: string;
  monacoTheme?: string;
  className?: string;
  fontSize?: number;
  originalEditable?: boolean;
  modifiedEditable?: boolean;
  onOriginalChange?: (value: string) => void;
  onModifiedChange?: (value: string) => void;
  outputPanelClass?: string;
}

export const JsonDiffEditor = forwardRef<JsonDiffEditorRef, JsonDiffEditorProps>(function JsonDiffEditor(
  {
    original,
    modified,
    language = "json",
    monacoTheme = "vs-dark",
    className,
    fontSize = 13,
    originalEditable = false,
    modifiedEditable = false,
    onOriginalChange,
    onModifiedChange,
    outputPanelClass = "border-base-300 bg-base-100",
  },
  ref,
) {
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);

  const getFocusedEditor = useCallback((): editor.IStandaloneCodeEditor | null => {
    const ed = diffEditorRef.current;
    if (!ed || !document.activeElement) return null;
    const orig = ed.getOriginalEditor();
    const mod = ed.getModifiedEditor();
    const origDom = orig.getContainerDomNode?.();
    const modDom = mod.getContainerDomNode?.();
    if (origDom?.contains(document.activeElement)) return orig;
    if (modDom?.contains(document.activeElement)) return mod;
    return null;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      pasteIntoFocusedEditor(text: string) {
        let ed = getFocusedEditor();
        if (!ed) {
          const diff = diffEditorRef.current;
          if (diff) {
            ed = diff.getOriginalEditor();
            ed.focus();
          } else return;
        }
        const model = ed.getModel();
        if (!model) return;
        const sel = ed.getSelection();
        const range = sel ?? model.getFullModelRange();
        ed.executeEdits("paste", [{ range, text }]);
      },
      undo() {
        const ed = getFocusedEditor();
        if (ed) ed.trigger("keyboard", "undo", null);
      },
      redo() {
        const ed = getFocusedEditor();
        if (ed) ed.trigger("keyboard", "redo", null);
      },
      canUndo() {
        const ed = getFocusedEditor();
        return ed ? ed.getModel()?.canUndo() ?? false : false;
      },
      canRedo() {
        const ed = getFocusedEditor();
        return ed ? ed.getModel()?.canRedo() ?? false : false;
      },
    }),
    [getFocusedEditor],
  );

  const handleMount = useCallback(
    (ed: editor.IStandaloneDiffEditor) => {
      diffEditorRef.current = ed;
      const model = ed.getModel();
      if (!model) return;
      const disposables: { dispose: () => void }[] = [];
      if (originalEditable && onOriginalChange) {
        const orig = model.original;
        if (orig) {
          disposables.push(orig.onDidChangeContent(() => onOriginalChange(orig.getValue())));
        }
      }
      if (modifiedEditable && onModifiedChange) {
        const mod = model.modified;
        if (mod) {
          disposables.push(mod.onDidChangeContent(() => onModifiedChange(mod.getValue())));
        }
      }
      return () => {
        diffEditorRef.current = null;
        disposables.forEach((d) => d.dispose());
      };
    },
    [originalEditable, modifiedEditable, onOriginalChange, onModifiedChange],
  );

  const bothEditable = originalEditable || modifiedEditable;

  return (
    <div
      className={`relative h-full min-h-0 overflow-hidden border ${outputPanelClass} ${className ?? ""}`}
    >
      <DiffEditor
        height="100%"
        original={original}
        modified={modified}
        language={language}
        theme={monacoTheme}
        onMount={handleMount}
        options={{
          readOnly: !bothEditable,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderSideBySide: true,
          minimap: { enabled: false },
          wordWrap: "on",
          fontSize,
          originalEditable,
          diffWordWrap: "on",
          ignoreTrimWhitespace: false,
        }}
      />
    </div>
  );
});
