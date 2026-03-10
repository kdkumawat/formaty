"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ChevronDownIcon,
  ComputerDesktopIcon,
  Cog6ToothIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline";
import { JsonDiffEditor } from "@/components/JsonDiffEditor";
import { JsonEditor } from "@/components/JsonEditor";
import { TreeView } from "@/components/TreeView";
import { diffJson } from "@/lib/json/diff";
import { useJsonWorker } from "@/hooks/useJsonWorker";
import type { JsonValue, TypeTargetLanguage } from "@/lib/json/core";

const SAMPLE_JSON = `{
  "id": 42,
  "name": "jsonix",
  "tags": ["json", "tooling", "productivity"],
  "owner": {
    "team": "platform",
    "active": true,
    "priority": null
  },
  "metrics": [
    { "day": "mon", "count": 1023 },
    { "day": "tue", "count": 1290 }
  ]
}`;

const OPERATION_ACTIONS = [
  ["Format", "format"],
  ["Minify", "minify"],
  ["Sort", "sort"],
  ["Remove Empty", "removeEmpty"],
  ["Flatten", "flatten"],
  ["Unflatten", "unflatten"],
  ["Schema", "schema"],
  ["Validate", "validate"],
  ["Diff", "diff"],
  ["YAML", "yaml"],
  ["XML", "xml"],
  ["CSV", "csv"],
] as const;

const TYPE_LANGUAGES: Array<{ id: TypeTargetLanguage; label: string; ext: string }> = [
  { id: "typescript", label: "TypeScript", ext: "ts" },
  { id: "java", label: "Java", ext: "java" },
  { id: "csharp", label: "C#", ext: "cs" },
  { id: "python", label: "Python", ext: "py" },
  { id: "go", label: "Go", ext: "go" },
  { id: "protobuf", label: "Protobuf", ext: "proto" },
  { id: "kotlin", label: "Kotlin", ext: "kt" },
  { id: "swift", label: "Swift", ext: "swift" },
  { id: "rust", label: "Rust", ext: "rs" },
  { id: "sql", label: "SQL", ext: "sql" },
];

type OperationAction = (typeof OPERATION_ACTIONS)[number][1] | "generateTypes";
type OutputLanguage =
  | "json"
  | "yaml"
  | "xml"
  | "sql"
  | "typescript"
  | "python"
  | "java"
  | "csharp"
  | "go"
  | "kotlin"
  | "swift"
  | "rust"
  | "plaintext";
type ThemeMode = "system" | "dark" | "light";
type ModalKind = "validate" | "diff" | null;
type RightView = "raw" | "tree";

const EXT_BY_ACTION: Record<Exclude<OperationAction, "generateTypes"> | "parse", string> = {
  parse: "json",
  format: "json",
  minify: "json",
  sort: "json",
  removeEmpty: "json",
  flatten: "json",
  unflatten: "json",
  schema: "json",
  validate: "json",
  diff: "json",
  yaml: "yaml",
  xml: "xml",
  csv: "csv",
};

const LANGUAGE_BY_ACTION: Record<Exclude<OperationAction, "generateTypes"> | "parse", OutputLanguage> =
  {
    parse: "json",
    format: "json",
    minify: "json",
    sort: "json",
    removeEmpty: "json",
    flatten: "json",
    unflatten: "json",
    schema: "json",
    validate: "json",
    diff: "json",
    yaml: "yaml",
    xml: "xml",
    csv: "plaintext",
  };

const LANGUAGE_BY_TYPE_TARGET: Record<TypeTargetLanguage, OutputLanguage> = {
  typescript: "typescript",
  sql: "sql",
  java: "java",
  csharp: "csharp",
  python: "python",
  go: "go",
  protobuf: "plaintext",
  kotlin: "kotlin",
  swift: "swift",
  rust: "rust",
};

export default function Home() {
  const { run } = useJsonWorker();
  const [input, setInput] = useState(SAMPLE_JSON);
  const [output, setOutput] = useState("");
  const [parsedOutput, setParsedOutput] = useState<JsonValue | null>(null);
  const [outputExt, setOutputExt] = useState("json");
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("json");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeOperation, setActiveOperation] = useState<OperationAction | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [split, setSplit] = useState(30);
  const [isResizing, setIsResizing] = useState(false);
  const [schemaInput, setSchemaInput] = useState("");
  const [compareInput, setCompareInput] = useState("");
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [modalValue, setModalValue] = useState("");
  const [diffPreview, setDiffPreview] = useState<{ original: string; modified: string } | null>(null);
  const [rightView, setRightView] = useState<RightView>("raw");
  const [typeLanguage, setTypeLanguage] = useState<TypeTargetLanguage>("typescript");
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [isInputMinimized, setIsInputMinimized] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [focusedPane, setFocusedPane] = useState<"input" | "output">("input");
  const [undoStack, setUndoStack] = useState<string[]>([SAMPLE_JSON]);
  const [undoIndex, setUndoIndex] = useState(0);
  const historyLock = useRef(false);
  const splitContainerRef = useRef<HTMLElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  const canDownload = useMemo(() => output.trim().length > 0, [output]);
  const isModalInputValid = useMemo(() => {
    if (!modalKind) return false;
    if (!modalValue.trim()) return false;
    try {
      JSON.parse(modalValue);
      return true;
    } catch {
      return false;
    }
  }, [modalKind, modalValue]);
  const resolvedTheme: Exclude<ThemeMode, "system"> =
    themeMode === "system" ? (systemDark ? "dark" : "light") : themeMode;
  const isDark = resolvedTheme === "dark";
  const toolbarBorderClass = isDark ? "border-white/45" : "border-base-300";
  const toolbarDividerClass = isDark ? "bg-white/45" : "bg-base-300";
  const monacoTheme = isDark ? "vs-dark" : "vs";
  const outputPanelClass = isDark ? "border-[#3c3c3c] bg-[#252526]" : "border-[#d4d4d4] bg-[#f3f3f3]";
  const canUndo = undoIndex > 0;
  const canRedo = undoIndex < undoStack.length - 1;
  const selectedTypeLanguageLabel =
    TYPE_LANGUAGES.find((item) => item.id === typeLanguage)?.label ?? "Language";
  const toolbarBtnBase =
    `btn btn-sm h-9 min-h-9 rounded-md border ${toolbarBorderClass} bg-base-100 px-2.5 text-base-content shadow-none hover:bg-base-200`;
  const toolbarBtnActive =
    "btn btn-sm h-9 min-h-9 rounded-md border border-primary bg-primary px-2.5 text-primary-content shadow-none hover:bg-primary/90";
  const toolbarBtnIcon =
    `btn btn-sm btn-square h-9 min-h-9 rounded-md border ${toolbarBorderClass} bg-base-100 text-base-content shadow-none hover:bg-base-200`;
  const themeOptions = [
    { mode: "system" as const, ariaLabel: "Use system theme", title: "System theme", Icon: ComputerDesktopIcon },
    { mode: "light" as const, ariaLabel: "Use light theme", title: "Light theme", Icon: SunIcon },
    { mode: "dark" as const, ariaLabel: "Use dark theme", title: "Dark theme", Icon: MoonIcon },
  ];

  const pushHistory = (next: string) => {
    if (historyLock.current) return;
    setUndoStack((prev) => {
      if (prev[undoIndex] === next) return prev;
      const sliced = prev.slice(0, undoIndex + 1);
      const result = [...sliced, next].slice(-100);
      setUndoIndex(result.length - 1);
      return result;
    });
  };

  const moveHistory = (delta: -1 | 1) => {
    if (delta < 0 && !canUndo) return;
    if (delta > 0 && !canRedo) return;
    const next = undoStack[undoIndex + delta];
    historyLock.current = true;
    setUndoIndex((n) => n + delta);
    setInput(next);
    setTimeout(() => {
      historyLock.current = false;
    }, 0);
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const onChange = (event: MediaQueryListEvent) => setIsDesktopLayout(event.matches);
    setIsDesktopLayout(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("jsonix-session");
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as {
        input?: string;
        output?: string;
        split?: number;
        themeMode?: ThemeMode;
        typeLanguage?: TypeTargetLanguage;
        rightView?: RightView;
      };
      if (data.input) setInput(data.input);
      if (data.output) setOutput(data.output);
      if (typeof data.split === "number") setSplit(data.split);
      if (data.themeMode) setThemeMode(data.themeMode);
      if (data.typeLanguage) setTypeLanguage(data.typeLanguage);
      if (data.rightView) setRightView(data.rightView);
    } catch {
      // Ignore malformed persisted sessions.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "jsonix-session",
      JSON.stringify({ input, output, split, themeMode, typeLanguage, rightView }),
    );
  }, [input, output, split, themeMode, typeLanguage, rightView]);

  useEffect(() => {
    if (!output.trim()) {
      setParsedOutput(null);
      return;
    }
    try {
      setParsedOutput(JSON.parse(output) as JsonValue);
    } catch {
      setParsedOutput(null);
    }
  }, [output]);

  useEffect(() => {
    if (rightView === "tree" && !parsedOutput) {
      setRightView("raw");
    }
  }, [rightView, parsedOutput]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      if (event.key === "Enter") {
        event.preventDefault();
        parseOnly();
      }
      if (event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        moveHistory(-1);
      }
      if (event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        moveHistory(1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (event: MouseEvent) => {
      const section = splitContainerRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const nextSplit = ((event.clientX - rect.left) / rect.width) * 100;
      setSplit(Math.max(30, Math.min(70, Math.round(nextSplit))));
    };

    const onMouseUp = () => setIsResizing(false);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (!modalKind) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalKind(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalKind]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (isSettingsOpen && settingsRef.current && !settingsRef.current.contains(target)) {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [isSettingsOpen]);

  const setOutputData = (
    value: string,
    action: OperationAction | "parse",
    lang?: OutputLanguage,
    typeTarget?: TypeTargetLanguage,
  ) => {
    setOutput(value);
    if (action === "generateTypes") {
      const target = typeTarget ?? typeLanguage;
      const current = TYPE_LANGUAGES.find((item) => item.id === target);
      setOutputExt(current?.ext ?? "txt");
      setOutputLanguage(lang ?? LANGUAGE_BY_TYPE_TARGET[target]);
      return;
    }
    setOutputExt(EXT_BY_ACTION[action]);
    setOutputLanguage(LANGUAGE_BY_ACTION[action]);
  };

  const parseOnly = () => {
    setBusy(true);
    setError(null);
    setDiffPreview(null);
    void (async () => {
      try {
        const json = await run<JsonValue>("parse", { input });
        setOutputData(JSON.stringify(json, null, 2), "parse");
        setActiveOperation(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Invalid JSON");
      } finally {
        setBusy(false);
      }
    })();
  };

  const executeOperation = (
    action: OperationAction,
    options?: {
      schemaText?: string;
      compareText?: string;
      typeLanguage?: TypeTargetLanguage;
    },
  ) => {
    setBusy(true);
    setError(null);
    setDiffPreview(null);
    void (async () => {
      try {
        const left = await run<JsonValue>("parse", { input });

        if (action === "validate") {
          const schemaText = options?.schemaText ?? schemaInput;
          if (!schemaText.trim()) throw new Error("Schema is required for Validate.");
          const schema = JSON.parse(schemaText);
          const result = await run<{ valid: boolean; errors: unknown[] }>("validate", {
            json: left,
            schema,
          });
          setOutputData(JSON.stringify(result, null, 2), action);
          return;
        }

        if (action === "diff") {
          const compareText = options?.compareText ?? compareInput;
          if (!compareText.trim()) throw new Error("Compare JSON is required for Diff.");
          const right = await run<JsonValue>("parse", { input: compareText });
          setDiffPreview({
            original: JSON.stringify(left, null, 2),
            modified: JSON.stringify(right, null, 2),
          });
          setRightView("raw");
          const result = diffJson(left, right);
          setOutputData(JSON.stringify(result, null, 2), action);
          return;
        }

        if (action === "generateTypes") {
          const targetLanguage = options?.typeLanguage ?? typeLanguage;
          const result = await run<string>("generateTypes", {
            json: left,
            language: targetLanguage,
          });
          setTypeLanguage(targetLanguage);
          setOutputData(result, action, undefined, targetLanguage);
          return;
        }

        if (action === "schema") {
          const result = await run<JsonValue>("schema", { json: left });
          const text = JSON.stringify(result, null, 2);
          setSchemaInput(text);
          setOutputData(text, action);
          return;
        }

        if (action === "yaml" || action === "xml" || action === "csv") {
          const result = await run<string>("convert", { json: left, kind: action });
          setOutputData(result, action);
          return;
        }

        const result = await run<unknown>(action as never, { json: left });
        setOutputData(
          typeof result === "string" ? result : JSON.stringify(result as JsonValue, null, 2),
          action,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Operation failed.");
      } finally {
        setBusy(false);
      }
    })();
  };

  const runOperation = (action: OperationAction) => {
    setFocusedPane("output");
    setActiveOperation(action);
    if (action === "validate") {
      setModalKind("validate");
      setModalValue(schemaInput);
      return;
    }
    if (action === "diff") {
      setModalKind("diff");
      setModalValue(compareInput);
      setDiffPreview(null);
      return;
    }
    executeOperation(action);
  };

  const downloadOutput = () => {
    if (!output.trim()) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jsonix-output.${outputExt}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyOutput = async () => {
    if (!output.trim()) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopyState("done");
    } catch {
      setCopyState("error");
    }
    window.setTimeout(() => setCopyState("idle"), 1400);
  };

  const toggleInputMinimized = () => {
    setIsInputMinimized((prev) => !prev);
    setFocusedPane((prev) => (prev === "input" ? "output" : prev));
  };

  const importJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setInput(text);
      pushHistory(text);
      setError(null);
    };
    reader.onerror = () => setError("Unable to read selected file.");
    reader.readAsText(file);
  };

  return (
    <main
      data-theme={resolvedTheme}
      className="min-h-screen overflow-y-auto bg-base-200 p-3 text-base-content md:p-4 xl:h-screen xl:overflow-hidden"
    >
      <div className="mx-auto min-h-full max-w-[1700px] flex flex-col gap-3 xl:h-full">
        <section className="rounded-md border border-base-300 bg-base-100 p-2.5 shadow-sm">
          <div className="flex items-center gap-2 overflow-x-auto overflow-y-visible pb-1">
            <div className="flex shrink-0 items-center gap-2">
              <label
                className={toolbarBtnBase}
              >
                Import JSON
                <input
                  type="file"
                  accept=".json,application/json,text/plain"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    importJsonFile(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                aria-label="Undo"
                title="Undo (Cmd/Ctrl+Z)"
                className={`${toolbarBtnIcon} disabled:opacity-40`}
                disabled={!canUndo}
                onClick={() => moveHistory(-1)}
              >
                <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Redo"
                title="Redo (Shift+Cmd/Ctrl+Z)"
                className={`${toolbarBtnIcon} disabled:opacity-40`}
                disabled={!canRedo}
                onClick={() => moveHistory(1)}
              >
                <ArrowUturnRightIcon className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Reset"
                title="Reset to sample"
                className={toolbarBtnIcon}
                onClick={() => {
                  setInput(SAMPLE_JSON);
                  pushHistory(SAMPLE_JSON);
                  setOutput("");
                  setParsedOutput(null);
                  setError(null);
                  setActiveOperation(null);
                  setSplit(30);
                  setIsInputMinimized(false);
                  setFocusedPane("input");
                  setCopyState("idle");
                }}
              >
                <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div
              aria-hidden="true"
              className={`hidden h-7 w-px self-center md:block ${toolbarDividerClass}`}
            />

            <div className="flex min-w-0 flex-1 items-center gap-2">
              {OPERATION_ACTIONS.map(([label, action]) => (
                <button
                  type="button"
                  key={label}
                  disabled={busy}
                  className={`${activeOperation === action ? toolbarBtnActive : toolbarBtnBase} shrink-0 disabled:opacity-40`}
                  onClick={() => runOperation(action)}
                >
                  {label}
                </button>
              ))}
              <div className="dropdown dropdown-bottom dropdown-end shrink-0">
                <button
                  type="button"
                  className={`${
                    activeOperation === "generateTypes" ? toolbarBtnActive : toolbarBtnBase
                  } inline-flex w-36 items-center justify-between gap-2 sm:w-44`}
                  popoverTarget="type-language-popover"
                  style={{ anchorName: "--type-language-anchor" } as CSSProperties}
                  aria-label="Select type language"
                >
                  <span className="truncate">{selectedTypeLanguageLabel}</span>
                  <ChevronDownIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
                <ul
                  className={`dropdown menu z-30 mt-1 w-52 rounded-box border bg-base-100 p-1 shadow-xl ${toolbarBorderClass}`}
                  popover="auto"
                  id="type-language-popover"
                  style={{ positionAnchor: "--type-language-anchor" } as CSSProperties}
                >
                  {TYPE_LANGUAGES.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={typeLanguage === item.id ? "menu-active" : ""}
                        onClick={(event) => {
                          (event.currentTarget.closest("ul") as (HTMLElement & { hidePopover?: () => void }) | null)
                            ?.hidePopover?.();
                          setFocusedPane("output");
                          setActiveOperation("generateTypes");
                          executeOperation("generateTypes", { typeLanguage: item.id });
                        }}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div aria-hidden="true" className={`h-6 w-px self-center ${toolbarDividerClass}`} />
              <div className={`join ml-auto h-9 shrink-0 overflow-hidden rounded-md border ${toolbarBorderClass}`}>
                {(["raw", "tree"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    disabled={view === "tree" && !parsedOutput}
                    className={`btn btn-sm join-item h-9 min-h-9 rounded-none border-0 px-3 shadow-none disabled:opacity-40 ${
                      rightView === view
                        ? "bg-primary text-primary-content hover:bg-primary/90"
                        : "bg-base-100 text-base-content hover:bg-base-200"
                    }`}
                    onClick={() => setRightView(view)}
                  >
                    {view[0].toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`${toolbarBtnActive} shrink-0 px-3 disabled:opacity-40`}
                disabled={!canDownload}
                onClick={copyOutput}
              >
                {copyState === "done" ? "Copied" : copyState === "error" ? "Copy Failed" : "Copy"}
              </button>
              <button
                type="button"
                className={`${toolbarBtnActive} shrink-0 px-3 disabled:opacity-40`}
                disabled={!canDownload}
                onClick={downloadOutput}
              >
                Download
              </button>
            </div>
          </div>
        </section>

        <section
          ref={splitContainerRef}
          className={`relative flex-1 min-h-0 grid ${isInputMinimized ? "grid-cols-1 gap-0" : "grid-cols-1 gap-3 xl:grid-cols-[1fr_1fr]"}`}
          style={isInputMinimized || !isDesktopLayout ? undefined : { gridTemplateColumns: `${split}% ${100 - split}%` }}
        >
          <div
            className={`absolute top-0 bottom-0 z-20 items-center ${isInputMinimized ? "hidden" : "hidden xl:flex"}`}
            style={{ left: `${split}%`, transform: "translateX(-50%)" }}
          >
            <div className="h-full w-px bg-base-300" />
            <button
              type="button"
              className="absolute inset-y-0 -left-2 w-4 cursor-col-resize bg-transparent"
              aria-label="Resize panels by dragging divider"
              onMouseDown={(event) => {
                event.preventDefault();
                if (isInputMinimized) setIsInputMinimized(false);
                setIsResizing(true);
              }}
            />
          </div>

          {!isInputMinimized ? (
            <div
              className={`min-h-[45vh] transition-all xl:min-h-0 ${focusedPane === "input" ? "opacity-100" : "opacity-60 saturate-50"}`}
              onMouseDown={() => setFocusedPane("input")}
            >
              <JsonEditor
                value={input}
                onChange={(next) => {
                  setInput(next);
                  pushHistory(next);
                  setFocusedPane("input");
                }}
                className="h-full min-h-0"
                language="json"
                monacoTheme={monacoTheme}
                placeholder="Paste or drop JSON here"
                panelTone="input"
              />
            </div>
          ) : null}

          <div
            className="relative flex min-h-[45vh] flex-col xl:min-h-0"
            onMouseDown={() => setFocusedPane("output")}
          >
            <button
              type="button"
              aria-label={isInputMinimized ? "Restore input panel" : "Maximize output panel"}
              title={isInputMinimized ? "Restore input panel" : "Maximize output panel"}
              className={`${toolbarBtnIcon} absolute right-2 top-2 z-20`}
              onClick={toggleInputMinimized}
            >
              {isInputMinimized ? (
                <ArrowsPointingInIcon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ArrowsPointingOutIcon className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <div className="flex-1 min-h-0">
              {rightView === "raw" ? (
                activeOperation === "diff" && diffPreview ? (
                  <JsonDiffEditor
                    original={diffPreview.original}
                    modified={diffPreview.modified}
                    className="h-full min-h-0"
                    language="json"
                    monacoTheme={monacoTheme}
                  />
                ) : output.trim() ? (
                  <JsonEditor
                    value={output}
                    onChange={setOutput}
                    className="h-full min-h-0"
                    readOnly
                    passiveReadOnly
                    language={outputLanguage}
                    monacoTheme={monacoTheme}
                    panelTone="output"
                  />
                ) : (
                  <div className={`flex h-full min-h-[360px] items-center justify-center rounded-xl border text-sm text-base-content/70 ${outputPanelClass}`}>
                    Run any operation to see output here
                  </div>
                )
              ) : null}
              {rightView === "tree" ? (
                parsedOutput ? (
                  <TreeView
                    data={parsedOutput}
                    className={outputPanelClass}
                  />
                ) : (
                  <div className={`flex h-full min-h-[360px] items-center justify-center rounded-xl border text-sm text-base-content/70 ${outputPanelClass}`}>
                    Current output is not valid JSON.
                  </div>
                )
              ) : null}
            </div>
          </div>
        </section>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        {modalKind ? (
          <div className="modal modal-open">
            <div className="modal-box w-full max-w-3xl">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {modalKind === "validate" ? "Schema JSON for Validate" : "Second JSON for Diff"}
                </h3>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setModalKind(null)}
                >
                  Close
                </button>
              </div>
              <textarea
                className="textarea textarea-bordered h-60 w-full text-xs"
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setModalKind(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!isModalInputValid}
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (!isModalInputValid) return;
                    if (modalKind === "validate") {
                      setSchemaInput(modalValue);
                      setModalKind(null);
                      executeOperation("validate", { schemaText: modalValue });
                    } else {
                      setCompareInput(modalValue);
                      setModalKind(null);
                      executeOperation("diff", { compareText: modalValue });
                    }
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setModalKind(null)}>close</button>
            </form>
          </div>
        ) : null}

        <div className="fixed bottom-6 right-6 z-40" ref={settingsRef}>
          {isSettingsOpen ? (
            <div className="absolute bottom-full right-0 mb-2 w-[320px] rounded-box border border-base-300 bg-base-100 p-3 shadow-xl">
              <div className="mb-2 rounded-md border border-base-300 bg-base-200 px-2 py-1.5">
                <p className="text-base font-bold leading-tight">jsonix</p>
                <p className="text-sm leading-tight text-base-content/70">
                  Local-first JSON transform and validation workspace
                </p>
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/70">
                Theme
              </p>
              <div className="join">
                {themeOptions.map(({ mode, ariaLabel, title, Icon }) => (
                  <button
                    key={mode}
                    type="button"
                    aria-label={ariaLabel}
                    title={title}
                    className={`btn btn-sm join-item btn-square ${
                      themeMode === mode ? "btn-primary" : "btn-ghost"
                    }`}
                    onClick={() => setThemeMode(mode)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <button
            type="button"
            aria-label="Open theme settings"
            title="Theme settings"
            className="btn btn-primary btn-circle shadow-lg"
            onClick={() => setIsSettingsOpen((s) => !s)}
          >
            <Cog6ToothIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

      </div>
    </main>
  );
}
