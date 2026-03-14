"use client";

import type { CSSProperties } from "react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
  ComputerDesktopIcon,
  DocumentArrowDownIcon,
  MinusIcon,
  MoonIcon,
  PlusIcon,
  ShareIcon,
  StarIcon,
  SunIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { NoSymbolIcon } from "@heroicons/react/24/solid";
import { JsonDiffEditor } from "@/components/JsonDiffEditor";
import { JsonEditor } from "@/components/JsonEditor";
import { GraphView, type GraphViewRef } from "@/components/GraphView";
import { TreeView } from "@/components/TreeView";
import {
  Dropdown,
  getSizeFormatted,
  Header as WorkspaceHeader,
  StatusBar,
} from "@/components/workspace";
import { diffJson } from "@/lib/json/diff";
import { useJsonWorker } from "@/hooks/useJsonWorker";
import { detectFormat, FORMAT_LABELS, parseInput, stringifyOutput, type FormatKind } from "@/lib/formats";
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

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <id>42</id>
  <name>jsonix</name>
  <tags>
    <item>json</item>
    <item>tooling</item>
  </tags>
  <owner team="platform" active="true"/>
</root>`;

const SAMPLE_YAML = `id: 42
name: jsonix
tags:
  - json
  - tooling
  - productivity
owner:
  team: platform
  active: true
  priority: null
metrics:
  - day: mon
    count: 1023
  - day: tue
    count: 1290`;

const SAMPLE_CSV = `id,name,tags
42,jsonix,"json,tooling"
1,example,"a,b,c"`;

const SAMPLE_TOML = `id = 42
name = "jsonix"
tags = ["json", "tooling"]

[owner]
team = "platform"
active = true`;

const SAMPLES: Record<FormatKind, string> = {
  json: SAMPLE_JSON,
  xml: SAMPLE_XML,
  yaml: SAMPLE_YAML,
  toml: SAMPLE_TOML,
  csv: SAMPLE_CSV,
};

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
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [parsedOutput, setParsedOutput] = useState<JsonValue | null>(null);
  const [outputExt, setOutputExt] = useState("json");
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("json");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeOperation, setActiveOperation] = useState<OperationAction | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [systemDark, setSystemDark] = useState(false);
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
  const [isOutputMaximized, setIsOutputMaximized] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const [focusedPane, setFocusedPane] = useState<"input" | "output">("input");
  const [formatOptions, setFormatOptions] = useState<FormatOptions>(DEFAULT_FORMAT_OPTIONS);
  const [convertToFormat, setConvertToFormat] = useState<FormatKind>("json");
  const [inputFormatOverride, setInputFormatOverride] = useState<FormatKind | null>(null);
  const [inputFormatOpen, setInputFormatOpen] = useState(false);
  const [transformConfigOpen, setTransformConfigOpen] = useState(false);
  const [pinnedItems, setPinnedItems] = useState<Set<string>>(
    () => new Set(["fmt:json", "fmt:xml", "view:raw", "action:minify", "action:schema", "type:typescript", "type:java", "type:go", "type:python", "type:sql"])
  );
  const [liveTransform, setLiveTransform] = useState(false);
  const [editorFontSize, setEditorFontSize] = useState(13);
  const [inputValid, setInputValid] = useState<boolean | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([""]);
  const [undoIndex, setUndoIndex] = useState(0);
  const historyLock = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
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
  const inputLineCount = input.split("\n").length;
  const inputSizeFormatted = getSizeFormatted(input);
  const selectedTypeLanguageLabel =
    TYPE_LANGUAGES.find((item) => item.id === typeLanguage)?.label ?? "Language";

  const joinItemBorderClass =
    "[&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:!border-base-300/50";
  const dropdownPanelClass = isDark ? "bg-[#252526] text-base-content" : "bg-base-100 text-base-content";
  const linkBtnClass = "btn btn-xs btn-ghost rounded p-1 border-0 hover:bg-[var(--workspace-panel)] hover:underline hover:text-primary";
  const inputEmpty = !input.trim();

  const detectedInputFormat = useMemo(() => detectFormat(input), [input]);
  const resolvedInputFormat = inputFormatOverride ?? detectedInputFormat;

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
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    return () => document.documentElement.removeAttribute("data-theme");
  }, [resolvedTheme]);

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
      pinnedItems?: string[];
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
      if (Array.isArray(data.pinnedItems)) setPinnedItems(new Set(data.pinnedItems));
      if (data.formatOptions) {
        const nextIndentation = Number(data.formatOptions.indentation);
        const indentation = Number.isFinite(nextIndentation) ? Math.max(0, Math.min(10, Math.floor(nextIndentation))) : DEFAULT_FORMAT_OPTIONS.indentation;
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
        pinnedItems: Array.from(pinnedItems),
      }),
    );
  }, [input, output, split, themeMode, typeLanguage, rightView, formatOptions, convertToFormat, liveTransform, editorFontSize, pinnedItems]);

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

  const [showBusy, setShowBusy] = useState(false);
  useEffect(() => {
    if (!busy) {
      setShowBusy(false);
      return;
    }
    const id = setTimeout(() => setShowBusy(true), 120);
    return () => clearTimeout(id);
  }, [busy]);

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
        } catch (e) {
          console.warn("Graph download failed:", e);
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

  const onInputFormatChange = useCallback(
    (newFormat: FormatKind) => {
      if (!input.trim()) {
        setInputFormatOverride(newFormat === detectedInputFormat ? null : newFormat);
        return;
      }
      try {
        const parsed = parseInput(input, resolvedInputFormat);
        const formatted = stringifyOutput(parsed, newFormat, {
          indentation: formatOptions.indentation,
          quoteStyle: formatOptions.quoteStyle,
          sortKeys: formatOptions.sortKeys,
        });
        setInput(formatted);
        pushHistory(formatted);
        setInputFormatOverride(newFormat === detectedInputFormat ? null : newFormat);
        setError(null);
      } catch {
        setInputFormatOverride(newFormat === detectedInputFormat ? null : newFormat);
      }
    },
    [input, resolvedInputFormat, detectedInputFormat, formatOptions, pushHistory]
  );

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      if (!output.trim() || focusedPane === "input") {
        setInput(text);
        pushHistory(text);
        setInputFormatOverride(null);
        setError(null);
      } else {
        setOutput(text);
      }
    } catch {
      setError("Could not read clipboard.");
    }
  };

  const importJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setInput(text);
      pushHistory(text);
      setInputFormatOverride(null);
      setError(null);
    };
    reader.onerror = () => setError("Unable to read selected file.");
    reader.readAsText(file);
  };

  return (
    <main
      data-theme={resolvedTheme}
      className="flex h-screen flex-col overflow-hidden bg-[var(--workspace-background)] text-[var(--workspace-text)]"
      style={{ height: "100vh" }}
    >
      <WorkspaceHeader
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        editorFontSize={editorFontSize}
        onEditorFontSizeChange={setEditorFontSize}
      />

      <div
        ref={splitContainerRef}
        className={`flex min-h-0 flex-1 overflow-hidden ${isDesktopLayout && !isOutputMaximized ? "flex-row" : "flex-col"}`}
      >
        {!isOutputMaximized && (
        <div
          className={`flex min-h-0 shrink-0 flex-col overflow-hidden transition-opacity duration-200 ${
            focusedPane === "output" ? "opacity-60" : "opacity-100"
          }`}
          style={isDesktopLayout ? { width: `${split}%`, minWidth: 160 } : undefined}
        >
          <div
            className={`flex shrink-0 flex-wrap items-center gap-1 border-b px-1.5 py-1 text-xs sm:flex-nowrap sm:overflow-x-auto ${inputEditorBgClass} ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                title="Undo (Ctrl+Z)"
                disabled={!canUndo}
                className={`${linkBtnClass} btn-square h-7 min-h-7 w-7 shrink-0`}
                onClick={() => moveHistory(-1)}
              >
                <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Redo (Shift+Ctrl+Z)"
                disabled={!canRedo}
                className={`${linkBtnClass} btn-square h-7 min-h-7 w-7 shrink-0`}
                onClick={() => moveHistory(1)}
              >
                <ArrowUturnRightIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                title="Clear"
                className={`${linkBtnClass} btn-square h-7 min-h-7 w-7 shrink-0`}
                onClick={() => {
                  setInput("");
                  setOutput("");
                  setParsedOutput(null);
                  setError(null);
                  setActiveOperation(null);
                  setCopyState("idle");
                }}
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <input
                id="import-json-file"
                type="file"
                accept=".json,.yaml,.yml,.xml,.toml,.csv,application/json,text/plain"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    importJsonFile(file);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <button
                type="button"
                className={`${linkBtnClass} h-7 min-h-7 shrink-0`}
                onClick={pasteFromClipboard}
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5 shrink-0" />
                Paste
              </button>
              <button
                type="button"
                className={`${linkBtnClass} h-7 min-h-7 shrink-0`}
                onClick={() => document.getElementById("import-json-file")?.click()}
              >
                <DocumentArrowDownIcon className="h-3.5 w-3.5 shrink-0" />
                Import
              </button>
            </div>
          </div>
          <div
            className="relative min-h-0 flex-1 overflow-hidden cursor-text"
            onClick={() => setFocusedPane("input")}
          >
            {!input.trim() ? (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4 p-4 text-center text-sm text-[var(--workspace-text-muted)]">
                <p className="max-w-[16rem] sm:max-w-none">Paste or import JSON, XML, YAML, TOML, or CSV here</p>
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {(["json", "xml", "yaml", "csv"] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      className="btn btn-ghost btn-xs rounded p-1 border-0 hover:bg-[var(--workspace-panel)] hover:underline hover:text-primary transition-colors"
                      onClick={() => {
                        setInput(SAMPLES[fmt]);
                        pushHistory(SAMPLES[fmt]);
                        setInputFormatOverride(null);
                        setError(null);
                      }}
                    >
                      Load sample {FORMAT_LABELS[fmt]}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <JsonEditor
                value={input}
                onChange={(next) => {
                  setInput(next);
                  pushHistory(next);
                  setFocusedPane("input");
                }}
                className="h-full"
                language={resolvedInputFormat === "toml" || resolvedInputFormat === "csv" ? "plaintext" : resolvedInputFormat}
                monacoTheme={monacoTheme}
                placeholder="Paste or drop JSON, XML, YAML, TOML, or CSV here"
                panelTone="input"
                fontSize={editorFontSize}
              />
            )}
          </div>
        </div>
        )}
        {isDesktopLayout && !isOutputMaximized && (
          <div
            role="separator"
            aria-orientation="vertical"
            className="w-px shrink-0 cursor-col-resize bg-[var(--workspace-border)] hover:bg-primary/30 transition-colors"
            onMouseDown={() => setIsResizing(true)}
          />
        )}
        <div
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          style={isDesktopLayout && !isOutputMaximized ? { width: `${100 - split}%` } : undefined}
        >
          <div
            className={`flex shrink-0 flex-wrap items-center gap-1 border-b px-1.5 py-1 text-xs sm:flex-nowrap sm:overflow-x-auto ${inputEditorBgClass} ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            <button
              type="button"
              disabled={showBusy || inputEmpty}
              className={`${linkBtnClass} h-7 min-h-7 shrink-0 ${
                activeOperation === "format" ? "text-primary" : ""
              }`}
              onClick={() => runOperation("format")}
            >
              Transform
            </button>
            <Dropdown
              open={transformConfigOpen}
              onOpenChange={setTransformConfigOpen}
              side="bottom"
              align="start"
              rootClassName="shrink-0"
              contentClassName={`w-80 rounded-lg border p-3 shadow-xl ${toolbarBorderClass} ${dropdownPanelClass}`}
              trigger={
                <div
                  className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center justify-center ${
                    transformConfigOpen ? "text-primary" : ""
                  }`}
                  title="Transform config"
                >
                  <ChevronDownIcon className="h-3.5 w-3.5" />
                </div>
              }
            >
              <div className="space-y-3 text-xs">
                <div>
                <p className="text-xs font-medium opacity-70 mb-1">Output format</p>
                <div className="flex flex-wrap gap-1">
                  {FORMAT_KINDS.map((fmt) => (
                    <div key={fmt} className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={inputEmpty}
                        className={`${linkBtnClass} h-6 min-h-6 disabled:opacity-50 ${
                          convertToFormat === fmt ? "text-primary" : ""
                        }`}
                        onClick={() => {
                          setFocusedPane("output");
                          runConvert(fmt);
                        }}
                      >
                        {FORMAT_LABELS[fmt]}
                      </button>
                      <button
                        type="button"
                        className={`btn btn-ghost btn-xs btn-square h-5 w-5 p-0 rounded ${
                          pinnedItems.has(`fmt:${fmt}`) ? "text-primary" : "opacity-40"
                        }`}
                        onClick={() => setPinnedItems((s) => { const n = new Set(s); n.has(`fmt:${fmt}`) ? n.delete(`fmt:${fmt}`) : n.add(`fmt:${fmt}`); return n; })}
                        title={pinnedItems.has(`fmt:${fmt}`) ? "Unpin" : "Pin to toolbar"}
                      >
                        <StarIcon className={`h-3.5 w-3.5 ${pinnedItems.has(`fmt:${fmt}`) ? "text-primary" : "opacity-40"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                </div>
                <div className="border-t border-[var(--workspace-border)] pt-2">
                <p className="text-xs font-medium opacity-70 mb-1">View</p>
                <div className="flex flex-wrap gap-1">
                  {(["raw", "tree", "graph"] as const).map((view) => (
                    <div key={view} className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={inputEmpty || ((view === "tree" || view === "graph") && !parsedOutput)}
                        className={`${linkBtnClass} h-6 min-h-6 disabled:opacity-50 ${
                          rightView === view ? "text-primary" : ""
                        }`}
                        onClick={() => {
                          setRightView(view);
                          setFocusedPane("output");
                        }}
                      >
                        {view[0].toUpperCase() + view.slice(1)}
                      </button>
                      <button
                        type="button"
                        className={`btn btn-ghost btn-xs btn-square h-5 w-5 p-0 rounded ${
                          pinnedItems.has(`view:${view}`) ? "text-primary" : "opacity-40"
                        }`}
                        onClick={() => setPinnedItems((s) => { const n = new Set(s); n.has(`view:${view}`) ? n.delete(`view:${view}`) : n.add(`view:${view}`); return n; })}
                        title={pinnedItems.has(`view:${view}`) ? "Unpin" : "Pin to toolbar"}
                      >
                        <StarIcon className={`h-3.5 w-3.5 ${pinnedItems.has(`view:${view}`) ? "text-primary" : "opacity-40"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                </div>
                <div className="border-t border-[var(--workspace-border)] pt-2">
                <p className="text-xs font-medium opacity-70 mb-1">Actions</p>
                <div className="flex flex-wrap gap-1">
                  {OPERATION_ACTIONS.map(([label, action]) => (
                    <div key={action} className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={showBusy || inputEmpty}
                        className={`${linkBtnClass} h-6 min-h-6 disabled:opacity-50 ${
                          activeOperation === action ? "text-primary" : ""
                        }`}
                        onClick={() => runOperation(action)}
                      >
                        {label}
                      </button>
                      <button
                        type="button"
                        className={`btn btn-ghost btn-xs btn-square h-5 w-5 p-0 rounded ${
                          pinnedItems.has(`action:${action}`) ? "text-primary" : "opacity-40"
                        }`}
                        onClick={() => setPinnedItems((s) => { const n = new Set(s); n.has(`action:${action}`) ? n.delete(`action:${action}`) : n.add(`action:${action}`); return n; })}
                        title={pinnedItems.has(`action:${action}`) ? "Unpin" : "Pin to toolbar"}
                      >
                        <StarIcon className={`h-3.5 w-3.5 ${pinnedItems.has(`action:${action}`) ? "text-primary" : "opacity-40"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                </div>
                <div className="border-t border-[var(--workspace-border)] pt-2">
                <div className="flex w-fit shrink-0 items-center justify-between gap-2">
                  <p className="text-xs font-medium opacity-70">Indent</p>
                  <button
                    type="button"
                    className={`btn btn-ghost btn-xs btn-square h-5 w-5 p-0 rounded ${
                      pinnedItems.has("indent") ? "text-primary" : "opacity-40"
                    }`}
                    onClick={() => setPinnedItems((s) => { const n = new Set(s); n.has("indent") ? n.delete("indent") : n.add("indent"); return n; })}
                    title={pinnedItems.has("indent") ? "Unpin" : "Pin to toolbar"}
                  >
                    <StarIcon className={`h-3.5 w-3.5 ${pinnedItems.has("indent") ? "text-primary" : "opacity-40"}`} />
                  </button>
                </div>
                <div className="flex w-fit shrink-0 items-center rounded-lg border border-[var(--workspace-border)] overflow-hidden [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-[var(--workspace-border)]">
                  <button
                    type="button"
                    aria-label="Decrease indent"
                    className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors"
                    onClick={() => {
                      const v = Math.max(0, formatOptions.indentation - 1);
                      applyFormatWithOptions({ ...formatOptions, indentation: v });
                    }}
                  >
                    <MinusIcon className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <span className="flex shrink-0 items-center justify-center px-1 py-0.5 text-xs tabular-nums text-[var(--workspace-text)] border-r border-[var(--workspace-border)]">
                    {formatOptions.indentation}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase indent"
                    className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors"
                    onClick={() => {
                      const v = Math.min(10, formatOptions.indentation + 1);
                      applyFormatWithOptions({ ...formatOptions, indentation: v });
                    }}
                  >
                    <PlusIcon className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Reset indent"
                    className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors"
                    onClick={() => applyFormatWithOptions({ ...formatOptions, indentation: 2 })}
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
                </div>
                <div className="border-t border-[var(--workspace-border)] pt-2">
                <p className="text-xs font-medium opacity-70 mb-1">Quote style</p>
                <div className="flex flex-wrap gap-1">
                  {(["double", "single"] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={`${linkBtnClass} h-6 min-h-6 ${
                        formatOptions.quoteStyle === q ? "text-primary" : ""
                      }`}
                      onClick={() => applyFormatWithOptions({ ...formatOptions, quoteStyle: q })}
                    >
                      {q === "double" ? "Double" : "Single"}
                    </button>
                  ))}
                </div>
                </div>
                <div className="border-t border-[var(--workspace-border)] pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={formatOptions.sortKeys}
                      onChange={(e) =>
                        applyFormatWithOptions({ ...formatOptions, sortKeys: e.target.checked })
                      }
                    />
                    Sort keys
                  </label>
                  <label className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs"
                      checked={formatOptions.removeEmpty}
                      onChange={(e) =>
                        applyFormatWithOptions({ ...formatOptions, removeEmpty: e.target.checked })
                      }
                    />
                    Remove empty
                  </label>
                </div>
                </div>
                <div className="border-t border-[var(--workspace-border)] pt-2">
                <p className="text-xs font-medium opacity-70 mb-1">Generate Types</p>
                <div className="flex flex-wrap gap-1">
                  {TYPE_LANGUAGES.map((item) => (
                    <div key={item.id} className="flex items-center gap-0.5">
                      <button
                        type="button"
                        disabled={inputEmpty}
                        className={`${linkBtnClass} h-6 min-h-6 disabled:opacity-50 ${
                          typeLanguage === item.id ? "text-primary" : ""
                        }`}
                        onClick={() => {
                          setFocusedPane("output");
                          setActiveOperation("generateTypes");
                          executeOperation("generateTypes", { typeLanguage: item.id });
                        }}
                      >
                        {item.label}
                      </button>
                      <button
                        type="button"
                        className={`btn btn-ghost btn-xs btn-square h-5 w-5 p-0 rounded ${
                          pinnedItems.has(`type:${item.id}`) ? "text-primary" : "opacity-40"
                        }`}
                        onClick={() => setPinnedItems((s) => { const n = new Set(s); n.has(`type:${item.id}`) ? n.delete(`type:${item.id}`) : n.add(`type:${item.id}`); return n; })}
                        title={pinnedItems.has(`type:${item.id}`) ? "Unpin" : "Pin to toolbar"}
                      >
                        <StarIcon className={`h-3.5 w-3.5 ${pinnedItems.has(`type:${item.id}`) ? "text-primary" : "opacity-40"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                </div>
              </div>
            </Dropdown>
            {FORMAT_KINDS.some((f) => pinnedItems.has(`fmt:${f}`)) && (
              <span className="mx-1 h-4 w-px shrink-0 self-center bg-[var(--workspace-text-muted)]/60" role="separator" aria-hidden />
            )}
            {FORMAT_KINDS.filter((f) => pinnedItems.has(`fmt:${f}`)).map((fmt) => (
              <button
                key={fmt}
                type="button"
                disabled={inputEmpty}
                className={`${linkBtnClass} h-7 min-h-7 shrink-0 disabled:opacity-50 ${
                  convertToFormat === fmt ? "text-primary" : ""
                }`}
                onClick={() => { setFocusedPane("output"); runConvert(fmt); }}
              >
                {FORMAT_LABELS[fmt]}
              </button>
            ))}
            {(["raw", "tree", "graph"] as const).some((v) => pinnedItems.has(`view:${v}`)) && (
              <span className="mx-1 h-4 w-px shrink-0 self-center bg-[var(--workspace-text-muted)]/60" role="separator" aria-hidden />
            )}
            {(["raw", "tree", "graph"] as const)
              .filter((v) => pinnedItems.has(`view:${v}`))
              .map((view) => (
                <button
                  key={view}
                  type="button"
                  disabled={inputEmpty || ((view === "tree" || view === "graph") && !parsedOutput)}
                  className={`${linkBtnClass} h-7 min-h-7 shrink-0 disabled:opacity-50 ${
                    rightView === view ? "text-primary" : ""
                  }`}
                  onClick={() => { setRightView(view); setFocusedPane("output"); }}
                >
                  {view[0].toUpperCase() + view.slice(1)}
                </button>
              ))}
            {OPERATION_ACTIONS.some(([, a]) => pinnedItems.has(`action:${a}`)) && (
              <span className="mx-1 h-4 w-px shrink-0 self-center bg-[var(--workspace-text-muted)]/60" role="separator" aria-hidden />
            )}
            {OPERATION_ACTIONS.filter(([, a]) => pinnedItems.has(`action:${a}`)).map(([label, action]) => (
              <button
                key={action}
                type="button"
                disabled={showBusy || inputEmpty}
                className={`${linkBtnClass} h-7 min-h-7 shrink-0 disabled:opacity-50 ${
                  activeOperation === action ? "text-primary" : ""
                }`}
                onClick={() => runOperation(action)}
              >
                {label}
              </button>
            ))}
            {pinnedItems.has("indent") && (
              <>
              <span className="mx-1 h-4 w-px shrink-0 self-center bg-[var(--workspace-text-muted)]/60" role="separator" aria-hidden />
              <div className="flex w-fit shrink-0 items-center rounded-lg border border-[var(--workspace-border)] overflow-hidden [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-[var(--workspace-border)]">
                <span className="px-1.5 py-0.5 text-xs opacity-70 border-r border-[var(--workspace-border)]">Indent</span>
                <button
                  type="button"
                  aria-label="Decrease indent"
                  className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors"
                  onClick={() => {
                    const v = Math.max(0, formatOptions.indentation - 1);
                    applyFormatWithOptions({ ...formatOptions, indentation: v });
                  }}
                >
                  <MinusIcon className="h-3 w-3" aria-hidden />
                </button>
                <span className="flex shrink-0 items-center justify-center px-1 py-0.5 text-xs tabular-nums border-r border-[var(--workspace-border)]">{formatOptions.indentation}</span>
                <button
                  type="button"
                  aria-label="Increase indent"
                  className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors"
                  onClick={() => {
                    const v = Math.min(10, formatOptions.indentation + 1);
                    applyFormatWithOptions({ ...formatOptions, indentation: v });
                  }}
                >
                  <PlusIcon className="h-3 w-3" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label="Reset indent"
                  className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors"
                  onClick={() => applyFormatWithOptions({ ...formatOptions, indentation: 2 })}
                >
                  <ArrowPathIcon className="h-3 w-3" aria-hidden />
                </button>
              </div>
              </>
            )}
            {TYPE_LANGUAGES.some((t) => pinnedItems.has(`type:${t.id}`)) && (
              <span className="mx-1 h-4 w-px shrink-0 self-center bg-[var(--workspace-text-muted)]/60" role="separator" aria-hidden />
            )}
            {TYPE_LANGUAGES.filter((t) => pinnedItems.has(`type:${t.id}`)).map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={inputEmpty}
                className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center gap-1 disabled:opacity-50 ${
                  activeOperation === "generateTypes" && typeLanguage === item.id ? "text-primary underline" : ""
                }`}
                onClick={() => {
                  setFocusedPane("output");
                  setActiveOperation("generateTypes");
                  executeOperation("generateTypes", { typeLanguage: item.id });
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {rightView === "raw" ? (
              activeOperation === "diff" && diffPreview ? (
                <JsonDiffEditor
                  original={diffPreview.original}
                  modified={diffPreview.modified}
                  className="h-full min-h-0 flex-1"
                  language={outputLanguage === "toml" || outputLanguage === "csv" ? "plaintext" : outputLanguage}
                  monacoTheme={monacoTheme}
                  fontSize={editorFontSize}
                />
              ) : output.trim() ? (
                <JsonEditor
                  value={output}
                  onChange={setOutput}
                  className="h-full min-h-0 flex-1"
                  readOnly
                  passiveReadOnly
                  language={outputLanguage === "toml" || outputLanguage === "csv" ? "plaintext" : outputLanguage}
                  monacoTheme={monacoTheme}
                  panelTone="output"
                  fontSize={editorFontSize}
                />
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center bg-[var(--workspace-panel)] text-sm text-[var(--workspace-text-muted)]">
                  Run an operation to see output here
                </div>
              )
            ) : null}
            {rightView === "tree" ? (
              parsedOutput ? (
                <TreeView
                  data={parsedOutput}
                  isDark={isDark}
                  className={`${outputPanelClass} min-h-0 flex-1 overflow-auto`}
                />
              ) : (
                <div className={`flex h-full min-h-[200px] items-center justify-center border text-sm text-base-content/70 ${outputPanelClass}`}>
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
                  className={`${outputPanelClass} min-h-0 flex-1`}
                />
              ) : (
                <div className={`flex h-full min-h-[200px] items-center justify-center border text-sm text-base-content/70 ${outputPanelClass}`}>
                  Current output is not valid JSON.
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>

      <StatusBar
        valid={inputValid}
        errorMessage={error}
        lineCount={inputLineCount}
        sizeFormatted={inputSizeFormatted}
        liveTransform={liveTransform}
        onLiveTransformToggle={() => setLiveTransform((v) => !v)}
        inputFormatDropdown={
          <Dropdown
            open={inputFormatOpen}
            onOpenChange={setInputFormatOpen}
            side="top"
            contentClassName={`w-24 rounded border p-1 shadow-xl ${toolbarBorderClass} ${dropdownPanelClass}`}
            trigger={() => (
              <div className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 cursor-pointer items-center gap-1`}>
                <span className="truncate">{FORMAT_LABELS[resolvedInputFormat]}</span>
                <ChevronUpIcon className="h-3.5 w-3.5 shrink-0" />
              </div>
            )}
          >
            <ul className="menu">
              {FORMAT_KINDS.map((fmt) => (
                <li key={fmt}>
                  <button
                    type="button"
                    className={`rounded text-xs ${resolvedInputFormat === fmt ? "bg-primary text-primary-content" : ""}`}
                    onClick={() => {
                      onInputFormatChange(fmt);
                      setInputFormatOpen(false);
                    }}
                  >
                    {FORMAT_LABELS[fmt]}
                  </button>
                </li>
              ))}
            </ul>
          </Dropdown>
        }
        rightActions={
          <>
            <button
              type="button"
              className={`${linkBtnClass} h-7 min-h-7 shrink-0 gap-1`}
              onClick={shareWorkspace}
            >
              <ShareIcon className="h-3.5 w-3.5 shrink-0" />
              {shareLabel}
            </button>
            <button
              type="button"
              className={`${linkBtnClass} h-7 min-h-7 shrink-0 gap-1 disabled:opacity-50`}
              disabled={!canDownload}
              onClick={copyOutput}
            >
              <ClipboardDocumentIcon className="h-3.5 w-3.5 shrink-0" />
              {copyLabel}
            </button>
            <button
              type="button"
              className={`${linkBtnClass} h-7 min-h-7 shrink-0 gap-1 disabled:opacity-50`}
              disabled={!canDownload}
              onClick={downloadOutput}
            >
              <ArrowDownTrayIcon className="h-3.5 w-3.5 shrink-0" />
              Download
            </button>
            <button
              type="button"
              className={`${linkBtnClass} h-7 min-h-7 w-7 shrink-0`}
              onClick={() => setIsOutputMaximized((v) => !v)}
              title={isOutputMaximized ? "Restore layout" : "Maximize output"}
              aria-label={isOutputMaximized ? "Restore layout" : "Maximize output"}
            >
              {isOutputMaximized ? (
                <ArrowsPointingInIcon className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ArrowsPointingOutIcon className="h-3.5 w-3.5 shrink-0" />
              )}
            </button>
          </>
        }
      />

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

    </main>
  );
}
