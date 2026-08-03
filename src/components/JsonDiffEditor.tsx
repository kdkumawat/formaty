"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { DiffEditor, type DiffOnMount } from "@monaco-editor/react";
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
 * Live-friendly DiffEditor wrapper.
 *
 * @monaco-editor/react calls model.setValue() whenever `original` / `modified` props
 * change, which both wipes undo and can lag decorations by a keystroke when React
 * state is used as a controlled value. We therefore:
 *  - pass props only as the initial seed (stable after mount)
 *  - apply external updates via model.setValue on the live models
 *  - let typing update models natively so diff highlights stay live
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
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);
  const onOriginalChangeRef = useRef(onOriginalChange);
  const onModifiedChangeRef = useRef(onModifiedChange);
  const onLineStatsChangeRef = useRef(onLineStatsChange);
  const onNavChangeRef = useRef(onNavChange);
  onOriginalChangeRef.current = onOriginalChange;
  onModifiedChangeRef.current = onModifiedChange;
  onLineStatsChangeRef.current = onLineStatsChange;
  onNavChangeRef.current = onNavChange;

  // Values last known to match the live models (typing + external)
  const lastOriginalRef = useRef(original);
  const lastModifiedRef = useRef(modified);
  // Seed values frozen for the DiffEditor React props (never updated after first paint
  // of this instance — remount via parent key if a full reset is required)
  const seedOriginalRef = useRef(original);
  const seedModifiedRef = useRef(modified);
  const mountedRef = useRef(false);

  const emitStatsAndNav = useCallback(() => {
    const ed = diffEditorRef.current;
    if (!ed) return;
    const changes = ed.getLineChanges();
    onLineStatsChangeRef.current?.(computeLineStats(changes));

    const modEditor = ed.getModifiedEditor();
    const currentLine = modEditor.getPosition()?.lineNumber ?? 0;
    const list = changes ?? [];
    if (list.length === 0) {
      onNavChangeRef.current?.({ current: 0, total: 0 });
      return;
    }
    let idx = list.findIndex((c) => c.modifiedStartLineNumber >= currentLine);
    if (idx < 0) idx = list.length - 1;
    else if (idx > 0 && list[idx].modifiedStartLineNumber > currentLine) {
      const prev = list[idx - 1];
      if (prev.modifiedEndLineNumber > 0 && currentLine <= prev.modifiedEndLineNumber) {
        idx = idx - 1;
      }
    }
    onNavChangeRef.current?.({ current: idx + 1, total: list.length });
  }, []);

  const applyExternalValue = useCallback((side: "original" | "modified", value: string) => {
    const ed = diffEditorRef.current;
    if (!ed) return;
    const model = side === "original" ? ed.getModel()?.original : ed.getModel()?.modified;
    if (!model) return;
    if (model.getValue() === value) return;
    // setValue resets that side's undo stack — only used for external sync (swap, paste from parent, enter-diff)
    model.setValue(value);
  }, []);

  // External prop sync (parent state changed, not from our own typing)
  useEffect(() => {
    if (!mountedRef.current) {
      lastOriginalRef.current = original;
      return;
    }
    if (original === lastOriginalRef.current) return;
    lastOriginalRef.current = original;
    applyExternalValue("original", original);
  }, [original, applyExternalValue]);

  useEffect(() => {
    if (!mountedRef.current) {
      lastModifiedRef.current = modified;
      return;
    }
    if (modified === lastModifiedRef.current) return;
    lastModifiedRef.current = modified;
    applyExternalValue("modified", modified);
  }, [modified, applyExternalValue]);

  // Language / theme / options updates without touching model text
  useEffect(() => {
    const ed = diffEditorRef.current;
    const monaco = monacoRef.current;
    if (!ed || !monaco) return;
    const model = ed.getModel();
    if (!model) return;
    monaco.editor.setModelLanguage(model.original, language);
    monaco.editor.setModelLanguage(model.modified, language);
  }, [language]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (monaco) monaco.editor.setTheme(monacoTheme);
  }, [monacoTheme]);

  const editorOptions = useMemo(
    () => ({
      readOnly: !(originalEditable || modifiedEditable),
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderSideBySide,
      minimap: { enabled: false },
      wordWrap: "on" as const,
      fontSize,
      originalEditable,
      diffWordWrap: "on" as const,
      ignoreTrimWhitespace,
      renderIndicators: true,
      renderMarginRevertIcon: originalEditable || modifiedEditable,
      enableSplitViewResizing: true,
    }),
    [originalEditable, modifiedEditable, renderSideBySide, fontSize, ignoreTrimWhitespace],
  );

  useEffect(() => {
    diffEditorRef.current?.updateOptions(editorOptions);
    // Diff recompute is async after option changes
    const t = window.setTimeout(emitStatsAndNav, 50);
    return () => window.clearTimeout(t);
  }, [editorOptions, emitStatsAndNav]);

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

  const getPreferredEditor = useCallback((preferUndo: boolean): editor.IStandaloneCodeEditor | null => {
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
  }, []);

  const goToChangeIndex = useCallback((indexZeroBased: number) => {
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
        const currentLine = ed.getModifiedEditor().getPosition()?.lineNumber ?? 0;
        const nextIdx = changes.findIndex((c) => c.modifiedStartLineNumber > currentLine);
        goToChangeIndex(nextIdx >= 0 ? nextIdx : 0);
      },
      prevChange() {
        const ed = diffEditorRef.current;
        if (!ed) return;
        const changes = ed.getLineChanges();
        if (!changes || changes.length === 0) return;
        const currentLine = ed.getModifiedEditor().getPosition()?.lineNumber ?? 0;
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
        return diffEditorRef.current?.getOriginalEditor().getModel()?.getValue() ?? lastOriginalRef.current;
      },
      getModifiedValue() {
        return diffEditorRef.current?.getModifiedEditor().getModel()?.getValue() ?? lastModifiedRef.current;
      },
      focusOriginal() {
        diffEditorRef.current?.getOriginalEditor().focus();
      },
      focusModified() {
        diffEditorRef.current?.getModifiedEditor().focus();
      },
      setBoth(nextOriginal: string, nextModified: string) {
        lastOriginalRef.current = nextOriginal;
        lastModifiedRef.current = nextModified;
        applyExternalValue("original", nextOriginal);
        applyExternalValue("modified", nextModified);
        window.setTimeout(emitStatsAndNav, 30);
      },
    }),
    [getFocusedEditor, getPreferredEditor, goToChangeIndex, applyExternalValue, emitStatsAndNav],
  );

  const disposablesRef = useRef<{ dispose: () => void }[]>([]);

  const handleMount = useCallback<DiffOnMount>(
    (ed, monaco) => {
      // Dispose previous listeners if remounting
      disposablesRef.current.forEach((d) => d.dispose());
      disposablesRef.current = [];

      diffEditorRef.current = ed;
      monacoRef.current = monaco as unknown as typeof import("monaco-editor");
      mountedRef.current = true;
      lastOriginalRef.current = ed.getOriginalEditor().getModel()?.getValue() ?? seedOriginalRef.current;
      lastModifiedRef.current = ed.getModifiedEditor().getModel()?.getValue() ?? seedModifiedRef.current;

      const disposables: { dispose: () => void }[] = [];
      const model = ed.getModel();

      // Prefer Monaco's own "diff finished" event for live stats/highlights
      const anyEd = ed as editor.IStandaloneDiffEditor & {
        onDidUpdateDiff?: (listener: () => void) => { dispose: () => void };
      };
      if (typeof anyEd.onDidUpdateDiff === "function") {
        disposables.push(anyEd.onDidUpdateDiff(() => emitStatsAndNav()));
      }

      if (model?.original) {
        disposables.push(
          model.original.onDidChangeContent(() => {
            const value = model.original.getValue();
            lastOriginalRef.current = value;
            onOriginalChangeRef.current?.(value);
            // Fallback if onDidUpdateDiff is unavailable
            window.setTimeout(emitStatsAndNav, 0);
          }),
        );
      }
      if (model?.modified) {
        disposables.push(
          model.modified.onDidChangeContent(() => {
            const value = model.modified.getValue();
            lastModifiedRef.current = value;
            onModifiedChangeRef.current?.(value);
            window.setTimeout(emitStatsAndNav, 0);
          }),
        );
      }

      disposables.push(ed.getModifiedEditor().onDidChangeCursorPosition(() => emitStatsAndNav()));
      disposablesRef.current = disposables;

      try {
        if (model) {
          monaco.editor.setModelLanguage(model.original, language);
          monaco.editor.setModelLanguage(model.modified, language);
        }
        monaco.editor.setTheme(monacoTheme);
      } catch {
        /* ignore */
      }

      window.setTimeout(emitStatsAndNav, 50);
    },
    [emitStatsAndNav],
  );

  useEffect(
    () => () => {
      mountedRef.current = false;
      disposablesRef.current.forEach((d) => d.dispose());
      disposablesRef.current = [];
      diffEditorRef.current = null;
    },
    [],
  );

  return (
    <div
      className={`relative h-full min-h-0 overflow-hidden border ${outputPanelClass} ${className ?? ""}`}
    >
      <DiffEditor
        height="100%"
        // Stable seeds — never feed live React state back into these props
        original={seedOriginalRef.current}
        modified={seedModifiedRef.current}
        language={language}
        theme={monacoTheme}
        onMount={handleMount}
        options={editorOptions}
      />
    </div>
  );
});
