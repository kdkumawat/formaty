"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  ArrowsRightLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  ListBulletIcon,
  MinusIcon,
  PlusIcon,
  StarIcon,
  ArrowLeftCircleIcon,
  ArrowRightCircleIcon,
  XMarkIcon,
  XCircleIcon,
  LinkSlashIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { JsonDiffEditor, type DiffNavState, type JsonDiffEditorRef } from "@/components/JsonDiffEditor";
import { ListComparePanel, type ListCompareExport } from "@/components/ListComparePanel";
import { DEFAULT_LIST_PARSE_OPTIONS, type ListParseOptions } from "@/lib/json/listCompare";
import {
  UtilsPanel,
  defaultUtilToolState,
  type UtilTab,
  type UtilsStateMap,
} from "@/components/UtilsPanel";
import { UTIL_TABS } from "@/lib/utils/devtools";
import { parseJsonInput } from "@/lib/json/core";
import { JsonEditor } from "@/components/JsonEditor";
import { GraphView, type GraphViewRef } from "@/components/GraphView";
import { TreeView } from "@/components/TreeView";
import { QueryView } from "@/components/QueryView";
import { TableView } from "@/components/TableView";
import {
  Dropdown,
  getSizeFormatted,
  Header as WorkspaceHeader,
  OutputActionBar,
  StatusBar,
  formatCopyAsText,
  DEFAULT_COPY_AS_OPTIONS,
  LIST_COPY_AS_OPTIONS,
  UUID_COPY_AS_OPTIONS,
  type CopyAsFormat,
} from "@/components/workspace";
import { Logo } from "@/components/Logo";
import {
  emptyDiffSummary,
  formatDiffReport,
  summarizeDiffFromText,
  type DiffSummary,
  type LineDiffStats,
} from "@/lib/json/diff";
import { useJsonWorker } from "@/hooks/useJsonWorker";
import { detectFormat, FORMAT_LABELS, getInputFormatLabel, parseInput, stringifyOutput, type FormatKind, type InputFormatKind } from "@/lib/formats";
import { ALL_TOOL_ROUTES, TOOL_PAGES, TOOL_PRESETS, type ToolRoute } from "@/lib/seo";
import { executeCurl, parseCurl } from "@/lib/curl/parseCurl";
import { formatJson } from "@/lib/json/core";
import { decodeState, encodeState } from "@/lib/shareState";
import { savePlayground, updatePlayground, deletePlayground } from "@/lib/playgroundApi";
import { CommandPalette, type Command } from "@/components/CommandPalette";
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

/** Array of objects — best starting point for Table view */
const SAMPLE_JSON_TABLE = `[
  { "id": 1, "name": "Alice", "role": "admin", "active": true, "score": 98 },
  { "id": 2, "name": "Bob", "role": "dev", "active": true, "score": 87 },
  { "id": 3, "name": "Carol", "role": "viewer", "active": false, "score": 72 },
  { "id": 4, "name": "Dave", "role": "dev", "active": true, "score": 91 }
]`;

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

/** Transform actions only — Compare is a separate workspace tool (not nested here). */
const OPERATION_ACTIONS = [
  ["Beautify", "beautify"],
  ["Minify", "minify"],
  ["Flatten", "flatten"],
  ["Unflatten", "unflatten"],
  ["Schema", "schema"],
  ["Validate", "validate"],
] as const;

const FORMAT_KINDS: FormatKind[] = ["json", "xml", "yaml", "toml", "csv"];
const INPUT_FORMAT_KINDS: InputFormatKind[] = [...FORMAT_KINDS, "curl"];

const TYPE_LANGUAGES: Array<{ id: TypeTargetLanguage; label: string; ext: string }> = [
  { id: "typescript", label: "TypeScript", ext: "ts" },
  { id: "zod", label: "Zod", ext: "ts" },
  { id: "java", label: "Java", ext: "java" },
  { id: "csharp", label: "C#", ext: "cs" },
  { id: "python", label: "Python", ext: "py" },
  { id: "pydantic", label: "Pydantic", ext: "py" },
  { id: "go", label: "Go", ext: "go" },
  { id: "protobuf", label: "Protobuf", ext: "proto" },
  { id: "kotlin", label: "Kotlin", ext: "kt" },
  { id: "swift", label: "Swift", ext: "swift" },
  { id: "rust", label: "Rust", ext: "rs" },
  { id: "sql", label: "SQL", ext: "sql" },
];

/** Soft caps for heavy views (bytes of input text). */
const LARGE_INPUT_BYTES = 400 * 1024;
const HUGE_INPUT_BYTES = 2 * 1024 * 1024;

/** Includes "diff" / "utils" for first-class tools (not transform OPERATION_ACTIONS menus). */
type OperationAction =
  | (typeof OPERATION_ACTIONS)[number][1]
  | "format"
  | "beautify"
  | "sort"
  | "sortArrays"
  | "dedup"
  | "removeEmpty"
  | "generateTypes"
  | "diff"
  | "utils";
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
type Tab = { id: string; label: string };
type FormatOptions = {
  indentation: number;
  quoteStyle: QuoteStyle;
  sortKeys: boolean;
  removeEmpty: boolean;
};

/**
 * Detect leftover internal path-diff payloads that used to be written into the main
 * output panel (including concatenated duplicates stuck in localStorage).
 */
function isStaleDiffOutput(text: string | null | undefined): boolean {
  if (!text || !text.trim()) return false;
  const t = text.trim();
  if (t.includes("Structural path diff requires valid JSON")) return true;
  if (t.includes('"leftValid"') && t.includes('"rightValid"') && t.includes('"note"')) return true;
  // Former structural report shape written only for visual-diff bookkeeping
  if (
    t.includes('"summary"') &&
    t.includes('"changes"') &&
    (t.includes('"truncated"') || t.includes('"added"')) &&
    t.includes('"path"') &&
    t.includes('"change"')
  ) {
    // Heuristic: only treat as stale if it looks like our internal export (not user data)
    try {
      const first = t.startsWith("{") ? JSON.parse(t.slice(0, t.indexOf("}\n{") > 0 ? t.indexOf("}\n{") + 1 : undefined)) : null;
      if (first && typeof first === "object" && first !== null && "summary" in first && "changes" in first) {
        return true;
      }
    } catch {
      /* fall through */
    }
  }
  return false;
}

function cleanSessionOutput(text: string | null | undefined): string {
  if (!text) return "";
  return isStaleDiffOutput(text) ? "" : text;
}

const EXT_BY_FORMAT: Record<FormatKind, string> = {
  json: "json",
  xml: "xml",
  yaml: "yaml",
  toml: "toml",
  csv: "csv",
};

const LANGUAGE_BY_TYPE_TARGET: Record<TypeTargetLanguage, OutputLanguage> = {
  typescript: "typescript",
  zod: "typescript",
  sql: "sql",
  java: "java",
  csharp: "csharp",
  python: "python",
  pydantic: "python",
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


export interface WorkspaceContentProps {
  initialState?: import("@/lib/shareState").WorkspaceState;
  sharedLinkId?: string;
  sharedLinkUrl?: string;
}

import type { ButtonHTMLAttributes } from "react";
import { Button as UiButton } from "@/components/ui/button";

/** shadcn-backed square icon button (preserves current sizing + icon size). */
function SquareBtn({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <UiButton
      type="button"
      variant="ghost"
      className={`h-auto min-h-0 w-auto min-w-0 !p-0 [&_svg]:!size-3.5 ${className}`}
      {...props}
    />
  );
}

export function WorkspaceContent({ initialState, sharedLinkId: initialSharedLinkId, sharedLinkUrl: initialSharedLinkUrl }: WorkspaceContentProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { run } = useJsonWorker();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [parsedOutput, setParsedOutput] = useState<JsonValue | null>(null);
  const [outputExt, setOutputExt] = useState("json");
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguage>("json");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeOperation, setActiveOperation] = useState<OperationAction | null>(null);
  const [utilTab, setUtilTab] = useState<UtilTab>("uuid");
  const [utilsByTool, setUtilsByTool] = useState<UtilsStateMap>({});
  const [shareAllTabs, setShareAllTabs] = useState(false);
  const [listToolbarHost, setListToolbarHost] = useState<HTMLElement | null>(null);
  /** Active list-compare result for shared OutputActionBar copy/download */
  const [listCompareExport, setListCompareExport] = useState<ListCompareExport | null>(null);
  const [listCompareOptions, setListCompareOptions] = useState<ListParseOptions>(DEFAULT_LIST_PARSE_OPTIONS);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [themeSynced, setThemeSynced] = useState(false);
  const [split, setSplit] = useState(20);
  const [isResizing, setIsResizing] = useState(false);
  const [schemaInput, setSchemaInput] = useState("");
  const [diffLeftInput, setDiffLeftInput] = useState("");
  const [diffRightInput, setDiffRightInput] = useState("");
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [modalValue, setModalValue] = useState("");
  const [rightView, setRightView] = useState<RightView>("raw");
  const [typeLanguage, setTypeLanguage] = useState<TypeTargetLanguage>("typescript");
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [shareState, setShareState] = useState<"idle" | "done" | "error">("idle");
  const [sharedLinkId, setSharedLinkId] = useState<string | null>(initialSharedLinkId ?? null);
  const [sharedLinkUrl, setSharedLinkUrl] = useState<string | null>(initialSharedLinkUrl ?? null);
  const [shareNotification, setShareNotification] = useState<string | null>(null);
  const [isOutputMaximized, setIsOutputMaximized] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(true);
  const [focusedPane, setFocusedPane] = useState<"input" | "output">("input");
  const [formatOptions, setFormatOptions] = useState<FormatOptions>(DEFAULT_FORMAT_OPTIONS);
  const [convertToFormat, setConvertToFormat] = useState<FormatKind>("json");
  const [inputFormatOverride, setInputFormatOverride] = useState<InputFormatKind | null>(null);
  const [inputFormatOpen, setInputFormatOpen] = useState(false);
  const [transformConfigOpen, setTransformConfigOpen] = useState(false);
  /** Menu-first chrome by default — cleaner for new users; uncheck in settings for pinned toolbar. */
  const [viewAsMenu, setViewAsMenu] = useState(true);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [typesMenuOpen, setTypesMenuOpen] = useState(false);
  const [pinnedItems, setPinnedItems] = useState<Set<string>>(
    () => new Set(["fmt:json", "view:raw", "view:query", "action:beautify", "action:minify", "type:typescript", "type:zod"])
  );
  const [shareConfirmOpen, setShareConfirmOpen] = useState(false);
  const [showFirstRunHint, setShowFirstRunHint] = useState(false);

  const [liveTransform, setLiveTransform] = useState(true);
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [lineWrap, setLineWrap] = useState(true);
  const [diffSideBySide, setDiffSideBySide] = useState(true);
  const [diffIgnoreWhitespace, setDiffIgnoreWhitespace] = useState(false);
  const [diffShowPaths, setDiffShowPaths] = useState(false);
  const [diffPathFilter, setDiffPathFilter] = useState<"all" | "added" | "removed" | "changed">("all");
  const [diffLineStats, setDiffLineStats] = useState<LineDiffStats | null>(null);
  const [diffNav, setDiffNav] = useState<DiffNavState>({ current: 0, total: 0 });
  const [diffActionFlash, setDiffActionFlash] = useState<string | null>(null);
  /** Document = Monaco text/JSON diff; List = set/list compare for SQL IN etc. */
  const [diffKind, setDiffKind] = useState<"document" | "list">("document");
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [csvDelimiter, setCsvDelimiter] = useState(",");
  const [isWindowFullscreen, setIsWindowFullscreen] = useState(false);

  // Multiple tabs
  const [tabs, setTabs] = useState<Tab[]>([{ id: "t1", label: "Tab 1" }]);
  const [activeTabId, setActiveTabId] = useState("t1");
  const [showTabs, setShowTabs] = useState(false);
  const tabCounterRef = useRef(1);
  // Recent command palette actions
  const [recentActions, setRecentActions] = useState<string[]>([]);
  // Split input
  const [splitInputOpen, setSplitInputOpen] = useState(false);
  const [splitInput2, setSplitInput2] = useState("");
  const [splitRatio, setSplitRatio] = useState(50);
  const [isSplitResizing, setIsSplitResizing] = useState(false);
  // Auto-format on paste
  const [autoFormatOnPaste, setAutoFormatOnPaste] = useState(true);

  const toggleWindowFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsWindowFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsWindowFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsWindowFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const [inputValid, setInputValid] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([""]);
  const [undoIndex, setUndoIndex] = useState(0);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [actionBounce, setActionBounce] = useState<"share" | "copy" | null>(null);
  const [mobileShowOutput, setMobileShowOutput] = useState(true);
  const [loadedToolPreset, setLoadedToolPreset] = useState<ToolRoute | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number } | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const historyLock = useRef(false);
  const splitContainerRef = useRef<HTMLDivElement | null>(null);
  const prevBeforeDiffRef = useRef<{
    rightView: RightView;
    activeOperation: OperationAction | null;
    isOutputMaximized: boolean;
    output: string;
    parsedOutput: JsonValue | null;
    outputExt: string;
    outputLanguage: OutputLanguage;
  } | null>(null);
  const graphViewRef = useRef<GraphViewRef | null>(null);
  const diffEditorRef = useRef<JsonDiffEditorRef | null>(null);
  const outputEditorApiRef = useRef<{ find(): void; focus(): void; collapseAll(): void; expandAll(): void; goToLine(line: number, column?: number): void } | null>(null);
  const inputEditorApiRef = useRef<{ find(): void; focus(): void; collapseAll(): void; expandAll(): void; goToLine(line: number, column?: number): void } | null>(null);
  const splitInput2ApiRef = useRef<{ find(): void; focus(): void; collapseAll(): void; expandAll(): void; goToLine(line: number, column?: number): void } | null>(null);
  type TabSnapshot = {
    input: string;
    inputFormatOverride: InputFormatKind | null;
    undoStack: string[];
    undoIndex: number;
    output: string;
    parsedOutput: JsonValue | null;
    outputExt: string;
    outputLanguage: OutputLanguage;
    activeOperation: OperationAction | null;
    error: string | null;
    convertToFormat: FormatKind;
    typeLanguage: TypeTargetLanguage;
    rightView: RightView;
    /** Per-tab Compare state (never shared across tabs). */
    diffLeftInput: string;
    diffRightInput: string;
    diffKind: "document" | "list";
    isOutputMaximized: boolean;
    /** Per-tab Utils selection + each util tool’s own I/O. */
    utilTab: UtilTab;
    utilsByTool: UtilsStateMap;
  };
  const emptyTabSnapshot = (): TabSnapshot => ({
    input: "",
    inputFormatOverride: null,
    undoStack: [""],
    undoIndex: 0,
    output: "",
    parsedOutput: null,
    outputExt: "json",
    outputLanguage: "json",
    activeOperation: null,
    error: null,
    convertToFormat: "json",
    typeLanguage: "typescript",
    rightView: "raw",
    diffLeftInput: "",
    diffRightInput: "",
    diffKind: "document",
    isOutputMaximized: false,
    utilTab: "uuid",
    utilsByTool: {},
  });
  const captureTabSnapshot = useCallback((): TabSnapshot => ({
    input,
    inputFormatOverride,
    undoStack,
    undoIndex,
    output,
    parsedOutput,
    outputExt,
    outputLanguage,
    activeOperation,
    error,
    convertToFormat,
    typeLanguage,
    rightView,
    diffLeftInput,
    diffRightInput,
    diffKind,
    isOutputMaximized,
    utilTab,
    utilsByTool,
  }), [input, inputFormatOverride, undoStack, undoIndex, output, parsedOutput, outputExt, outputLanguage, activeOperation, error, convertToFormat, typeLanguage, rightView, diffLeftInput, diffRightInput, diffKind, isOutputMaximized, utilTab, utilsByTool]);
  const applyTabSnapshot = (snap: TabSnapshot) => {
    setInput(snap.input);
    setInputFormatOverride(snap.inputFormatOverride);
    setUndoStack(snap.undoStack);
    setUndoIndex(snap.undoIndex);
    setOutput(cleanSessionOutput(snap.output));
    setParsedOutput(snap.parsedOutput);
    setOutputExt(snap.outputExt);
    setOutputLanguage(snap.outputLanguage);
    setActiveOperation(snap.activeOperation);
    setError(snap.error);
    setValidationError(null);
    setConvertToFormat(snap.convertToFormat);
    setTypeLanguage(snap.typeLanguage);
    setRightView(snap.rightView);
    setDiffLeftInput(snap.diffLeftInput ?? "");
    setDiffRightInput(snap.diffRightInput ?? "");
    setDiffKind(snap.diffKind ?? "document");
    setIsOutputMaximized(
      Boolean(snap.isOutputMaximized) ||
        snap.activeOperation === "diff" ||
        snap.activeOperation === "utils",
    );
    setUtilTab(snap.utilTab ?? "uuid");
    setUtilsByTool(snap.utilsByTool ?? {});
    setDiffLineStats(null);
    setDiffNav({ current: 0, total: 0 });
    // Recover structured views after tab switch / Compare exit
    if (snap.parsedOutput == null) {
      const cleaned = cleanSessionOutput(snap.output);
      const source = cleaned?.trim() ? cleaned : snap.input;
      if (source?.trim()) {
        try {
          setParsedOutput(parseJsonInput(source));
        } catch {
          try {
            const fmt = detectFormat(source);
            if (fmt !== "curl") setParsedOutput(parseInput(source, fmt) as JsonValue);
          } catch {
            /* leave null */
          }
        }
      }
    }
  };
  const tabSnapshotsRef = useRef<Map<string, TabSnapshot>>(new Map());
  const splitContainerInputRef = useRef<HTMLDivElement | null>(null);
  const diffDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRestoredRef = useRef(false);
  const skipNextPersistRef = useRef(true);
  const curlCacheRef = useRef<{ input: string; result: string } | null>(null);
  const isViewingSharedRef = useRef(false);

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
  const monacoTheme = isDark ? "vs-dark" : "vs";
  const outputPanelClass = isDark ? "border-[#2d2d30] bg-[#1e1e1e]" : "border-[#e5e5e5] bg-[#ffffff]";
  const inputEditorBgClass = "border border-[var(--workspace-border)] border-t-0 bg-[var(--workspace-panel)]";
  const canUndo = undoIndex > 0;
  const canRedo = undoIndex < undoStack.length - 1;
  /** Diff mode always uses full-width left/right panes (no main input panel). */
  const isDiffMode = activeOperation === "diff";
  const isUtilsMode = activeOperation === "utils";
  const hideInputPanel = isOutputMaximized || isDiffMode || isUtilsMode;

  const structuralDiff = useMemo((): DiffSummary | null => {
    if (!isDiffMode) return null;
    if (!diffLeftInput.trim() && !diffRightInput.trim()) return emptyDiffSummary();
    return summarizeDiffFromText(diffLeftInput, diffRightInput);
  }, [isDiffMode, diffLeftInput, diffRightInput]);

  /** Monaco language: JSON highlighting only when both sides parse as JSON (loose OK). */
  const documentDiffLanguage = useMemo(() => {
    const ok = (t: string) => {
      const s = t.trim();
      if (!s) return true;
      try {
        parseJsonInput(s);
        return true;
      } catch {
        return false;
      }
    };
    return ok(diffLeftInput) && ok(diffRightInput) ? "json" : "plaintext";
  }, [diffLeftInput, diffRightInput]);

  const canShowPathDiff = structuralDiff !== null;
  // Close paths panel when leaving document compare (list mode / other tools)
  useEffect(() => {
    if ((!isDiffMode || diffKind !== "document") && diffShowPaths) {
      setDiffShowPaths(false);
    }
  }, [isDiffMode, diffKind, diffShowPaths]);

  const filteredDiffRows = useMemo(() => {
    if (!structuralDiff) return [];
    if (diffPathFilter === "all") return structuralDiff.rows;
    return structuralDiff.rows.filter((r) => r.change === diffPathFilter);
  }, [structuralDiff, diffPathFilter]);

  const flashDiffAction = useCallback((msg: string) => {
    setDiffActionFlash(msg);
    window.setTimeout(() => setDiffActionFlash(null), 1400);
  }, []);
  const copyLabel = copyState === "done" ? "Copied" : copyState === "error" ? "Failed" : "Copy";
  const shareLabel = shareState === "done" ? "Copied" : shareState === "error" ? "Failed" : "Share";
  const inputLineCount = input.split("\n").length;
  const inputSizeFormatted = getSizeFormatted(input);
  const inputByteSize = useMemo(() => (input ? new Blob([input]).size : 0), [input]);
  const isLargeInput = inputByteSize >= LARGE_INPUT_BYTES;
  const isHugeInput = inputByteSize >= HUGE_INPUT_BYTES;
  const selectedTypeLanguageLabel =
    TYPE_LANGUAGES.find((item) => item.id === typeLanguage)?.label ?? "Language";

  const dropdownPanelClass = isDark ? "bg-[#1a1a1a]/98 backdrop-blur-xl text-[#e8e8e8]" : "bg-white/98 backdrop-blur-xl text-[#1a1a1a]";
  const settingsLabelClass = isDark ? "text-[10px] font-bold uppercase tracking-[0.1em] text-primary/80" : "text-[10px] font-bold uppercase tracking-[0.1em] text-primary/65";
  const settingsBtnGroupClass =
    "inline-flex w-fit max-w-full items-center overflow-hidden rounded-lg border border-[var(--workspace-border)]/60 divide-x divide-[var(--workspace-border)]/40 bg-[var(--workspace-background)]/60";
  const settingsStepBtnClass =
    "flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] transition-all duration-100 hover:bg-primary/10 hover:text-primary active:scale-95";
  const pinStarClass = (on: boolean) =>
    `inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-all ${
      on
        ? "text-amber-500 hover:bg-amber-500/10"
        : "text-[var(--workspace-text-muted)]/55 hover:bg-primary/10 hover:text-primary"
    }`;
  const toolbarSep = (
    <span className="mx-1 h-4 w-px shrink-0 self-center bg-[var(--workspace-border)]" role="separator" aria-hidden />
  );
  const linkBtnClass = isDark
    ? "btn btn-xs btn-ghost cursor-pointer rounded-md px-1.5 py-1 border-0 font-medium text-[#b0b0b0] hover:bg-white/[0.1] hover:text-[#e8e8e8] transition-all duration-100"
    : "btn btn-xs btn-ghost cursor-pointer rounded-md px-1.5 py-1 border-0 font-medium text-[#3a3a3a] hover:bg-black/[0.07] hover:text-[#0a0a0a] transition-all duration-100";
  const tbActiveClass = "!bg-primary/12 !text-primary font-semibold";
  const inputEmpty = !input.trim();
  useEffect(() => {
    if (inputEmpty) setCursorPosition(null);
  }, [inputEmpty]);

  // Large payloads: keep raw editing snappy — turn off live transform automatically
  useEffect(() => {
    if (isHugeInput && liveTransform) {
      setLiveTransform(false);
      setShareNotification("Live transform off for large files");
      window.setTimeout(() => setShareNotification(null), 3000);
    }
    // Only react to size crossing the threshold, not liveTransform toggles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHugeInput]);

  const detectedInputFormat = useMemo(() => detectFormat(input), [input]);
  const resolvedInputFormat: InputFormatKind = inputFormatOverride ?? detectedInputFormat;
  const resolvedParseFormat: FormatKind = resolvedInputFormat === "curl" ? "json" : resolvedInputFormat;

  const getParsedInput = useCallback(async (): Promise<JsonValue> => {
    if (resolvedInputFormat === "curl") {
      const cache = curlCacheRef.current;
      let responseText: string;
      if (cache && cache.input === input) {
        responseText = cache.result;
      } else {
        const parsed = parseCurl(input);
        responseText = await executeCurl(parsed);
        curlCacheRef.current = { input, result: responseText };
      }
      const fmt = detectFormat(responseText) === "curl" ? "json" : (detectFormat(responseText) as FormatKind);
      return run<JsonValue>("parseFormat", { input: responseText, format: fmt });
    }
    return run<JsonValue>("parseFormat", { input, format: resolvedParseFormat });
  }, [input, resolvedInputFormat, resolvedParseFormat, run]);

  const pushHistory = useCallback((next: string) => {
    if (historyLock.current) return;
    setUndoStack((prev) => {
      if (prev[undoIndex] === next) return prev;
      const sliced = prev.slice(0, undoIndex + 1);
      const result = [...sliced, next].slice(-100);
      setUndoIndex(result.length - 1);
      return result;
    });
  }, [undoIndex]);

  const moveHistory = useCallback((delta: number) => {
    const targetIdx = undoIndex + delta;
    if (targetIdx < 0 || targetIdx >= undoStack.length) return;
    const next = undoStack[targetIdx];
    historyLock.current = true;
    setUndoIndex(targetIdx);
    setInput(next);
    setTimeout(() => {
      historyLock.current = false;
    }, 0);
  }, [undoIndex, undoStack]);

  const switchToTab = (tabId: string) => {
    if (tabId === activeTabId) return;
    tabSnapshotsRef.current.set(activeTabId, captureTabSnapshot());
    const snap = tabSnapshotsRef.current.get(tabId) ?? emptyTabSnapshot();
    historyLock.current = true;
    setActiveTabId(tabId);
    applyTabSnapshot(snap);
    prevBeforeDiffRef.current = null;
    setTimeout(() => { historyLock.current = false; }, 0);
  };

  const addTab = () => {
    tabSnapshotsRef.current.set(activeTabId, captureTabSnapshot());
    tabCounterRef.current += 1;
    const newId = `t${tabCounterRef.current}`;
    setTabs((prev) => [...prev, { id: newId, label: `Tab ${tabCounterRef.current}` }]);
    setActiveTabId(newId);
    historyLock.current = true;
    applyTabSnapshot(emptyTabSnapshot());
    prevBeforeDiffRef.current = null;
    setTimeout(() => { historyLock.current = false; }, 0);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return;
    const tabIdx = tabs.findIndex((t) => t.id === tabId);
    tabSnapshotsRef.current.delete(tabId);
    const newTabs = tabs.filter((t) => t.id !== tabId);
    if (tabId === activeTabId) {
      const nextTab = newTabs[Math.max(0, tabIdx - 1)];
      const snap = tabSnapshotsRef.current.get(nextTab.id) ?? emptyTabSnapshot();
      setTabs(newTabs);
      setActiveTabId(nextTab.id);
      historyLock.current = true;
      applyTabSnapshot(snap);
      prevBeforeDiffRef.current = null;
      setTimeout(() => { historyLock.current = false; }, 0);
    } else {
      setTabs(newTabs);
    }
  };

  useEffect(() => {
    try {
      const s = localStorage.getItem("formaty-session");
      if (s) {
        const d = JSON.parse(s) as { themeMode?: ThemeMode };
        if (d.themeMode === "dark" || d.themeMode === "light" || d.themeMode === "system") setThemeMode(d.themeMode);
      }
    } catch {}
    try {
      if (localStorage.getItem("formaty-onboarded") !== "1") {
        setShowFirstRunHint(true);
      }
    } catch {}
    setSystemDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDesktopLayout(window.matchMedia("(min-width: 1280px)").matches);
    setThemeSynced(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!themeSynced) return;
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    const style = document.getElementById("formaty-theme-inline");
    if (style) {
      style.textContent = resolvedTheme === "dark"
        ? "html,body{--workspace-background:#0d0d0d;--workspace-panel:#141414;--workspace-border:#282828;--workspace-text:#f0f0f0;--workspace-text-muted:#9a9a9a}"
        : "html,body{--workspace-background:#f5f5f5;--workspace-panel:#ffffff;--workspace-border:#dedede;--workspace-text:#0a0a0a;--workspace-text-muted:#4a4a4a}";
    }
  }, [resolvedTheme, themeSynced]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const onChange = (event: MediaQueryListEvent) => setIsDesktopLayout(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (initialState) {
      isViewingSharedRef.current = true;
      if (initialState.input) {
        setInput(initialState.input);
        setUndoStack([initialState.input]);
        setUndoIndex(0);
      }
      if (initialState.convertToFormat && FORMAT_KINDS.includes(initialState.convertToFormat))
        setConvertToFormat(initialState.convertToFormat);
      if (typeof initialState.liveTransform === "boolean") setLiveTransform(initialState.liveTransform);
      if (initialState.output) {
        setOutput(initialState.output);
        if (initialState.outputLanguage) {
          const ol = initialState.outputLanguage;
          if (["json", "xml", "yaml", "toml", "csv"].includes(ol)) {
            setOutputExt(EXT_BY_FORMAT[ol as FormatKind]);
            setOutputLanguage(ol as OutputLanguage);
          } else {
            const ext = TYPE_LANGUAGES.find((t) => t.id === ol)?.ext ?? "ts";
            setOutputExt(ext);
            setOutputLanguage(ol as OutputLanguage);
          }
        } else if (initialState.outputFormat) {
          setOutputExt(EXT_BY_FORMAT[initialState.outputFormat]);
          setOutputLanguage(initialState.outputFormat);
        }
        try {
          if (initialState.outputFormat === "json" || !initialState.outputFormat) {
            setParsedOutput(JSON.parse(initialState.output) as JsonValue);
          } else if (initialState.outputFormat && initialState.output) {
            void import("@/lib/formats").then(({ parseInput }) => {
              setParsedOutput(parseInput(initialState.output!, initialState.outputFormat!));
            });
          }
        } catch {
          setParsedOutput(null);
        }
      }
      if (initialState.typeLanguage) setTypeLanguage(initialState.typeLanguage);
      if (initialState.viewMode) setRightView(initialState.viewMode);
      setActiveOperation((initialState.activeOperation as OperationAction) ?? "format");
      if (typeof initialState.split === "number") setSplit(Math.max(20, Math.min(80, initialState.split)));
      sessionRestoredRef.current = true;
      return;
    }
    const toolParam = searchParams?.get("tool");
    if (pathname === "/playground" && toolParam && ALL_TOOL_ROUTES.includes(toolParam as ToolRoute)) {
      const preset = TOOL_PRESETS[toolParam as ToolRoute];
      if (preset) {
        if (preset.input) {
          setInput(preset.input);
          setUndoStack([preset.input]);
          setUndoIndex(0);
        }
        if (preset.inputFormatOverride) setInputFormatOverride(preset.inputFormatOverride);
        if (preset.convertToFormat && FORMAT_KINDS.includes(preset.convertToFormat))
          setConvertToFormat(preset.convertToFormat);
        if (preset.viewMode) {
          setRightView(preset.viewMode);
        }
        if (preset.activeOperation) setActiveOperation(preset.activeOperation as OperationAction);
        if (preset.outputLanguage) {
          const ol = preset.outputLanguage;
          if (["json", "xml", "yaml", "toml", "csv"].includes(ol)) {
            setOutputExt(EXT_BY_FORMAT[ol as FormatKind]);
            setOutputLanguage(ol as OutputLanguage);
          } else {
            const ext = TYPE_LANGUAGES.find((t) => t.id === ol)?.ext ?? "ts";
            setOutputExt(ext);
            setOutputLanguage(ol as OutputLanguage);
          }
        }
        if (preset.typeLanguage) setTypeLanguage(preset.typeLanguage as TypeTargetLanguage);
        if ("diffLeftInput" in preset && preset.diffLeftInput) setDiffLeftInput(preset.diffLeftInput);
        if ("diffRightInput" in preset && preset.diffRightInput) setDiffRightInput(preset.diffRightInput);
        if (preset.activeOperation === "diff") {
          setIsOutputMaximized(true);
          setRightView("raw");
          const dl = preset.diffLeftInput ?? "";
          const dr = preset.diffRightInput ?? "";
          if (dl.trim() || dr.trim()) {
            setTimeout(() => {
              executeOperation("diff", { leftText: dl, rightText: dr });
            }, 0);
          }
        }
        sessionRestoredRef.current = true;
        setLoadedToolPreset(toolParam as ToolRoute);
        return;
      }
    }
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    const shared = searchParams?.get("shared") === "1";
    const state = hash ? decodeState(hash) : null;
    if (state) {
      if (shared) isViewingSharedRef.current = true;
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
        if (state.outputLanguage) {
          const ol = state.outputLanguage;
          if (["json", "xml", "yaml", "toml", "csv"].includes(ol)) {
            setOutputExt(EXT_BY_FORMAT[ol as FormatKind]);
            setOutputLanguage(ol as OutputLanguage);
          } else {
            const ext = TYPE_LANGUAGES.find((t) => t.id === ol)?.ext ?? "ts";
            setOutputExt(ext);
            setOutputLanguage(ol as OutputLanguage);
          }
        } else if (state.outputFormat) {
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
        tabs?: Tab[];
        activeTabId?: string;
        tabCounter?: number;
        tabSnapshots?: Record<string, unknown>;
        showTabs?: boolean;
      };
    if (data.input) setInput(data.input);
    if (data.output) setOutput(cleanSessionOutput(data.output));
    if (typeof data.split === "number") setSplit(data.split);
    if (data.themeMode) setThemeMode(data.themeMode);
    if (data.typeLanguage) setTypeLanguage(data.typeLanguage);
    if (data.rightView) setRightView(data.rightView);
    if (data.convertToFormat) setConvertToFormat(data.convertToFormat);
    if (typeof data.editorFontSize === "number") setEditorFontSize(data.editorFontSize);
      if (typeof data.liveTransform === "boolean") setLiveTransform(data.liveTransform);
      if (typeof data.viewAsMenu === "boolean") setViewAsMenu(data.viewAsMenu);
      if (typeof data.mobileShowOutput === "boolean") setMobileShowOutput(data.mobileShowOutput);
      if (typeof data.showTabs === "boolean") setShowTabs(data.showTabs);
      if (data.activeOperation) setActiveOperation(data.activeOperation);
      if (Array.isArray(data.pinnedItems)) setPinnedItems(new Set(data.pinnedItems));
      // Restore tabs
      if (Array.isArray(data.tabs) && data.tabs.length > 0) {
        setTabs(data.tabs);
        if (typeof data.tabCounter === "number") tabCounterRef.current = data.tabCounter;
        if (data.activeTabId && data.tabs.some((t: Tab) => t.id === data.activeTabId)) {
          setActiveTabId(data.activeTabId);
        } else {
          setActiveTabId(data.tabs[0].id);
        }
        if (data.tabSnapshots && typeof data.tabSnapshots === "object") {
          const map = new Map<string, typeof tabSnapshotsRef extends React.MutableRefObject<Map<string, infer V>> ? V : never>();
          for (const [k, v] of Object.entries(data.tabSnapshots)) {
            if (v && typeof v === "object") {
              const snap = { ...(v as object) } as { output?: string };
              if (isStaleDiffOutput(snap.output)) snap.output = "";
              map.set(k, snap as typeof map extends Map<string, infer V> ? V : never);
            }
          }
          tabSnapshotsRef.current = map;
          const activeId =
            data.activeTabId && data.tabs.some((t: Tab) => t.id === data.activeTabId)
              ? data.activeTabId
              : data.tabs[0].id;
          const activeSnap = map.get(activeId) as TabSnapshot | undefined;
          if (activeSnap) {
            if (activeSnap.utilTab) setUtilTab(activeSnap.utilTab);
            if (activeSnap.utilsByTool) setUtilsByTool(activeSnap.utilsByTool);
            if (activeSnap.diffKind) setDiffKind(activeSnap.diffKind);
            if (typeof activeSnap.diffLeftInput === "string") setDiffLeftInput(activeSnap.diffLeftInput);
            if (typeof activeSnap.diffRightInput === "string") setDiffRightInput(activeSnap.diffRightInput);
          }
        }
      }
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
    // Restore-once effect: `initialState` may be a fresh object reference each render, so
    // it is intentionally not a dep — re-running would re-apply shared state and clobber
    // user edits. `executeOperation` is also referenced here (tool-preset restore).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]);

  useEffect(() => {
    if (isViewingSharedRef.current) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    // Build full tab snapshots for persistence: save current tab state too
    const allSnapshots: Record<string, unknown> = {};
    tabSnapshotsRef.current.forEach((snap, id) => { allSnapshots[id] = snap; });
    const persistOutput = cleanSessionOutput(output);
    // Overwrite current tab with live state
    allSnapshots[activeTabId] = {
      ...captureTabSnapshot(),
      undoStack: undoStack.slice(-20),
      undoIndex: Math.min(undoIndex, 19),
      output: persistOutput,
      parsedOutput: null,
      error: null,
    };
    localStorage.setItem(
      "formaty-session",
      JSON.stringify({
        input,
        output: persistOutput,
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
        tabs,
        activeTabId,
        showTabs,
        tabCounter: tabCounterRef.current,
        tabSnapshots: allSnapshots,
      }),
    );
  }, [input, output, split, themeMode, typeLanguage, rightView, formatOptions, convertToFormat, liveTransform, editorFontSize, viewAsMenu, mobileShowOutput, activeOperation, pinnedItems, tabs, activeTabId, showTabs, inputFormatOverride, undoStack, undoIndex, outputExt, outputLanguage, diffLeftInput, diffRightInput, diffKind, isOutputMaximized, utilTab, utilsByTool, captureTabSnapshot]);

  // Prefer structured parse for views (table/tree/graph/query)
  useEffect(() => {
    // While Compare/Utils own the main pane, keep transform parsed data intact
    if (isDiffMode || isUtilsMode) return;
    if (!output.trim()) {
      // Fall back to input so Table/Tree still work after Compare if output was empty
      if (input.trim()) {
        try {
          setParsedOutput(parseJsonInput(input));
          return;
        } catch {
          try {
            const fmt = detectFormat(input);
            if (fmt !== "curl") {
              setParsedOutput(parseInput(input, fmt) as JsonValue);
              return;
            }
          } catch {
            /* fall through */
          }
        }
      }
      setParsedOutput(null);
      return;
    }
    // Purge leftover path-diff notes still sitting in state / session
    if (isStaleDiffOutput(output)) {
      setOutput("");
      setParsedOutput(null);
      return;
    }
    let parsed: JsonValue | null = null;
    try {
      parsed = parseJsonInput(output);
    } catch {
      try {
        if (["xml", "yaml", "toml", "csv"].includes(outputLanguage)) {
          parsed = parseInput(output, outputLanguage as FormatKind) as JsonValue;
        }
      } catch {
        parsed = null;
      }
    }
    // Last resort: parse input (e.g. after tool switch left output empty)
    if (parsed == null && input.trim()) {
      try {
        parsed = parseJsonInput(input);
      } catch {
        try {
          const fmt = detectFormat(input);
          if (fmt !== "curl") parsed = parseInput(input, fmt) as JsonValue;
        } catch {
          parsed = null;
        }
      }
    }
    setParsedOutput(parsed);
  }, [output, outputLanguage, isDiffMode, isUtilsMode, input]);

  // Auto-select Table once when a new array-of-objects lands on default Raw view
  const lastAutoTableKeyRef = useRef("");
  useEffect(() => {
    if (isDiffMode || isUtilsMode || !parsedOutput) return;
    if (rightView !== "raw") return; // respect explicit view choices
    if (
      Array.isArray(parsedOutput) &&
      parsedOutput.length > 0 &&
      parsedOutput.every((x) => x !== null && typeof x === "object" && !Array.isArray(x))
    ) {
      const key = `${parsedOutput.length}:${Object.keys(parsedOutput[0] as object).slice(0, 8).join(",")}`;
      if (lastAutoTableKeyRef.current === key) return;
      lastAutoTableKeyRef.current = key;
      setRightView("table");
    }
  }, [parsedOutput, rightView, isDiffMode, isUtilsMode]);

  useEffect(() => {
    if (!sessionRestoredRef.current || !input.trim() || !activeOperation) return;
    sessionRestoredRef.current = false;
    if (activeOperation === "diff") return;
    const id = setTimeout(() => {
      if (activeOperation === "generateTypes") {
        executeOperation("generateTypes", { typeLanguage });
        return;
      }
      if (activeOperation === "format" || activeOperation === "beautify" || OPERATION_ACTIONS.some(([, a]) => a === activeOperation)) {
        if (activeOperation === "format" || activeOperation === "beautify") {
          runConvert(convertToFormat);
        } else {
          executeOperation(activeOperation);
        }
      }
    }, 500);
    return () => clearTimeout(id);
    // One-shot restore timer guarded by sessionRestoredRef. executeOperation / runConvert
    // are declared later in the component and intentionally not in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, output, activeOperation, convertToFormat, typeLanguage]);

  useEffect(() => {
    if (isViewingSharedRef.current) return;
    if ((rightView === "tree" || rightView === "graph" || rightView === "query" || rightView === "table") && !parsedOutput && !output.trim() && !input.trim()) {
      setRightView("raw");
    }
  }, [rightView, parsedOutput, output, input]);

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
      const currentFmt = detectFormat(currentInput);
      if (currentFmt === "curl") return;
      void run<JsonValue>("parseFormat", { input: currentInput, format: currentFmt })
        .then(async (json) => {
          const out = await convertJsonToOutput(json, { toFormat: convertToFormat });
          setOutput(out);
          setOutputExt(EXT_BY_FORMAT[convertToFormat]);
          setOutputLanguage(convertToFormat);
          setParsedOutput(json);
          // Keep Transform mode (don't clobber Compare/Utils)
          setActiveOperation((op) => (op === "diff" || op === "utils" ? op : null));
          if (
            Array.isArray(json) &&
            json.length > 0 &&
            json.every((x) => x !== null && typeof x === "object" && !Array.isArray(x))
          ) {
            setRightView("table");
          }
        })
        .catch(() => { /* validation shows invalid */ })
        .finally(() => setBusy(false));
    }, 400);
    return () => {
      if (liveTransformTimeoutRef.current) clearTimeout(liveTransformTimeoutRef.current);
    };
    // Debounced live transform reads the latest input via inputRef; convertJsonToOutput is
    // declared below and intentionally not in deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTransform, input, convertToFormat, run]);



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
    if (!isSplitResizing) return;
    const onMouseMove = (event: MouseEvent) => {
      const container = splitContainerInputRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const next = ((event.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(20, Math.min(80, Math.round(next))));
    };
    const onMouseUp = () => setIsSplitResizing(false);
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
  }, [isSplitResizing]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setModalKind(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalKind]);

  const setOutputData = useCallback((
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
  }, [typeLanguage, convertToFormat]);

  const convertJsonToOutput = useCallback(async (
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

    return run<string>("convert", { json, toFormat, formatOptions: formatOpts, csvDelimiter });
  }, [convertToFormat, formatOptions, run, csvDelimiter]);

  const parseOnly = useCallback((inputOverride?: string, formatOverride?: InputFormatKind) => {
    const text = inputOverride ?? input;
    const fmt = formatOverride ?? resolvedInputFormat;
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    setValidationError(null);
    void (async () => {
      try {
        let toParse = text;
        let parseFmt: FormatKind = fmt === "curl" ? "json" : fmt;
        if (fmt === "curl") {
          const cache = curlCacheRef.current;
          if (cache && cache.input === text) {
            toParse = cache.result;
          } else {
            const parsed = parseCurl(text);
            toParse = await executeCurl(parsed);
            curlCacheRef.current = { input: text, result: toParse };
          }
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
  }, [input, resolvedInputFormat, run, convertJsonToOutput, setOutputData, isDesktopLayout]);

  const executeOperation = useCallback((
    action: OperationAction,
    options?: {
      schemaText?: string;
      leftText?: string;
      rightText?: string;
      typeLanguage?: TypeTargetLanguage;
      formatOptions?: FormatOptions;
    },
  ) => {
    setBusy(true);
    setError(null);
    void (async () => {
      try {
        if (action === "diff") {
          // Visual diff + path stats live in Diff UI only — never overwrite the main output
          // panel (that left a leftover `{...}` path-diff JSON after exiting).
          setBusy(false);
          return;
        }

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

        if (action === "beautify" || action === "format") {
          const formatConfig = action === "beautify"
            ? { ...DEFAULT_FORMAT_OPTIONS, indentation: formatOptions.indentation }
            : (options?.formatOptions ?? formatOptions);
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

        if (action === "minify" && convertToFormat !== "json") {
          const out = await run<string>("convert", {
            json: left,
            toFormat: convertToFormat,
            formatOptions: { minify: true },
          });
          setOutputData(out, action);
          setParsedOutput(left);
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
  }, [getParsedInput, parseSchemaToObject, run, convertJsonToOutput, setOutputData, schemaInput, typeLanguage, formatOptions, convertToFormat]);

  const runConvert = useCallback((toFormat: FormatKind) => {
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
  }, [getParsedInput, convertJsonToOutput, isDesktopLayout]);

  const handleDiffLeftChange = useCallback(
    (value: string) => {
      setDiffLeftInput(value);
      if (diffDebounceRef.current) clearTimeout(diffDebounceRef.current);
      diffDebounceRef.current = setTimeout(() => {
        diffDebounceRef.current = null;
        executeOperation("diff", { leftText: value, rightText: diffRightInput });
      }, 400);
    },
    [diffRightInput, executeOperation],
  );

  const handleDiffRightChange = useCallback(
    (value: string) => {
      setDiffRightInput(value);
      if (diffDebounceRef.current) clearTimeout(diffDebounceRef.current);
      diffDebounceRef.current = setTimeout(() => {
        diffDebounceRef.current = null;
        executeOperation("diff", { leftText: diffLeftInput, rightText: value });
      }, 400);
    },
    [diffLeftInput, executeOperation],
  );

  const swapDiffSides = useCallback(() => {
    const left = diffEditorRef.current?.getOriginalValue() ?? diffLeftInput;
    const right = diffEditorRef.current?.getModifiedValue() ?? diffRightInput;
    setDiffLeftInput(right);
    setDiffRightInput(left);
    diffEditorRef.current?.setBoth(right, left);
    executeOperation("diff", { leftText: right, rightText: left });
    flashDiffAction("Swapped left ↔ right");
  }, [diffLeftInput, diffRightInput, executeOperation, flashDiffAction]);

  const beautifyDiffSides = useCallback(
    (side: "left" | "right" | "both") => {
      let left = diffEditorRef.current?.getOriginalValue() ?? diffLeftInput;
      let right = diffEditorRef.current?.getModifiedValue() ?? diffRightInput;
      let ok = false;
      try {
        if (side === "left" || side === "both") {
          if (left.trim()) {
            left = formatJson(JSON.parse(left) as JsonValue, { indentation: formatOptions.indentation });
            ok = true;
          }
        }
        if (side === "right" || side === "both") {
          if (right.trim()) {
            right = formatJson(JSON.parse(right) as JsonValue, { indentation: formatOptions.indentation });
            ok = true;
          }
        }
      } catch {
        flashDiffAction("Beautify needs valid JSON");
        return;
      }
      if (!ok) {
        flashDiffAction("Nothing to beautify");
        return;
      }
      setDiffLeftInput(left);
      setDiffRightInput(right);
      diffEditorRef.current?.setBoth(left, right);
      executeOperation("diff", { leftText: left, rightText: right });
      flashDiffAction(side === "both" ? "Beautified both sides" : `Beautified ${side}`);
    },
    [diffLeftInput, diffRightInput, executeOperation, flashDiffAction, formatOptions.indentation],
  );

  const copyDiffText = useCallback(
    async (which: "left" | "right" | "report" | "paths") => {
      try {
        let text = "";
        if (which === "left") text = diffEditorRef.current?.getOriginalValue() ?? diffLeftInput;
        else if (which === "right") text = diffEditorRef.current?.getModifiedValue() ?? diffRightInput;
        else if (which === "paths") {
          const summary = structuralDiff ?? emptyDiffSummary();
          text = JSON.stringify(summary.rows, null, 2);
        } else {
          text = formatDiffReport(
            diffEditorRef.current?.getOriginalValue() ?? diffLeftInput,
            diffEditorRef.current?.getModifiedValue() ?? diffRightInput,
            structuralDiff,
            diffLineStats ?? diffEditorRef.current?.getLineStats() ?? null,
          );
        }
        await navigator.clipboard.writeText(text);
        flashDiffAction(
          which === "left"
            ? "Left copied"
            : which === "right"
              ? "Right copied"
              : which === "paths"
                ? "Path changes copied"
                : "Diff report copied",
        );
      } catch {
        flashDiffAction("Copy failed");
      }
    },
    [diffLeftInput, diffRightInput, structuralDiff, diffLineStats, flashDiffAction],
  );

  const downloadDiffReport = useCallback(() => {
    const text = formatDiffReport(
      diffEditorRef.current?.getOriginalValue() ?? diffLeftInput,
      diffEditorRef.current?.getModifiedValue() ?? diffRightInput,
      structuralDiff,
      diffLineStats ?? diffEditorRef.current?.getLineStats() ?? null,
    );
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formaty-diff-report.json";
    a.click();
    URL.revokeObjectURL(url);
    flashDiffAction("Report downloaded");
  }, [diffLeftInput, diffRightInput, structuralDiff, diffLineStats, flashDiffAction]);

  const clearDiffSide = useCallback(
    (side: "left" | "right" | "both") => {
      const left = side === "right" ? (diffEditorRef.current?.getOriginalValue() ?? diffLeftInput) : "";
      const right = side === "left" ? (diffEditorRef.current?.getModifiedValue() ?? diffRightInput) : "";
      setDiffLeftInput(left);
      setDiffRightInput(right);
      diffEditorRef.current?.setBoth(left, right);
      executeOperation("diff", { leftText: left, rightText: right });
      flashDiffAction(side === "both" ? "Cleared both" : `Cleared ${side}`);
    },
    [diffLeftInput, diffRightInput, executeOperation, flashDiffAction],
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
    if (action === "utils") {
      if (activeOperation === "utils") {
        setActiveOperation(null);
        setIsOutputMaximized(false);
        return;
      }
      // Leave compare if open, then open utils full-width
      if (activeOperation === "diff") {
        const prev = prevBeforeDiffRef.current;
        prevBeforeDiffRef.current = null;
        if (prev) {
          setRightView(prev.rightView);
          const stale = isStaleDiffOutput(prev.output);
          if (stale) {
            setOutput("");
            setParsedOutput(null);
          } else {
            setOutput(prev.output);
            setParsedOutput(prev.parsedOutput);
          }
          setOutputExt(prev.outputExt);
          setOutputLanguage(prev.outputLanguage);
        }
      }
      setIsOutputMaximized(true);
      setActiveOperation("utils");
      setError(null);
      setBusy(false);
      return;
    }
    if (action === "diff") {
      if (activeOperation === "diff") {
        // Exit Compare → restore Transform layout/output; keep this tab's left/right for next Compare visit
        const prev = prevBeforeDiffRef.current;
        prevBeforeDiffRef.current = null;
        if (prev) {
          setRightView(prev.rightView);
          setIsOutputMaximized(prev.isOutputMaximized);
          const stale = isStaleDiffOutput(prev.output);
          if (stale) {
            setOutput("");
            setParsedOutput(null);
          } else {
            const restoredOut = prev.output || "";
            setOutput(restoredOut);
            let restoredParsed = prev.parsedOutput;
            if (restoredParsed == null) {
              const src = restoredOut.trim() || input.trim();
              if (src) {
                try {
                  restoredParsed = parseJsonInput(src);
                } catch {
                  try {
                    const fmt = detectFormat(src);
                    if (fmt !== "curl") restoredParsed = parseInput(src, fmt) as JsonValue;
                  } catch {
                    restoredParsed = null;
                  }
                }
              }
            }
            setParsedOutput(restoredParsed);
          }
          setOutputExt(prev.outputExt);
          setOutputLanguage(prev.outputLanguage);
          setActiveOperation(prev.activeOperation === "utils" ? null : prev.activeOperation);
        } else {
          setActiveOperation(null);
          setIsOutputMaximized(false);
          if (isStaleDiffOutput(output)) {
            setOutput("");
            setParsedOutput(null);
          } else if (parsedOutput == null && (output.trim() || input.trim())) {
            const src = output.trim() || input;
            try {
              setParsedOutput(parseJsonInput(src));
            } catch {
              /* keep */
            }
          }
        }
        return;
      }
      // Enter Compare — preserve Transform state; do not wipe existing compare panes
      if (activeOperation === "utils") {
        setActiveOperation(null);
      }
      const snapshotOutput = cleanSessionOutput(output);
      // Prefer live parsed data; re-parse input/output if needed so Table restores after exit
      let snapParsed = isStaleDiffOutput(output) ? null : parsedOutput;
      if (snapParsed == null) {
        const src = snapshotOutput.trim() || input.trim();
        if (src) {
          try {
            snapParsed = parseJsonInput(src);
          } catch {
            try {
              const fmt = detectFormat(src);
              if (fmt !== "curl") snapParsed = parseInput(src, fmt) as JsonValue;
            } catch {
              snapParsed = null;
            }
          }
        }
      }
      prevBeforeDiffRef.current = {
        rightView,
        activeOperation: activeOperation === "utils" ? null : activeOperation,
        isOutputMaximized: activeOperation === "utils" ? false : isOutputMaximized,
        output: snapshotOutput || (input.trim() ? input : ""),
        parsedOutput: snapParsed,
        outputExt,
        outputLanguage,
      };
      setIsOutputMaximized(true);
      // Keep rightView (e.g. table) in state — Compare renders when isDiffMode, independent of view
      setActiveOperation("diff");
      setError(null);
      setDiffLineStats(null);
      setDiffNav({ current: 0, total: 0 });
      setDiffPathFilter("all");
      // Only seed from transform input when both compare panes are empty (new session / tab)
      if (!diffLeftInput.trim() && !diffRightInput.trim() && input.trim()) {
        setDiffLeftInput(input);
        setDiffRightInput("");
      }
      setBusy(false);
      return;
    }
    // Transform ops leave Utils
    if (activeOperation === "utils") {
      setIsOutputMaximized(false);
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
          setShareNotification("Downloaded");
          window.setTimeout(() => setShareNotification(null), 3000);
        } catch (e) {
          console.warn("Graph download failed:", e);
          setShareNotification("Download failed");
          window.setTimeout(() => setShareNotification(null), 3000);
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
    setShareNotification("Downloaded");
    window.setTimeout(() => setShareNotification(null), 3000);
    setDownloadMenuOpen(false);
  };

  const requestShare = () => {
    // Updating an existing share still re-uploads payload — always confirm once per open.
    setShareConfirmOpen(true);
  };

  const shareWorkspace = async () => {
    setShareConfirmOpen(false);
    setActionBounce("share");
    setTimeout(() => setActionBounce(null), 300);
    // Flush active tab into snapshot map before packaging multi-tab share
    tabSnapshotsRef.current.set(activeTabId, captureTabSnapshot());
    const includeAllTabs = shareAllTabs && showTabs && tabs.length > 1;
    const workspaceState: import("@/lib/shareState").WorkspaceState & {
      tabs?: Tab[];
      activeTabId?: string;
      showTabs?: boolean;
      tabSnapshots?: Record<string, TabSnapshot>;
      diffLeftInput?: string;
      diffRightInput?: string;
      diffKind?: "document" | "list";
      utilTab?: UtilTab;
    } = {
      input,
      convertToFormat,
      liveTransform,
      output: cleanSessionOutput(output),
      outputFormat: ["json", "xml", "yaml", "toml", "csv"].includes(outputLanguage) ? (outputLanguage as FormatKind) : undefined,
      outputLanguage: outputLanguage as import("@/lib/shareState").OutputDisplayKind,
      typeLanguage,
      viewMode: rightView,
      split,
      activeOperation:
        activeOperation === "diff" || activeOperation === "utils" || activeOperation === null
          ? undefined
          : (activeOperation as import("@/lib/shareState").OperationAction),
      diffLeftInput,
      diffRightInput,
      diffKind,
      utilTab,
    };
    if (includeAllTabs) {
      const all: Record<string, TabSnapshot> = {};
      tabSnapshotsRef.current.forEach((snap, id) => {
        all[id] = {
          ...snap,
          output: cleanSessionOutput(snap.output),
          parsedOutput: snap.parsedOutput,
        };
      });
      workspaceState.tabs = tabs;
      workspaceState.activeTabId = activeTabId;
      workspaceState.showTabs = true;
      workspaceState.tabSnapshots = all;
    }
    let id: string | null = null;
    if (sharedLinkId) {
      const ok = await updatePlayground(sharedLinkId, workspaceState);
      if (ok) id = sharedLinkId;
    }
    if (!id) {
      const apiResult = await savePlayground(workspaceState);
      id = apiResult?.id ?? null;
    }
    const url =
      id && typeof window !== "undefined"
        ? `${window.location.origin}/playground?id=${id}`
        : `${typeof window !== "undefined" ? window.location.origin + window.location.pathname : ""}#${encodeState(workspaceState)}`;
    if (id) {
      setSharedLinkId(id);
      setSharedLinkUrl(url);
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState("done");
      setShareNotification(
        includeAllTabs
          ? `Link copied (${tabs.length} tabs)`
          : url,
      );
      window.setTimeout(() => setShareNotification(null), 4000);
    } catch {
      setShareState("error");
    }
    window.setTimeout(() => setShareState("idle"), 1400);
  };

  const useOutputAsInput = useCallback(() => {
    if (!output.trim()) return;
    setInput(output);
    pushHistory(output);
    setInputFormatOverride(null);
    setError(null);
    setValidationError(null);
    setFocusedPane("input");
    setRightView("raw");
    setActiveOperation(null);
    setShareNotification("Output moved to input");
    window.setTimeout(() => setShareNotification(null), 2500);
    if (!isDesktopLayout) setMobileShowOutput(false);
  }, [output, isDesktopLayout, pushHistory]);

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
        setShareNotification("Copied");
        window.setTimeout(() => setShareNotification(null), 3000);
      } catch {
        setCopyState("error");
        setShareNotification("Copy failed");
        window.setTimeout(() => setShareNotification(null), 3000);
      }
      window.setTimeout(() => setCopyState("idle"), 1400);
      return;
    }
    if (!output.trim()) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopyState("done");
      setShareNotification("Copied");
      window.setTimeout(() => setShareNotification(null), 3000);
    } catch {
      setCopyState("error");
      setShareNotification("Copy failed");
      window.setTimeout(() => setShareNotification(null), 3000);
    }
    window.setTimeout(() => setCopyState("idle"), 1400);
  };

  const getActiveOutputText = useCallback((): string => {
    if (isUtilsMode) {
      const s = utilsByTool[utilTab];
      if (s?.uuidList && s.uuidList.length > 0) return s.uuidList.join("\n");
      return s?.output ?? "";
    }
    if (isDiffMode) {
      if (diffKind === "list") return listCompareExport?.text ?? "";
      try {
        const left = diffEditorRef.current?.getOriginalValue() ?? diffLeftInput;
        const right = diffEditorRef.current?.getModifiedValue() ?? diffRightInput;
        return formatDiffReport(
          left,
          right,
          structuralDiff ?? summarizeDiffFromText(left, right),
          diffLineStats ?? diffEditorRef.current?.getLineStats() ?? null,
        );
      } catch {
        return diffRightInput || diffLeftInput;
      }
    }
    return output;
  }, [
    isUtilsMode,
    isDiffMode,
    utilTab,
    utilsByTool,
    diffKind,
    listCompareExport,
    diffLeftInput,
    diffRightInput,
    structuralDiff,
    diffLineStats,
    output,
  ]);

  const copyOutputAs = async (format: CopyAsFormat) => {
    const raw = getActiveOutputText();
    if (!raw.trim()) return;
    try {
      const text = formatCopyAsText(raw, format);
      await navigator.clipboard.writeText(text);
      setShareNotification("Copied");
    } catch {
      setShareNotification("Copy failed");
    }
    window.setTimeout(() => setShareNotification(null), 3000);
  };

  const handleWorkspaceReset = useCallback(() => {
    if (isUtilsMode) {
      setUtilsByTool((prev) => ({
        ...prev,
        [utilTab]: {
          ...defaultUtilToolState(utilTab),
          input: "",
          output: "",
          uuidList: [],
          touched: true,
        },
      }));
      setShareNotification("Reset");
      window.setTimeout(() => setShareNotification(null), 1500);
      return;
    }
    if (isDiffMode) {
      if (diffKind === "list") {
        setDiffLeftInput("");
        setDiffRightInput("");
        setListCompareExport(null);
      } else {
        clearDiffSide("both");
      }
      setShareNotification("Reset");
      window.setTimeout(() => setShareNotification(null), 1500);
      return;
    }
    setInput("");
    setOutput("");
    setParsedOutput(null);
    setError(null);
    setValidationError(null);
    setActiveOperation(null);
    setCopyState("idle");
    setSharedLinkId(null);
    setSharedLinkUrl(null);
    isViewingSharedRef.current = false;
    if (pathname === "/playground" && searchParams?.get("id")) router.replace("/playground");
    setShareNotification("Reset");
    window.setTimeout(() => setShareNotification(null), 1500);
  }, [
    isUtilsMode,
    isDiffMode,
    utilTab,
    diffKind,
    clearDiffSide,
    pathname,
    searchParams,
    router,
  ]);

  const activeCopyAsOptions = useMemo(() => {
    if (isUtilsMode && utilTab === "uuid") return UUID_COPY_AS_OPTIONS;
    if (isUtilsMode) return [...DEFAULT_COPY_AS_OPTIONS, ...UUID_COPY_AS_OPTIONS.filter((o) => o.id === "newline" || o.id === "comma")];
    if (isDiffMode && diffKind === "list") return LIST_COPY_AS_OPTIONS;
    return DEFAULT_COPY_AS_OPTIONS;
  }, [isUtilsMode, utilTab, isDiffMode, diffKind]);

  const exportHistory = () => {
    const entries = undoStack.slice(0, undoIndex + 1).map((content, i) => ({ index: i, content }));
    const data = JSON.stringify(entries, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formaty-history.json";
    a.click();
    URL.revokeObjectURL(url);
    setShareNotification("History exported");
    window.setTimeout(() => setShareNotification(null), 3000);
  };


  const applyFormatWithOptions = (next: FormatOptions) => {
    // Always persist prefs; never kick out of Compare for a settings tweak
    setFormatOptions(next);
    if (activeOperation === "diff") return;
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

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      if (activeOperation === "diff" && diffEditorRef.current) {
        diffEditorRef.current.pasteIntoFocusedEditor(text);
        return;
      }
      const fmt = detectFormat(text);
      let finalText = text;
      if (autoFormatOnPaste && text.trim() && fmt !== "curl") {
        try {
          const json = await run<JsonValue>("parseFormat", { input: text, format: fmt });
          finalText = await convertJsonToOutput(json, { toFormat: fmt as FormatKind });
        } catch {
          finalText = text;
        }
      }
      setInput(finalText);
      pushHistory(finalText);
      setInputFormatOverride(null);
      setError(null);
      setValidationError(null);
      parseOnly(finalText, fmt);
      setFocusedPane("output");
      if (!isDesktopLayout) setMobileShowOutput(true);
    } catch {
      setError("Could not read clipboard.");
    }
  }, [activeOperation, autoFormatOnPaste, run, convertJsonToOutput, pushHistory, parseOnly, isDesktopLayout]);

  // Global workspace keyboard shortcuts (Cmd/Ctrl + K / Enter / V / Z). Re-registers
  // whenever the handlers or their state change so the closure is always fresh.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      if (event.key === "k") {
        event.preventDefault();
        setCommandPaletteOpen((v) => !v);
        return;
      }
      if (modalKind) return;
      if (activeOperation === "diff") {
        // List mode uses plain textareas — let the browser handle undo/paste.
        if (diffKind === "list") return;
        // Document mode: route undo/redo to Monaco diff panes.
        if (event.key.toLowerCase() === "z" && !event.shiftKey) {
          event.preventDefault();
          diffEditorRef.current?.undo();
          return;
        }
        if (event.key.toLowerCase() === "z" && event.shiftKey) {
          event.preventDefault();
          diffEditorRef.current?.redo();
          return;
        }
        if (event.key.toLowerCase() === "y") {
          event.preventDefault();
          diffEditorRef.current?.redo();
          return;
        }
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        parseOnly();
      }
      if (event.key.toLowerCase() === "v") {
        const target = event.target as HTMLElement;
        const isEditable = target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA";
        // Only intercept when input is empty (paste to start) - when input has content, let editor handle paste at cursor
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
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [modalKind, inputEmpty, focusedPane, activeOperation, diffKind, moveHistory, parseOnly, pasteFromClipboard]);

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

  const commandPaletteCommands = useMemo((): Command[] => [
    // Operations / Actions
    { id: "op-beautify",   label: "Beautify",              category: "Actions", keywords: ["format", "pretty", "indent"], disabled: inputEmpty || showBusy, action: () => runOperation("beautify") },
    { id: "op-minify",    label: "Minify",               category: "Actions", keywords: ["compress", "compact"], disabled: inputEmpty || showBusy, action: () => runOperation("minify") },
    { id: "op-flatten",   label: "Flatten",              category: "Actions", keywords: ["dot", "nested"], disabled: inputEmpty || showBusy, action: () => runOperation("flatten") },
    { id: "op-unflatten", label: "Unflatten",            category: "Actions", keywords: ["nested", "expand"], disabled: inputEmpty || showBusy, action: () => runOperation("unflatten") },
    { id: "op-schema",    label: "Generate JSON Schema", category: "Actions", keywords: ["schema", "types", "infer"], disabled: inputEmpty || showBusy, action: () => runOperation("schema") },
    { id: "op-validate",  label: "Validate against Schema", category: "Actions", keywords: ["validate", "check"], disabled: inputEmpty || showBusy, action: () => runOperation("validate") },
    { id: "tool-transform", label: "Tool: Transform", category: "Workspace", keywords: ["format", "convert", "tool"], badge: !isDiffMode && !isUtilsMode ? "active" : undefined, action: () => { if (isDiffMode) runOperation("diff"); else if (isUtilsMode) runOperation("utils"); } },
    { id: "tool-compare",   label: isDiffMode ? "Tool: Compare (active)" : "Tool: Compare", category: "Workspace", keywords: ["diff", "compare", "list", "document", "tool"], badge: isDiffMode ? "active" : undefined, action: () => { if (!isDiffMode) runOperation("diff"); } },
    { id: "tool-utils",     label: isUtilsMode ? "Tool: Utils (active)" : "Tool: Utils", category: "Workspace", keywords: ["uuid", "base64", "jwt", "hash", "generator", "util", "password", "hex"], badge: isUtilsMode ? "active" : undefined, action: () => { if (!isUtilsMode) runOperation("utils"); } },
    ...UTIL_TABS.map((t) => ({
      id: `util-${t.id}`,
      label: `Utils: ${t.label}`,
      category: "Utils" as const,
      keywords: [t.id, t.label.toLowerCase(), "utils", "devtools"],
      badge: isUtilsMode && utilTab === t.id ? "active" : undefined,
      action: () => {
        if (!isUtilsMode) runOperation("utils");
        setUtilTab(t.id);
      },
    })),
    { id: "op-diff",        label: isDiffMode ? "Exit Compare mode" : "Open Compare", category: "Workspace", keywords: ["diff", "compare", "delta"], disabled: showBusy, action: () => runOperation("diff") },
    // Convert to
    { id: "fmt-json",  label: "Convert to JSON",  category: "Convert to", keywords: ["json"],  badge: convertToFormat === "json"  ? "active" : undefined, disabled: inputEmpty, action: () => { setFocusedPane("output"); runConvert("json");  } },
    { id: "fmt-yaml",  label: "Convert to YAML",  category: "Convert to", keywords: ["yaml"],  badge: convertToFormat === "yaml"  ? "active" : undefined, disabled: inputEmpty, action: () => { setFocusedPane("output"); runConvert("yaml");  } },
    { id: "fmt-xml",   label: "Convert to XML",   category: "Convert to", keywords: ["xml"],   badge: convertToFormat === "xml"   ? "active" : undefined, disabled: inputEmpty, action: () => { setFocusedPane("output"); runConvert("xml");   } },
    { id: "fmt-toml",  label: "Convert to TOML",  category: "Convert to", keywords: ["toml"],  badge: convertToFormat === "toml"  ? "active" : undefined, disabled: inputEmpty, action: () => { setFocusedPane("output"); runConvert("toml");  } },
    { id: "fmt-csv",   label: "Convert to CSV",   category: "Convert to", keywords: ["csv"],   badge: convertToFormat === "csv"   ? "active" : undefined, disabled: inputEmpty, action: () => { setFocusedPane("output"); runConvert("csv");   } },
    // View as
    { id: "view-raw",   label: "View: Raw",   category: "View as", badge: rightView === "raw"   ? "active" : undefined, disabled: false, action: () => { setRightView("raw");   setFocusedPane("output"); } },
    { id: "view-tree",  label: "View: Tree",  category: "View as", badge: rightView === "tree"  ? "active" : undefined, disabled: !parsedOutput, action: () => { setRightView("tree");  setFocusedPane("output"); } },
    { id: "view-graph", label: "View: Graph", category: "View as", badge: rightView === "graph" ? "active" : undefined, disabled: !parsedOutput, action: () => { setRightView("graph"); setFocusedPane("output"); } },
    { id: "view-query", label: "View: Query (JSONPath / JMESPath)", category: "View as", keywords: ["query", "jsonpath", "jmespath", "filter"], badge: rightView === "query" ? "active" : undefined, disabled: !parsedOutput, action: () => { setRightView("query"); setFocusedPane("output"); } },
    { id: "view-table", label: "View: Table", category: "View as", keywords: ["table", "grid", "rows"], badge: rightView === "table" ? "active" : undefined, disabled: !parsedOutput, action: () => { setRightView("table"); setFocusedPane("output"); } },
    // Generate Types
    ...TYPE_LANGUAGES.map((t) => ({
      id: `type-${t.id}`,
      label: `Generate ${t.label} types`,
      category: "Generate Types",
      keywords: [t.id, t.label, "types", "interface", "struct"],
      badge: activeOperation === "generateTypes" && typeLanguage === t.id ? "active" : undefined,
      disabled: inputEmpty,
      action: () => { setFocusedPane("output"); setActiveOperation("generateTypes"); executeOperation("generateTypes", { typeLanguage: t.id }); },
    })),
    // Samples
    ...FORMAT_KINDS.map((fmt) => ({
      id: `sample-${fmt}`,
      label: `Load ${FORMAT_LABELS[fmt]} sample`,
      category: "Samples",
      keywords: [fmt, "sample", "example", "demo"],
      disabled: false,
      action: () => {
        const sample = SAMPLES[fmt];
        setInput(sample);
        pushHistory(sample);
        setInputFormatOverride(null);
        setError(null);
        setValidationError(null);
        parseOnly(sample, fmt);
        setFocusedPane("output");
        if (!isDesktopLayout) setMobileShowOutput(true);
      },
    })),
    {
      id: "sample-table",
      label: "Load Table sample (array of objects)",
      category: "Samples",
      keywords: ["table", "array", "rows", "sample", "grid"],
      disabled: false,
      action: () => {
        setInput(SAMPLE_JSON_TABLE);
        pushHistory(SAMPLE_JSON_TABLE);
        setInputFormatOverride(null);
        setError(null);
        setValidationError(null);
        parseOnly(SAMPLE_JSON_TABLE, "json");
        setRightView("table");
        setFocusedPane("output");
        if (!isDesktopLayout) setMobileShowOutput(true);
      },
    },
    ...EXAMPLES.map((ex) => ({
      id: `example-${ex.id}`,
      label: `Load example: ${ex.label}`,
      category: "Samples",
      keywords: [ex.id, ex.label.toLowerCase(), "example", "demo"],
      disabled: false,
      action: () => {
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
      },
    })),
    // Workspace
    { id: "ws-paste",    label: "Paste from clipboard",  category: "Workspace", shortcut: "⌘V", disabled: false, action: pasteFromClipboard },
    { id: "ws-import",   label: "Import file",           category: "Workspace", keywords: ["upload", "open", "file"], disabled: false, action: () => document.getElementById("import-json-file")?.click() },
    { id: "ws-copy",     label: "Copy output",           category: "Workspace", shortcut: "⌘C", keywords: ["clipboard"], disabled: !output.trim(), action: copyOutput },
    { id: "ws-copy-b64", label: "Copy as Base64",        category: "Workspace", keywords: ["base64", "encode", "clipboard"], disabled: !output.trim(), action: () => copyOutputAs("base64") },
    { id: "ws-copy-esc", label: "Copy as Escaped string", category: "Workspace", keywords: ["escaped", "string", "json string"], disabled: !output.trim(), action: () => copyOutputAs("escaped") },
    { id: "ws-copy-uri", label: "Copy as URL-encoded",   category: "Workspace", keywords: ["url", "encoded", "percent", "uri"], disabled: !output.trim(), action: () => copyOutputAs("uri") },
    { id: "ws-copy-dat", label: "Copy as Data URI",      category: "Workspace", keywords: ["data", "uri", "base64"], disabled: !output.trim(), action: () => copyOutputAs("datauri") },
    { id: "ws-download", label: "Download output",       category: "Workspace", keywords: ["save", "export"], disabled: !output.trim(), action: () => downloadOutput() },
    { id: "ws-share",    label: "Share workspace link",  category: "Workspace", keywords: ["link", "url"], disabled: !output.trim(), action: requestShare },
    { id: "ws-use-output", label: "Use output as input", category: "Workspace", keywords: ["chain", "promote", "swap"], disabled: !output.trim(), action: useOutputAsInput },
    ...(sharedLinkUrl ? [{ id: "ws-embed", label: "Copy embed / iframe URL", category: "Workspace" as const, keywords: ["embed", "iframe", "share"], disabled: false, action: async () => { await navigator.clipboard.writeText(`${sharedLinkUrl}&embed=1`); setShareNotification("Embed URL copied"); window.setTimeout(() => setShareNotification(null), 3000); } }] : []),
    { id: "ws-clear",    label: "Clear workspace",       category: "Workspace", keywords: ["reset", "new", "empty"], disabled: inputEmpty && !output.trim(), action: () => {
      setInput(""); setOutput(""); setParsedOutput(null); setError(null);
      setValidationError(null); setActiveOperation(null); setCopyState("idle");
      setSharedLinkId(null); setSharedLinkUrl(null); isViewingSharedRef.current = false;
      if (pathname === "/playground" && searchParams?.get("id")) router.replace("/playground");
      if (!isDesktopLayout) setMobileShowOutput(true);
    } },
    // Focus
    { id: "focus-input",  label: "Focus input pane",  category: "Workspace", keywords: ["focus", "input", "left", "editor"], action: () => { setFocusedPane("input"); inputEditorApiRef.current?.focus(); } },
    { id: "focus-output", label: "Focus output pane", category: "Workspace", keywords: ["focus", "output", "right", "editor"], action: () => { setFocusedPane("output"); outputEditorApiRef.current?.focus(); } },
    { id: "search-output", label: "Find in output",   category: "Workspace", keywords: ["find", "search", "output", "ctrl+f"], disabled: !output.trim(), action: () => { setFocusedPane("output"); setTimeout(() => outputEditorApiRef.current?.find(), 50); } },
    // History
    { id: "hist-undo",   label: "Undo input",    category: "Workspace", shortcut: "⌘Z", keywords: ["undo", "history", "back"], disabled: !canUndo, action: () => moveHistory(-1) },
    { id: "hist-redo",   label: "Redo input",    category: "Workspace", shortcut: "⌘⇧Z", keywords: ["redo", "history", "forward"], disabled: !canRedo, action: () => moveHistory(1) },
    { id: "hist-browse", label: "Browse input history", category: "Workspace", keywords: ["history", "undo", "stack", "timeline"], action: () => setShowHistoryPanel(true) },
    { id: "hist-export", label: "Export history",       category: "Workspace", keywords: ["history", "export", "download", "all"], disabled: undoStack.length <= 1, action: exportHistory },
    // Zoom / font size
    { id: "zoom-in",    label: `Zoom in (font ${Math.min(24, editorFontSize + 1)}px)`,  category: "Workspace", keywords: ["zoom", "font", "size", "bigger", "larger"],  disabled: editorFontSize >= 24, action: () => setEditorFontSize((s) => Math.min(24, s + 1)) },
    { id: "zoom-out",   label: `Zoom out (font ${Math.max(10, editorFontSize - 1)}px)`, category: "Workspace", keywords: ["zoom", "font", "size", "smaller"],              disabled: editorFontSize <= 10, action: () => setEditorFontSize((s) => Math.max(10, s - 1)) },
    { id: "zoom-reset", label: "Reset zoom (14px)",                                     category: "Workspace", keywords: ["zoom", "font", "size", "reset"],              disabled: editorFontSize === 14, action: () => setEditorFontSize(14) },
    { id: "line-wrap",  label: lineWrap ? "Line wrap: On (turn off)" : "Line wrap: Off (turn on)", category: "Workspace", keywords: ["wrap", "line", "long", "scroll"], badge: lineWrap ? "on" : undefined, action: () => setLineWrap((v) => !v) },
    { id: "fullscreen",        label: isOutputMaximized ? "Restore output pane" : "Maximize output pane",    category: "Workspace", keywords: ["maximize", "expand", "output", "pane"],                          action: () => setIsOutputMaximized((v) => !v) },
    { id: "window-fullscreen", label: isWindowFullscreen ? "Exit fullscreen" : "Enter fullscreen",          category: "Workspace", keywords: ["fullscreen", "full screen", "window", "expand", "maximize"], action: toggleWindowFullscreen },
    // Diff
    { id: "diff-prev",      label: "Previous difference",    category: "Workspace", keywords: ["diff", "prev", "previous", "change", "navigate"], disabled: activeOperation !== "diff", action: () => diffEditorRef.current?.prevChange() },
    { id: "diff-next",      label: "Next difference",        category: "Workspace", keywords: ["diff", "next", "change", "navigate"], disabled: activeOperation !== "diff", action: () => diffEditorRef.current?.nextChange() },
    { id: "diff-layout",    label: diffSideBySide ? "Diff: Switch to inline view" : "Diff: Switch to side-by-side view", category: "Workspace", keywords: ["diff", "inline", "side by side", "layout"], disabled: activeOperation !== "diff", action: () => setDiffSideBySide((v) => !v) },
    { id: "diff-swap",      label: "Diff: Swap left and right", category: "Workspace", keywords: ["diff", "swap", "exchange", "sides"], disabled: activeOperation !== "diff", action: swapDiffSides },
    { id: "diff-ws",        label: diffIgnoreWhitespace ? "Diff: Respect whitespace" : "Diff: Ignore trim whitespace", category: "Workspace", keywords: ["diff", "whitespace", "trim", "ignore"], disabled: activeOperation !== "diff", action: () => setDiffIgnoreWhitespace((v) => !v) },
    { id: "diff-paths",     label: diffShowPaths ? "Diff: Hide path list" : "Diff: Show path list", category: "Workspace", keywords: ["diff", "paths", "structural", "keys", "list"], disabled: activeOperation !== "diff", action: () => setDiffShowPaths((v) => !v) },
    { id: "diff-beautify",  label: "Diff: Beautify both sides", category: "Workspace", keywords: ["diff", "beautify", "pretty", "format"], disabled: activeOperation !== "diff", action: () => beautifyDiffSides("both") },
    { id: "diff-copy-left", label: "Diff: Copy left", category: "Workspace", keywords: ["diff", "copy", "left", "original"], disabled: activeOperation !== "diff", action: () => void copyDiffText("left") },
    { id: "diff-copy-right",label: "Diff: Copy right", category: "Workspace", keywords: ["diff", "copy", "right", "modified"], disabled: activeOperation !== "diff", action: () => void copyDiffText("right") },
    { id: "diff-copy-report", label: "Diff: Copy full report", category: "Workspace", keywords: ["diff", "copy", "report", "export", "summary"], disabled: activeOperation !== "diff", action: () => void copyDiffText("report") },
    { id: "diff-download",  label: "Diff: Download report", category: "Workspace", keywords: ["diff", "download", "export", "report", "json"], disabled: activeOperation !== "diff" || diffKind !== "document", action: downloadDiffReport },
    { id: "diff-kind-doc",  label: "Diff: Document mode (text/JSON)", category: "Workspace", keywords: ["diff", "document", "text", "json", "monaco"], disabled: activeOperation !== "diff", action: () => setDiffKind("document") },
    { id: "diff-kind-list", label: "Diff: List / set mode (SQL IN)", category: "Workspace", keywords: ["diff", "list", "set", "common", "sql", "in", "intersection", "compare lists"], disabled: activeOperation !== "diff", action: () => setDiffKind("list") },
    // New operations
    { id: "op-sort-arrays", label: "Sort array items",         category: "Actions", keywords: ["sort", "arrays", "items", "order"], disabled: inputEmpty || showBusy, action: () => { setFocusedPane("output"); runOperation("sortArrays"); } },
    { id: "op-dedup",       label: "Remove duplicate items",   category: "Actions", keywords: ["dedup", "duplicate", "unique", "array"], disabled: inputEmpty || showBusy, action: () => { setFocusedPane("output"); runOperation("dedup"); } },
    // CSV delimiter settings
    { id: "csv-comma",     label: "CSV delimiter: Comma (,)",     category: "Settings", keywords: ["csv", "delimiter", "comma"], badge: csvDelimiter === ","  ? "active" : undefined, action: () => setCsvDelimiter(",")  },
    { id: "csv-tab",       label: "CSV delimiter: Tab (TSV)",     category: "Settings", keywords: ["csv", "delimiter", "tab", "tsv"], badge: csvDelimiter === "\t" ? "active" : undefined, action: () => setCsvDelimiter("\t") },
    { id: "csv-semicolon", label: "CSV delimiter: Semicolon (;)", category: "Settings", keywords: ["csv", "delimiter", "semicolon"], badge: csvDelimiter === ";"  ? "active" : undefined, action: () => setCsvDelimiter(";")  },
    { id: "csv-pipe",      label: "CSV delimiter: Pipe (|)",      category: "Settings", keywords: ["csv", "delimiter", "pipe"], badge: csvDelimiter === "|"  ? "active" : undefined, action: () => setCsvDelimiter("|")  },
    // Pin/Unpin current view
    { id: "pin-view",   label: pinnedItems.has(`view:${rightView}`) ? `Unpin current view (${rightView})` : `Pin current view (${rightView})`, category: "Settings", keywords: ["pin", "unpin", "toolbar", "view"], action: () => setPinnedItems((s) => { const n = new Set(s); if (n.has(`view:${rightView}`)) n.delete(`view:${rightView}`); else n.add(`view:${rightView}`); return n; }) },
    { id: "pin-format", label: pinnedItems.has(`fmt:${convertToFormat}`) ? `Unpin current format (${convertToFormat})` : `Pin current format (${convertToFormat})`, category: "Settings", keywords: ["pin", "unpin", "toolbar", "format"], action: () => setPinnedItems((s) => { const n = new Set(s); if (n.has(`fmt:${convertToFormat}`)) n.delete(`fmt:${convertToFormat}`); else n.add(`fmt:${convertToFormat}`); return n; }) },
    // Settings
    { id: "set-sort-keys",    label: formatOptions.sortKeys    ? "Sort keys: On (turn off)"    : "Sort keys: Off (turn on)",    category: "Settings", keywords: ["sort", "keys", "alphabetical"],           badge: formatOptions.sortKeys    ? "on" : undefined, disabled: inputEmpty, action: () => applyFormatWithOptions({ ...formatOptions, sortKeys:    !formatOptions.sortKeys    }) },
    { id: "set-rm-empty",     label: formatOptions.removeEmpty ? "Remove empty: On (turn off)" : "Remove empty: Off (turn on)", category: "Settings", keywords: ["remove", "empty", "null", "clean"],          badge: formatOptions.removeEmpty ? "on" : undefined, disabled: inputEmpty, action: () => applyFormatWithOptions({ ...formatOptions, removeEmpty: !formatOptions.removeEmpty }) },
    { id: "set-quote-double", label: "Quote style: Double",   category: "Settings", keywords: ["quote", "double"],     badge: formatOptions.quoteStyle === "double" ? "active" : undefined, disabled: inputEmpty, action: () => applyFormatWithOptions({ ...formatOptions, quoteStyle: "double" }) },
    { id: "set-quote-single", label: "Quote style: Single",   category: "Settings", keywords: ["quote", "single"],     badge: formatOptions.quoteStyle === "single" ? "active" : undefined, disabled: inputEmpty, action: () => applyFormatWithOptions({ ...formatOptions, quoteStyle: "single" }) },
    { id: "set-indent-inc",   label: `Indent: increase (${Math.min(10, formatOptions.indentation + 1)})`, category: "Settings", keywords: ["indent", "spaces"], disabled: inputEmpty || formatOptions.indentation >= 10, action: () => applyFormatWithOptions({ ...formatOptions, indentation: Math.min(10, formatOptions.indentation + 1) }) },
    { id: "set-indent-dec",   label: `Indent: decrease (${Math.max(0,  formatOptions.indentation - 1)})`, category: "Settings", keywords: ["indent", "spaces"], disabled: inputEmpty || formatOptions.indentation <= 0,  action: () => applyFormatWithOptions({ ...formatOptions, indentation: Math.max(0,  formatOptions.indentation - 1) }) },
    { id: "set-indent-reset", label: "Indent: reset to 2",     category: "Settings", keywords: ["indent", "spaces", "reset"], disabled: inputEmpty || formatOptions.indentation === 2, action: () => applyFormatWithOptions({ ...formatOptions, indentation: 2 }) },
    { id: "set-live",         label: liveTransform ? "Live transform: On (turn off)" : "Live transform: Off (turn on)", category: "Settings", keywords: ["live", "auto", "realtime", "transform"], badge: liveTransform ? "on" : undefined, action: () => setLiveTransform((v) => !v) },
    { id: "set-viewasmenu",   label: viewAsMenu ? "Compact menus: On" : "Compact menus: Off (pinned toolbar)", category: "Settings", keywords: ["menu", "view", "panel", "sidebar"], badge: viewAsMenu ? "on" : undefined, action: () => setViewAsMenu((v) => !v) },
    { id: "set-reset",        label: "Reset all settings to default", category: "Settings", keywords: ["reset", "default", "restore"], action: () => { setFormatOptions(DEFAULT_FORMAT_OPTIONS); setConvertToFormat("json"); setRightView("raw"); setEditorFontSize(13); setPinnedItems(new Set(["fmt:json", "fmt:xml", "view:raw", "view:graph", "view:query", "action:beautify", "action:minify", "action:schema", "action:diff", "type:typescript", "type:java", "type:go", "type:python", "type:sql"])); } },
    // Theme
    { id: "theme-light",  label: "Theme: Light",  category: "Theme", badge: themeMode === "light"  ? "active" : undefined, action: () => setThemeMode("light")  },
    { id: "theme-dark",   label: "Theme: Dark",   category: "Theme", badge: themeMode === "dark"   ? "active" : undefined, action: () => setThemeMode("dark")   },
    { id: "theme-system", label: "Theme: System", category: "Theme", badge: themeMode === "system" ? "active" : undefined, action: () => setThemeMode("system") },
    // Editor: fold / unfold
    { id: "fold-all",   label: "Fold all  (collapse top-level keys)", category: "Workspace", keywords: ["fold", "collapse", "all", "keys"], disabled: inputEmpty, action: () => inputEditorApiRef.current?.collapseAll() },
    { id: "unfold-all", label: "Unfold all (expand top-level keys)",  category: "Workspace", keywords: ["unfold", "expand", "all", "keys"],  disabled: inputEmpty, action: () => inputEditorApiRef.current?.expandAll()   },
    // Split input
    { id: "split-input", label: splitInputOpen ? "Close split input pane" : "Open split input pane", category: "Workspace", keywords: ["split", "input", "two", "pane", "side by side"], badge: splitInputOpen ? "on" : undefined, action: () => setSplitInputOpen((v) => !v) },
    // Tabs
    { id: "tab-toggle", label: showTabs ? "Disable multi-tab mode" : "Enable multi-tab mode", category: "Workspace", keywords: ["tab", "tabs", "multi", "mode", "enable", "disable"], badge: showTabs ? "on" : undefined, action: () => setShowTabs((v) => !v) },
    { id: "tab-new",   label: "New tab",           category: "Workspace", keywords: ["tab", "new", "document", "add"], disabled: !showTabs, action: addTab },
    { id: "tab-close", label: "Close current tab", category: "Workspace", keywords: ["tab", "close", "remove"], disabled: !showTabs || tabs.length <= 1, action: () => closeTab(activeTabId) },
    // Auto-format on paste
    { id: "auto-fmt-paste", label: autoFormatOnPaste ? "Auto-format on paste: On (turn off)" : "Auto-format on paste: Off (turn on)", category: "Settings", keywords: ["auto", "format", "paste", "beautify", "pretty"], badge: autoFormatOnPaste ? "on" : undefined, action: () => setAutoFormatOnPaste((v) => !v) },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [inputEmpty, showBusy, convertToFormat, rightView, parsedOutput, typeLanguage, activeOperation, output, themeMode, editorFontSize, isOutputMaximized, isWindowFullscreen, toggleWindowFullscreen, formatOptions, liveTransform, viewAsMenu, canUndo, canRedo, lineWrap, diffSideBySide, diffIgnoreWhitespace, diffShowPaths, diffKind, csvDelimiter, sharedLinkUrl, pinnedItems, undoStack.length, tabs.length, activeTabId, splitInputOpen, autoFormatOnPaste, showTabs, swapDiffSides, beautifyDiffSides, copyDiffText, downloadDiffReport, isUtilsMode, utilTab, isDiffMode]);

  return (
    <main
      className="flex flex-col overflow-hidden bg-[var(--workspace-background)] text-[var(--workspace-text)]"
      style={{ height: "100dvh", minHeight: "100dvh", maxHeight: "100dvh" }}
    >
      <WorkspaceHeader
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {loadedToolPreset && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-4 w-0.5 shrink-0 rounded-full bg-primary/70" aria-hidden />
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="text-[11px] font-semibold text-primary">
                {TOOL_PAGES[loadedToolPreset]?.h1 ?? loadedToolPreset}
              </span>
            </span>
            <span className="hidden text-[11px] text-[var(--workspace-text-muted)] sm:inline">preset loaded</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <a
              href={`/${loadedToolPreset}`}
              className="hidden items-center gap-1 text-[11px] text-[var(--workspace-text-muted)] transition-colors hover:text-primary sm:inline-flex"
            >
              <ArrowLeftCircleIcon className="h-3.5 w-3.5" />
              Tool page
            </a>
            <button
              type="button"
              aria-label="Dismiss"
              className="text-[var(--workspace-text-muted)] transition-colors hover:text-[var(--workspace-text)]"
              onClick={() => setLoadedToolPreset(null)}
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Outer: tab rail (sidebar) + workspace. Tabs must never sit in a column stack with the editors. */}
      <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
        {isDesktopLayout && showTabs && (
          <div className="flex h-full w-7 shrink-0 flex-col overflow-y-auto border-r border-[var(--workspace-border)] bg-[var(--workspace-panel)] pb-1 pt-1">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                role="tab"
                tabIndex={0}
                title={tab.label}
                className={`group relative flex cursor-pointer items-center justify-center py-2.5 transition-all duration-150 ${activeTabId === tab.id ? "bg-primary/10 text-primary" : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)]/60 hover:text-[var(--workspace-text)]"}`}
                onClick={() => switchToTab(tab.id)}
                onKeyDown={(e) => e.key === "Enter" && switchToTab(tab.id)}
              >
                {activeTabId === tab.id && (
                  <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-primary" />
                )}
                <span className="truncate font-mono text-[10px] font-semibold tracking-wider" style={{ writingMode: "vertical-rl", textOrientation: "mixed", maxHeight: 72 }}>
                  {tab.label}
                </span>
                {tabs.length > 1 && (
                  <button
                    type="button"
                    className="absolute -right-0.5 -top-0.5 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--workspace-border)] text-[var(--workspace-text-muted)] group-hover:flex hover:bg-red-500/20 hover:text-red-400"
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                    aria-label={`Close ${tab.label}`}
                  >
                    <XMarkIcon className="h-2 w-2" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="mt-0.5 flex items-center justify-center py-2 text-[var(--workspace-text-muted)] transition-all duration-100 hover:bg-primary/5 hover:text-primary"
              onClick={addTab}
              title="New tab"
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      {/* Column: stable full-width tool row + split (icons never jump when left panel hides) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* ── Full-width secondary toolbar (Transform | Compare | Utils + output actions) ── */}
        <div
          className={`flex h-10 shrink-0 flex-nowrap items-center gap-0.5 border-b px-1.5 text-xs ${inputEditorBgClass} text-[var(--workspace-text-muted)]`}
        >
          <div
            className="relative flex h-7 shrink-0 overflow-hidden rounded-lg border border-[var(--workspace-border)]"
            role="group"
            aria-label="Workspace tool"
          >
            {(
              [
                {
                  id: "transform",
                  label: "Transform",
                  active: !isDiffMode && !isUtilsMode,
                  title: "Format, convert, views, types",
                  onClick: () => {
                    if (isDiffMode) runOperation("diff");
                    else if (isUtilsMode) runOperation("utils");
                  },
                },
                {
                  id: "compare",
                  label: "Compare",
                  active: isDiffMode,
                  title: "Document or list compare",
                  onClick: () => {
                    if (!isDiffMode) runOperation("diff");
                  },
                },
                {
                  id: "utils",
                  label: "Utils",
                  active: isUtilsMode,
                  title: "UUID, Base64, JWT, hash, time…",
                  onClick: () => {
                    if (!isUtilsMode) runOperation("utils");
                  },
                },
              ] as const
            ).map((tab, i) => (
              <button
                key={tab.id}
                type="button"
                className={`relative h-7 cursor-pointer px-2.5 text-[11px] font-semibold transition-colors duration-150 ${
                  i > 0 ? "border-l border-[var(--workspace-border)]" : ""
                } ${
                  tab.active
                    ? "text-primary"
                    : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"
                }`}
                onClick={tab.onClick}
                title={tab.title}
              >
                {tab.active && (
                  <motion.span
                    layoutId="tool-mode-pill"
                    className="absolute inset-0 bg-primary/15"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-[1]">{tab.label}</span>
              </button>
            ))}
          </div>

          {isDiffMode && (
            <>
              <div className="flex h-7 shrink-0 overflow-hidden rounded-lg border border-[var(--workspace-border)]">
                <button
                  type="button"
                  className={`h-7 cursor-pointer px-2.5 text-[11px] font-semibold ${
                    diffKind === "document"
                      ? "bg-primary/15 text-primary"
                      : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)]"
                  }`}
                  onClick={() => setDiffKind("document")}
                  title="Document text/JSON diff"
                >
                  Document
                </button>
                <button
                  type="button"
                  className={`h-7 cursor-pointer border-l border-[var(--workspace-border)] px-2.5 text-[11px] font-semibold ${
                    diffKind === "list"
                      ? "bg-primary/15 text-primary"
                      : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)]"
                  }`}
                  onClick={() => setDiffKind("list")}
                  title="List / set compare"
                >
                  Lists
                </button>
              </div>
              {diffKind === "list" && (
                <div
                  ref={setListToolbarHost}
                  className="flex min-h-7 min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                />
              )}
              {diffKind === "document" && (
                <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[var(--workspace-border)]/60 px-0.5">
                    <button type="button" title="Previous difference" className={`${linkBtnClass} btn-square h-7 min-h-7 w-7`} disabled={!diffNav.total} onClick={() => diffEditorRef.current?.prevChange()}>
                      <ChevronUpIcon className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-[2.75rem] px-0.5 text-center text-[11px] font-medium tabular-nums text-[var(--workspace-text)]" title="Current / total hunks">
                      {diffNav.total ? `${diffNav.current}/${diffNav.total}` : "0"}
                    </span>
                    <button type="button" title="Next difference" className={`${linkBtnClass} btn-square h-7 min-h-7 w-7`} disabled={!diffNav.total} onClick={() => diffEditorRef.current?.nextChange()}>
                      <ChevronDownIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  {diffLineStats && diffLineStats.hunks > 0 ? (
                    <div className="flex shrink-0 items-center gap-1 text-[10px] font-medium tabular-nums">
                      <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-600 dark:text-emerald-400">+{diffLineStats.linesAdded}</span>
                      <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-red-600 dark:text-red-400">−{diffLineStats.linesRemoved}</span>
                      <span className="hidden sm:inline rounded bg-[var(--workspace-background)] px-1.5 py-0.5 text-[var(--workspace-text-muted)]">{diffLineStats.hunks} hunk{diffLineStats.hunks === 1 ? "" : "s"}</span>
                    </div>
                  ) : (diffLeftInput.trim() || diffRightInput.trim()) ? (
                    <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Identical</span>
                  ) : null}
                  <button type="button" title="Undo" className={`${linkBtnClass} btn-square h-7 min-h-7 w-7`} onClick={() => diffEditorRef.current?.undo()}>
                    <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" title="Redo" className={`${linkBtnClass} btn-square h-7 min-h-7 w-7`} onClick={() => diffEditorRef.current?.redo()}>
                    <ArrowUturnRightIcon className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" title={diffSideBySide ? "Inline view" : "Side-by-side"} className={`${linkBtnClass} h-7 min-h-7 px-1.5 text-[11px]`} onClick={() => setDiffSideBySide((v) => !v)}>
                    {diffSideBySide ? "Inline" : "Side-by-side"}
                  </button>
                  <button type="button" title="Ignore trim whitespace" className={`${linkBtnClass} h-7 min-h-7 px-1.5 text-[11px] ${diffIgnoreWhitespace ? "text-primary !bg-primary/10" : ""}`} onClick={() => setDiffIgnoreWhitespace((v) => !v)}>
                    {diffIgnoreWhitespace ? "Ignore WS ✓" : "Ignore WS"}
                  </button>
                  <button type="button" title="Swap sides" className={`${linkBtnClass} btn-square h-7 min-h-7 w-7`} onClick={swapDiffSides}>
                    <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    title={canShowPathDiff ? "JSON path-level changes" : "Path diff needs valid JSON on both sides"}
                    disabled={!canShowPathDiff}
                    className={`${linkBtnClass} h-7 min-h-7 gap-1 px-1.5 text-[11px] disabled:opacity-40 ${diffShowPaths ? "text-primary !bg-primary/10" : ""}`}
                    onClick={() => setDiffShowPaths((v) => !v)}
                  >
                    <ListBulletIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">Paths</span>
                    {canShowPathDiff && structuralDiff && structuralDiff.total > 0 && (
                      <span className="tabular-nums opacity-80">{structuralDiff.total}</span>
                    )}
                  </button>
                  <button type="button" title="Paste into focused pane" className={`${linkBtnClass} h-7 min-h-7 px-1.5 text-[11px]`} onClick={pasteFromClipboard}>
                    <ClipboardDocumentIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">Paste</span>
                  </button>
                  <button type="button" title="Beautify both sides" className={`${linkBtnClass} h-7 min-h-7 px-1.5 text-[11px]`} onClick={() => beautifyDiffSides("both")}>
                    Beautify
                  </button>
                  <Dropdown
                    open={downloadMenuOpen && isDiffMode}
                    onOpenChange={setDownloadMenuOpen}
                    side="bottom"
                    align="end"
                    rootClassName="shrink-0"
                    contentClassName={`dropdown-content z-[100] min-w-[11rem] p-1.5 shadow-2xl rounded-xl border border-[var(--workspace-border)]/50 ${dropdownPanelClass}`}
                    trigger={
                      <div className={`${linkBtnClass} flex h-7 min-h-7 items-center gap-1 px-1.5 text-[11px]`} title="Copy / export">
                        <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Export</span>
                        <ChevronDownIcon className="h-3 w-3 shrink-0" />
                      </div>
                    }
                  >
                    <div className="flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className={`${linkBtnClass} h-7 min-h-7 w-full justify-start px-2.5 text-[11px] font-medium`} onClick={() => { void copyDiffText("left"); setDownloadMenuOpen(false); }}>Copy left</button>
                      <button type="button" className={`${linkBtnClass} h-7 min-h-7 w-full justify-start px-2.5 text-[11px] font-medium`} onClick={() => { void copyDiffText("right"); setDownloadMenuOpen(false); }}>Copy right</button>
                      <button type="button" className={`${linkBtnClass} h-7 min-h-7 w-full justify-start px-2.5 text-[11px] font-medium`} onClick={() => { void copyDiffText("paths"); setDownloadMenuOpen(false); }}>Copy path changes</button>
                      <button type="button" className={`${linkBtnClass} h-7 min-h-7 w-full justify-start px-2.5 text-[11px] font-medium`} onClick={() => { void copyDiffText("report"); setDownloadMenuOpen(false); }}>Copy full report</button>
                      <button type="button" className={`${linkBtnClass} h-7 min-h-7 w-full justify-start px-2.5 text-[11px] font-medium`} onClick={() => { downloadDiffReport(); setDownloadMenuOpen(false); }}>Download report JSON</button>
                    </div>
                  </Dropdown>
                  {diffActionFlash && <span className="shrink-0 text-[10px] font-medium text-primary animate-pulse">{diffActionFlash}</span>}
                </div>
              )}
            </>
          )}

          <span className="min-w-2 flex-1" />

          <OutputActionBar
              canCopy={Boolean(getActiveOutputText().trim()) || (!isDiffMode && !isUtilsMode && canDownload)}
              canShare
              canShareAll={showTabs && tabs.length > 1}
              isGraphView={!isDiffMode && !isUtilsMode && isGraphView}
              isMaximized={isOutputMaximized}
              copyLabel={copyLabel}
              shareLabel={shareLabel}
              actionBounce={actionBounce}
              linkBtnClass={linkBtnClass}
              dropdownPanelClass={dropdownPanelClass}
              downloadMenuOpen={downloadMenuOpen && !isDiffMode}
              onDownloadMenuOpenChange={setDownloadMenuOpen}
              settingsOpen={transformConfigOpen}
              onSettingsOpenChange={setTransformConfigOpen}
              settingsContent={
                <div className="space-y-3">
                  {/* Active tab */}
                  <div className="flex items-center gap-1 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)] p-1">
                    {(
                      [
                        ["transform", !isDiffMode && !isUtilsMode],
                        ["compare", isDiffMode],
                        ["utils", isUtilsMode],
                      ] as const
                    ).map(([m, active]) => (
                      <span
                        key={m}
                        className={`flex-1 rounded-md px-2 py-1 text-center text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                          active ? "bg-primary/12 text-primary" : "text-[var(--workspace-text-muted)]"
                        }`}
                      >
                        {m}
                      </span>
                    ))}
                  </div>

                  {!isDiffMode && !isUtilsMode && (
                  <>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        ["Compact menus", viewAsMenu, () => setViewAsMenu((v) => !v)],
                        ["Live transform", liveTransform, () => setLiveTransform((v) => !v)],
                        ["Line wrap", lineWrap, () => setLineWrap((v) => !v)],
                        ["Format on paste", autoFormatOnPaste, () => setAutoFormatOnPaste((v) => !v)],
                      ] as const
                    ).map(([label, on, toggle]) => (
                      <button
                        key={label}
                        type="button"
                        onClick={toggle}
                        className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-colors ${
                          on
                            ? "border-primary/30 bg-primary/12 text-primary"
                            : "border-[var(--workspace-border)] text-[var(--workspace-text-muted)] hover:border-primary/20 hover:text-[var(--workspace-text)]"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-primary" : "bg-[var(--workspace-border)]"}`} />
                        {label}
                      </button>
                    ))}
                  </div>
                  </>
                  )}
                  {isDiffMode && (
                  <>
                    <p className="rounded-md bg-primary/5 px-2 py-1.5 text-[10px] leading-snug text-[var(--workspace-text-muted)]">
                      <strong className="text-primary">Compare</strong> — options below save preferences only.
                    </p>
                    <div className="flex flex-col gap-1">
                      <p className={settingsLabelClass}>Font</p>
                      <div className={settingsBtnGroupClass}>
                        <button type="button" aria-label="Decrease font size" className={settingsStepBtnClass} onClick={() => setEditorFontSize((s) => Math.max(10, s - 1))}><MinusIcon className="h-3.5 w-3.5" aria-hidden /></button>
                        <span className="flex h-7 min-w-[1.75rem] items-center justify-center px-1.5 text-xs font-medium tabular-nums text-[var(--workspace-text)]">{editorFontSize}</span>
                        <button type="button" aria-label="Increase font size" className={settingsStepBtnClass} onClick={() => setEditorFontSize((s) => Math.min(24, s + 1))}><PlusIcon className="h-3.5 w-3.5" aria-hidden /></button>
                        <button type="button" aria-label="Reset font size" className={settingsStepBtnClass} onClick={() => setEditorFontSize(14)}><ArrowPathIcon className="h-3 w-3" aria-hidden /></button>
                      </div>
                    </div>
                    {diffKind === "list" && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">List parse options</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            ["trim", "Trim whitespace"],
                            ["ignoreEmpty", "Skip empty"],
                            ["caseInsensitive", "Ignore case"],
                            ["stripQuotes", "Strip quotes"],
                            ["numericNormalize", "Normalize numbers"],
                          ] as const
                        ).map(([key, label]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              setListCompareOptions((prev) => ({ ...prev, [key]: !prev[key as keyof ListParseOptions] }))
                            }
                            className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-medium transition-colors ${
                              listCompareOptions[key as keyof ListParseOptions]
                                ? "border-primary/30 bg-primary/12 text-primary"
                                : "border-[var(--workspace-border)] text-[var(--workspace-text-muted)] hover:border-primary/20 hover:text-[var(--workspace-text)]"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${listCompareOptions[key as keyof ListParseOptions] ? "bg-primary" : "bg-[var(--workspace-border)]"}`}
                            />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    )}
                  </>
                  )}
                  {isUtilsMode && (
                  <>
                    <p className="rounded-md bg-primary/5 px-2 py-1.5 text-[10px] leading-snug text-[var(--workspace-text-muted)]">
                      <strong className="text-primary">Utils</strong> — tools update live as you type.
                    </p>
                    <div className="flex flex-col gap-1">
                      <p className={settingsLabelClass}>Font</p>
                      <div className={settingsBtnGroupClass}>
                        <button type="button" aria-label="Decrease font size" className={settingsStepBtnClass} onClick={() => setEditorFontSize((s) => Math.max(10, s - 1))}><MinusIcon className="h-3.5 w-3.5" aria-hidden /></button>
                        <span className="flex h-7 min-w-[1.75rem] items-center justify-center px-1.5 text-xs font-medium tabular-nums text-[var(--workspace-text)]">{editorFontSize}</span>
                        <button type="button" aria-label="Increase font size" className={settingsStepBtnClass} onClick={() => setEditorFontSize((s) => Math.min(24, s + 1))}><PlusIcon className="h-3.5 w-3.5" aria-hidden /></button>
                        <button type="button" aria-label="Reset font size" className={settingsStepBtnClass} onClick={() => setEditorFontSize(14)}><ArrowPathIcon className="h-3 w-3" aria-hidden /></button>
                      </div>
                    </div>
                  </>
                  )}
                  {!isDiffMode && !isUtilsMode && (
                  <>
                  {/* Steppers — content-width only */}
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <p className={settingsLabelClass}>Font</p>
                        <button
                          type="button"
                          className={pinStarClass(pinnedItems.has("fontSize"))}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPinnedItems((s) => {
                              const n = new Set(s);
                              if (n.has("fontSize")) n.delete("fontSize"); else n.add("fontSize");
                              return n;
                            });
                          }}
                          title={pinnedItems.has("fontSize") ? "Unpin from toolbar" : "Pin to toolbar"}
                          aria-label={pinnedItems.has("fontSize") ? "Unpin font size" : "Pin font size"}
                        >
                          {pinnedItems.has("fontSize") ? (
                            <StarSolidIcon className="h-3.5 w-3.5" />
                          ) : (
                            <StarIcon className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <div className={settingsBtnGroupClass}>
                        <button type="button" aria-label="Decrease font size" className={settingsStepBtnClass} onClick={() => setEditorFontSize((s) => Math.max(10, s - 1))}><MinusIcon className="h-3.5 w-3.5" aria-hidden /></button>
                        <span className="flex h-7 min-w-[1.75rem] items-center justify-center px-1.5 text-xs font-medium tabular-nums text-[var(--workspace-text)]">{editorFontSize}</span>
                        <button type="button" aria-label="Increase font size" className={settingsStepBtnClass} onClick={() => setEditorFontSize((s) => Math.min(24, s + 1))}><PlusIcon className="h-3.5 w-3.5" aria-hidden /></button>
                        <button type="button" aria-label="Reset font size" className={settingsStepBtnClass} onClick={() => setEditorFontSize(14)}><ArrowPathIcon className="h-3 w-3" aria-hidden /></button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1">
                        <p className={settingsLabelClass}>Indent</p>
                        <button
                          type="button"
                          className={pinStarClass(pinnedItems.has("indent"))}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPinnedItems((s) => {
                              const n = new Set(s);
                              if (n.has("indent")) n.delete("indent"); else n.add("indent");
                              return n;
                            });
                          }}
                          title={pinnedItems.has("indent") ? "Unpin from toolbar" : "Pin to toolbar"}
                          aria-label={pinnedItems.has("indent") ? "Unpin indent" : "Pin indent"}
                        >
                          {pinnedItems.has("indent") ? (
                            <StarSolidIcon className="h-3.5 w-3.5" />
                          ) : (
                            <StarIcon className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <div className={settingsBtnGroupClass}>
                        <button type="button" aria-label="Decrease indent" className={settingsStepBtnClass} onClick={() => { const v = Math.max(0, formatOptions.indentation - 1); applyFormatWithOptions({ ...formatOptions, indentation: v }); }}><MinusIcon className="h-3.5 w-3.5" aria-hidden /></button>
                        <span className="flex h-7 min-w-[1.5rem] items-center justify-center px-1.5 text-xs font-medium tabular-nums text-[var(--workspace-text)]">{formatOptions.indentation}</span>
                        <button type="button" aria-label="Increase indent" className={settingsStepBtnClass} onClick={() => { const v = Math.min(10, formatOptions.indentation + 1); applyFormatWithOptions({ ...formatOptions, indentation: v }); }}><PlusIcon className="h-3.5 w-3.5" aria-hidden /></button>
                        <button type="button" aria-label="Reset indent" className={settingsStepBtnClass} onClick={() => applyFormatWithOptions({ ...formatOptions, indentation: 2 })}><ArrowPathIcon className="h-3 w-3" aria-hidden /></button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className={settingsLabelClass}>Quotes</p>
                      <div className="inline-flex w-fit overflow-hidden rounded-lg border border-[var(--workspace-border)]/60">
                        {(["double", "single"] as const).map((q) => (
                          <button key={q} type="button" className={`h-7 px-2 text-[11px] font-medium ${formatOptions.quoteStyle === q ? "bg-primary/12 text-primary" : "text-[var(--workspace-text-muted)] hover:bg-primary/5"}`} onClick={() => applyFormatWithOptions({ ...formatOptions, quoteStyle: q })}>{q === "double" ? '" "' : "' '"}</button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className={settingsLabelClass}>JSON</p>
                      <div className="flex flex-wrap gap-1">
                        <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-[var(--workspace-border)]/60 px-2 text-[11px] hover:bg-primary/5">
                          <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={formatOptions.sortKeys} onChange={(e) => applyFormatWithOptions({ ...formatOptions, sortKeys: e.target.checked })} />
                          Sort keys
                        </label>
                        <label className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-[var(--workspace-border)]/60 px-2 text-[11px] hover:bg-primary/5">
                          <input type="checkbox" className="checkbox checkbox-xs checkbox-primary" checked={formatOptions.removeEmpty} onChange={(e) => applyFormatWithOptions({ ...formatOptions, removeEmpty: e.target.checked })} />
                          Drop empty
                        </label>
                      </div>
                    </div>
                  </div>
                  {/* Pin favorites — only used when compact menus is off */}
                  {!isDiffMode && !isUtilsMode && !viewAsMenu && (
                    <>
                      <div className="h-px bg-[var(--workspace-border)]/50" />
                      <p className={settingsLabelClass}>Pin to toolbar · star to show</p>
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-0.5">
                          <span className="mr-1 w-12 shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">Format</span>
                          {FORMAT_KINDS.map((fmt) => {
                            const on = pinnedItems.has(`fmt:${fmt}`);
                            return (
                              <button
                                key={fmt}
                                type="button"
                                className={`inline-flex h-7 items-center gap-0.5 rounded-md border px-1.5 text-[11px] font-medium transition-colors ${on ? "border-primary/30 bg-primary/10 text-primary" : "border-[var(--workspace-border)]/70 text-[var(--workspace-text-muted)] hover:border-primary/20"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPinnedItems((s) => {
                                    const n = new Set(s);
                                    if (n.has(`fmt:${fmt}`)) n.delete(`fmt:${fmt}`); else n.add(`fmt:${fmt}`);
                                    return n;
                                  });
                                }}
                                title={on ? `Unpin ${FORMAT_LABELS[fmt]}` : `Pin ${FORMAT_LABELS[fmt]}`}
                              >
                                {on ? <StarSolidIcon className="h-3 w-3 text-amber-500" /> : <StarIcon className="h-3 w-3 opacity-50" />}
                                {FORMAT_LABELS[fmt]}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap items-center gap-0.5">
                          <span className="mr-1 w-12 shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">View</span>
                          {(["raw", "tree", "graph", "query", "table"] as const).map((view) => {
                            const on = pinnedItems.has(`view:${view}`);
                            const label = view[0].toUpperCase() + view.slice(1);
                            return (
                              <button
                                key={view}
                                type="button"
                                className={`inline-flex h-7 items-center gap-0.5 rounded-md border px-1.5 text-[11px] font-medium transition-colors ${on ? "border-primary/30 bg-primary/10 text-primary" : "border-[var(--workspace-border)]/70 text-[var(--workspace-text-muted)] hover:border-primary/20"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPinnedItems((s) => {
                                    const n = new Set(s);
                                    if (n.has(`view:${view}`)) n.delete(`view:${view}`); else n.add(`view:${view}`);
                                    return n;
                                  });
                                }}
                                title={on ? `Unpin ${label}` : `Pin ${label}`}
                              >
                                {on ? <StarSolidIcon className="h-3 w-3 text-amber-500" /> : <StarIcon className="h-3 w-3 opacity-50" />}
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap items-center gap-0.5">
                          <span className="mr-1 w-12 shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">Action</span>
                          {OPERATION_ACTIONS.map(([label, action]) => {
                            const on = pinnedItems.has(`action:${action}`);
                            return (
                              <button
                                key={action}
                                type="button"
                                className={`inline-flex h-7 items-center gap-0.5 rounded-md border px-1.5 text-[11px] font-medium transition-colors ${on ? "border-primary/30 bg-primary/10 text-primary" : "border-[var(--workspace-border)]/70 text-[var(--workspace-text-muted)] hover:border-primary/20"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPinnedItems((s) => {
                                    const n = new Set(s);
                                    if (n.has(`action:${action}`)) n.delete(`action:${action}`); else n.add(`action:${action}`);
                                    return n;
                                  });
                                }}
                                title={on ? `Unpin ${label}` : `Pin ${label}`}
                              >
                                {on ? <StarSolidIcon className="h-3 w-3 text-amber-500" /> : <StarIcon className="h-3 w-3 opacity-50" />}
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap items-center gap-0.5">
                          <span className="mr-1 w-12 shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">Types</span>
                          {TYPE_LANGUAGES.slice(0, 8).map((item) => {
                            const on = pinnedItems.has(`type:${item.id}`);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                className={`inline-flex h-7 items-center gap-0.5 rounded-md border px-1.5 text-[11px] font-medium transition-colors ${on ? "border-primary/30 bg-primary/10 text-primary" : "border-[var(--workspace-border)]/70 text-[var(--workspace-text-muted)] hover:border-primary/20"}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPinnedItems((s) => {
                                    const n = new Set(s);
                                    if (n.has(`type:${item.id}`)) n.delete(`type:${item.id}`); else n.add(`type:${item.id}`);
                                    return n;
                                  });
                                }}
                                title={on ? `Unpin ${item.label}` : `Pin ${item.label}`}
                              >
                                {on ? <StarSolidIcon className="h-3 w-3 text-amber-500" /> : <StarIcon className="h-3 w-3 opacity-50" />}
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                  {!isDiffMode && !isUtilsMode && viewAsMenu && (
                    <p className="text-[10px] leading-snug text-[var(--workspace-text-muted)]">
                      Compact menus on — toolbar uses Format / View / Actions / Types. Turn off compact to pin shortcuts.
                    </p>
                  )}
                  <button
                    type="button"
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--workspace-border)]/50 py-1.5 text-[11px] font-medium text-[var(--workspace-text-muted)] transition-all hover:bg-primary/8 hover:text-primary"
                    onClick={() => {
                      setFormatOptions(DEFAULT_FORMAT_OPTIONS);
                      setConvertToFormat("json");
                      setRightView("raw");
                      setEditorFontSize(14);
                      setViewAsMenu(true);
                      setPinnedItems(new Set(["fmt:json", "view:raw", "view:query", "action:beautify", "action:minify", "type:typescript", "type:zod"]));
                    }}
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5" />
                    Reset to default
                  </button>
                  </>
                  )}
                </div>
              }
              onShare={() => {
                setShareAllTabs(false);
                requestShare();
              }}
              onShareAll={() => {
                setShareAllTabs(true);
                requestShare();
              }}
              onCopy={() => {
                const text = getActiveOutputText();
                if (!text.trim() && !isDiffMode) {
                  if (!isUtilsMode) void copyOutput();
                  return;
                }
                if (!text.trim()) return;
                void navigator.clipboard.writeText(text).then(
                  () => {
                    setCopyState("done");
                    setShareNotification("Copied");
                    window.setTimeout(() => setShareNotification(null), 2000);
                    window.setTimeout(() => setCopyState("idle"), 1400);
                  },
                  () => setCopyState("error"),
                );
              }}
              onDownload={() => {
                if (isUtilsMode) {
                  const text = getActiveOutputText();
                  if (!text) return;
                  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `formaty-${utilTab}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setShareNotification("Downloaded");
                  window.setTimeout(() => setShareNotification(null), 2000);
                  return;
                }
                if (isDiffMode) {
                  if (diffKind === "list" && listCompareExport?.text) {
                    const blob = new Blob([listCompareExport.text], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = listCompareExport.filename;
                    a.click();
                    URL.revokeObjectURL(url);
                    setShareNotification("Downloaded");
                    window.setTimeout(() => setShareNotification(null), 2000);
                    return;
                  }
                  downloadDiffReport();
                  return;
                }
                downloadOutput();
              }}
              onToggleMaximize={
                isDiffMode || isUtilsMode
                  ? undefined
                  : () => setIsOutputMaximized((v) => !v)
              }
              onUseAsInput={isDiffMode || isUtilsMode ? undefined : useOutputAsInput}
              onCopyAs={copyOutputAs}
              copyAsOptions={activeCopyAsOptions}
              onReset={handleWorkspaceReset}
              resetLabel={
                isUtilsMode
                  ? "Reset util"
                  : isDiffMode
                    ? "Reset both sides"
                    : "Reset input & output"
              }
              forceHide={{
                useAsInput: isDiffMode || isUtilsMode,
                maximize: isDiffMode || isUtilsMode,
              }}
            />
        </div>

      <div
        ref={splitContainerRef}
        className={`flex min-h-0 min-w-0 flex-1 overflow-hidden ${isDesktopLayout && !hideInputPanel ? "flex-row" : "flex-col"}`}
      >
        {!hideInputPanel && (!isDesktopLayout ? !mobileShowOutput : true) && (isDesktopLayout || output.trim() || !inputEmpty) && (
        <div
          className={`flex min-h-0 overflow-hidden bg-[var(--workspace-background)] transition-opacity duration-200 flex-col ${
            isDesktopLayout ? "shrink-0" : "min-h-0 flex-1"
          } ${isDesktopLayout && focusedPane === "output" ? "opacity-70" : "opacity-100"}`}
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
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className={`flex h-10 shrink-0 flex-nowrap items-center gap-0.5 border-b px-1.5 text-xs ${inputEditorBgClass} text-[var(--workspace-text-muted)]`}
          >
            <div className="flex shrink-0 items-center gap-1">
              <SquareBtn
                title="Undo (Ctrl+Z)"
                disabled={!canUndo}
                className={`${linkBtnClass} h-7 min-h-7 w-7 shrink-0`}
                onClick={() => moveHistory(-1)}
              >
                <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
              </SquareBtn>
              <SquareBtn
                title="Redo (Shift+Ctrl+Z)"
                disabled={!canRedo}
                className={`${linkBtnClass} h-7 min-h-7 w-7 shrink-0`}
                onClick={() => moveHistory(1)}
              >
                <ArrowUturnRightIcon className="h-3.5 w-3.5" />
              </SquareBtn>
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
              contentClassName={`dropdown-content z-[100] min-w-[7rem] p-1.5 shadow-2xl rounded-xl border border-[var(--workspace-border)]/50 ${dropdownPanelClass}`}
              trigger={
                <div className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center gap-1 ${inputFormatOpen ? "text-primary" : ""}`} title="Input format">
                  <span className="truncate font-medium">{getInputFormatLabel(resolvedInputFormat)}</span>
                  <ChevronDownIcon className="h-3 w-3 shrink-0" />
                </div>
              }
            >
              <div className="flex flex-col gap-0.5 p-0.5" onClick={(e) => e.stopPropagation()}>
                    {INPUT_FORMAT_KINDS.map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    className={`${linkBtnClass} h-7 min-h-7 px-2.5 text-[11px] font-medium w-full text-left ${resolvedInputFormat === fmt ? "!text-primary !bg-primary/10" : ""}`}
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
            <div className="flex shrink-0 items-center gap-1 hidden">
              <SquareBtn
                title={splitInputOpen ? "Close split pane" : "Split input pane"}
                className={`${linkBtnClass} h-7 min-h-7 w-7 shrink-0 ${splitInputOpen ? "text-primary" : ""}`}
                onClick={() => setSplitInputOpen((v) => !v)}
              >
                <ViewColumnsIcon className="h-3.5 w-3.5" />
              </SquareBtn>
            </div>
          </div>
          {splitInputOpen && isDesktopLayout ? (
            <div
              ref={splitContainerInputRef}
              className="flex min-h-0 flex-1 overflow-hidden"
              onMouseEnter={() => setFocusedPane("input")}
            >
              <div
                className="relative min-h-0 overflow-hidden cursor-text shrink-0"
                style={{ width: `${splitRatio}%` }}
                onClick={() => setFocusedPane("input")}
              >
                <JsonEditor
                  value={input}
                  onChange={(next) => { setInput(next); pushHistory(next); setFocusedPane("input"); }}
                  className="h-full"
                  language={resolvedInputFormat === "toml" || resolvedInputFormat === "csv" || resolvedInputFormat === "curl" ? "plaintext" : resolvedInputFormat}
                  monacoTheme={monacoTheme}
                  fontSize={editorFontSize}
                  wordWrap={lineWrap ? "on" : "off"}
                  onEditorMount={(api) => { inputEditorApiRef.current = api; }}
                  onCursorChange={(line, column) => setCursorPosition({ line, column })}
                  placeholder="Left input…"
                />
              </div>
              <div
                role="separator"
                aria-orientation="vertical"
                className="group relative flex shrink-0 cursor-col-resize justify-center"
                onMouseDown={() => setIsSplitResizing(true)}
              >
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-px bg-[var(--workspace-border)] transition-all duration-200 group-hover:w-[2px] group-hover:bg-gradient-to-b group-hover:from-transparent group-hover:via-primary group-hover:to-transparent group-hover:opacity-100 group-hover:[box-shadow:0_0_8px_rgba(124,58,237,0.4)]" />
              </div>
              <div
                className="relative min-h-0 flex-1 overflow-hidden cursor-text"
                onClick={() => setFocusedPane("input")}
              >
                <JsonEditor
                  value={splitInput2}
                  onChange={setSplitInput2}
                  className="h-full"
                  language="json"
                  monacoTheme={monacoTheme}
                  fontSize={editorFontSize}
                  wordWrap={lineWrap ? "on" : "off"}
                  onEditorMount={(api) => { splitInput2ApiRef.current = api; }}
                  placeholder="Right input…"
                />
              </div>
            </div>
          ) : (
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
                fontSize={editorFontSize}
                wordWrap={lineWrap ? "on" : "off"}
                onEditorMount={(api) => { inputEditorApiRef.current = api; }}
                onCursorChange={(line, column) => setCursorPosition({ line, column })}
              />
              {inputEmpty && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center select-none">
                  <div className="rounded-xl border border-dashed border-[var(--workspace-border)] bg-[var(--workspace-panel)]/50 px-6 py-4 backdrop-blur-sm">
                    <div className="mb-2 flex flex-wrap items-center justify-center gap-1.5">
                      {["JSON", "XML", "YAML", "TOML", "CSV", "cURL"].map((fmt) => (
                        <span
                          key={fmt}
                          className="rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2 py-0.5 font-mono text-[11px] text-[var(--workspace-text-muted)]"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-[var(--workspace-text-muted)]">
                      Paste or drop your data{" "}
                      <kbd className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-1.5 py-0.5 font-mono text-[10px]">
                        ⌘V
                      </kbd>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
        )}
        {isDesktopLayout && !hideInputPanel && (isDesktopLayout || output.trim() || !inputEmpty) && (
          <div
            role="separator"
            aria-orientation="vertical"
            className="group relative flex shrink-0 cursor-col-resize items-stretch justify-center"
            style={{ width: 9, marginLeft: -4, marginRight: -4, zIndex: 10 }}
            onMouseDown={() => setIsResizing(true)}
          >
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--workspace-border)] transition-all duration-150 group-hover:w-[3px] group-hover:bg-primary/60 group-hover:shadow-[0_0_6px_rgba(124,58,237,0.35)] group-active:w-[3px] group-active:bg-primary group-active:shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
          </div>
        )}
        <div
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--workspace-background)] ${!isDesktopLayout && !mobileShowOutput && !isDiffMode ? "hidden" : ""}`}
          style={isDesktopLayout && !hideInputPanel && (output.trim() || !inputEmpty) ? { width: `${100 - split}%` } : undefined}
        >
          {!isDesktopLayout && mobileShowOutput && !inputEmpty && !isDiffMode && (
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
          {/* Transform-only secondary row — mode switcher lives on full-width bar above */}
          {!isDiffMode && !isUtilsMode && (
          <div
            className={`flex h-10 shrink-0 flex-nowrap items-center gap-0.5 border-b px-1.5 text-xs ${inputEditorBgClass} text-[var(--workspace-text-muted)]`}
          >
            {viewAsMenu && (
              <>
            <Dropdown open={formatMenuOpen} onOpenChange={setFormatMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`dropdown-content z-[100] min-w-[7rem] p-1.5 shadow-2xl rounded-xl border border-[var(--workspace-border)]/50 ${dropdownPanelClass}`} trigger={<div className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center gap-1 ${formatMenuOpen ? "text-primary" : ""}`} title="Format"><span className="font-medium">Format</span><ChevronDownIcon className="h-3 w-3" /></div>}>
              <div className="flex flex-col gap-0.5 p-0.5" onClick={(e) => e.stopPropagation()}>
                {FORMAT_KINDS.map((fmt) => (
                  <button key={fmt} type="button" disabled={inputEmpty} className={`${linkBtnClass} h-7 min-h-7 px-2.5 text-[11px] font-medium w-full text-left disabled:opacity-40 ${convertToFormat === fmt ? "!text-primary !bg-primary/10" : ""}`} onClick={() => { setFocusedPane("output"); runConvert(fmt); setFormatMenuOpen(false); }}>{FORMAT_LABELS[fmt]}</button>
                ))}
              </div>
            </Dropdown>
            <Dropdown open={viewMenuOpen} onOpenChange={setViewMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`dropdown-content z-[100] min-w-[14rem] p-3 shadow-2xl rounded-xl border border-[var(--workspace-border)]/50 ${dropdownPanelClass}`} trigger={<div className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center gap-1 ${viewMenuOpen ? "text-primary" : ""}`} title="View"><span className="font-medium">View</span><ChevronDownIcon className="h-3 w-3" /></div>}>
              <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
                <div>
                  <p className={`${settingsLabelClass} mb-1.5`}>View mode</p>
                  <div className="flex flex-wrap gap-0.5">
                    {(["raw", "tree", "graph", "query", "table"] as const).map((view) => (
                      <button key={view} type="button" disabled={inputEmpty || ((view === "tree" || view === "graph" || view === "query" || view === "table") && !parsedOutput)} className={`${linkBtnClass} h-7 min-h-7 px-2 text-[11px] font-medium disabled:opacity-40 ${rightView === view ? "!text-primary !bg-primary/10" : ""}`} onClick={() => { setRightView(view); setFocusedPane("output"); setViewMenuOpen(false); }}>{view[0].toUpperCase() + view.slice(1)}</button>
                    ))}
                  </div>
                </div>
              </div>
            </Dropdown>
            <Dropdown open={actionsMenuOpen} onOpenChange={setActionsMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`dropdown-content z-[100] min-w-[7rem] p-1.5 shadow-2xl rounded-xl border border-[var(--workspace-border)]/50 ${dropdownPanelClass}`} trigger={<div className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center gap-1 ${actionsMenuOpen ? "text-primary" : ""}`} title="Actions"><span className="font-medium">Actions</span><ChevronDownIcon className="h-3 w-3" /></div>}>
              <div className="flex flex-col gap-0.5 p-0.5" onClick={(e) => e.stopPropagation()}>
                {OPERATION_ACTIONS.map(([label, action]) => (
                  <button key={action} type="button" disabled={showBusy || inputEmpty} className={`${linkBtnClass} h-7 min-h-7 px-2.5 text-[11px] font-medium w-full text-left disabled:opacity-40 ${activeOperation === action ? "!text-primary !bg-primary/10" : ""}`} onClick={() => { runOperation(action); setActionsMenuOpen(false); }}>{label}</button>
                ))}
              </div>
            </Dropdown>
            <Dropdown open={typesMenuOpen} onOpenChange={setTypesMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`dropdown-content z-[100] min-w-[8rem] max-h-[50vh] overflow-y-auto p-1.5 shadow-2xl rounded-xl border border-[var(--workspace-border)]/50 ${dropdownPanelClass}`} trigger={<div className={`${linkBtnClass} flex h-7 min-h-7 shrink-0 items-center gap-1 ${typesMenuOpen ? "text-primary" : ""}`} title="Generate Types"><span className="font-medium">Types</span><ChevronDownIcon className="h-3 w-3" /></div>}>
              <div className="flex flex-col gap-0.5 p-0.5" onClick={(e) => e.stopPropagation()}>
                {TYPE_LANGUAGES.map((item) => (
                  <button key={item.id} type="button" disabled={inputEmpty} className={`${linkBtnClass} h-7 min-h-7 px-2.5 text-[11px] font-medium w-full text-left disabled:opacity-40 ${typeLanguage === item.id ? "!text-primary !bg-primary/10" : ""}`} onClick={() => { setFocusedPane("output"); setActiveOperation("generateTypes"); executeOperation("generateTypes", { typeLanguage: item.id }); setTypesMenuOpen(false); }}>{item.label}</button>
                ))}
              </div>
            </Dropdown>
              </>
            )}
            {/* Pinned shortcuts only when compact menus is OFF */}
            {!viewAsMenu && (() => {
              const fmtPins = FORMAT_KINDS.filter((f) => pinnedItems.has(`fmt:${f}`));
              const viewPins = (["raw", "tree", "graph", "query", "table"] as const).filter((v) => pinnedItems.has(`view:${v}`));
              const actionPins = OPERATION_ACTIONS.filter(([, a]) => pinnedItems.has(`action:${a}`));
              const typePins = TYPE_LANGUAGES.filter((t) => pinnedItems.has(`type:${t.id}`));
              const hasPins = fmtPins.length + viewPins.length + actionPins.length + typePins.length > 0
                || pinnedItems.has("fontSize") || pinnedItems.has("indent");
              if (!hasPins) return null;
              const groups: React.ReactNode[] = [];
              if (fmtPins.length > 0) {
                groups.push(
                  <span key="fmt" className="flex shrink-0 items-center gap-0.5">
                    {fmtPins.map((fmt) => (
                      <button key={fmt} type="button" disabled={inputEmpty} className={`${linkBtnClass} h-7 min-h-7 shrink-0 disabled:opacity-40 ${convertToFormat === fmt ? tbActiveClass : ""}`} onClick={() => { setFocusedPane("output"); runConvert(fmt); }}>{FORMAT_LABELS[fmt]}</button>
                    ))}
                  </span>,
                );
              }
              if (viewPins.length > 0) {
                groups.push(
                  <span key="view" className="flex shrink-0 items-center gap-0.5">
                    {viewPins.map((view) => (
                      <button key={view} type="button" disabled={inputEmpty || ((view === "tree" || view === "graph" || view === "query" || view === "table") && !parsedOutput)} className={`${linkBtnClass} h-7 min-h-7 shrink-0 disabled:opacity-40 ${rightView === view ? tbActiveClass : ""}`} onClick={() => { setRightView(view); setFocusedPane("output"); }}>{view[0].toUpperCase() + view.slice(1)}</button>
                    ))}
                  </span>,
                );
              }
              if (actionPins.length > 0) {
                groups.push(
                  <span key="act" className="flex shrink-0 items-center gap-0.5">
                    {actionPins.map(([label, action]) => (
                      <button key={action} type="button" disabled={showBusy || inputEmpty} className={`${linkBtnClass} h-7 min-h-7 shrink-0 disabled:opacity-40 ${activeOperation === action ? tbActiveClass : ""}`} onClick={() => runOperation(action)}>{label}</button>
                    ))}
                  </span>,
                );
              }
              if (typePins.length > 0) {
                groups.push(
                  <span key="type" className="flex shrink-0 items-center gap-0.5">
                    {typePins.map((item) => (
                      <button key={item.id} type="button" disabled={inputEmpty} className={`${linkBtnClass} h-7 min-h-7 shrink-0 disabled:opacity-40 ${activeOperation === "generateTypes" && typeLanguage === item.id ? tbActiveClass : ""}`} onClick={() => { setFocusedPane("output"); setActiveOperation("generateTypes"); executeOperation("generateTypes", { typeLanguage: item.id }); }}>{item.label}</button>
                    ))}
                  </span>,
                );
              }
              if (pinnedItems.has("fontSize") || pinnedItems.has("indent")) {
                groups.push(
                  <span key="steps" className="flex shrink-0 items-center gap-1">
                    {pinnedItems.has("fontSize") && (
                      <div className={settingsBtnGroupClass} title="Font size">
                        <button type="button" aria-label="Decrease font size" className={settingsStepBtnClass} onClick={() => setEditorFontSize((s) => Math.max(10, s - 1))}><MinusIcon className="h-3 w-3" /></button>
                        <span className="flex h-7 min-w-[1.5rem] items-center justify-center px-1 text-[11px] font-medium tabular-nums text-[var(--workspace-text)]">{editorFontSize}</span>
                        <button type="button" aria-label="Increase font size" className={settingsStepBtnClass} onClick={() => setEditorFontSize((s) => Math.min(24, s + 1))}><PlusIcon className="h-3 w-3" /></button>
                      </div>
                    )}
                    {pinnedItems.has("indent") && (
                      <div className={settingsBtnGroupClass} title="Indent">
                        <button type="button" aria-label="Decrease indent" className={settingsStepBtnClass} onClick={() => { const v = Math.max(0, formatOptions.indentation - 1); applyFormatWithOptions({ ...formatOptions, indentation: v }); }}><MinusIcon className="h-3 w-3" /></button>
                        <span className="flex h-7 min-w-[1.25rem] items-center justify-center px-1 text-[11px] font-medium tabular-nums text-[var(--workspace-text)]">{formatOptions.indentation}</span>
                        <button type="button" aria-label="Increase indent" className={settingsStepBtnClass} onClick={() => { const v = Math.min(10, formatOptions.indentation + 1); applyFormatWithOptions({ ...formatOptions, indentation: v }); }}><PlusIcon className="h-3 w-3" /></button>
                      </div>
                    )}
                  </span>,
                );
              }
              return (
                <>
                  {groups.map((g, i) => (
                    <React.Fragment key={i}>
                      {i > 0 ? toolbarSep : null}
                      {g}
                    </React.Fragment>
                  ))}
                </>
              );
            })()}
            <span className="flex-1" />
          </div>
          )}
          <div className="relative flex min-h-[200px] min-h-0 flex-1 flex-col overflow-hidden">
            <div
              key={
                isUtilsMode
                  ? `utils-${utilTab}`
                  : isDiffMode
                    ? `diff-${diffKind}`
                    : `transform-${rightView}`
              }
              className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            >
            {isUtilsMode ? (
              <UtilsPanel
                linkBtnClass={linkBtnClass}
                panelClass={outputPanelClass}
                isDark={isDark}
                activeTab={utilTab}
                onActiveTabChange={setUtilTab}
                stateByTool={utilsByTool}
                onStateByToolChange={setUtilsByTool}
                fontSize={editorFontSize}
                onNotify={(msg) => {
                  setShareNotification(msg);
                  window.setTimeout(() => setShareNotification(null), 2500);
                }}
              />
            ) : isDiffMode ? (
              <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                {diffKind === "list" ? (
                  <ListComparePanel
                    left={diffLeftInput}
                    right={diffRightInput}
                    onLeftChange={setDiffLeftInput}
                    onRightChange={setDiffRightInput}
                    linkBtnClass={linkBtnClass}
                    panelClass={outputPanelClass}
                    dropdownPanelClass={dropdownPanelClass}
                    isDark={isDark}
                    toolbarHost={listToolbarHost}
                    onExportChange={setListCompareExport}
                    fontSize={editorFontSize}
                    options={listCompareOptions}
                    onOptionsChange={setListCompareOptions}
                  />
                ) : (
                  <div className="flex min-h-0 flex-1 overflow-hidden">
                    <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${diffShowPaths ? "" : "w-full"}`}>
                      {diffSideBySide && (
                        <div className={`flex h-6 shrink-0 border-b text-[11px] font-medium ${outputPanelClass}`}>
                          <div className="flex flex-1 items-center gap-1.5 border-r border-[var(--workspace-border)] px-2 text-[var(--workspace-text-muted)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-400/80" />
                            Left
                          </div>
                          <div className="flex flex-1 items-center gap-1.5 px-2 text-[var(--workspace-text-muted)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                            Right
                          </div>
                        </div>
                      )}
                      <JsonDiffEditor
                        key={`diff-doc-${activeTabId}`}
                        ref={diffEditorRef}
                        original={diffLeftInput}
                        modified={diffRightInput}
                        className="h-full min-h-0 flex-1"
                        language={documentDiffLanguage}
                        monacoTheme={monacoTheme}
                        fontSize={editorFontSize}
                        renderSideBySide={diffSideBySide}
                        ignoreTrimWhitespace={diffIgnoreWhitespace}
                        originalEditable
                        modifiedEditable
                        onOriginalChange={handleDiffLeftChange}
                        onModifiedChange={handleDiffRightChange}
                        onLineStatsChange={setDiffLineStats}
                        onNavChange={setDiffNav}
                        outputPanelClass={outputPanelClass}
                      />
                    </div>
                    {diffShowPaths && (
                      <div className={`flex w-full max-w-[min(100%,20rem)] shrink-0 flex-col border-l sm:w-80 ${outputPanelClass}`}>
                        <div className="flex shrink-0 items-center gap-1 border-b border-[var(--workspace-border)] px-2 py-1.5">
                          <ListBulletIcon className="h-3.5 w-3.5 text-[var(--workspace-text-muted)]" />
                          <span className="text-[11px] font-semibold text-[var(--workspace-text)]">Path changes</span>
                          <span className="ml-auto text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
                            {structuralDiff ? structuralDiff.total : "—"}
                          </span>
                          <SquareBtn
                            className={`${linkBtnClass} h-6 min-h-6 w-6`}
                            title="Close path list"
                            onClick={() => setDiffShowPaths(false)}
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                          </SquareBtn>
                        </div>
                        <div className="flex shrink-0 gap-0.5 border-b border-[var(--workspace-border)] px-1.5 py-1">
                          {([
                            ["all", "All"],
                            ["added", "+"],
                            ["removed", "−"],
                            ["changed", "~"],
                          ] as const).map(([id, label]) => (
                            <button
                              key={id}
                              type="button"
                              className={`${linkBtnClass} h-6 min-h-6 flex-1 px-1 text-[10px] font-medium ${diffPathFilter === id ? "text-primary !bg-primary/10" : ""}`}
                              onClick={() => setDiffPathFilter(id)}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
                          {structuralDiff === null ? (
                            <p className="px-2 py-3 text-[11px] leading-relaxed text-[var(--workspace-text-muted)]">
                              Path list is available when both sides are valid JSON.
                            </p>
                          ) : filteredDiffRows.length === 0 ? (
                            <p className="px-2 py-3 text-[11px] text-[var(--workspace-text-muted)]">
                              {structuralDiff.total === 0 ? "No structural differences." : "No changes match this filter."}
                            </p>
                          ) : (
                            <ul className="flex flex-col gap-1">
                              {filteredDiffRows.map((row, i) => (
                                <li
                                  key={`${row.path}-${row.change}-${i}`}
                                  className="rounded-lg border border-[var(--workspace-border)]/50 bg-[var(--workspace-background)]/50 px-2 py-1.5"
                                >
                                  <div className="flex items-start gap-1.5">
                                    <span
                                      className={`mt-0.5 shrink-0 rounded px-1 py-px text-[9px] font-bold uppercase tracking-wide ${
                                        row.change === "added"
                                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                          : row.change === "removed"
                                            ? "bg-red-500/15 text-red-600 dark:text-red-400"
                                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                      }`}
                                    >
                                      {row.change === "added" ? "+" : row.change === "removed" ? "−" : "~"}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-mono text-[10px] font-semibold text-[var(--workspace-text)]" title={row.path}>
                                        {row.path}
                                      </p>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (error || validationError) ? (
              <div className={`flex h-full min-h-[200px] flex-col items-start justify-start gap-2 p-4 overflow-y-auto ${outputPanelClass}`}>
                <div className="flex w-full items-center gap-2 text-error font-medium">
                  <XCircleIcon className="h-5 w-5 shrink-0" />
                  Error
                  <span className="flex-1" />
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] px-3 py-1.5 text-xs font-medium text-[var(--workspace-text)] hover:bg-primary/10 hover:text-primary"
                    title="Clear input and error"
                    onClick={() => {
                      setInput("");
                      setOutput("");
                      setParsedOutput(null);
                      setError(null);
                      setValidationError(null);
                      setActiveOperation(null);
                      setCopyState("idle");
                      setFocusedPane("input");
                      if (!isDesktopLayout) setMobileShowOutput(false);
                    }}
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                    Clear
                  </button>
                </div>
                <pre className="w-full text-left text-sm text-[var(--workspace-text-muted)] whitespace-pre-wrap break-words font-mono">
                  {error ?? validationError}
                </pre>
                <div className="flex flex-wrap items-center gap-2">
                {(() => {
                  const msg = error ?? validationError ?? "";
                  const m = msg.match(/position\s+(\d+)/i) || msg.match(/line\s+(\d+)/i) || msg.match(/at position\s+(\d+)/i);
                  if (!m) return null;
                  const n = Number(m[1]);
                  if (!Number.isFinite(n) || n < 1) return null;
                  // Prefer line number if "line N", else approximate line from char position
                  const isLine = /line\s+\d+/i.test(msg);
                  let line = n;
                  if (!isLine) {
                    const slice = input.slice(0, n);
                    line = slice.split("\n").length;
                  }
                  return (
                    <button
                      type="button"
                      className="rounded-lg border border-[var(--workspace-border)] px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                      onClick={() => {
                        setFocusedPane("input");
                        if (!isDesktopLayout) setMobileShowOutput(false);
                        inputEditorApiRef.current?.goToLine(line, 1);
                      }}
                    >
                      Jump to line {line} in input
                    </button>
                  );
                })()}
                  <button
                    type="button"
                    className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
                    onClick={() => {
                      setInput(SAMPLE_JSON_TABLE);
                      pushHistory(SAMPLE_JSON_TABLE);
                      setInputFormatOverride(null);
                      setError(null);
                      setValidationError(null);
                      parseOnly(SAMPLE_JSON_TABLE, "json");
                      setRightView("table");
                      setFocusedPane("output");
                      if (!isDesktopLayout) setMobileShowOutput(true);
                    }}
                  >
                    Load table sample
                  </button>
                </div>
              </div>
            ) : rightView === "raw" ? (
              output.trim() ? (
                <JsonEditor
                  value={output}
                  onChange={setOutput}
                  className="h-full min-h-0 flex-1"
                  readOnly
                  passiveReadOnly
                  language={outputLanguage === "toml" || outputLanguage === "csv" ? "plaintext" : outputLanguage}
                  monacoTheme={monacoTheme}
                  fontSize={editorFontSize}
                  wordWrap={lineWrap ? "on" : "off"}
                  onEditorMount={(api) => { outputEditorApiRef.current = api; }}
                />
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-6 p-6 text-center overflow-y-auto bg-[var(--workspace-panel)]">
                  {/* Brand + tagline */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="flex gap-0.5 items-center">
                      <Logo size={36} className="shrink-0" />
                      <span className="text-xl font-extrabold tracking-tight text-primary">ormaty</span>
                    </div>
                    <p className="max-w-md text-sm text-[var(--workspace-text-muted)] leading-relaxed">
                      Format, convert, compare, and developer utils — JSON, XML, YAML, and more. Everything runs locally in your browser.
                    </p>
                    <p className="text-[11px] text-[var(--workspace-text-muted)]">
                      Tip: <kbd className="rounded border border-[var(--workspace-border)] px-1 font-mono text-[10px]">Ctrl+K</kbd> opens commands · Share is the only action that can leave your device
                    </p>
                  </motion.div>

                  {/* Quick actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.07 }}
                    className="flex flex-wrap items-center justify-center gap-2"
                  >
                    <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/15 hover:shadow-sm" onClick={pasteFromClipboard}>
                      <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                      Paste
                    </button>
                    <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3 py-1.5 text-xs font-medium text-[var(--workspace-text-muted)] transition-all hover:border-primary/30 hover:text-primary hover:shadow-sm" onClick={() => document.getElementById("import-json-file")?.click()}>
                      <DocumentArrowDownIcon className="h-3.5 w-3.5" />
                      Import file
                    </button>
                    <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3 py-1.5 text-xs font-medium text-[var(--workspace-text-muted)] transition-all hover:border-primary/30 hover:text-primary hover:shadow-sm" onClick={() => runOperation("diff")}>
                      <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
                      Compare
                    </button>
                  </motion.div>

                  {/* Samples */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.14 }}
                    className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--workspace-border)] bg-[var(--workspace-background)]/60 px-5 py-3"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">Try a sample</span>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {FORMAT_KINDS.map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          className="rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--workspace-text-muted)] transition-all hover:border-primary/40 hover:text-primary hover:shadow-sm"
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
                        className="rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--workspace-text-muted)] transition-all hover:border-primary/40 hover:text-primary hover:shadow-sm"
                        onClick={() => {
                          setInput(SAMPLE_JSON_TABLE);
                          pushHistory(SAMPLE_JSON_TABLE);
                          setInputFormatOverride(null);
                          setError(null);
                          setValidationError(null);
                          parseOnly(SAMPLE_JSON_TABLE, "json");
                          setRightView("table");
                          setFocusedPane("output");
                          if (!isDesktopLayout) setMobileShowOutput(true);
                        }}
                      >
                        Table
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--workspace-text-muted)] transition-all hover:border-primary/40 hover:text-primary hover:shadow-sm"
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
                  </motion.div>

                  {/* Example gallery */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.21 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">Example gallery</span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {EXAMPLES.map((ex) => (
                        <button
                          key={ex.id}
                          type="button"
                          className="rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2.5 py-1 text-[11px] font-medium text-[var(--workspace-text-muted)] transition-all hover:border-primary/40 hover:text-primary hover:shadow-sm"
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
                  </motion.div>

                  {/* Capability strip */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.28 }}
                    className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-medium text-[var(--workspace-text-muted)]"
                  >
                    <span>JSONPath / JMESPath</span>
                    <span className="text-[var(--workspace-border)]">·</span>
                    <span>cURL → API</span>
                    <span className="text-[var(--workspace-border)]">·</span>
                    <span>Tree · Graph · Table</span>
                    <span className="text-[var(--workspace-border)]">·</span>
                    <span>Schema & Types</span>
                    <span className="text-[var(--workspace-border)]">·</span>
                    <span>Diff & Share</span>
                  </motion.div>
                </div>
              )
            ) : null}
            {!isUtilsMode && !isDiffMode && rightView === "tree" ? (
              parsedOutput ? (
                isHugeInput ? (
                  <div className={`flex h-full min-h-[200px] flex-col items-center justify-center gap-3 border p-6 text-center text-sm text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
                    <p>Tree view is disabled for inputs over ~2MB to keep the UI responsive.</p>
                    <button type="button" className={`${linkBtnClass} h-8 px-3 font-medium text-primary`} onClick={() => setRightView("raw")}>Switch to Raw</button>
                  </div>
                ) : (
                  <TreeView
                    data={parsedOutput}
                    isDark={isDark}
                    largeFile={isLargeInput}
                    onNotify={(msg) => {
                      setShareNotification(msg);
                      window.setTimeout(() => setShareNotification(null), 2500);
                    }}
                    className={`${outputPanelClass} min-h-0 flex-1 overflow-auto`}
                  />
                )
              ) : (
                <div className={`flex h-full min-h-[200px] items-center justify-center border text-sm text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
                  Current output is not valid JSON.
                </div>
              )
            ) : null}
            {!isUtilsMode && !isDiffMode && rightView === "graph" ? (
              parsedOutput ? (
                isHugeInput ? (
                  <div className={`flex h-full min-h-[200px] flex-col items-center justify-center gap-3 border p-6 text-center text-sm text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
                    <p>Graph view is disabled for inputs over ~2MB. Use Raw, Query, or download instead.</p>
                    <button type="button" className={`${linkBtnClass} h-8 px-3 font-medium text-primary`} onClick={() => setRightView("raw")}>Switch to Raw</button>
                  </div>
                ) : isLargeInput ? (
                  <div className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden ${outputPanelClass}`}>
                    <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                      Large file — graph may be slow. Prefer Query or Tree for exploration.
                    </div>
                    <GraphView
                      ref={graphViewRef}
                      data={parsedOutput}
                      isDark={isDark}
                      className="min-h-0 flex-1"
                    />
                  </div>
                ) : (
                  <GraphView
                    ref={graphViewRef}
                    data={parsedOutput}
                    isDark={isDark}
                    className={`${outputPanelClass} min-h-0 flex-1`}
                  />
                )
              ) : (
                <div className={`flex h-full min-h-[200px] items-center justify-center border text-sm text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
                  Current output is not valid JSON.
                </div>
              )
            ) : null}
            {!isUtilsMode && !isDiffMode && rightView === "query" ? (
              parsedOutput ? (
                <QueryView
                  data={parsedOutput}
                  className={`${outputPanelClass} min-h-0 flex-1`}
                  isDark={isDark}
                  fontSize={editorFontSize}
                  monacoTheme={monacoTheme}
                  onPromoteResult={(text) => {
                    setInput(text);
                    pushHistory(text);
                    setInputFormatOverride(null);
                    setError(null);
                    setValidationError(null);
                    setRightView("raw");
                    setFocusedPane("input");
                    setShareNotification("Query result moved to input");
                    window.setTimeout(() => setShareNotification(null), 2500);
                  }}
                  onNotify={(msg) => {
                    setShareNotification(msg);
                    window.setTimeout(() => setShareNotification(null), 2500);
                  }}
                />
              ) : (
                <div className={`flex h-full min-h-[200px] items-center justify-center border text-sm text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
                  Current output is not valid JSON.
                </div>
              )
            ) : null}
            {!isUtilsMode && !isDiffMode && rightView === "table" ? (
              (() => {
                let data = parsedOutput;
                const tryParse = (text: string) => {
                  try {
                    return parseJsonInput(text);
                  } catch {
                    try {
                      const fmt = detectFormat(text);
                      if (fmt !== "curl") return parseInput(text, fmt) as JsonValue;
                    } catch {
                      /* ignore */
                    }
                    return null;
                  }
                };
                if (data == null && output.trim()) data = tryParse(output);
                if (data == null && input.trim()) data = tryParse(input);
                return data != null ? (
                  <TableView
                    data={data}
                    className={`${outputPanelClass} min-h-0 flex-1 overflow-auto`}
                    isDark={isDark}
                  />
                ) : (
                  <div className={`flex h-full min-h-[200px] flex-col items-center justify-center gap-2 border p-6 text-center text-sm text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
                    <p>No tabular data yet. Paste a JSON <strong className="text-[var(--workspace-text)]">array of objects</strong>.</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        className={`${linkBtnClass} h-8 px-3 font-medium text-primary`}
                        onClick={() => {
                          setInput(SAMPLE_JSON_TABLE);
                          pushHistory(SAMPLE_JSON_TABLE);
                          setInputFormatOverride(null);
                          setError(null);
                          setValidationError(null);
                          parseOnly(SAMPLE_JSON_TABLE, "json");
                          setRightView("table");
                        }}
                      >
                        Load table sample
                      </button>
                      <button
                        type="button"
                        className={`${linkBtnClass} h-8 px-3 font-medium`}
                        onClick={() => setRightView("raw")}
                      >
                        Switch to Raw
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : null}
            </div>
          </div>
        </div>
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
        rightActions={
          <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] tracking-wide text-[var(--workspace-text-muted)]">
            <span className="font-semibold text-[var(--workspace-text)]">{getInputFormatLabel(resolvedInputFormat)}</span>
            <span className="text-primary">→</span>
            <span className="font-semibold text-[var(--workspace-text)]">{activeOperation === "generateTypes" ? selectedTypeLanguageLabel : FORMAT_LABELS[convertToFormat]}</span>
          </span>
        }
        sharedLink={
          sharedLinkUrl ? (
            <span className="flex shrink-0 items-center gap-1">
              <span className="shrink-0 text-primary">Shared</span>
              <a
                href={sharedLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="max-w-[8rem] truncate hover:underline sm:max-w-[12rem]"
                title={sharedLinkUrl}
              >
                {sharedLinkUrl.replace(/^https?:\/\/[^/]+/, "")}
              </a>
              <button
                type="button"
                className="btn btn-ghost btn-xs shrink-0 rounded p-0.5"
                title="Copy link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(sharedLinkUrl);
                    setShareNotification(sharedLinkUrl);
                    window.setTimeout(() => setShareNotification(null), 3000);
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-xs shrink-0 rounded p-0.5"
                title="Disable sharing"
                onClick={async () => {
                  const idToDelete = sharedLinkId;
                  setSharedLinkId(null);
                  setSharedLinkUrl(null);
                  isViewingSharedRef.current = false;
                  if (idToDelete) await deletePlayground(idToDelete);
                  setShareNotification("Link disabled");
                  window.setTimeout(() => setShareNotification(null), 3000);
                }}
              >
                <LinkSlashIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          ) : undefined
        }
      />
      {shareNotification ? (
        <div
          className={`fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-[var(--workspace-border)]/50 bg-[var(--workspace-panel)]/95 px-4 py-2 text-xs shadow-xl backdrop-blur-md`}
          role="status"
        >
          <p className={`font-medium ${shareNotification.includes("failed") ? "text-error" : "text-primary"}`}>
            {shareNotification.startsWith("http") ? "Link copied" : shareNotification}
          </p>
          {shareNotification.startsWith("http") && (
            <p className="mt-0.5 max-w-[min(90vw,400px)] truncate" title={shareNotification}>
              {shareNotification}
            </p>
          )}
        </div>
      ) : null}

        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          commands={commandPaletteCommands}
          isDark={isDark}
          recentIds={recentActions}
          onExecute={(id) => {
            setRecentActions((prev) => {
              const next = [id, ...prev.filter((x) => x !== id)].slice(0, 3);
              return next;
            });
          }}
        />

        {/* History Panel */}
        {showHistoryPanel && (
          <div className="fixed inset-0 z-[200] flex items-stretch justify-end" onClick={() => setShowHistoryPanel(false)}>
            <div
              className={`flex h-full w-full max-w-sm flex-col shadow-2xl shadow-black/20 border-l ${isDark ? "bg-[#141414]/95 backdrop-blur-xl border-white/[0.06]" : "bg-white/95 backdrop-blur-xl border-black/[0.06]"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`flex shrink-0 items-center justify-between border-b px-4 py-3 ${isDark ? "border-white/[0.06]" : "border-black/[0.06]"}`}>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold tracking-wide text-[var(--workspace-text)]">Input History</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums ${isDark ? "bg-white/[0.06] text-white/40" : "bg-black/[0.04] text-black/40"}`}>{undoIndex + 1}/{undoStack.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className={`${linkBtnClass} h-7 min-h-7 text-[11px] font-medium`} onClick={exportHistory}>Export</button>
                  <SquareBtn className={`${linkBtnClass} h-7 min-h-7 w-7 [&_svg]:!size-4`} onClick={() => setShowHistoryPanel(false)}><XMarkIcon className="h-4 w-4" /></SquareBtn>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {[...undoStack].reverse().map((content, reversedIdx) => {
                  const idx = undoStack.length - 1 - reversedIdx;
                  const isCurrent = idx === undoIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`flex w-full flex-col items-start gap-1 border-b px-4 py-3 text-left transition-all duration-100 ${isDark ? "border-white/[0.04]" : "border-black/[0.04]"} ${isCurrent ? "bg-primary/10" : isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]"}`}
                      onClick={() => {
                        const delta = idx - undoIndex;
                        if (delta !== 0) moveHistory(delta as -1 | 1);
                        setShowHistoryPanel(false);
                      }}
                    >
                      <div className="flex w-full items-center gap-2">
                        {isCurrent && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                        <span className={`text-[11px] font-medium ${isCurrent ? "text-primary" : "text-[var(--workspace-text-muted)]"}`}>
                          {isCurrent ? "Current" : `History ${idx + 1}`}
                        </span>
                        <span className={`ml-auto text-[10px] ${isDark ? "text-white/30" : "text-black/30"}`}>{getSizeFormatted(content)}</span>
                      </div>
                      <span className="line-clamp-2 font-mono text-[11px] text-[var(--workspace-text-muted)]">
                        {content.slice(0, 120) || "(empty)"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

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

        {shareConfirmOpen ? (
          <div className="modal modal-open">
            <div className="modal-box max-w-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)]">
              <h3 className="text-sm font-semibold text-[var(--workspace-text)]">Share this workspace?</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--workspace-text-muted)]">
                Everything else in Formaty runs <strong className="text-[var(--workspace-text)]">locally in your browser</strong>.
                Sharing uploads your current input (and related settings) so others can open a link.
                Do not share secrets, tokens, or personal data.
              </p>
              {showTabs && tabs.length > 1 && (
                <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)]/60 px-3 py-2.5">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary mt-0.5"
                    checked={shareAllTabs}
                    onChange={(e) => setShareAllTabs(e.target.checked)}
                  />
                  <span className="text-xs leading-relaxed text-[var(--workspace-text)]">
                    <strong className="font-semibold">Share all {tabs.length} tabs</strong>
                    <span className="mt-0.5 block text-[var(--workspace-text-muted)]">
                      Include every tab’s input, output, Compare sides, and Utils state. Unchecked shares only the active tab.
                    </span>
                  </span>
                </label>
              )}
              <ul className="mt-3 list-inside list-disc text-[11px] text-[var(--workspace-text-muted)]">
                <li>Link can be disabled later from the status bar</li>
                <li>If cloud share is unavailable, a URL hash fallback is used in the browser</li>
              </ul>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--workspace-border)] px-3 py-1.5 text-xs font-medium text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)]"
                  onClick={() => setShareConfirmOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  onClick={() => void shareWorkspace()}
                >
                  Create link &amp; copy
                </button>
              </div>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button type="button" onClick={() => setShareConfirmOpen(false)}>close</button>
            </form>
          </div>
        ) : null}

        {showFirstRunHint && (
          <div className="fixed bottom-20 left-1/2 z-50 flex max-w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-3 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)]/95 px-4 py-3 text-xs shadow-xl backdrop-blur-md">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--workspace-text)]">Quick tip</p>
              <p className="mt-0.5 text-[var(--workspace-text-muted)]">
                Press <kbd className="rounded border border-[var(--workspace-border)] px-1 font-mono text-[10px]">Ctrl+K</kbd> for any action.
                Output Share / Copy / Download live in the <strong>toolbar</strong> (never over your text).
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 text-[var(--workspace-text-muted)] hover:text-[var(--workspace-text)]"
              aria-label="Dismiss"
              onClick={() => {
                setShowFirstRunHint(false);
                try {
                  localStorage.setItem("formaty-onboarded", "1");
                } catch {
                  /* ignore */
                }
              }}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}

    </main>
  );
}
