"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
  ComputerDesktopIcon,
  Cog6ToothIcon,
  MinusIcon,
  MoonIcon,
  PlusIcon,
  ShareIcon,
  SunIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon as ArrowPathIconSolid, NoSymbolIcon } from "@heroicons/react/24/solid";
import { JsonDiffEditor } from "@/components/JsonDiffEditor";
import { JsonEditor } from "@/components/JsonEditor";
import { GraphView, type GraphViewRef } from "@/components/GraphView";
import { TreeView } from "@/components/TreeView";
import { diffJson } from "@/lib/json/diff";
import { useJsonWorker } from "@/hooks/useJsonWorker";
import { detectFormat, FORMAT_LABELS, parseInput, type FormatKind } from "@/lib/formats";
import { decodeState, encodeState } from "@/lib/shareState";
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
  ["Flatten", "flatten"],
  ["Unflatten", "unflatten"],
  ["Schema", "schema"],
  ["Validate", "validate"],
  ["Diff", "diff"],
] as const;

const FORMAT_KINDS: FormatKind[] = ["json", "xml", "yaml", "toml", "csv"];

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

type OperationAction = (typeof OPERATION_ACTIONS)[number][1] | "sort" | "removeEmpty" | "generateTypes";
type OutputLanguage =
  | "json"
  | "yaml"
  | "xml"
  | "toml"
  | "csv"
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
type RightView = "raw" | "tree" | "graph";
type QuoteStyle = "double" | "single";
type FormatOptions = {
  indentation: number;
  quoteStyle: QuoteStyle;
  sortKeys: boolean;
  removeEmpty: boolean;
};

const EXT_BY_FORMAT: Record<FormatKind, string> = {
  json: "json",
  xml: "xml",
  yaml: "yaml",
  toml: "toml",
  csv: "csv",
};

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

const DEFAULT_FORMAT_OPTIONS: FormatOptions = {
  indentation: 2,
  quoteStyle: "double",
  sortKeys: false,
  removeEmpty: false,
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
  const [split, setSplit] = useState(20);
  const [isResizing, setIsResizing] = useState(false);
  const [schemaInput, setSchemaInput] = useState("");
  const [compareInput, setCompareInput] = useState("");
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [modalValue, setModalValue] = useState("");
  const [diffPreview, setDiffPreview] = useState<{ original: string; modified: string } | null>(null);
  const [rightView, setRightView] = useState<RightView>("raw");
  const [typeLanguage, setTypeLanguage] = useState<TypeTargetLanguage>("typescript");
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [shareState, setShareState] = useState<"idle" | "done" | "error">("idle");
  const [isInputMinimized, setIsInputMinimized] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [focusedPane, setFocusedPane] = useState<"input" | "output">("input");
  const [formatOptions, setFormatOptions] = useState<FormatOptions>(DEFAULT_FORMAT_OPTIONS);
  const [convertToFormat, setConvertToFormat] = useState<FormatKind>("json");
  const [liveTransform, setLiveTransform] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(13);
  const [inputValid, setInputValid] = useState<boolean | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([SAMPLE_JSON]);
  const [undoIndex, setUndoIndex] = useState(0);
  const historyLock = useRef(false);
  const splitContainerRef = useRef<HTMLElement | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const graphViewRef = useRef<GraphViewRef | null>(null);

  const isGraphView = rightView === "graph" && Boolean(parsedOutput);
  const canDownload = useMemo(
    () => (isGraphView ? Boolean(parsedOutput) : output.trim().length > 0),
    [isGraphView, output, parsedOutput],
  );
  const parseSchemaToObject = useCallback((text: string): object | null => {
    if (!text.trim()) return null;
    const fmt = detectFormat(text);
    try {
      if (fmt === "json" || fmt === "yaml") return parseInput(text, fmt) as object;
      try {
        return parseInput(text, "json") as object;
      } catch {
        return parseInput(text, "yaml") as object;
      }
    } catch {
      return null;
    }
  }, []);
  const isModalInputValid = useMemo(() => {
    if (!modalKind) return false;
    if (!modalValue.trim()) return false;
    if (modalKind === "validate") return parseSchemaToObject(modalValue) !== null;
    return true;
  }, [modalKind, modalValue, parseSchemaToObject]);
  const resolvedTheme: Exclude<ThemeMode, "system"> =
    themeMode === "system" ? (systemDark ? "dark" : "light") : themeMode;
  const isDark = resolvedTheme === "dark";
  const toolbarBorderClass = isDark ? "border-white/45" : "border-base-300";
  const toolbarDividerClass = isDark ? "bg-white/45" : "bg-base-300";
  const monacoTheme = isDark ? "vs-dark" : "vs";
  const outputPanelClass = isDark ? "border-[#2d2d30] bg-[#1e1e1e]" : "border-[#e5e5e5] bg-[#ffffff]";
  const inputEditorBgClass = isDark
    ? "border border-[#3c3c3c] border-t-0 bg-[#252526]"
    : "border border-[#d4d4d4] border-t-0 bg-[#f3f3f3]";
  const canUndo = undoIndex > 0;
  const canRedo = undoIndex < undoStack.length - 1;
  const copyLabel = copyState === "done" ? "Copied" : copyState === "error" ? "Failed" : "Copy";
  const shareLabel = shareState === "done" ? "Copied" : shareState === "error" ? "Failed" : "Share";
  const selectedTypeLanguageLabel =
    TYPE_LANGUAGES.find((item) => item.id === typeLanguage)?.label ?? "Language";
  const TOOLBAR_BTN_SIZE = "h-8 min-h-8";
  const TOOLBAR_TEXT = "text-xs";
  const toolbarBtnBase =
    `btn btn-xs ${TOOLBAR_BTN_SIZE} rounded px-2 ${TOOLBAR_TEXT} shadow-none text-base-content hover:bg-base-200 disabled:opacity-70 disabled:text-base-content/60`;
  const toolbarBtnActive =
    `btn btn-xs btn-primary ${TOOLBAR_BTN_SIZE} rounded px-2 ${TOOLBAR_TEXT} shadow-none text-primary-content hover:bg-primary/90 disabled:opacity-70 disabled:text-primary-content/70`;
  const toolbarBtnIcon =
    `btn btn-xs btn-square ${TOOLBAR_BTN_SIZE} min-w-8 rounded px-2 ${TOOLBAR_TEXT} shadow-none text-base-content hover:bg-base-200 disabled:opacity-70 disabled:text-base-content/60`;
  const joinItemBorderClass =
    "[&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:!border-base-300/50";
  const radioGroupClass = `join h-8 shrink-0 overflow-hidden rounded-md ${toolbarBorderClass} ${joinItemBorderClass}`;
  const radioBtnClass = `btn btn-xs join-item h-8 min-h-8 rounded-none px-2 text-xs shadow-none transition-colors`;
  const dropdownPanelClass = isDark ? "bg-[#252526] text-base-content" : "bg-base-100 text-base-content";

  const resolvedInputFormat = useMemo(() => detectFormat(input), [input]);

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
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const state = hash ? decodeState(hash) : null;
    if (state) {
      if (state.input) {
        setInput(state.input);
        setUndoStack([state.input]);
        setUndoIndex(0);
      }
      if (state.convertToFormat && FORMAT_KINDS.includes(state.convertToFormat))
        setConvertToFormat(state.convertToFormat);
      if (typeof state.liveTransform === "boolean") setLiveTransform(state.liveTransform);
      if (state.output) {
        setOutput(state.output);
        if (state.outputFormat) {
          setOutputExt(EXT_BY_FORMAT[state.outputFormat]);
          setOutputLanguage(state.outputFormat);
        }
        try {
          if (state.outputFormat === "json" || !state.outputFormat) {
            setParsedOutput(JSON.parse(state.output) as JsonValue);
          } else if (state.outputFormat && state.output) {
            const out = state.output;
            const fmt = state.outputFormat;
            void import("@/lib/formats").then(({ parseInput }) => {
              setParsedOutput(parseInput(out, fmt));
            });
          }
        } catch {
          setParsedOutput(null);
        }
      }
      if (state.typeLanguage) setTypeLanguage(state.typeLanguage);
      if (state.viewMode) setRightView(state.viewMode);
      if (typeof state.split === "number") setSplit(Math.max(20, Math.min(80, state.split)));
      return;
    }
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
        formatOptions?: Partial<FormatOptions>;
        convertToFormat?: FormatKind;
editorFontSize?: number;
      liveTransform?: boolean;
    };
    if (data.input) setInput(data.input);
    if (data.output) setOutput(data.output);
    if (typeof data.split === "number") setSplit(data.split);
    if (data.themeMode) setThemeMode(data.themeMode);
    if (data.typeLanguage) setTypeLanguage(data.typeLanguage);
    if (data.rightView) setRightView(data.rightView);
    if (data.convertToFormat) setConvertToFormat(data.convertToFormat);
    if (typeof data.editorFontSize === "number") setEditorFontSize(data.editorFontSize);
      if (typeof data.liveTransform === "boolean") setLiveTransform(data.liveTransform);
      if (data.formatOptions) {
        const nextIndentation = Number(data.formatOptions.indentation);
        const indentation = Number.isFinite(nextIndentation) ? Math.max(1, Math.min(10, Math.floor(nextIndentation))) : DEFAULT_FORMAT_OPTIONS.indentation;
        const quoteStyle = data.formatOptions.quoteStyle === "single" ? "single" : "double";
        const sortKeys = Boolean(data.formatOptions.sortKeys);
        const removeEmpty = Boolean(data.formatOptions.removeEmpty);
        setFormatOptions({ indentation, quoteStyle, sortKeys, removeEmpty });
      }
    } catch {
      // Ignore malformed persisted sessions.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "jsonix-session",
      JSON.stringify({
        input,
        output,
        split,
        themeMode,
        typeLanguage,
        rightView,
        formatOptions,
        convertToFormat,
        liveTransform,
        editorFontSize,
      }),
    );
  }, [input, output, split, themeMode, typeLanguage, rightView, formatOptions, convertToFormat, liveTransform, editorFontSize]);

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
    if ((rightView === "tree" || rightView === "graph") && !parsedOutput) {
      setRightView("raw");
    }
  }, [rightView, parsedOutput]);

  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveTransformTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef(input);
  inputRef.current = input;

  useEffect(() => {
    if (!input.trim()) {
      setInputValid(null);
      return;
    }
    validationTimeoutRef.current = setTimeout(() => {
      run("parseFormat", { input, format: resolvedInputFormat })
        .then(() => setInputValid(true))
        .catch(() => setInputValid(false));
    }, 300);
    return () => {
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    };
  }, [input, resolvedInputFormat, run]);

  useEffect(() => {
    if (!liveTransform || !input.trim()) return;
    liveTransformTimeoutRef.current = setTimeout(() => {
      const currentInput = inputRef.current;
      if (!currentInput.trim()) return;
      setBusy(true);
      setError(null);
      setDiffPreview(null);
      const fmt = detectFormat(currentInput);
      void run<JsonValue>("parseFormat", { input: currentInput, format: fmt })
        .then(async (json) => {
          const out = await convertJsonToOutput(json, { toFormat: convertToFormat });
          setOutput(out);
          setOutputExt(EXT_BY_FORMAT[convertToFormat]);
          setOutputLanguage(convertToFormat);
          setParsedOutput(json);
          setActiveOperation(null);
        })
        .catch(() => { /* validation shows invalid */ })
        .finally(() => setBusy(false));
    }, 400);
    return () => {
      if (liveTransformTimeoutRef.current) clearTimeout(liveTransformTimeoutRef.current);
    };
  }, [liveTransform, input, convertToFormat, run]);

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
      setSplit(Math.max(20, Math.min(80, Math.round(nextSplit))));
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
    setOutputExt(EXT_BY_FORMAT[convertToFormat]);
    setOutputLanguage(convertToFormat);
  };

  const convertJsonToOutput = async (
    json: JsonValue,
    opts?: {
      toFormat?: FormatKind;
      indentation?: number;
      quoteStyle?: QuoteStyle;
      sortKeys?: boolean;
    },
  ): Promise<string> => {
    const toFormat = opts?.toFormat ?? convertToFormat;
    const formatOpts = {
      indentation: opts?.indentation ?? formatOptions.indentation,
      quoteStyle: opts?.quoteStyle ?? formatOptions.quoteStyle,
      sortKeys: opts?.sortKeys ?? formatOptions.sortKeys,
    };

    if (toFormat === "json") {
      return JSON.stringify(json, null, formatOpts.indentation);
    }

    return run<string>("convert", { json, toFormat, formatOptions: formatOpts });
  };

  const parseOnly = () => {
    setBusy(true);
    setError(null);
    setDiffPreview(null);
    void (async () => {
      try {
        const json = await run<JsonValue>("parseFormat", {
          input,
          format: resolvedInputFormat,
        });
        const result = await convertJsonToOutput(json);
        setOutputData(result, "parse");
        setParsedOutput(json);
        setActiveOperation(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : `Invalid ${FORMAT_LABELS[resolvedInputFormat]}`);
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
      formatOptions?: FormatOptions;
    },
  ) => {
    setBusy(true);
    setError(null);
    setDiffPreview(null);
    void (async () => {
      try {
        const left = await run<JsonValue>("parseFormat", {
          input,
          format: resolvedInputFormat,
        });

        if (action === "validate") {
          const schemaText = options?.schemaText ?? schemaInput;
          if (!schemaText.trim()) throw new Error("Schema is required for Validate.");
          const schema = parseSchemaToObject(schemaText);
          if (!schema) throw new Error("Invalid schema. Use JSON or YAML format.");
          const result = await run<{ valid: boolean; errors: unknown[] }>("validate", {
            json: left,
            schema,
          });
          const out = await convertJsonToOutput(result as JsonValue);
          setOutputData(out, action);
          setParsedOutput(result as JsonValue);
          return;
        }

        if (action === "diff") {
          const compareText = options?.compareText ?? compareInput;
          if (!compareText.trim()) throw new Error("Compare JSON is required for Diff.");
          const right = await run<JsonValue>("parseFormat", {
            input: compareText,
            format: detectFormat(compareText),
          });
          const leftStr = await convertJsonToOutput(left);
          const rightStr = await convertJsonToOutput(right);
          setDiffPreview({ original: leftStr, modified: rightStr });
          setRightView("raw");
          const result = diffJson(left, right);
          const out = await convertJsonToOutput(result as unknown as JsonValue);
          setOutputData(out, action);
          setParsedOutput(result as unknown as JsonValue);
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
          const schemaText = JSON.stringify(result, null, 2);
          setSchemaInput(schemaText);
          const out = await convertJsonToOutput(result);
          setOutputData(out, action);
          setParsedOutput(result);
          return;
        }

        if (action === "format") {
          const formatConfig = options?.formatOptions ?? formatOptions;
          let preparedJson = left;
          if (formatConfig.removeEmpty) preparedJson = await run<JsonValue>("removeEmpty", { json: preparedJson });
          if (formatConfig.sortKeys) preparedJson = await run<JsonValue>("sort", { json: preparedJson });
          const out = await convertJsonToOutput(preparedJson, {
            indentation: formatConfig.indentation,
            quoteStyle: formatConfig.quoteStyle,
            sortKeys: formatConfig.sortKeys,
          });
          setOutputData(out, action);
          setParsedOutput(preparedJson);
          return;
        }

        const result = await run<unknown>(action as never, { json: left });
        if (action === "minify" && typeof result === "string" && convertToFormat === "json") {
          setOutputData(result, action);
          setParsedOutput(JSON.parse(result) as JsonValue);
          return;
        }
        const jsonResult = (typeof result === "string" ? JSON.parse(result) : result) as JsonValue;
        const out = await convertJsonToOutput(jsonResult);
        setOutputData(out, action);
        setParsedOutput(jsonResult);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Operation failed.");
      } finally {
        setBusy(false);
      }
    })();
  };

  const runConvert = (toFormat: FormatKind) => {
    setConvertToFormat(toFormat);
    setFocusedPane("output");
    setBusy(true);
    setError(null);
    void (async () => {
      try {
        const json = await run<JsonValue>("parseFormat", {
          input,
          format: resolvedInputFormat,
        });
        const result = await convertJsonToOutput(json, { toFormat });
        setOutput(result);
        setOutputExt(EXT_BY_FORMAT[toFormat]);
        setOutputLanguage(toFormat);
        setParsedOutput(json);
        setActiveOperation(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Conversion failed");
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
    if (isGraphView) {
      void (async () => {
        try {
          if (!graphViewRef.current) {
            throw new Error("Graph export is not ready yet.");
          }
          await graphViewRef.current.downloadPng();
        } catch {
          setCopyState("error");
          window.setTimeout(() => setCopyState("idle"), 1400);
        }
      })();
      return;
    }
    if (!output.trim()) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `jsonix-output.${outputExt}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareWorkspace = async () => {
    const state = encodeState({
      input,
      convertToFormat,
      liveTransform,
      output,
      outputFormat: outputLanguage as FormatKind | undefined,
      typeLanguage,
      viewMode: rightView,
      split,
    });
    const url = `${typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""}#${state}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareState("done");
    } catch {
      setShareState("error");
    }
    window.setTimeout(() => setShareState("idle"), 1400);
  };

  const copyOutput = async () => {
    if (isGraphView) {
      try {
        if (!graphViewRef.current) {
          throw new Error("Graph export is not ready yet.");
        }
        await graphViewRef.current.copyPngToClipboard();
        setCopyState("done");
      } catch {
        setCopyState("error");
      }
      window.setTimeout(() => setCopyState("idle"), 1400);
      return;
    }
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


  const applyFormatWithOptions = (next: FormatOptions) => {
    setFormatOptions(next);
    setFocusedPane("output");
    setActiveOperation("format");
    executeOperation("format", { formatOptions: next });
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
      className="min-h-screen overflow-y-auto bg-base-200 p-3 text-base-content md:p-3 xl:h-screen xl:overflow-hidden"
    >
      <div className="mx-auto min-h-full max-w-[1700px] flex flex-col xl:h-full">
        <section className="border border-base-300 bg-base-100 p-1.5 shadow-sm overflow-x-auto">
          <div className="flex min-w-max flex-wrap items-center gap-1.5">
            <div className="flex shrink-0 items-center gap-2">
              <label
                className={toolbarBtnBase}
              >
                Import
                <input
                  type="file"
                  accept=".json,.yaml,.yml,.xml,.toml,.csv,application/json,text/plain,text/yaml,text/xml,text/csv"
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
                className={toolbarBtnIcon}
                disabled={!canUndo}
                onClick={() => moveHistory(-1)}
              >
                <ArrowUturnLeftIcon className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Redo"
                title="Redo (Shift+Cmd/Ctrl+Z)"
                className={toolbarBtnIcon}
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
                  setSplit(20);
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
              className={`h-6 w-px self-center ${toolbarDividerClass}`}
            />

            <div className={radioGroupClass}>
              {FORMAT_KINDS.map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  className={`${radioBtnClass} ${
                    convertToFormat === fmt ? "btn-primary" : ""
                  }`}
                  onClick={() => runConvert(fmt)}
                >
                  {FORMAT_LABELS[fmt]}
                </button>
              ))}
            </div>

            <div
              aria-hidden="true"
              className={`h-6 w-px self-center ${toolbarDividerClass}`}
            />

            <div className="flex min-w-0 flex-1 shrink-0 items-center gap-2">
              {OPERATION_ACTIONS.map(([label, action]) =>
                action === "format" ? (
                  <div key={label} className="dropdown dropdown-bottom shrink-0">
                    <div className={radioGroupClass}>
                      <button
                        type="button"
                        disabled={busy}
                        className={`${radioBtnClass} ${
                          activeOperation === action ? "btn-primary" : ""
                        }`}
                        onClick={() => runOperation(action)}
                      >
                        <span className="whitespace-nowrap">{label}</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Format options"
                        popoverTarget="format-options-popover"
                        style={{ anchorName: "--format-options-anchor" } as CSSProperties}
                        className={`${radioBtnClass} min-w-8 ${
                          activeOperation === action ? "btn-primary" : ""
                        }`}
                      >
                        <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div
                      popover="auto"
                      id="format-options-popover"
                      style={{ positionAnchor: "--format-options-anchor" } as CSSProperties}
                      className={`dropdown rounded-md z-30 mt-1 w-72 border p-3 shadow-xl ${toolbarBorderClass} ${dropdownPanelClass}`}
                    >
                      <div className="space-y-3">
                        <div>
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-semibold opacity-70">Indentation</p>
                            <span className="text-xs font-semibold opacity-80">{formatOptions.indentation}</span>
                          </div>
                          <div className="w-full">
                            <input
                              type="range"
                              min={1}
                              max={10}
                              step={1}
                              value={formatOptions.indentation}
                              className="range range-primary range-xs"
                              aria-label="Indentation level"
                              onChange={(event) => {
                                const parsed = Number(event.target.value);
                                if (!Number.isFinite(parsed)) return;
                                const indentation = Math.max(1, Math.min(10, Math.floor(parsed)));
                                applyFormatWithOptions({ ...formatOptions, indentation });
                              }}
                            />
                            <div className="mt-2 grid grid-cols-10 px-1 text-[10px] leading-none opacity-70">
                              {Array.from({ length: 10 }, (_, index) => (
                                <span key={`indent-mark-${index + 1}`} className="text-center">|</span>
                              ))}
                            </div>
                            <div className="mt-1 grid grid-cols-10 px-1 text-[10px] leading-none tabular-nums opacity-80">
                              {Array.from({ length: 10 }, (_, index) => (
                                <span key={`indent-label-${index + 1}`} className="text-center">{index + 1}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-xs font-semibold opacity-70">Quote style</p>
                          <div className={`join h-8 overflow-hidden rounded-md border ${toolbarBorderClass} ${joinItemBorderClass}`}>
                            {(["double", "single"] as const).map((quote) => (
                              <button
                                key={quote}
                                type="button"
                                className={`${radioBtnClass} ${
                                  formatOptions.quoteStyle === quote ? "btn-primary" : ""
                                }`}
                                onClick={() => applyFormatWithOptions({ ...formatOptions, quoteStyle: quote })}
                              >
                                {quote === "double" ? "Double" : "Single"}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 pt-1">
                          <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={formatOptions.sortKeys}
                              onChange={(event) =>
                                applyFormatWithOptions({ ...formatOptions, sortKeys: event.target.checked })
                              }
                            />
                            <span>Sort</span>
                          </label>
                          <label className="flex cursor-pointer items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={formatOptions.removeEmpty}
                              onChange={(event) =>
                                applyFormatWithOptions({ ...formatOptions, removeEmpty: event.target.checked })
                              }
                            />
                            <span>Remove Empty</span>
                          </label>
                        </div>

                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    key={label}
                    disabled={busy}
                    className={`${activeOperation === action ? toolbarBtnActive : toolbarBtnBase}`}
                    onClick={() => runOperation(action)}
                  >
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                ),
              )}
              <div className="dropdown dropdown-bottom dropdown-end shrink-0">
                <button
                  type="button"
                  className={`${
                    activeOperation === "generateTypes" ? toolbarBtnActive : toolbarBtnBase
                  } min-w-[6.5rem] inline-flex items-center justify-between gap-1.5`}
                  popoverTarget="type-language-popover"
                  style={{ anchorName: "--type-language-anchor" } as CSSProperties}
                  aria-label="Select type language"
                >
                  <span className="truncate">{selectedTypeLanguageLabel}</span>
                  <ChevronDownIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                </button>
                <ul
                  className={`dropdown rounded-md menu z-30 mt-1 w-32 border p-1 shadow-xl ${toolbarBorderClass} ${dropdownPanelClass}`}
                  popover="auto"
                  id="type-language-popover"
                  style={{ positionAnchor: "--type-language-anchor" } as CSSProperties}
                >
                  {TYPE_LANGUAGES.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`rounded-md ${typeLanguage === item.id ? "bg-primary text-primary-content" : "text-base-content hover:bg-base-200"}`}
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
              <div className={radioGroupClass}>
                {(["raw", "tree", "graph"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    disabled={(view === "tree" || view === "graph") && !parsedOutput}
                    className={`${radioBtnClass} ${
                      rightView === view ? "btn-primary" : ""
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    onClick={() => setRightView(view)}
                  >
                    {view[0].toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`${toolbarBtnBase} min-w-[5.5rem] shrink-0 gap-1.5`}
                title="Copy shareable link"
                onClick={shareWorkspace}
              >
                <ShareIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">{shareLabel}</span>
              </button>
              <button
                type="button"
                className={`${toolbarBtnActive} min-w-[5rem] shrink-0 gap-1.5 ${!canDownload ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!canDownload}
                onClick={copyOutput}
              >
                <ClipboardDocumentIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {copyLabel}
              </button>
              <button
                type="button"
                className={`${toolbarBtnActive} min-w-[5rem] shrink-0 gap-1.5 ${!canDownload ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={!canDownload}
                onClick={downloadOutput}
              >
                <ArrowDownTrayIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                Download
              </button>
            </div>
          </div>
        </section>

        <section
          ref={splitContainerRef}
          className={`relative flex-1 min-h-0 grid ${isInputMinimized ? "grid-cols-1 gap-0 min-h-[calc(100dvh-11rem)]" : "grid-cols-1 gap-3 xl:gap-0 xl:grid-cols-[20%_80%]"}`}
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
              className={`flex min-h-[45vh] flex-col transition-all xl:min-h-0 ${focusedPane === "input" ? "opacity-100" : "opacity-60 saturate-50"}`}
              onMouseDown={() => setFocusedPane("input")}
            >
              <JsonEditor
                value={input}
                onChange={(next) => {
                  setInput(next);
                  pushHistory(next);
                  setFocusedPane("input");
                }}
                className="h-full min-h-0 flex-1 p-1"
                language={resolvedInputFormat === "toml" || resolvedInputFormat === "csv" ? "plaintext" : resolvedInputFormat}
                monacoTheme={monacoTheme}
                placeholder="Paste or drop JSON here"
                panelTone="input"
                fontSize={editorFontSize}
              />
              <div
                className={`flex items-center justify-between gap-4 border-t px-2 py-1.5 text-xs ${inputEditorBgClass} ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                <div className="flex items-center gap-4">
                  <span className="flex min-w-[5rem] items-center gap-1.5">
                    {inputValid === true ? (
                      <>
                        <CheckCircleIcon className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
                        <span>Valid</span>
                      </>
                    ) : inputValid === false ? (
                      <>
                        <XCircleIcon className="h-3.5 w-3.5 shrink-0 text-error" aria-hidden="true" />
                        <span>Invalid</span>
                      </>
                    ) : (
                      <span className="opacity-60">—</span>
                    )}
                  </span>
                  <button
                    type="button"
                    className={`flex min-w-[6.5rem] items-center gap-1.5 whitespace-nowrap ${liveTransform ? "opacity-100" : "opacity-60 hover:opacity-100"}`}
                    title={liveTransform ? "Live transform on" : "Live transform off"}
                    onClick={() => setLiveTransform((v) => !v)}
                  >
                    {liveTransform ? (
                      <ArrowPathIconSolid
                        className="h-3.5 w-3.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    ) : (
                      <NoSymbolIcon
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span>Live Transform</span>
                  </button>
                </div>
                <div className="dropdown dropdown-top dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className="flex min-w-[4rem] cursor-pointer items-center gap-1.5 opacity-80 hover:opacity-100"
                    aria-label="Input format"
                  >
                    <ChevronUpIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {FORMAT_LABELS[resolvedInputFormat]}
                  </div>
                  <ul
                    className={`menu dropdown-content z-50 mb-1 w-32 rounded-md border p-1 shadow-xl ${toolbarBorderClass} ${dropdownPanelClass}`}
                  >
                    {FORMAT_KINDS.map((fmt) => (
                      <li key={fmt}>
                        <button
                          type="button"
                          className={`rounded-md ${resolvedInputFormat === fmt ? "bg-primary text-primary-content" : ""}`}
                          onClick={() => {
                            if (fmt === resolvedInputFormat) return;
                            void (async () => {
                              try {
                                const json = await run<JsonValue>("parseFormat", {
                                  input,
                                  format: resolvedInputFormat,
                                });
                                const converted =
                                  fmt === "json"
                                    ? JSON.stringify(json, null, 2)
                                    : await run<string>("convert", { json, toFormat: fmt });
                                setInput(converted);
                                pushHistory(converted);
                              } catch {
                                setError("Failed to convert input");
                              }
                            })();
                          }}
                        >
                          {FORMAT_LABELS[fmt]}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          <div
            className={`relative flex flex-col xl:min-h-0 ${isInputMinimized ? "min-h-full" : "min-h-[45vh]"}`}
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
                    language={outputLanguage === "toml" || outputLanguage === "csv" ? "plaintext" : outputLanguage}
                    monacoTheme={monacoTheme}
                    fontSize={editorFontSize}
                  />
                ) : output.trim() ? (
                  <JsonEditor
                    value={output}
                    onChange={setOutput}
                    className="h-full min-h-0"
                    readOnly
                    passiveReadOnly
                    language={outputLanguage === "toml" || outputLanguage === "csv" ? "plaintext" : outputLanguage}
                    monacoTheme={monacoTheme}
                    panelTone="output"
                    fontSize={editorFontSize}
                  />
                ) : (
                  <div className={`flex h-full min-h-0 items-center justify-center border text-sm text-base-content/70 ${outputPanelClass}`}>
                    Run any operation to see output here
                  </div>
                )
              ) : null}
              {rightView === "tree" ? (
                parsedOutput ? (
                  <TreeView
                    data={parsedOutput}
                    isDark={isDark}
                    className={`${outputPanelClass} min-h-0`}
                  />
                ) : (
                  <div className={`flex h-full min-h-0 items-center justify-center rounded-xl border text-sm text-base-content/70 ${outputPanelClass}`}>
                    Current output is not valid JSON.
                  </div>
                )
              ) : null}
              {rightView === "graph" ? (
                parsedOutput ? (
                  <GraphView
                    ref={graphViewRef}
                    data={parsedOutput}
                    isDark={isDark}
                    className={`${outputPanelClass} min-h-0`}
                  />
                ) : (
                  <div className={`flex h-full min-h-0 items-center justify-center rounded-xl border text-sm text-base-content/70 ${outputPanelClass}`}>
                    Current output is not valid JSON.
                  </div>
                )
              ) : null}
            </div>
          </div>
        </section>


        {modalKind ? (
          <div className="modal modal-open">
            <div className="modal-box w-full max-w-3xl">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {modalKind === "validate"
                    ? "Schema (JSON or YAML) for Validate"
                    : "Second document for Diff"}
                </h3>
                <button
                  type="button"
                  className="btn btn-xs btn-soft"
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
                  className="btn btn-sm btn-soft"
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

        {error ? (
          <div className="toast toast-bottom toast-start z-50">
            <div className="alert alert-error flex items-center gap-2 shadow-lg">
              <span className="flex-1">{error}</span>
              <button
                type="button"
                aria-label="Close error"
                className="btn btn-xs btn-soft btn-circle shrink-0"
                onClick={() => setError(null)}
              >
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}

        <div className="fixed bottom-6 right-6 z-40" ref={settingsRef}>
          {isSettingsOpen ? (
            <div className="absolute rounded-md bottom-full right-0 mb-2 w-[320px] border border-base-300 bg-base-100 p-3 shadow-xl">
              <div className="mb-2 rounded-md border border-base-300 bg-base-200 px-2 py-1.5">
                <p className="text-base font-bold leading-tight">jsonix</p>
                <p className="text-sm leading-tight text-base-content/70">
                  Local-first JSON transform and validation workspace
                </p>
              </div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-base-content/70">
                Theme
              </p>
              <div className={`join overflow-hidden rounded-md border ${toolbarBorderClass} ${joinItemBorderClass}`}>
                {themeOptions.map(({ mode, ariaLabel, title, Icon }) => (
                  <button
                    key={mode}
                    type="button"
                    aria-label={ariaLabel}
                    title={title}
                    className={`btn btn-sm btn-soft join-item btn-square min-w-9 h-9 min-h-9 rounded-none transition-colors ${
                      themeMode === mode ? "btn-primary" : ""
                    }`}
                    onClick={() => setThemeMode(mode)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <p className="mt-4 mb-2 text-xs font-semibold tracking-wide text-base-content/70">
                Font size
              </p>
              <div className={`join overflow-hidden rounded-md border ${toolbarBorderClass} ${joinItemBorderClass}`}>
                <button
                  type="button"
                  aria-label="Decrease font size"
                  title="Decrease font size"
                  className="btn btn-sm btn-soft join-item btn-square min-w-9 h-9 min-h-9 rounded-none transition-colors"
                  onClick={() => setEditorFontSize((size) => Math.max(10, size - 1))}
                >
                  <MinusIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Current font size"
                  title="Current font size"
                  className="btn btn-sm btn-soft join-item btn-square min-w-[3.5rem] h-9 min-h-9 rounded-none disabled:opacity-70 disabled:text-base-content/60"
                  disabled
                >
                  {editorFontSize}
                </button>
                <button
                  type="button"
                  aria-label="Increase font size"
                  title="Increase font size"
                  className="btn btn-sm btn-soft join-item btn-square min-w-9 h-9 min-h-9 rounded-none transition-colors"
                  onClick={() => setEditorFontSize((size) => Math.min(24, size + 1))}
                >
                  <PlusIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Reset font size"
                  title="Reset font size"
                  className="btn btn-sm btn-soft join-item btn-square min-w-9 h-9 min-h-9 rounded-none transition-colors"
                  onClick={() => setEditorFontSize(13)}
                >
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
          <button
            type="button"
            aria-label="Open settings"
            title="Settings"
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
