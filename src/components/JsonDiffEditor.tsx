"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { DiffEditor } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import type { LineDiffStats } from "@/lib/json/diff";

export interface DiffNavState {
  /** 1-based index of current change, or 0 if none. */
  current: number;
  total: number;
}

export interface JsonDiffEditorRef {
  pasteIntoFocusedEditor: (text: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  nextChange: () => void;
  prevChange: () => void;
  goToChange: (indexZeroBased: number) => void;
  getDiffCount: () => number;
  getLineStats: () => LineDiffStats;
  getOriginalValue: () => string;
  getModifiedValue: () => string;
  focusOriginal: () => void;
  focusModified: () => void;
  /** Replace both sides in one go (e.g. swap) without intermediate flicker. */
  setBoth: (original: string, modified: string) => void;
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
  onLineStatsChange?: (stats: LineDiffStats) => void;
  onNavChange?: (nav: DiffNavState) => void;
  outputPanelClass?: string;
  renderSideBySide?: boolean;
  ignoreTrimWhitespace?: boolean;
}

function computeLineStats(changes: editor.ILineChange[] | null): LineDiffStats {
  if (!changes || changes.length === 0) {
    return {
      hunks: 0,
      linesAdded: 0,
      linesRemoved: 0,
      hunksModified: 0,
      hunksAdded: 0,
      hunksRemoved: 0,
    };
  }
  let linesAdded = 0;
  let linesRemoved = 0;
  let hunksAdded = 0;
  let hunksRemoved = 0;
  let hunksModified = 0;
  for (const c of changes) {
    const origLen =
      c.originalEndLineNumber === 0
        ? 0
        : c.originalEndLineNumber - c.originalStartLineNumber + 1;
    const modLen =
      c.modifiedEndLineNumber === 0
        ? 0
        : c.modifiedEndLineNumber - c.modifiedStartLineNumber + 1;
    linesRemoved += origLen;
    linesAdded += modLen;
    if (origLen === 0 && modLen > 0) hunksAdded++;
    else if (modLen === 0 && origLen > 0) hunksRemoved++;
    else hunksModified++;
  }
  return {
    hunks: changes.length,
    linesAdded,
    linesRemoved,
    hunksModified,
    hunksAdded,
    hunksRemoved,
  };
}

/**
 * Monaco DiffEditor from @monaco-editor/react calls model.setValue() whenever the
 * `original` prop changes, which wipes the undo stack. We keep stable prop values
 * for the DiffEditor and only push external updates, so typing does not destroy undo.
 */
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
    onLineStatsChange,
    onNavChange,
    outputPanelClass = "border-base-300 bg-base-100",
    renderSideBySide = true,
    ignoreTrimWhitespace = false,
  },
  ref,
) {
  const diffEditorRef = useRef<editor.IStandaloneDiffEditor | null>(null);
  const onOriginalChangeRef = useRef(onOriginalChange);
  const onModifiedChangeRef = useRef(onModifiedChange);
  const onLineStatsChangeRef = useRef(onLineStatsChange);
  const onNavChangeRef = useRef(onNavChange);
  onOriginalChangeRef.current = onOriginalChange;
  onModifiedChangeRef.current = onModifiedChange;
  onLineStatsChangeRef.current = onLineStatsChange;
  onNavChangeRef.current = onNavChange;

  const [editorOriginal, setEditorOriginal] = useState(original);
  const [editorModified, setEditorModified] = useState(modified);
  const lastEmittedOriginal = useRef(original);
  const lastEmittedModified = useRef(modified);
  const statsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (original === lastEmittedOriginal.current) return;
    lastEmittedOriginal.current = original;
    setEditorOriginal(original);
  }, [original]);

  useEffect(() => {
    if (modified === lastEmittedModified.current) return;
    lastEmittedModified.current = modified;
    setEditorModified(modified);
  }, [modified]);

  const emitStatsAndNav = useCallback(() => {
    const ed = diffEditorRef.current;
    if (!ed) return;
    const changes = ed.getLineChanges();
    const stats = computeLineStats(changes);
    onLineStatsChangeRef.current?.(stats);

    const modEditor = ed.getModifiedEditor();
    const currentLine = modEditor.getPosition()?.lineNumber ?? 0;
    const list = changes ?? [];
    if (list.length === 0) {
      onNavChangeRef.current?.({ current: 0, total: 0 });
      return;
    }
    // Find nearest change at or after cursor; else last change before cursor
    let idx = list.findIndex((c) => c.modifiedStartLineNumber >= currentLine);
    if (idx < 0) {
      // cursor past all changes — use last
      idx = list.length - 1;
    } else if (idx > 0 && list[idx].modifiedStartLineNumber > currentLine) {
      // if not exactly on a change, prefer previous if cursor is between
      const prev = list[idx - 1];
      if (prev.modifiedEndLineNumber > 0 && currentLine <= prev.modifiedEndLineNumber) {
        idx = idx - 1;
      } else if (currentLine < list[idx].modifiedStartLineNumber && idx > 0) {
        // between hunks — show upcoming as current for "N of M" feel when navigating
      }
    }
    // Clamp: if on a pure deletion (modifiedStartLineNumber can be 0-ish), still count
    onNavChangeRef.current?.({ current: idx + 1, total: list.length });
  }, []);

  const scheduleStats = useCallback(() => {
    if (statsTimerRef.current) clearTimeout(statsTimerRef.current);
    statsTimerRef.current = setTimeout(() => {
      statsTimerRef.current = null;
      emitStatsAndNav();
    }, 80);
  }, [emitStatsAndNav]);

  useEffect(() => () => {
    if (statsTimerRef.current) clearTimeout(statsTimerRef.current);
  }, []);

  // Recompute when layout / ignore-whitespace option changes (Monaco recomputes async)
  useEffect(() => {
    const t = setTimeout(emitStatsAndNav, 120);
    return () => clearTimeout(t);
  }, [renderSideBySide, ignoreTrimWhitespace, editorOriginal, editorModified, emitStatsAndNav]);

  const getFocusedEditor = useCallback((): editor.IStandaloneCodeEditor | null => {
    const ed = diffEditorRef.current;
    if (!ed) return null;
    const orig = ed.getOriginalEditor();
    const mod = ed.getModifiedEditor();
    if (document.activeElement) {
      const origDom = orig.getContainerDomNode?.();
      const modDom = mod.getContainerDomNode?.();
      if (origDom?.contains(document.activeElement)) return orig;
      if (modDom?.contains(document.activeElement)) return mod;
    }
    if (orig.getModel()?.canUndo()) return orig;
    if (mod.getModel()?.canUndo()) return mod;
    return mod;
  }, []);

  const getPreferredEditor = useCallback(
    (preferUndo: boolean): editor.IStandaloneCodeEditor | null => {
      const ed = diffEditorRef.current;
      if (!ed) return null;
      const orig = ed.getOriginalEditor();
      const mod = ed.getModifiedEditor();
      if (document.activeElement) {
        const origDom = orig.getContainerDomNode?.();
        const modDom = mod.getContainerDomNode?.();
        if (origDom?.contains(document.activeElement)) return orig;
        if (modDom?.contains(document.activeElement)) return mod;
      }
      if (preferUndo) {
        if (orig.getModel()?.canUndo()) return orig;
        if (mod.getModel()?.canUndo()) return mod;
      } else {
        if (orig.getModel()?.canRedo()) return orig;
        if (mod.getModel()?.canRedo()) return mod;
      }
      return mod;
    },
    [],
  );

  const goToChangeIndex = useCallback(
    (indexZeroBased: number) => {
      const ed = diffEditorRef.current;
      if (!ed) return;
      const changes = ed.getLineChanges();
      if (!changes || changes.length === 0) return;
      const i = ((indexZeroBased % changes.length) + changes.length) % changes.length;
      const target = changes[i];
      const modEditor = ed.getModifiedEditor();
      const line =
        target.modifiedStartLineNumber > 0
          ? target.modifiedStartLineNumber
          : Math.max(1, target.originalStartLineNumber);
      modEditor.revealLineInCenter(line);
      modEditor.setPosition({ lineNumber: line, column: 1 });
      modEditor.focus();
      onNavChangeRef.current?.({ current: i + 1, total: changes.length });
    },
    [],
  );

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
        const ed = getPreferredEditor(true);
        if (ed) ed.trigger("keyboard", "undo", null);
      },
      redo() {
        const ed = getPreferredEditor(false);
        if (ed) ed.trigger("keyboard", "redo", null);
      },
      canUndo() {
        const ed = diffEditorRef.current;
        if (!ed) return false;
        return (
          (ed.getOriginalEditor().getModel()?.canUndo() ?? false) ||
          (ed.getModifiedEditor().getModel()?.canUndo() ?? false)
        );
      },
      canRedo() {
        const ed = diffEditorRef.current;
        if (!ed) return false;
        return (
          (ed.getOriginalEditor().getModel()?.canRedo() ?? false) ||
          (ed.getModifiedEditor().getModel()?.canRedo() ?? false)
        );
      },
      nextChange() {
        const ed = diffEditorRef.current;
        if (!ed) return;
        const changes = ed.getLineChanges();
        if (!changes || changes.length === 0) return;
        const modEditor = ed.getModifiedEditor();
        const currentLine = modEditor.getPosition()?.lineNumber ?? 0;
        const nextIdx = changes.findIndex((c) => c.modifiedStartLineNumber > currentLine);
        goToChangeIndex(nextIdx >= 0 ? nextIdx : 0);
      },
      prevChange() {
        const ed = diffEditorRef.current;
        if (!ed) return;
        const changes = ed.getLineChanges();
        if (!changes || changes.length === 0) return;
        const modEditor = ed.getModifiedEditor();
        const currentLine = modEditor.getPosition()?.lineNumber ?? 0;
        let prevIdx = -1;
        for (let i = changes.length - 1; i >= 0; i--) {
          if (changes[i].modifiedStartLineNumber < currentLine) {
            prevIdx = i;
            break;
          }
        }
        goToChangeIndex(prevIdx >= 0 ? prevIdx : changes.length - 1);
      },
      goToChange(indexZeroBased: number) {
        goToChangeIndex(indexZeroBased);
      },
      getDiffCount() {
        return diffEditorRef.current?.getLineChanges()?.length ?? 0;
      },
      getLineStats() {
        return computeLineStats(diffEditorRef.current?.getLineChanges() ?? null);
      },
      getOriginalValue() {
        return diffEditorRef.current?.getOriginalEditor().getModel()?.getValue() ?? lastEmittedOriginal.current;
      },
      getModifiedValue() {
        return diffEditorRef.current?.getModifiedEditor().getModel()?.getValue() ?? lastEmittedModified.current;
      },
      focusOriginal() {
        diffEditorRef.current?.getOriginalEditor().focus();
      },
      focusModified() {
        diffEditorRef.current?.getModifiedEditor().focus();
      },
      setBoth(nextOriginal: string, nextModified: string) {
        lastEmittedOriginal.current = nextOriginal;
        lastEmittedModified.current = nextModified;
        setEditorOriginal(nextOriginal);
        setEditorModified(nextModified);
      },
    }),
    [getFocusedEditor, getPreferredEditor, goToChangeIndex],
  );

  const handleMount = useCallback(
    (ed: editor.IStandaloneDiffEditor) => {
      diffEditorRef.current = ed;
      const model = ed.getModel();
      if (!model) return;
      const disposables: { dispose: () => void }[] = [];

      const onContent = () => scheduleStats();
      if (model.original) {
        disposables.push(model.original.onDidChangeContent(onContent));
        if (originalEditable) {
          disposables.push(
            model.original.onDidChangeContent(() => {
              const value = model.original.getValue();
              lastEmittedOriginal.current = value;
              onOriginalChangeRef.current?.(value);
            }),
          );
        }
      }
      if (model.modified) {
        disposables.push(model.modified.onDidChangeContent(onContent));
        if (modifiedEditable) {
          disposables.push(
            model.modified.onDidChangeContent(() => {
              const value = model.modified.getValue();
              lastEmittedModified.current = value;
              onModifiedChangeRef.current?.(value);
            }),
          );
        }
      }

      const modEditor = ed.getModifiedEditor();
      disposables.push(modEditor.onDidChangeCursorPosition(() => scheduleStats()));

      // Initial stats after Monaco computes diff
      setTimeout(() => emitStatsAndNav(), 100);

      return () => {
        diffEditorRef.current = null;
        disposables.forEach((d) => d.dispose());
      };
    },
    [originalEditable, modifiedEditable, scheduleStats, emitStatsAndNav],
  );

  const bothEditable = originalEditable || modifiedEditable;

  return (
    <div
      className={`relative h-full min-h-0 overflow-hidden border ${outputPanelClass} ${className ?? ""}`}
    >
      <DiffEditor
        height="100%"
        original={editorOriginal}
        modified={editorModified}
        language={language}
        theme={monacoTheme}
        onMount={handleMount}
        options={{
          readOnly: !bothEditable,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderSideBySide,
          minimap: { enabled: false },
          wordWrap: "on",
          fontSize,
          originalEditable,
          diffWordWrap: "on",
          ignoreTrimWhitespace,
          renderIndicators: true,
          renderMarginRevertIcon: bothEditable,
          enableSplitViewResizing: true,
        }}
      />
    </div>
  );
});
