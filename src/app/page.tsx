"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  Cog6ToothIcon,
  ComputerDesktopIcon,
  DocumentArrowDownIcon,
  MinusIcon,
  MoonIcon,
  PlusIcon,
  ShareIcon,
  StarIcon,
  SunIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
} from "@heroicons/react/24/outline";
import { JsonDiffEditor } from "@/components/JsonDiffEditor";
import { JsonEditor } from "@/components/JsonEditor";
import { GraphView, type GraphViewRef } from "@/components/GraphView";
import { TreeView } from "@/components/TreeView";
import { QueryView } from "@/components/QueryView";
import { TableView } from "@/components/TableView";
import {
  Dropdown,
  getSizeFormatted,
  Header as WorkspaceHeader,
  StatusBar,
} from "@/components/workspace";
import { diffJson } from "@/lib/json/diff";
import { useJsonWorker } from "@/hooks/useJsonWorker";
import { detectFormat, FORMAT_LABELS, getInputFormatLabel, parseInput, stringifyOutput, type FormatKind, type InputFormatKind } from "@/lib/formats";
import { executeCurl, parseCurl } from "@/lib/curl/parseCurl";
import { formatJson } from "@/lib/json/core";
import { decodeState, encodeState } from "@/lib/shareState";
import type { JsonValue, TypeTargetLanguage } from "@/lib/json/core";

const SAMPLE_JSON = `{
  "id": 42,
  "name": "formaty",
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
  <name>formaty</name>
  <tags>
    <item>json</item>
    <item>tooling</item>
  </tags>
  <owner team="platform" active="true"/>
</root>`;

const SAMPLE_YAML = `id: 42
name: formaty
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
42,formaty,"json,tooling"
1,example,"a,b,c"`;

const SAMPLE_TOML = `id = 42
name = "formaty"
tags = ["json", "tooling"]

[owner]
team = "platform"
active = true`;

const SAMPLE_CURL = `curl -X GET "https://www.cloudflarestatus.com/api/v2/status.json"`;

const EXAMPLE_GITHUB = `{
  "id": 460078,
  "name": "next.js",
  "full_name": "vercel/next.js",
  "private": false,
  "owner": {
    "login": "vercel",
    "id": 14985020,
    "avatar_url": "https://avatars.githubusercontent.com/u/14985020?v=4",
    "type": "Organization"
  },
  "description": "The React Framework",
  "fork": false,
  "created_at": "2016-01-17T00:55:59Z",
  "updated_at": "2025-03-16T12:00:00Z",
  "stargazers_count": 120000,
  "language": "TypeScript",
  "license": { "key": "mit", "name": "MIT License" }
}`;

const EXAMPLE_STRIPE = `{
  "id": "evt_1ABC123",
  "object": "event",
  "api_version": "2023-10-16",
  "created": 1699000000,
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1ABC123",
      "object": "payment_intent",
      "amount": 2000,
      "currency": "usd",
      "status": "succeeded",
      "metadata": { "order_id": "ord_123" }
    }
  }
}`;

const EXAMPLE_K8S = `{
  "apiVersion": "apps/v1",
  "kind": "Deployment",
  "metadata": {
    "name": "nginx-deployment",
    "labels": { "app": "nginx" }
  },
  "spec": {
    "replicas": 3,
    "selector": { "matchLabels": { "app": "nginx" } },
    "template": {
      "metadata": { "labels": { "app": "nginx" } },
      "spec": {
        "containers": [{
          "name": "nginx",
          "image": "nginx:1.14.2",
          "ports": [{ "containerPort": 80 }]
        }]
      }
    }
  }
}`;

const EXAMPLE_OPENAPI = `{
  "openapi": "3.0.0",
  "info": {
    "title": "Sample API",
    "version": "1.0.0",
    "description": "A sample OpenAPI specification"
  },
  "paths": {
    "/users": {
      "get": {
        "summary": "List users",
        "responses": { "200": { "description": "Success" } }
      },
      "post": {
        "summary": "Create user",
        "responses": { "201": { "description": "Created" } }
      }
    }
  }
}`;

const EXAMPLES = [
  { id: "github", label: "GitHub API", data: EXAMPLE_GITHUB },
  { id: "stripe", label: "Stripe webhook", data: EXAMPLE_STRIPE },
  { id: "k8s", label: "Kubernetes manifest", data: EXAMPLE_K8S },
  { id: "openapi", label: "OpenAPI schema", data: EXAMPLE_OPENAPI },
] as const;

const SAMPLES: Record<FormatKind, string> = {
  json: SAMPLE_JSON,
  xml: SAMPLE_XML,
  yaml: SAMPLE_YAML,
  toml: SAMPLE_TOML,
  csv: SAMPLE_CSV,
};

const OPERATION_ACTIONS = [
  ["Minify", "minify"],
  ["Flatten", "flatten"],
  ["Unflatten", "unflatten"],
  ["Schema", "schema"],
  ["Validate", "validate"],
  ["Diff", "diff"],
] as const;

const FORMAT_KINDS: FormatKind[] = ["json", "xml", "yaml", "toml", "csv"];
const INPUT_FORMAT_KINDS: InputFormatKind[] = [...FORMAT_KINDS, "curl"];

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

type OperationAction = (typeof OPERATION_ACTIONS)[number][1] | "format" | "sort" | "removeEmpty" | "generateTypes";
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
type RightView = "raw" | "tree" | "graph" | "query" | "table";
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
  const [inputFormatOverride, setInputFormatOverride] = useState<InputFormatKind | null>(null);
  const [inputFormatOpen, setInputFormatOpen] = useState(false);
  const [transformConfigOpen, setTransformConfigOpen] = useState(false);
  const [viewAsMenu, setViewAsMenu] = useState(false);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [typesMenuOpen, setTypesMenuOpen] = useState(false);
  const [pinnedItems, setPinnedItems] = useState<Set<string>>(
    () => new Set(["fmt:json", "fmt:xml", "view:raw", "view:graph", "view:query", "action:minify", "action:schema", "action:diff", "type:typescript", "type:java", "type:go", "type:python", "type:sql"])
  );
  const [liveTransform, setLiveTransform] = useState(true);
  const [editorFontSize, setEditorFontSize] = useState(13);
  const [inputValid, setInputValid] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([""]);
  const [undoIndex, setUndoIndex] = useState(0);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [actionBounce, setActionBounce] = useState<"share" | "copy" | null>(null);
  const [mobileShowOutput, setMobileShowOutput] = useState(true);
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number } | null>(null);
  const historyLock = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const prevBeforeDiffRef = useRef<{ rightView: RightView; activeOperation: OperationAction | null; isOutputMaximized: boolean } | null>(null);
  const graphViewRef = useRef<GraphViewRef | null>(null);
  const diffDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRestoredRef = useRef(false);

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
  useEffect(() => {
    if (inputEmpty) setCursorPosition(null);
  }, [inputEmpty]);

  const detectedInputFormat = useMemo(() => detectFormat(input), [input]);
  const resolvedInputFormat: InputFormatKind = inputFormatOverride ?? detectedInputFormat;
  const resolvedParseFormat: FormatKind = resolvedInputFormat === "curl" ? "json" : resolvedInputFormat;

  const getParsedInput = useCallback(async (): Promise<JsonValue> => {
    if (resolvedInputFormat === "curl") {
      const parsed = parseCurl(input);
      const responseText = await executeCurl(parsed);
      const fmt = detectFormat(responseText) === "curl" ? "json" : (detectFormat(responseText) as FormatKind);
      return run<JsonValue>("parseFormat", { input: responseText, format: fmt });
    }
    return run<JsonValue>("parseFormat", { input, format: resolvedParseFormat });
  }, [input, resolvedInputFormat, resolvedParseFormat, run]);

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
      if (state.input) sessionRestoredRef.current = true;
      return;
    }
    const raw = localStorage.getItem("formaty-session");
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
        viewAsMenu?: boolean;
        mobileShowOutput?: boolean;
        activeOperation?: OperationAction;
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
      if (typeof data.viewAsMenu === "boolean") setViewAsMenu(data.viewAsMenu);
      if (typeof data.mobileShowOutput === "boolean") setMobileShowOutput(data.mobileShowOutput);
      if (data.activeOperation) setActiveOperation(data.activeOperation);
      if (Array.isArray(data.pinnedItems)) setPinnedItems(new Set(data.pinnedItems));
      sessionRestoredRef.current = true;
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
      "formaty-session",
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
        viewAsMenu,
        mobileShowOutput,
        activeOperation,
        pinnedItems: Array.from(pinnedItems),
      }),
    );
  }, [input, output, split, themeMode, typeLanguage, rightView, formatOptions, convertToFormat, liveTransform, editorFontSize, viewAsMenu, mobileShowOutput, activeOperation, pinnedItems]);

  useEffect(() => {
    if (!output.trim()) {
      setParsedOutput(null);
      return;
    }
    try {
      if (outputLanguage === "json") {
        setParsedOutput(JSON.parse(output) as JsonValue);
      } else if (["xml", "yaml", "toml", "csv"].includes(outputLanguage)) {
        setParsedOutput(parseInput(output, outputLanguage as FormatKind) as JsonValue);
      } else {
        setParsedOutput(null);
      }
    } catch {
      setParsedOutput(null);
    }
  }, [output, outputLanguage]);

  useEffect(() => {
    if (!sessionRestoredRef.current || !input.trim() || !activeOperation) return;
    sessionRestoredRef.current = false;
    if (activeOperation === "diff") return;
    const id = setTimeout(() => {
      if (activeOperation === "generateTypes") {
        executeOperation("generateTypes", { typeLanguage });
        return;
      }
      if (activeOperation === "format" || OPERATION_ACTIONS.some(([, a]) => a === activeOperation)) {
        if (activeOperation === "format") {
          runConvert(convertToFormat);
        } else {
          executeOperation(activeOperation);
        }
      }
    }, 500);
    return () => clearTimeout(id);
  }, [input, output, activeOperation, convertToFormat, typeLanguage]);

  useEffect(() => {
    if ((rightView === "tree" || rightView === "graph" || rightView === "query" || rightView === "table") && !parsedOutput) {
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
      setValidationError(null);
      return;
    }
    if (resolvedInputFormat === "curl") {
      try {
        parseCurl(input);
        setInputValid(true);
        setValidationError(null);
      } catch {
        setInputValid(false);
        setValidationError("Invalid cURL command");
      }
      return;
    }
    validationTimeoutRef.current = setTimeout(() => {
      run("parseFormat", { input, format: resolvedInputFormat })
        .then(() => {
          setInputValid(true);
          setValidationError(null);
        })
        .catch((e) => {
          setInputValid(false);
          setValidationError(e instanceof Error ? e.message : `Invalid ${getInputFormatLabel(resolvedInputFormat)}`);
        });
    }, 300);
    return () => {
      if (validationTimeoutRef.current) clearTimeout(validationTimeoutRef.current);
    };
  }, [input, resolvedInputFormat, run]);

  useEffect(() => {
    if (!liveTransform || !input.trim()) return;
    const fmt = detectFormat(input);
    if (fmt === "curl") return; // cURL: execute only on explicit run (Cmd+Enter)
    liveTransformTimeoutRef.current = setTimeout(() => {
      const currentInput = inputRef.current;
      if (!currentInput.trim()) return;
      setBusy(true);
      setError(null);
      setDiffPreview(null);
      const currentFmt = detectFormat(currentInput);
      if (currentFmt === "curl") return;
      void run<JsonValue>("parseFormat", { input: currentInput, format: currentFmt })
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
      if (modalKind) return;
      if (event.key === "Enter") {
        event.preventDefault();
        parseOnly();
      }
      if (event.key.toLowerCase() === "v") {
        const target = event.target as HTMLElement;
        const isEditable = target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA";
        // Only intercept when input is empty (paste to start) — when input has content, let editor handle paste at cursor
        if (!isEditable && inputEmpty) {
          event.preventDefault();
          pasteFromClipboard();
        }
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
  }, [modalKind, inputEmpty, focusedPane]);

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
      return formatJson(json, {
        indentation: formatOpts.indentation,
        quoteStyle: formatOpts.quoteStyle,
        sortKeys: formatOpts.sortKeys,
      });
    }

    return run<string>("convert", { json, toFormat, formatOptions: formatOpts });
  };

  const parseOnly = (inputOverride?: string, formatOverride?: InputFormatKind) => {
    const text = inputOverride ?? input;
    const fmt = formatOverride ?? resolvedInputFormat;
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    setValidationError(null);
    setDiffPreview(null);
    void (async () => {
      try {
        let toParse = text;
        let parseFmt: FormatKind = fmt === "curl" ? "json" : fmt;
        if (fmt === "curl") {
          const parsed = parseCurl(text);
          toParse = await executeCurl(parsed);
          parseFmt = detectFormat(toParse) === "curl" ? "json" : (detectFormat(toParse) as FormatKind);
        }
        const json = await run<JsonValue>("parseFormat", {
          input: toParse,
          format: parseFmt,
        });
        const result = await convertJsonToOutput(json);
        setOutputData(result, "parse");
        setParsedOutput(json);
        setActiveOperation(null);
        if (!isDesktopLayout) setMobileShowOutput(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : fmt === "curl" ? "cURL execution failed" : `Invalid ${FORMAT_LABELS[fmt as FormatKind]}`);
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
    if (action !== "diff") setDiffPreview(null);
    void (async () => {
      try {
        const left = await getParsedInput();

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
          setDiffPreview({ original: leftStr, modified: compareText });
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
    if (!isDesktopLayout) setMobileShowOutput(true);
    setBusy(true);
    setError(null);
    void (async () => {
      try {
        const json = await getParsedInput();
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

  const handleDiffModifiedChange = useCallback(
    (value: string) => {
      setCompareInput(value);
      setDiffPreview((prev) => (prev ? { ...prev, modified: value } : null));
      if (diffDebounceRef.current) clearTimeout(diffDebounceRef.current);
      if (!value.trim()) return;
      diffDebounceRef.current = setTimeout(() => {
        diffDebounceRef.current = null;
        executeOperation("diff", { compareText: value });
      }, 400);
    },
    [executeOperation],
  );

  useEffect(() => () => {
    if (diffDebounceRef.current) clearTimeout(diffDebounceRef.current);
  }, []);

  const runOperation = (action: OperationAction) => {
    setFocusedPane("output");
    if (!isDesktopLayout) setMobileShowOutput(true);
    setActiveOperation(action);
    if (action === "validate") {
      setModalKind("validate");
      setModalValue(schemaInput);
      return;
    }
    if (action === "diff") {
      if (activeOperation === "diff") {
        if (prevBeforeDiffRef.current && !prevBeforeDiffRef.current.isOutputMaximized) {
          setRightView(prevBeforeDiffRef.current.rightView);
          setActiveOperation(prevBeforeDiffRef.current.activeOperation);
          setIsOutputMaximized(false);
          setDiffPreview(null);
          if (prevBeforeDiffRef.current.activeOperation === "format") {
            runConvert(convertToFormat);
          } else if (prevBeforeDiffRef.current.activeOperation === "generateTypes") {
            executeOperation("generateTypes", { typeLanguage });
          } else if (prevBeforeDiffRef.current.activeOperation) {
            executeOperation(prevBeforeDiffRef.current.activeOperation);
          }
        }
        prevBeforeDiffRef.current = null;
        return;
      }
      prevBeforeDiffRef.current = { rightView, activeOperation, isOutputMaximized: isOutputMaximized };
      setIsOutputMaximized(true);
      setRightView("raw");
      setBusy(true);
      setError(null);
      void (async () => {
        try {
          const left = await getParsedInput();
          const leftStr = await convertJsonToOutput(left);
          setDiffPreview({ original: leftStr, modified: compareInput });
          if (compareInput.trim()) {
            executeOperation("diff", { compareText: compareInput });
          } else {
            setBusy(false);
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : "Operation failed.");
          setBusy(false);
        }
      })();
      return;
    }
    executeOperation(action);
  };

  const downloadOutput = (format?: "png" | "jpg") => {
    if (isGraphView) {
      void (async () => {
        try {
          if (!graphViewRef.current) {
            throw new Error("Graph export is not ready yet.");
          }
          await graphViewRef.current.downloadImage(format ?? "png");
        } catch (e) {
          console.warn("Graph download failed:", e);
          setCopyState("error");
          window.setTimeout(() => setCopyState("idle"), 1400);
        }
      })();
      setDownloadMenuOpen(false);
      return;
    }
    if (!output.trim()) return;
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `formaty-output.${outputExt}`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadMenuOpen(false);
  };

  const shareWorkspace = async () => {
    setActionBounce("share");
    setTimeout(() => setActionBounce(null), 300);
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
    setActionBounce("copy");
    setTimeout(() => setActionBounce(null), 300);
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
    (newFormat: InputFormatKind) => {
      if (!input.trim()) {
        setInputFormatOverride(newFormat === detectedInputFormat ? null : newFormat);
        return;
      }
      if (newFormat === "curl" || resolvedInputFormat === "curl") {
        setInputFormatOverride(newFormat === detectedInputFormat ? null : newFormat);
        return;
      }
      try {
        const parsed = parseInput(input, resolvedInputFormat as FormatKind);
        const formatted = stringifyOutput(parsed, newFormat as FormatKind, {
          indentation: formatOptions.indentation,
          quoteStyle: formatOptions.quoteStyle,
          sortKeys: formatOptions.sortKeys,
        });
        setInput(formatted);
        pushHistory(formatted);
        setInputFormatOverride(newFormat === detectedInputFormat ? null : newFormat);
        setError(null);
        setValidationError(null);
      } catch {
        setInputFormatOverride(newFormat === detectedInputFormat ? null : newFormat);
      }
    },
    [input, resolvedInputFormat, detectedInputFormat, formatOptions, pushHistory],
  );

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      setInput(text);
      pushHistory(text);
      setInputFormatOverride(null);
      setError(null);
      setValidationError(null);
      parseOnly(text, detectFormat(text));
      setFocusedPane("output");
      if (!isDesktopLayout) setMobileShowOutput(true);
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
      parseOnly(text, detectFormat(text));
    };
    reader.onerror = () => setError("Unable to read selected file.");
    reader.readAsText(file);
  };

  return (
    <main
      data-theme={resolvedTheme}
      className="flex flex-col overflow-hidden bg-[var(--workspace-background)] text-[var(--workspace-text)]"
      style={{ height: "100dvh", minHeight: "100dvh", maxHeight: "100dvh" }}
    >
      <WorkspaceHeader
        themeMode={themeMode}
        onThemeChange={setThemeMode}
      />

      <div
        ref={splitContainerRef}
        className={`flex min-h-0 flex-1 overflow-hidden ${isDesktopLayout && !isOutputMaximized ? "flex-row" : "flex-col"}`}
      >
        {!isOutputMaximized && (!isDesktopLayout ? !mobileShowOutput : true) && (
        <div
          className={`flex min-h-0 flex-col overflow-hidden bg-[var(--workspace-background)] transition-opacity duration-200 ${
            isDesktopLayout ? "shrink-0" : "min-h-0 flex-1"
          } ${focusedPane === "output" ? "opacity-60" : "opacity-100"}`}
          style={isDesktopLayout ? { width: `${split}%`, minWidth: 160 } : undefined}
        >
          {!isDesktopLayout && !mobileShowOutput && (
            <button
              type="button"
              className="flex w-full shrink-0 items-center justify-center gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-[var(--workspace-background)] active:opacity-80"
              onClick={() => setMobileShowOutput(true)}
            >
              View output
              <ArrowRightCircleIcon className="h-4 w-4 shrink-0" />
            </button>
          )}
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
        setValidationError(null);
                  setActiveOperation(null);
                  setCopyState("idle");
                  if (!isDesktopLayout) setMobileShowOutput(true);
                }}
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
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
              <Dropdown
              open={inputFormatOpen}
              onOpenChange={setInputFormatOpen}
              side="bottom"
              align="start"
              rootClassName="shrink-0"
              contentClassName={`dropdown-content z-[100] min-w-[7rem] p-1 shadow-xl rounded-lg border ${toolbarBorderClass} ${dropdownPanelClass}`}
              trigger={
                <div className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center gap-1 ${inputFormatOpen ? "text-primary" : ""}`} title="Input format">
                  <span className="truncate">{getInputFormatLabel(resolvedInputFormat)}</span>
                  <ChevronDownIcon className="h-3 w-3 shrink-0" />
                </div>
              }
            >
              <div className="flex flex-wrap gap-0.5 p-1" onClick={(e) => e.stopPropagation()}>
                    {INPUT_FORMAT_KINDS.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    className={`${linkBtnClass} h-6 min-h-6 px-1.5 ${resolvedInputFormat === fmt ? "text-primary" : ""}`}
                    onClick={() => {
                      onInputFormatChange(fmt);
                      setInputFormatOpen(false);
                    }}
                  >
                    {getInputFormatLabel(fmt)}
                  </button>
                ))}
              </div>
            </Dropdown>
            </div>
          </div>
          <div
            className="relative min-h-0 flex-1 overflow-hidden cursor-text"
            onClick={() => setFocusedPane("input")}
            onMouseEnter={() => setFocusedPane("input")}
          >
            <JsonEditor
              value={input}
              onChange={(next) => {
                setInput(next);
                pushHistory(next);
                setFocusedPane("input");
              }}
              className="h-full"
              language={resolvedInputFormat === "toml" || resolvedInputFormat === "csv" || resolvedInputFormat === "curl" ? "plaintext" : resolvedInputFormat}
              monacoTheme={monacoTheme}
              // placeholder="Paste or drop JSON, XML, YAML, TOML, or CSV here"
              panelTone="input"
              fontSize={editorFontSize}
              onCursorChange={(line, column) => setCursorPosition({ line, column })}
            />
          </div>
        </div>
        )}
        {isDesktopLayout && !isOutputMaximized && (
          <div
            role="separator"
            aria-orientation="vertical"
            className="group relative flex shrink-0 cursor-col-resize justify-center transition-colors"
            onMouseDown={() => setIsResizing(true)}
          >
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-px bg-[var(--workspace-border)] opacity-60 group-hover:opacity-100 group-hover:bg-primary group-hover:w-[3px] group-hover:-ml-0.5 transition-all" />
          </div>
        )}
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--workspace-background)] ${!isDesktopLayout && !mobileShowOutput ? "hidden" : ""}`}
          style={isDesktopLayout && !isOutputMaximized ? { width: `${100 - split}%` } : undefined}
        >
          {!isDesktopLayout && mobileShowOutput && !inputEmpty && (
            <button
              type="button"
              className="flex w-full shrink-0 items-center justify-center gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-[var(--workspace-background)] active:opacity-80"
              onClick={() => {
                setMobileShowOutput(false);
                setIsOutputMaximized(false);
              }}
            >
              <ArrowLeftCircleIcon className="h-4 w-4 shrink-0" />
              Back to input
            </button>
          )}
          <div
            className={`flex shrink-0 flex-nowrap items-center gap-1 overflow-x-auto border-b px-1.5 py-1 text-xs ${inputEditorBgClass} ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            <Dropdown
              open={transformConfigOpen}
              onOpenChange={setTransformConfigOpen}
              side="bottom"
              align="start"
              rootClassName="shrink-0"
              contentClassName={`dropdown-content card card-sm z-[100] w-64 sm:w-85 max-w-[90vw] shadow-xl border border-white/45 ${dropdownPanelClass}`}
              trigger={
                <div className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center justify-center ${transformConfigOpen ? "text-primary" : ""}`} title="Settings">
                  <Cog6ToothIcon className="h-3.5 w-3.5" />
                </div>
              }
            >
              <div className="card-body p-3 text-xs max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <label className="flex cursor-pointer items-center gap-2 pb-2 border-b border-[var(--workspace-border)]">
                  <input type="checkbox" className="toggle toggle-sm toggle-primary" checked={viewAsMenu} onChange={(e) => setViewAsMenu(e.target.checked)} />
                  <span className="text-xs font-medium">View as Menu items</span>
                </label>
                {viewAsMenu ? (
                  <p className="text-xs opacity-70 py-2">Options are now in the menu bar above. Uncheck to use the settings panel.</p>
                ) : (
                  <>
                <p className="text-xs font-medium opacity-70">Output format</p>
                <div className="flex flex-wrap gap-1">
                  {FORMAT_KINDS.map((fmt) => (
                    <div key={fmt} className="flex items-center">
                      <button type="button" disabled={inputEmpty} className={`${linkBtnClass} h-6 min-h-6 disabled:opacity-50 ${convertToFormat === fmt ? "text-primary" : ""}`} onClick={() => { setFocusedPane("output"); runConvert(fmt); }}>
                        {FORMAT_LABELS[fmt]}
                      </button>
                      <button type="button" className={`btn btn-ghost btn-xs btn-square h-5 w-5 p-0 rounded ${pinnedItems.has(`fmt:${fmt}`) ? "text-primary" : "opacity-40"}`} onClick={(e) => { e.stopPropagation(); setPinnedItems((s) => { const n = new Set(s); n.has(`fmt:${fmt}`) ? n.delete(`fmt:${fmt}`) : n.add(`fmt:${fmt}`); return n; }); }} title={pinnedItems.has(`fmt:${fmt}`) ? "Unpin" : "Pin to toolbar"}>
                        <StarIcon className={`h-3.5 w-3.5 ${pinnedItems.has(`fmt:${fmt}`) ? "text-primary" : "opacity-40"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[var(--workspace-border)] pt-2">
                  <p className="text-xs font-medium opacity-70 mb-1">View</p>
                  <div className="flex flex-wrap gap-1">
                    {(["raw", "tree", "graph", "query", "table"] as const).map((view) => (
                      <div key={view} className="flex items-center">
                        <button type="button" disabled={inputEmpty || ((view === "tree" || view === "graph" || view === "query" || view === "table") && !parsedOutput)} className={`${linkBtnClass} h-6 min-h-6 disabled:opacity-50 ${rightView === view ? "text-primary" : ""}`} onClick={() => { setRightView(view); setFocusedPane("output"); }}>
                          {view[0].toUpperCase() + view.slice(1)}
                        </button>
                        <button type="button" className={`btn btn-ghost btn-xs btn-square h-5 w-5 p-0 rounded ${pinnedItems.has(`view:${view}`) ? "text-primary" : "opacity-40"}`} onClick={(e) => { e.stopPropagation(); setPinnedItems((s) => { const n = new Set(s); n.has(`view:${view}`) ? n.delete(`view:${view}`) : n.add(`view:${view}`); return n; }); }} title={pinnedItems.has(`view:${view}`) ? "Unpin" : "Pin to toolbar"}>
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
                      <div key={action} className="flex items-center">
                        <button type="button" disabled={showBusy || inputEmpty} className={`${linkBtnClass} h-6 min-h-6 disabled:opacity-50 ${activeOperation === action ? "text-primary" : ""}`} onClick={() => runOperation(action)}>{label}</button>
                        <button type="button" className={`btn btn-ghost btn-xs btn-square h-5 w-5 p-0 rounded ${pinnedItems.has(`action:${action}`) ? "text-primary" : "opacity-40"}`} onClick={(e) => { e.stopPropagation(); setPinnedItems((s) => { const n = new Set(s); n.has(`action:${action}`) ? n.delete(`action:${action}`) : n.add(`action:${action}`); return n; }); }} title={pinnedItems.has(`action:${action}`) ? "Unpin" : "Pin to toolbar"}>
                          <StarIcon className={`h-3.5 w-3.5 ${pinnedItems.has(`action:${action}`) ? "text-primary" : "opacity-40"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-[var(--workspace-border)] pt-2 flex flex-wrap gap-4 sm:gap-6">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-medium opacity-70">Font size</p>
                      <button type="button" className={`btn btn-ghost btn-xs btn-square h-5 w-5 p-0 rounded ${pinnedItems.has("fontSize") ? "text-primary" : "opacity-40"}`} onClick={(e) => { e.stopPropagation(); setPinnedItems((s) => { const n = new Set(s); n.has("fontSize") ? n.delete("fontSize") : n.add("fontSize"); return n; }); }} title={pinnedItems.has("fontSize") ? "Unpin" : "Pin to toolbar"}><StarIcon className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="flex items-center rounded-lg border border-[var(--workspace-border)] overflow-hidden [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-[var(--workspace-border)]">
                      <button type="button" aria-label="Decrease font size" className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors" onClick={() => setEditorFontSize((s) => Math.max(10, s - 1))}><MinusIcon className="h-3.5 w-3.5" aria-hidden /></button>
                      <span className="flex shrink-0 items-center justify-center px-1 py-0.5 text-xs tabular-nums text-[var(--workspace-text)] border-r border-[var(--workspace-border)] min-w-[2rem]">{editorFontSize}</span>
                      <button type="button" aria-label="Increase font size" className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors" onClick={() => setEditorFontSize((s) => Math.min(24, s + 1))}><PlusIcon className="h-3.5 w-3.5" aria-hidden /></button>
                      <button type="button" aria-label="Reset font size" className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors" onClick={() => setEditorFontSize(13)}><ArrowPathIcon className="h-3.5 w-3.5" aria-hidden /></button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-medium opacity-70">Indent</p>
                      <button type="button" className={`btn btn-ghost btn-xs btn-square h-5 w-5 p-0 rounded ${pinnedItems.has("indent") ? "text-primary" : "opacity-40"}`} onClick={(e) => { e.stopPropagation(); setPinnedItems((s) => { const n = new Set(s); n.has("indent") ? n.delete("indent") : n.add("indent"); return n; }); }} title={pinnedItems.has("indent") ? "Unpin" : "Pin to toolbar"}><StarIcon className="h-3.5 w-3.5" /></button>
                    </div>
                    <div className="flex items-center rounded-lg border border-[var(--workspace-border)] overflow-hidden [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-[var(--workspace-border)]">
                      <button type="button" aria-label="Decrease indent" className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors" onClick={() => { const v = Math.max(0, formatOptions.indentation - 1); applyFormatWithOptions({ ...formatOptions, indentation: v }); }}><MinusIcon className="h-3.5 w-3.5" aria-hidden /></button>
                      <span className="flex shrink-0 items-center justify-center px-1 py-0.5 text-xs tabular-nums text-[var(--workspace-text)] border-r border-[var(--workspace-border)]">{formatOptions.indentation}</span>
                      <button type="button" aria-label="Increase indent" className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors" onClick={() => { const v = Math.min(10, formatOptions.indentation + 1); applyFormatWithOptions({ ...formatOptions, indentation: v }); }}><PlusIcon className="h-3.5 w-3.5" aria-hidden /></button>
                      <button type="button" aria-label="Reset indent" className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors" onClick={() => applyFormatWithOptions({ ...formatOptions, indentation: 2 })}><ArrowPathIcon className="h-3.5 w-3.5" aria-hidden /></button>
                    </div>
                  </div>
                </div>
                <div className="border-t border-[var(--workspace-border)] pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium opacity-70">Quote style</p>
                    <div className="flex flex-wrap gap-1">
                      {(["double", "single"] as const).map((q) => (
                        <button key={q} type="button" className={`${linkBtnClass} h-6 min-h-6 ${formatOptions.quoteStyle === q ? "text-primary" : ""}`} onClick={() => applyFormatWithOptions({ ...formatOptions, quoteStyle: q })}>{q === "double" ? "Double" : "Single"}</button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium opacity-70">Format options</p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <label className="flex cursor-pointer items-center gap-1.5 p-1"><input type="checkbox" className="checkbox checkbox-xs" checked={formatOptions.sortKeys} onChange={(e) => applyFormatWithOptions({ ...formatOptions, sortKeys: e.target.checked })} />Sort keys</label>
                      <label className="flex cursor-pointer items-center gap-1.5"><input type="checkbox" className="checkbox checkbox-xs" checked={formatOptions.removeEmpty} onChange={(e) => applyFormatWithOptions({ ...formatOptions, removeEmpty: e.target.checked })} />Remove empty</label>
                    </div>
                  </div>
                </div>
                <div className="border-t border-[var(--workspace-border)] pt-2">
                  <p className="text-xs font-medium opacity-70 mb-1">Generate Types</p>
                  <div className="flex flex-wrap gap-1">
                    {TYPE_LANGUAGES.map((item) => (
                      <div key={item.id} className="flex items-center">
                        <button type="button" disabled={inputEmpty} className={`${linkBtnClass} h-6 min-h-6 disabled:opacity-50 ${typeLanguage === item.id ? "text-primary" : ""}`} onClick={() => { setFocusedPane("output"); setActiveOperation("generateTypes"); executeOperation("generateTypes", { typeLanguage: item.id }); }}>{item.label}</button>
                        <button type="button" className={`btn btn-ghost btn-xs btn-square h-5 w-5 p-0 rounded ${pinnedItems.has(`type:${item.id}`) ? "text-primary" : "opacity-40"}`} onClick={(e) => { e.stopPropagation(); setPinnedItems((s) => { const n = new Set(s); n.has(`type:${item.id}`) ? n.delete(`type:${item.id}`) : n.add(`type:${item.id}`); return n; }); }} title={pinnedItems.has(`type:${item.id}`) ? "Unpin" : "Pin to toolbar"}><StarIcon className={`h-3.5 w-3.5 ${pinnedItems.has(`type:${item.id}`) ? "text-primary" : "opacity-40"}`} /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-[var(--workspace-border)] pt-2">
                  <button type="button" className={`${linkBtnClass} flex w-full items-center justify-center gap-1.5 py-1.5`} onClick={() => { setFormatOptions(DEFAULT_FORMAT_OPTIONS); setConvertToFormat("json"); setRightView("raw"); setEditorFontSize(13); setPinnedItems(new Set(["fmt:json", "fmt:xml", "view:raw", "view:graph", "view:query", "action:minify", "action:schema", "action:diff", "type:typescript", "type:java", "type:go", "type:python", "type:sql"])); }}>
                    <ArrowPathIcon className="h-3.5 w-3.5" />Reset to default
                  </button>
                </div>
                  </>
                )}
              </div>
            </Dropdown>
            {viewAsMenu && (
              <>
            <Dropdown open={formatMenuOpen} onOpenChange={setFormatMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`dropdown-content z-[100] min-w-[7rem] p-1 shadow-xl rounded-lg border ${toolbarBorderClass} ${dropdownPanelClass}`} trigger={<div className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center gap-1 ${formatMenuOpen ? "text-primary" : ""}`} title="Format"><span>Format</span><ChevronDownIcon className="h-3 w-3" /></div>}>
              <div className="flex flex-wrap gap-0.5 p-1" onClick={(e) => e.stopPropagation()}>
                {FORMAT_KINDS.map((fmt) => (
                  <button key={fmt} type="button" disabled={inputEmpty} className={`${linkBtnClass} h-6 min-h-6 px-1.5 ${convertToFormat === fmt ? "text-primary" : ""}`} onClick={() => { setFocusedPane("output"); runConvert(fmt); setFormatMenuOpen(false); }}>{FORMAT_LABELS[fmt]}</button>
                ))}
              </div>
            </Dropdown>
            <Dropdown open={viewMenuOpen} onOpenChange={setViewMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`dropdown-content z-[100] min-w-[10rem] p-1.5 shadow-xl rounded-lg border ${toolbarBorderClass} ${dropdownPanelClass}`} trigger={<div className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center gap-1 ${viewMenuOpen ? "text-primary" : ""}`} title="View"><span>View</span><ChevronDownIcon className="h-3 w-3" /></div>}>
              <div className="max-h-[50vh] overflow-y-auto space-y-2" onClick={(e) => e.stopPropagation()}>
                <div>
                  <p className="text-[10px] font-medium opacity-60 mb-1">View mode</p>
                  <div className="flex flex-wrap gap-0.5">
                    {(["raw", "tree", "graph", "query", "table"] as const).map((view) => (
                      <button key={view} type="button" disabled={inputEmpty || ((view === "tree" || view === "graph" || view === "query" || view === "table") && !parsedOutput)} className={`${linkBtnClass} h-6 min-h-6 px-1.5 disabled:opacity-50 ${rightView === view ? "text-primary" : ""}`} onClick={() => { setRightView(view); setFocusedPane("output"); setViewMenuOpen(false); }}>{view[0].toUpperCase() + view.slice(1)}</button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-1 border-t border-[var(--workspace-border)]">
                  <div>
                    <p className="text-[10px] font-medium opacity-60 mb-0.5">Font size</p>
                    <div className="flex items-center gap-0.5">
                      <button type="button" className={`${linkBtnClass} btn-square h-6 w-6 p-0`} onClick={() => setEditorFontSize((s) => Math.max(10, s - 1))}><MinusIcon className="h-3 w-3" /></button>
                      <span className="text-xs tabular-nums px-1 min-w-[1.5rem]">{editorFontSize}</span>
                      <button type="button" className={`${linkBtnClass} btn-square h-6 w-6 p-0`} onClick={() => setEditorFontSize((s) => Math.min(24, s + 1))}><PlusIcon className="h-3 w-3" /></button>
                      <button type="button" className={`${linkBtnClass} h-6 min-h-6 text-[10px]`} onClick={() => setEditorFontSize(13)}>Reset</button>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium opacity-60 mb-0.5">Indent</p>
                    <div className="flex items-center gap-0.5">
                      <button type="button" className={`${linkBtnClass} btn-square h-6 w-6 p-0`} onClick={() => { const v = Math.max(0, formatOptions.indentation - 1); applyFormatWithOptions({ ...formatOptions, indentation: v }); }}><MinusIcon className="h-3 w-3" /></button>
                      <span className="text-xs tabular-nums px-1 min-w-[1.5rem]">{formatOptions.indentation}</span>
                      <button type="button" className={`${linkBtnClass} btn-square h-6 w-6 p-0`} onClick={() => { const v = Math.min(10, formatOptions.indentation + 1); applyFormatWithOptions({ ...formatOptions, indentation: v }); }}><PlusIcon className="h-3 w-3" /></button>
                      <button type="button" className={`${linkBtnClass} h-6 min-h-6 text-[10px]`} onClick={() => applyFormatWithOptions({ ...formatOptions, indentation: 2 })}>Reset</button>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-1 border-t border-[var(--workspace-border)]">
                  <div>
                    <p className="text-[10px] font-medium opacity-60 mb-0.5">Quote style</p>
                    <div className="flex gap-0.5">
                      {(["double", "single"] as const).map((q) => (
                        <button key={q} type="button" className={`${linkBtnClass} h-6 min-h-6 px-1.5 ${formatOptions.quoteStyle === q ? "text-primary" : ""}`} onClick={() => applyFormatWithOptions({ ...formatOptions, quoteStyle: q })}>{q === "double" ? "Double" : "Single"}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium opacity-60 mb-0.5">Format options</p>
                    <div className="flex gap-1">
                      <button type="button" className={`${linkBtnClass} h-6 min-h-6 px-1.5 ${formatOptions.sortKeys ? "text-primary" : ""}`} onClick={() => applyFormatWithOptions({ ...formatOptions, sortKeys: !formatOptions.sortKeys })}>Sort keys</button>
                      <button type="button" className={`${linkBtnClass} h-6 min-h-6 px-1.5 ${formatOptions.removeEmpty ? "text-primary" : ""}`} onClick={() => applyFormatWithOptions({ ...formatOptions, removeEmpty: !formatOptions.removeEmpty })}>Remove empty</button>
                    </div>
                  </div>
                </div>
              </div>
            </Dropdown>
            <Dropdown open={actionsMenuOpen} onOpenChange={setActionsMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`dropdown-content z-[100] min-w-[6.5rem] p-1 shadow-xl rounded-lg border ${toolbarBorderClass} ${dropdownPanelClass}`} trigger={<div className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center gap-1 ${actionsMenuOpen ? "text-primary" : ""}`} title="Actions"><span>Actions</span><ChevronDownIcon className="h-3 w-3" /></div>}>
              <div className="flex flex-wrap gap-0.5 p-1" onClick={(e) => e.stopPropagation()}>
                {OPERATION_ACTIONS.map(([label, action]) => (
                  <button key={action} type="button" disabled={showBusy || inputEmpty} className={`${linkBtnClass} h-6 min-h-6 px-1.5 disabled:opacity-50 ${activeOperation === action ? "text-primary" : ""}`} onClick={() => { runOperation(action); setActionsMenuOpen(false); }}>{label}</button>
                ))}
              </div>
            </Dropdown>
            <Dropdown open={typesMenuOpen} onOpenChange={setTypesMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`dropdown-content z-[100] min-w-[6rem] max-h-[50vh] overflow-y-auto p-1 shadow-xl rounded-lg border ${toolbarBorderClass} ${dropdownPanelClass}`} trigger={<div className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center gap-1 ${typesMenuOpen ? "text-primary" : ""}`} title="Generate Types"><span>Types</span><ChevronDownIcon className="h-3 w-3" /></div>}>
              <div className="flex flex-wrap gap-0.5 p-1" onClick={(e) => e.stopPropagation()}>
                {TYPE_LANGUAGES.map((item) => (
                  <button key={item.id} type="button" disabled={inputEmpty} className={`${linkBtnClass} h-6 min-h-6 px-1.5 disabled:opacity-50 ${typeLanguage === item.id ? "text-primary" : ""}`} onClick={() => { setFocusedPane("output"); setActiveOperation("generateTypes"); executeOperation("generateTypes", { typeLanguage: item.id }); setTypesMenuOpen(false); }}>{item.label}</button>
                ))}
              </div>
            </Dropdown>
              </>
            )}
            {!viewAsMenu && (
            <button type="button" disabled={showBusy || inputEmpty} className={`${linkBtnClass} h-7 min-h-7 shrink-0 ${activeOperation === "format" ? "text-primary" : ""}`} onClick={() => runOperation("format")}>Transform</button>
            )}
            {!viewAsMenu && FORMAT_KINDS.some((f) => pinnedItems.has(`fmt:${f}`)) && (
              <span className="mx-1 h-4 w-px shrink-0 self-center bg-[var(--workspace-text-muted)]/60" role="separator" aria-hidden />
            )}
            {!viewAsMenu && FORMAT_KINDS.filter((f) => pinnedItems.has(`fmt:${f}`)).map((fmt) => (
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
            {!viewAsMenu && (["raw", "tree", "graph", "query", "table"] as const).some((v) => pinnedItems.has(`view:${v}`)) && (
              <span className="mx-1 h-4 w-px shrink-0 self-center bg-[var(--workspace-text-muted)]/60" role="separator" aria-hidden />
            )}
            {!viewAsMenu && (["raw", "tree", "graph", "query", "table"] as const)
              .filter((v) => pinnedItems.has(`view:${v}`))
              .map((view) => (
                <button
                  key={view}
                  type="button"
                  disabled={inputEmpty || ((view === "tree" || view === "graph" || view === "query" || view === "table") && !parsedOutput)}
                  className={`${linkBtnClass} h-7 min-h-7 shrink-0 disabled:opacity-50 ${
                    rightView === view ? "text-primary" : ""
                  }`}
                  onClick={() => { setRightView(view); setFocusedPane("output"); }}
                >
                  {view[0].toUpperCase() + view.slice(1)}
                </button>
              ))}
            {!viewAsMenu && OPERATION_ACTIONS.some(([, a]) => pinnedItems.has(`action:${a}`)) && (
              <span className="mx-1 h-4 w-px shrink-0 self-center bg-[var(--workspace-text-muted)]/60" role="separator" aria-hidden />
            )}
            {!viewAsMenu && OPERATION_ACTIONS.filter(([, a]) => pinnedItems.has(`action:${a}`)).map(([label, action]) => (
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
            )            )}
            {!viewAsMenu && pinnedItems.has("fontSize") && (
              <>
              <span className="mx-1 h-4 w-px shrink-0 self-center bg-[var(--workspace-text-muted)]/60" role="separator" aria-hidden />
              <div className="flex w-fit shrink-0 items-center rounded-lg border border-[var(--workspace-border)] overflow-hidden [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-[var(--workspace-border)]">
                <span className="px-1.5 py-0.5 text-xs opacity-70 border-r border-[var(--workspace-border)]">Font</span>
                <button type="button" aria-label="Decrease font size" className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors" onClick={() => setEditorFontSize((s) => Math.max(10, s - 1))}>
                  <MinusIcon className="h-3 w-3" aria-hidden />
                </button>
                <span className="flex shrink-0 items-center justify-center px-1 py-0.5 text-xs tabular-nums border-r border-[var(--workspace-border)]">{editorFontSize}</span>
                <button type="button" aria-label="Increase font size" className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors" onClick={() => setEditorFontSize((s) => Math.min(24, s + 1))}>
                  <PlusIcon className="h-3 w-3" aria-hidden />
                </button>
                <button type="button" aria-label="Reset font size" className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors" onClick={() => setEditorFontSize(13)}>
                  <ArrowPathIcon className="h-3 w-3" aria-hidden />
                </button>
              </div>
              </>
            )}
            {!viewAsMenu && pinnedItems.has("indent") && (
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
            {!viewAsMenu && TYPE_LANGUAGES.some((t) => pinnedItems.has(`type:${t.id}`)) && (
              <span className="mx-1 h-4 w-px shrink-0 self-center bg-[var(--workspace-text-muted)]/60" role="separator" aria-hidden />
            )}
            {!viewAsMenu && TYPE_LANGUAGES.filter((t) => pinnedItems.has(`type:${t.id}`)).map((item) => (
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
            <span className="flex-1" />
          </div>
          <div className="relative flex min-h-[200px] min-h-0 flex-1 flex-col overflow-hidden">
            <div className="absolute right-[14px] top-2 z-10 flex items-center gap-0.5 rounded-lg border border-[var(--workspace-border)] p-0.5 bg-[var(--workspace-background)]/95 backdrop-blur-sm shadow-sm">
              <button
                type="button"
                className={`rounded p-1.5 shrink-0 transition-all duration-200 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] ${actionBounce === "share" ? "-translate-y-0.5" : ""}`}
                onClick={shareWorkspace}
                title={shareLabel}
              >
                <ShareIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`rounded p-1.5 shrink-0 transition-all duration-200 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] disabled:opacity-50 ${actionBounce === "copy" ? "-translate-y-0.5" : ""}`}
                disabled={!canDownload}
                onClick={copyOutput}
                title={copyLabel}
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
              {isGraphView ? (
                <Dropdown
                  open={downloadMenuOpen}
                  onOpenChange={setDownloadMenuOpen}
                  side="bottom"
                  align="end"
                  contentClassName={`rounded border p-1 shadow-xl ${toolbarBorderClass} ${dropdownPanelClass}`}
                  trigger={
                    <button
                      type="button"
                      className={`rounded p-1.5 shrink-0 transition-colors text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] disabled:opacity-50`}
                      disabled={!canDownload}
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  }
                >
                  <div className="flex flex-col gap-0.5 p-1">
                    <button type="button" className="btn btn-ghost btn-xs justify-start" onClick={() => downloadOutput("png")}>PNG</button>
                    <button type="button" className="btn btn-ghost btn-xs justify-start" onClick={() => downloadOutput("jpg")}>JPG</button>
                  </div>
                </Dropdown>
              ) : (
                <button
                  type="button"
                  className={`rounded p-1.5 shrink-0 transition-colors text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] disabled:opacity-50`}
                  disabled={!canDownload}
                  onClick={() => downloadOutput()}
                  title="Download"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                className="rounded p-1.5 shrink-0 transition-colors text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)]"
                onClick={() => setIsOutputMaximized((v) => !v)}
                title={isOutputMaximized ? "Restore layout" : "Maximize output"}
              >
                {isOutputMaximized ? (
                  <ArrowsPointingInIcon className="h-4 w-4" />
                ) : (
                  <ArrowsPointingOutIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {rightView === "raw" ? (
              activeOperation === "diff" && diffPreview ? (
                <JsonDiffEditor
                  original={diffPreview.original}
                  modified={diffPreview.modified}
                  className="h-full min-h-0 flex-1"
                  language={outputLanguage === "toml" || outputLanguage === "csv" ? "plaintext" : outputLanguage}
                  monacoTheme={monacoTheme}
                  fontSize={editorFontSize}
                  modifiedEditable
                  onModifiedChange={handleDiffModifiedChange}
                  outputPanelClass={outputPanelClass}
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
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-5 p-6 text-center overflow-y-auto bg-[var(--workspace-panel)]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-1">
                      <img src="/icon.svg" alt="" width={40} height={40} className="workspace-icon shrink-0" />
                      <span className="text-lg font-semibold text-primary">formaty</span>
                    </div>
                    <p className="max-w-lg text-sm text-[var(--workspace-text-muted)] leading-relaxed">
                      Format, convert, validate, and query JSON, XML, YAML, TOML, CSV. Paste with <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--workspace-border)] font-mono">ctrl+v/cmd+v</kbd> or import a file.
                    </p>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-[var(--workspace-text-muted)] justify-center">
                      <span>Query (JSONPath/JMESPath)</span>
                      <span>·</span>
                      <span>cURL → fetch API</span>
                      <span>·</span>
                      <span>Tree & graph & table</span>
                      <span>·</span>
                      <span>Schema & types</span>
                      <span>·</span>
                      <span>Diff & share</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button type="button" className={`${linkBtnClass} gap-1.5`} onClick={pasteFromClipboard}>
                      <ClipboardDocumentIcon className="h-4 w-4" />
                      Paste
                    </button>
                    <button type="button" className={`${linkBtnClass} gap-1.5`} onClick={() => document.getElementById("import-json-file")?.click()}>
                      <DocumentArrowDownIcon className="h-4 w-4" />
                      Import
                    </button>
                    <span className="text-xs font-medium">or try sample</span>
                    {FORMAT_KINDS.map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        className={linkBtnClass}
                        onClick={() => {
                          const sample = SAMPLES[fmt];
                          setInput(sample);
                          pushHistory(sample);
                          setInputFormatOverride(null);
                          setError(null);
                          setValidationError(null);
                          parseOnly(sample, fmt);
                          setFocusedPane("output");
                          if (!isDesktopLayout) setMobileShowOutput(true);
                        }}
                      >
                        {FORMAT_LABELS[fmt]}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={linkBtnClass}
                      onClick={() => {
                        setInput(SAMPLE_CURL);
                        pushHistory(SAMPLE_CURL);
                        setInputFormatOverride("curl");
                        setError(null);
                        setValidationError(null);
                        parseOnly(SAMPLE_CURL, "curl");
                        setFocusedPane("output");
                        if (!isDesktopLayout) setMobileShowOutput(true);
                      }}
                    >
                      cURL
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[var(--workspace-border)]">
                    <span className="text-xs font-medium opacity-70">Example gallery</span>
                    <div className="flex flex-wrap gap-1.5">
                      {EXAMPLES.map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          className={`${linkBtnClass} text-xs`}
                          onClick={() => {
                            setInput(ex.data);
                            pushHistory(ex.data);
                            setInputFormatOverride(null);
                            setError(null);
                            setValidationError(null);
                            parseOnly(ex.data, "json");
                            setConvertToFormat("json");
                            setRightView("raw");
                            setFocusedPane("output");
                            if (!isDesktopLayout) setMobileShowOutput(true);
                          }}
                        >
                          {ex.label}
                        </button>
                      ))}
                    </div>
                  </div>
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
            {rightView === "query" ? (
              parsedOutput ? (
                <QueryView
                  data={parsedOutput}
                  className={`${outputPanelClass} min-h-0 flex-1`}
                  isDark={isDark}
                  fontSize={editorFontSize}
                  monacoTheme={monacoTheme}
                />
              ) : (
                <div className={`flex h-full min-h-[200px] items-center justify-center border text-sm text-base-content/70 ${outputPanelClass}`}>
                  Current output is not valid JSON.
                </div>
              )
            ) : null}
            {rightView === "table" ? (
              parsedOutput ? (
                <TableView
                  data={parsedOutput}
                  className={`${outputPanelClass} min-h-0 flex-1 overflow-auto`}
                  isDark={isDark}
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
        errorMessage={error ?? validationError}
        lineCount={inputLineCount}
        sizeFormatted={inputSizeFormatted}
        liveTransform={liveTransform}
        onLiveTransformToggle={() => setLiveTransform((v) => !v)}
        cursorPosition={cursorPosition ? `Ln ${cursorPosition.line}, Col ${cursorPosition.column}` : undefined}
        indentSize={formatOptions.indentation}
        encoding="UTF-8"
      />

        {modalKind === "validate" ? (
          <div className="modal modal-open">
            <div className="modal-box w-full max-w-3xl">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Schema (JSON or YAML) for Validate</h3>
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
                    setSchemaInput(modalValue);
                    setModalKind(null);
                    executeOperation("validate", { schemaText: modalValue });
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
