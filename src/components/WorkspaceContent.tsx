"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ArrowDownTrayIcon,
  ArrowLeftCircleIcon,
  ChevronRightIcon,
  ClockIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import {
  Button,
  StatusText,
  IconButton,
  KitTooltipProvider,
  Tooltip,
  Segmented,
  type CopyButtonProps,
  type CopyFormat,
} from "@/components/kit";
import dynamic from "next/dynamic";
import type { ComponentType, RefAttributes } from "react";
import type { DiffNavState, JsonDiffEditorProps, JsonDiffEditorRef } from "@/components/JsonDiffEditor";
import { ListComparePanel, type ListCompareExport } from "@/components/ListComparePanel";
import { SingleListPanel } from "@/components/SingleListPanel";
import { DEFAULT_LIST_PARSE_OPTIONS, type ListBucket, type ListParseOptions } from "@/lib/json/listCompare";
import {
  UtilsPanel,
  defaultUtilToolState,
  type UtilTab,
  type UtilsStateMap,
} from "@/components/UtilsPanel";
import { UTIL_SAMPLES, UTIL_TABS } from "@/lib/utils/devtools";
import {
  flattenJson,
  generateOpenApiSpec,
  parseJsonInput,
  toCsv,
  toHtmlTable,
  toMarkdownTable,
} from "@/lib/json/core";
// Monaco is the single biggest client dependency (~5MB) and is only needed on
// views that render a code editor. Load it lazily so list-compare / SQL / utils
// pages never pull it in (mirrors how GraphView code-splits jsoncrack).
const JsonEditor = dynamic(() => import("@/components/JsonEditor").then((m) => m.JsonEditor), {
  ssr: false,
});
const JsonDiffEditor = dynamic(
  () => import("@/components/JsonDiffEditor").then((m) => m.JsonDiffEditor),
  { ssr: false },
) as ComponentType<JsonDiffEditorProps & RefAttributes<JsonDiffEditorRef>>;
// Secondary views / overlays are only needed once the user switches to them, so keep
// them (and what they pull in: html2canvas, jsoncrack glue, virtualised table) out of
// the playground's first load.
const GraphView = dynamic(() => import("@/components/GraphView").then((m) => m.GraphView), {
  ssr: false,
}) as ComponentType<GraphViewProps & RefAttributes<GraphViewRef>>;
const TreeView = dynamic(() => import("@/components/TreeView").then((m) => m.TreeView), {
  ssr: false,
}) as ComponentType<TreeViewProps & RefAttributes<TreeViewRef>>;
const QueryView = dynamic(() => import("@/components/QueryView").then((m) => m.QueryView), {
  ssr: false,
});
const TableView = dynamic(() => import("@/components/TableView").then((m) => m.TableView), {
  ssr: false,
});
const CommandPalette = dynamic(
  () => import("@/components/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false },
);
const GuidedTour = dynamic(() => import("@/components/GuidedTour").then((m) => m.GuidedTour), {
  ssr: false,
});
import type { GraphViewRef, GraphViewProps } from "@/components/GraphView";
import { getInstantActions } from "@/lib/instant/actionBus";
import { clearAllTabSettings } from "@/lib/instant/persist";
import type { TreeViewRef, TreeViewProps } from "@/components/TreeView";
import { trackEvent } from "@/components/Analytics";
import {
  getSizeFormatted,
  Header as WorkspaceHeader,
  type ChromeTab,
} from "@/components/workspace";
import {
  loadVisibility,
  formatCopyAsText,
  formatCopyItemsAsText,
  DEFAULT_COPY_AS_OPTIONS,
  TABLE_COPY_AS_OPTIONS,
  type CopyAsFormat,
  type GraphCopyFormat,
  type OutputActionVisibility,
} from "@/components/workspace/OutputActionBar";
import {
  formatListCopyAsText,
  loadListCopyPref,
} from "@/lib/copyAs";
import { Logo } from "@/components/Logo";
import {
  emptyDiffSummary,
  formatDiffReport,
  summarizeDiffFromText,
  type DiffSummary,
  type LineDiffStats,
} from "@/lib/json/diff";
import { useJsonWorker } from "@/hooks/useJsonWorker";
import { useDelayedReset } from "@/hooks/useDelayedReset";
import { explainProblem } from "@/lib/formats/explain";
import { detectFormat, FORMAT_LABELS, getInputFormatLabel, parseInput, type FormatKind, type InputFormatKind } from "@/lib/formats";
import { ALL_TOOL_ROUTES, TOOL_PAGES, TOOL_PRESETS, type ToolRoute } from "@/lib/seo";
import { executeCurlDetailed, parseCurl, type CurlExecutionResult } from "@/lib/curl/parseCurl";
import { CURL_TARGETS, generateCurlCode, getCurlTarget, type CurlTargetId } from "@/lib/curl/codegen";
import type { SqlDialect } from "@/lib/json/core";
import { formatJson } from "@/lib/json/core";
import { decodeState, encodeState, LIST_OPTIONS_VERSION, upgradeListOptions, type WorkspaceState } from "@/lib/shareState";
import { HUGE_INPUT_BYTES, LARGE_INPUT_BYTES, WORKER_INPUT_CAP_BYTES } from "@/lib/io/size";
import { readFileAsTextGuarded } from "@/lib/io/ingest";
import { savePlayground, updatePlayground, deletePlayground } from "@/lib/playgroundApi";
import { PRESETS, getPreset, type PresetId } from "@/lib/presets";
import { themeInlineCss } from "@/lib/utils/themeTokens";
import type { Command } from "@/components/CommandPalette";
import { describeCommand } from "@/components/palette/describe";
import { previewOutput } from "@/components/palette/preview";
import { isEditableTarget, isPlainTextField } from "@/lib/shortcuts";
import { Toaster, toast } from "@/components/Toast";
import type { JsonValue, TypeTargetLanguage } from "@/lib/json/core";

import {
  DEFAULT_FORMAT_OPTIONS,
  EXAMPLES,
  EXT_BY_FORMAT,
  FORMAT_KINDS,
  LANGUAGE_BY_TYPE_TARGET,
  OPERATION_ACTIONS,
  QUICK_TIPS,
  SAMPLES,
  SAMPLE_CURL,
  SAMPLE_JSON,
  SAMPLE_JSON_TABLE,
  TYPE_LANGUAGES,
  DEFAULT_LEARNED_CHIPS,
  FIXED_OUTPUT_CHIPS,
  MORE_OPERATIONS,
  type OutputId,
  type FormatOptions,
  type ModalKind,
  type OperationAction,
  type OutputLanguage,
  type QuoteStyle,
  type RightView,
  type Tab,
  type ThemeMode,
} from "@/components/workspace/constants";
import { autoTabName, numberDuplicates, tabKindOf } from "@/components/workspace/tabNames";
import { loadLastUsed, saveLastUsed, type NewTabSpec } from "@/components/workspace/NewTabMenu";
import { INPUT_SAMPLES, CurlSendStrip, EmptyInput, InputErrorStrip, InputHeader, OutputHeader } from "@/components/workspace/PaneHeaders";
import { ActionRow, CompareBar } from "@/components/workspace/CompareBar";
import { StatusBar } from "@/components/workspace/StatusBar";
import { InlineRename } from "@/components/workspace/InlineRename";
import { commandIcon } from "@/components/workspace/commandIcons";
import { GRAPH_COPY_OPTIONS } from "@/components/workspace/OutputActionBar";
import { DocumentHeader, FieldTable } from "@/components/workspace/DocumentCompare";
import { SettingsPanel } from "@/components/workspace/SettingsPanel";
import { SharePanel } from "@/components/workspace/SharePanel";




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


/** Outputs that stay selected when the input changes: they re-run instead of falling back to a plain format. */
const STICKY_OPS: OperationAction[] = ["generateTypes", "schema", "openapi", "validate", "flatten", "unflatten", "minify"];

export interface WorkspaceContentProps {
  initialState?: import("@/lib/shareState").WorkspaceState;
  sharedLinkId?: string;
  sharedLinkUrl?: string;
  /** Embed mode: hide chrome (header, status bar, footer links) for iframes. */
  embed?: boolean;
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export function WorkspaceContent({
  initialState,
  sharedLinkId: initialSharedLinkId,
  sharedLinkUrl: initialSharedLinkUrl,
  embed = false,
}: WorkspaceContentProps = {}) {
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
  /** Bumped on workspace-tab add so generator utils seed fresh values in the new tab. */
  const [utilsRegenKey, setUtilsRegenKey] = useState(0);
  /** Utils undo/redo — snapshot-based, same approach as workspace input undo. */
  const [utilsUndoStack, setUtilsUndoStack] = useState<UtilsStateMap[]>([{}]);
  const [utilsUndoIdx, setUtilsUndoIdx] = useState(0);
  const utilsHistoryLock = useRef(false);
  const utilsUndoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [listToolbarHost, setListToolbarHost] = useState<HTMLElement | null>(null);
  /** Active list-compare result for shared OutputActionBar copy/download */
  const [listCompareExport, setListCompareExport] = useState<ListCompareExport | null>(null);
  const [listCompareOptions, setListCompareOptions] = useState<ListParseOptions>(DEFAULT_LIST_PARSE_OPTIONS);
  /** Parsed item counts of the open list(s), reported by the list panels for the status bar. */
  const [listCounts, setListCounts] = useState({ left: 0, right: 0 });
  // Stable identities: the panels report counts from an effect keyed on these, so an inline arrow would loop.
  const reportListCounts = useCallback((l: number, r: number) => setListCounts((c) => (c.left === l && c.right === r ? c : { left: l, right: r })), []);
  const reportListCount = useCallback((n: number) => reportListCounts(n, 0), [reportListCounts]);
  /** CSV key column for compare-by-column (persisted in share links). */
  const [csvColumn, setCsvColumn] = useState<string | null>(null);
  /** Query-view text, lifted for share links. */
  const [queryText, setQueryText] = useState("");
  /** Currently shown bucket in the per-bucket list-compare view (persisted in share links). */
  const [activeBucket, setActiveBucket] = useState<ListBucket>("common");
  /** Ref into TreeView search box (Cmd/Ctrl+F). */
  const treeViewRef = useRef<TreeViewRef | null>(null);
  /** Info about the last file dropped/imported (shown as a chip, cleared on demand). */
  const [, setDroppedFile] = useState<{ name: string; size: number; format: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const dragDepthRef = useRef(0);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [themeSynced, setThemeSynced] = useState(false);
  const [split, setSplit] = useState(41);
  const startResize = useCallback(() => setIsResizing(true), []);
  const nudgeSplit = useCallback((delta: number) => setSplit((s) => Math.max(25, Math.min(60, s + delta))), []);
  const [isResizing, setIsResizing] = useState(false);
  const [schemaInput, setSchemaInput] = useState("");
  const [diffLeftInput, setDiffLeftInput] = useState("");
  const [diffRightInput, setDiffRightInput] = useState("");
  const [modalKind, setModalKind] = useState<ModalKind>(null);
  const [modalValue, setModalValue] = useState("");
  /** Clipboard-read permission prompt - shown when ⌘V paste is blocked by the browser. */
  const [showPastePrompt, setShowPastePrompt] = useState(false);
  const [pastePromptError, setPastePromptError] = useState(false);
  /** True while a "Clear cache & reload" wipe is in flight — blocks the
   *  pagehide flush from resurrecting the session after localStorage.clear(). */
  const suppressSessionFlushRef = useRef(false);
  const [rightView, setRightView] = useState<RightView>("raw");
  /** Latest query-view result - lifted so the global toolbar copies / downloads it. */
  const [queryResult, setQueryResult] = useState("");
  /** Last 'copy as' format per tool (keyed by tool id) - preserved per tab. */
  const [copyAsMemory, setCopyAsMemory] = useState<Record<string, CopyAsFormat>>({});
  /** Last graph copy format (PNG / JPG / SVG / JSON) - preserved per tab. */
  const [graphCopyFormat, setGraphCopyFormat] = useState<GraphCopyFormat>("png");
  const [typeLanguage, setTypeLanguage] = useState<TypeTargetLanguage>("typescript");
  /** Root type name for generated types and table name for SQL (empty = automatic). */
  const [typeName, setTypeName] = useState("");
  const [sqlTable, setSqlTable] = useState("");
  const [learnedChips, setLearnedChips] = useState<OutputId[]>(DEFAULT_LEARNED_CHIPS);
  const [, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const resetCopySoon = useDelayedReset(() => setCopyState("idle"));
  const [sharedLinkId, setSharedLinkId] = useState<string | null>(initialSharedLinkId ?? null);
  const [sharedLinkUrl, setSharedLinkUrl] = useState<string | null>(initialSharedLinkUrl ?? null);
  const [isOutputMaximized, setIsOutputMaximized] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(true);
  /** Viewport shorter than ~700px: stacked panes switch between Input and Output instead of scrolling. */
  const [isShortViewport, setIsShortViewport] = useState(false);
  const [focusedPane, setFocusedPane] = useState<"input" | "output">("input");
  const [formatOptions, setFormatOptions] = useState<FormatOptions>(DEFAULT_FORMAT_OPTIONS);
  const [convertToFormat, setConvertToFormat] = useState<FormatKind>("json");
  const [inputFormatOverride, setInputFormatOverride] = useState<InputFormatKind | null>(null);
  const [transformConfigOpen, setTransformConfigOpen] = useState(false);

  const [curlTarget, setCurlTarget] = useState<CurlTargetId | null>(null);
  const [outputActionVisibility, setOutputActionVisibility] = useState<OutputActionVisibility>(() => loadVisibility());
  const [shareOpen, setShareOpen] = useState(false);
  const [showFirstRunHint, setShowFirstRunHint] = useState(false);
  /** Guided product tour - auto-starts for first-time users, replayable anytime. */
  const [tourOpen, setTourOpen] = useState(false);
  /** Guards against the tour opening twice (auto-start + replay race). */
  const tourOpenedRef = useRef(false);

  const [liveTransform, setLiveTransform] = useState(true);
  const [editorFontSize, setEditorFontSize] = useState(13);
  const [lineWrap, setLineWrap] = useState(true);
  const [diffSideBySide, setDiffSideBySide] = useState(true);
  const [diffIgnoreWhitespace, setDiffIgnoreWhitespace] = useState(false);
  // User override to keep the full editor on for inputs above HUGE_INPUT_BYTES.
  // Defaults off so an accidental 200 MB paste lands on the hardened editor +
  // lazy views instead of locking the page.
  const [forceFullEditor, setForceFullEditor] = useState(false);
  const [diffIgnoreOrder] = useState(false);
  const [diffShowPaths, setDiffShowPaths] = useState(false);
  const [docCopyFormat, setDocCopyFormat] = useState("report");
  /** cURL response metadata (status / headers / size / timing) shown for curl input. */
  const [curlMeta, setCurlMeta] = useState<CurlExecutionResult | null>(null);
  /** True while a cURL request is in flight (cache miss) - drives the skeleton. */
  const [curlFetching, setCurlFetching] = useState(false);
  /** Last input value actually executed - drives the "Press ⌘⏎ to run" hint. */
  const [lastExecutedCurlInput, setLastExecutedCurlInput] = useState("");
  /** SQL dialect used by the JSON → SQL type generator. */
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>("sqlite");
  // The SQL dialect is a standing preference: remembered across reloads, the same in every tab.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("formaty-sql-dialect");
      if (saved === "sqlite" || saved === "postgres" || saved === "mysql") setSqlDialect(saved);
    } catch {
      /* storage blocked */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("formaty-sql-dialect", sqlDialect);
    } catch {
      /* storage blocked */
    }
  }, [sqlDialect]);
  const [, setDiffPathFilter] = useState<"all" | "added" | "removed" | "changed">("all");
  const [diffLineStats, setDiffLineStats] = useState<LineDiffStats | null>(null);
  const [diffNav, setDiffNav] = useState<DiffNavState>({ current: 0, total: 0 });
  /** Document = Monaco text/JSON diff; List = set/list compare; Single = one-list analysis. */
  const [diffKind, setDiffKind] = useState<"document" | "list" | "single">("document");
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [csvDelimiter, setCsvDelimiter] = useState(",");
  const [isWindowFullscreen, setIsWindowFullscreen] = useState(false);

  // Multiple tabs
  const [tabs, setTabs] = useState<Tab[]>([{ id: "t1", label: "T1", num: 1 }]);
  const [activeTabId, setActiveTabId] = useState("t1");
  // Tabs are always on; older saved sessions may carry showTabs: false, which is ignored.
  const showTabs = true;
  /** Latest openNewTab, for the global key handler (declared before openNewTab exists). */
  const openNewTabRef = useRef<(spec: NewTabSpec) => void>(() => {});
  const tabCounterRef = useRef(1);
  /** Recently closed tabs, newest last, for "Reopen closed tab". In memory only. */
  const closedTabsRef = useRef<Array<{ tab: Tab; snap: TabSnapshot; name: string }>>([]);
  const [closedTabName, setClosedTabName] = useState<string | null>(null);
  /** Inline list-pane rename editor (floating input next to the Left/Right/List header). */
  type RenameSide = "left" | "right" | "list";
  const [renamingListSide, setRenamingListSide] = useState<RenameSide | null>(null);
  const [listRenameValue, setListRenameValue] = useState("");
  const [listRenameRect, setListRenameRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  // Recent command palette actions
  // Auto-format on paste
  const [autoFormatOnPaste, setAutoFormatOnPaste] = useState(true);
  /** Randomized quick tip (set after mount to avoid hydration mismatch). */
  const [quickTip, setQuickTip] = useState<string | null>(null);
  useEffect(() => {
    setQuickTip(QUICK_TIPS[Math.floor(Math.random() * QUICK_TIPS.length)] ?? null);
  }, []);

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
  const [, setActionBounce] = useState<"share" | "copy" | null>(null);
  const [mobileShowOutput, setMobileShowOutput] = useState(true);

  // Auto-hide the first-run quick tip after a few seconds (dismissal marks it seen).
  useEffect(() => {
    if (!showFirstRunHint) return;
    const id = window.setTimeout(() => {
      setShowFirstRunHint(false);
      try {
        localStorage.setItem("formaty-onboarded", "1");
      } catch {
        /* ignore */
      }
    }, 8000);
    return () => window.clearTimeout(id);
  }, [showFirstRunHint]);
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
  /** Latest input-editor cursor - restored after undo/redo rewrites the value. */
  const cursorPositionRef = useRef<{ line: number; column: number } | null>(null);
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
    diffKind: "document" | "list" | "single";
    /** Per-tab list parsing options / CSV column / query text (persisted with tab snapshots). */
    listCompareOptions?: Partial<ListParseOptions>;
    csvColumn?: string | null;
    queryText?: string;
    /** Per-tab bucket currently shown in the per-bucket view (e.g. "common", "leftOnly"). */
    compareActiveBucket?: ListBucket;
    /** Per-tab diff toolbar preferences - preserved like other toolbar settings. */
    diffSideBySide: boolean;
    diffIgnoreWhitespace: boolean;
    diffShowPaths: boolean;
    isOutputMaximized: boolean;
    /** Per-tab Utils selection + each util tool’s own I/O. */
    utilTab: UtilTab;
    utilsByTool: UtilsStateMap;
    /** Per-tool, per-tab 'last copy as' memory. */
    copyAsMemory: Record<string, CopyAsFormat>;
    graphCopyFormat: GraphCopyFormat;
    /** Per-tab format options (indentation, quote style, sort, removeEmpty). */
    formatOptions: FormatOptions;
    /** Per-tab output action visibility (which copy/download actions show). */
    outputActionVisibility: OutputActionVisibility;
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
    listCompareOptions: { ...DEFAULT_LIST_PARSE_OPTIONS },
    csvColumn: null,
    queryText: "",
    compareActiveBucket: undefined,
    diffSideBySide: true,
    diffIgnoreWhitespace: false,
    diffShowPaths: false,
    isOutputMaximized: false,
    utilTab: "uuid",
    utilsByTool: {},
    copyAsMemory: {},
    graphCopyFormat: "png",
    formatOptions: { indentation: 2, quoteStyle: "double", sortKeys: false, removeEmpty: false },
    outputActionVisibility: loadVisibility(),
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
    listCompareOptions,
    csvColumn,
    queryText,
    compareActiveBucket: activeBucket,
    diffSideBySide,
    diffIgnoreWhitespace,
    diffShowPaths,
    isOutputMaximized,
    utilTab,
    utilsByTool,
    copyAsMemory,
    graphCopyFormat,
    formatOptions,
    outputActionVisibility,
  }), [input, inputFormatOverride, undoStack, undoIndex, output, parsedOutput, outputExt, outputLanguage, activeOperation, error, convertToFormat, typeLanguage, rightView, diffLeftInput, diffRightInput, diffKind, listCompareOptions, csvColumn, queryText, activeBucket, diffSideBySide, diffIgnoreWhitespace, diffShowPaths, isOutputMaximized, utilTab, utilsByTool, copyAsMemory, graphCopyFormat, formatOptions, outputActionVisibility]);
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
    // Parse options belong to the tab: a tab without saved options starts from the defaults.
    setListCompareOptions({ ...DEFAULT_LIST_PARSE_OPTIONS, ...snap.listCompareOptions });
    if (snap.csvColumn) setCsvColumn(snap.csvColumn);
    if (snap.queryText) setQueryText(snap.queryText);
    if (snap.compareActiveBucket) setActiveBucket(snap.compareActiveBucket);
    setDiffSideBySide(snap.diffSideBySide ?? true);
    setDiffIgnoreWhitespace(snap.diffIgnoreWhitespace ?? false);
    setDiffShowPaths(snap.diffShowPaths ?? false);
    setIsOutputMaximized(
      snap.activeOperation === "diff" ||
        snap.activeOperation === "utils",
    );
    setUtilTab(snap.utilTab ?? "uuid");
    setUtilsByTool(snap.utilsByTool ?? {});
    setCopyAsMemory(snap.copyAsMemory ?? {});
    setGraphCopyFormat(snap.graphCopyFormat ?? "png");
    if (snap.formatOptions) setFormatOptions(snap.formatOptions);
    if (snap.outputActionVisibility) setOutputActionVisibility(snap.outputActionVisibility);
    setQueryResult("");
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
  /** Tabs and snapshots carried by a shared link. Links from before tab snapshots carry one tab's fields at the top level. */
  const sharedTabEntries = (st: WorkspaceState): Array<{ tab: Tab; snap: TabSnapshot }> => {
    if (Array.isArray(st.tabs) && st.tabs.length && st.tabSnapshots && typeof st.tabSnapshots === "object") {
      const snaps = st.tabSnapshots as Record<string, Partial<TabSnapshot>>;
      return st.tabs
        .filter((t) => snaps[t.id] && typeof snaps[t.id] === "object")
        .map((t) => {
          const raw = upgradeListOptions({ ...snaps[t.id] } as Partial<TabSnapshot> & { listCompareOptions?: Partial<ListParseOptions> }, st.listOptionsVersion);
          const snap = { ...emptyTabSnapshot(), ...raw } as TabSnapshot;
          if (isStaleDiffOutput(snap.output)) snap.output = "";
          if (!snap.undoStack?.length) snap.undoStack = [snap.input];
          return { tab: { id: t.id, label: t.label, num: t.num, renamed: t.renamed, leftLabel: t.leftLabel, rightLabel: t.rightLabel }, snap };
        });
    }
    const compare = st.activeOperation === "diff" || !!(st.diffLeftInput || st.diffRightInput);
    const ol = (st.outputLanguage ?? st.outputFormat ?? "json") as OutputLanguage;
    const snap: TabSnapshot = {
      ...emptyTabSnapshot(),
      input: st.input ?? "",
      undoStack: [st.input ?? ""],
      output: st.output ?? "",
      outputLanguage: ol,
      outputExt: EXT_BY_FORMAT[ol as FormatKind] ?? TYPE_LANGUAGES.find((t) => t.id === ol)?.ext ?? "json",
      activeOperation: compare ? "diff" : ((st.activeOperation as OperationAction) ?? "format"),
      convertToFormat: st.convertToFormat ?? "json",
      typeLanguage: st.typeLanguage ?? "typescript",
      rightView: st.viewMode ?? "raw",
      diffLeftInput: st.diffLeftInput ?? "",
      diffRightInput: st.diffRightInput ?? "",
      diffKind: st.diffKind ?? "document",
      listCompareOptions: { ...DEFAULT_LIST_PARSE_OPTIONS, ...st.listCompareOptions },
      csvColumn: st.csvColumn ?? null,
      queryText: st.queryText ?? "",
      compareActiveBucket: st.compareActiveBucket,
      isOutputMaximized: compare,
    };
    if (!snap.input.trim() && !snap.diffLeftInput.trim() && !snap.diffRightInput.trim()) return [];
    return [{ tab: { id: "shared", label: "Shared", num: 0, leftLabel: st.leftLabel, rightLabel: st.rightLabel }, snap }];
  };
  const pendingShareRef = useRef<WorkspaceState | null>(null);
  const tabSnapshotsRef = useRef<Map<string, TabSnapshot>>(new Map());
  const diffDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRestoredRef = useRef(false);
  const persistSessionRef = useRef<() => void>(() => {});
  const sessionLoadedRef = useRef(false);
  const skipNextPersistRef = useRef(true);
  const curlCacheRef = useRef<{ input: string; result: string; meta: CurlExecutionResult | null } | null>(null);
  /** Output snapshot before the last transform action - "Actions → None" restores it. */
  const prevActionStateRef = useRef<{
    output: string;
    parsedOutput: JsonValue | null;
    outputLanguage?: OutputLanguage;
    outputExt?: string;
  } | null>(null);
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
  const outputPanelClass = "border-[var(--workspace-border)] bg-[var(--workspace-panel)]";
  const canUndo = undoIndex > 0;
  const canRedo = undoIndex < undoStack.length - 1;
  /** Diff mode always uses full-width left/right panes (no main input panel). */
  const isDiffMode = activeOperation === "diff";
  const isUtilsMode = activeOperation === "utils";
  const hideInputPanel = isDiffMode || isUtilsMode;
  /** Input folded into a rail so the output gets the full width (persisted per tab as isOutputMaximized). */
  const inputCollapsed = isDesktopLayout && !hideInputPanel && isOutputMaximized;
  /** Short and narrow: one pane at a time behind an Input / Output switch. */
  const stackSwitch = !isDesktopLayout && isShortViewport && !hideInputPanel;
  const showInputPane = !hideInputPanel && !inputCollapsed && !(stackSwitch && mobileShowOutput);
  const showOutputPane = !(stackSwitch && !mobileShowOutput);

  const structuralDiff = useMemo((): DiffSummary | null => {
    if (!isDiffMode) return null;
    if (!diffLeftInput.trim() && !diffRightInput.trim()) return emptyDiffSummary();
    return summarizeDiffFromText(diffLeftInput, diffRightInput, {
      ignoreArrayOrder: diffIgnoreOrder,
      arrayKey: diffIgnoreOrder ? "id" : undefined,
    });
  }, [isDiffMode, diffLeftInput, diffRightInput, diffIgnoreOrder]);

  /** Monaco language: JSON highlighting only when both sides parse as JSON (loose OK). */
  const documentDiffLanguage = useMemo(() => {
    const ok = (t: string) => {
      const s = t.trim();
      if (!s) return true;
      // Large text: don't parse in render, sniff the first character instead.
      if (s.length > LARGE_INPUT_BYTES) return s[0] === "{" || s[0] === "[";
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


  const flashDiffAction = useCallback((msg: string) => {
    toast({ message: msg, type: /failed|needs valid JSON/i.test(msg) ? "error" : "success" });
  }, []);
  const inputLineCount = input.split("\n").length;
  const inputSizeFormatted = getSizeFormatted(input);
  const inputByteSize = useMemo(() => (input ? new Blob([input]).size : 0), [input]);
  const outputByteSize = useMemo(() => (output ? new Blob([output]).size : 0), [output]);
  const isLargeInput = inputByteSize >= LARGE_INPUT_BYTES;
  const isHugeInput = inputByteSize >= HUGE_INPUT_BYTES;
  // The right-side views render `parsedOutput` (which may be derived from
  // either the input or the output string). Track the larger of the two
  // so the huge-mode gate also fires when a small input explodes into a
  // huge output via a transform.
  const effectiveRightByteSize = Math.max(inputByteSize, outputByteSize);
  const isHugeRight = effectiveRightByteSize >= HUGE_INPUT_BYTES;
  // Table and Graph are much heavier than the tree — they materialize every
  // cell / node in the DOM. Gate them earlier (at LARGE_INPUT_BYTES) so a
  // 1.8 MB file does not hang the renderer. The banner shows the same
  // "first 200 rows" preview as the tree view.
  const isLargeRight = effectiveRightByteSize >= LARGE_INPUT_BYTES;

  const inputEmpty = !input.trim();
  useEffect(() => {
    if (inputEmpty) setCursorPosition(null);
  }, [inputEmpty]);

  // Large payloads: keep raw editing snappy - turn off live transform automatically
  useEffect(() => {
    if (isHugeInput && liveTransform) {
      setLiveTransform(false);
      toast({ message: "Live transform off for large files", type: "info" });
    }
    // Only react to size crossing the threshold, not liveTransform toggles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHugeInput]);

  const detectedInputFormat = useMemo(() => detectFormat(input), [input]);
  const resolvedInputFormat: InputFormatKind = inputFormatOverride ?? detectedInputFormat;

  const getParsedInput = useCallback(async (textOverride?: string): Promise<JsonValue> => {
    const source = textOverride ?? input;
    const inputFmt = textOverride ? detectFormat(source) : resolvedInputFormat;
    if (inputFmt === "curl") {
      const cache = curlCacheRef.current;
      let responseText: string;
      if (cache && cache.input === source) {
        responseText = cache.result;
        if (cache.meta) setCurlMeta(cache.meta);
      } else {
        setCurlFetching(true);
        try {
          const parsed = parseCurl(source);
          const executed = await executeCurlDetailed(parsed);
          responseText = executed.body;
          setCurlMeta(executed);
          setLastExecutedCurlInput(source);
          curlCacheRef.current = { input: source, result: responseText, meta: executed };
        } finally {
          setCurlFetching(false);
        }
      }
      const fmt = detectFormat(responseText) === "curl" ? "json" : (detectFormat(responseText) as FormatKind);
      return run<JsonValue>("parseFormat", { input: responseText, format: fmt });
    }
    return run<JsonValue>("parseFormat", { input: source, format: inputFmt });
  }, [input, resolvedInputFormat, run]);

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
    const pos = cursorPositionRef.current;
    historyLock.current = true;
    setUndoIndex(targetIdx);
    setInput(next);
    // Monaco's setValue resets the cursor - restore it once the new value lands
    // so undo/redo (and ⌥↑/⌥↓ history stepping) don't jump to the end of input.
    if (pos) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputEditorApiRef.current?.goToLine(pos.line, pos.column);
        });
      });
    }
    setTimeout(() => {
      historyLock.current = false;
    }, 0);
  }, [undoIndex, undoStack]);

  /** Push utilsByTool snapshot onto undo stack (debounced). */
  const pushUtilsHistory = useCallback((next: UtilsStateMap) => {
    if (utilsHistoryLock.current) return;
    if (utilsUndoTimerRef.current) clearTimeout(utilsUndoTimerRef.current);
    utilsUndoTimerRef.current = setTimeout(() => {
      setUtilsUndoStack((prev) => {
        if (JSON.stringify(prev[utilsUndoIdx]) === JSON.stringify(next)) return prev;
        const sliced = prev.slice(0, utilsUndoIdx + 1);
        const result = [...sliced, next].slice(-100);
        setUtilsUndoIdx(result.length - 1);
        return result;
      });
    }, 300);
  }, [utilsUndoIdx]);

  /** Move utils undo/redo by delta steps. */
  const moveUtilsHistory = useCallback((delta: number) => {
    const targetIdx = utilsUndoIdx + delta;
    if (targetIdx < 0 || targetIdx >= utilsUndoStack.length) return;
    utilsHistoryLock.current = true;
    setUtilsUndoIdx(targetIdx);
    setUtilsByTool(utilsUndoStack[targetIdx]);
    setTimeout(() => { utilsHistoryLock.current = false; }, 0);
  }, [utilsUndoIdx, utilsUndoStack]);

  const canUtilsUndo = utilsUndoIdx > 0;
  const canUtilsRedo = utilsUndoIdx < utilsUndoStack.length - 1;

  // Utils deep-link: /playground?util=base64 opens the Utils workspace on that tool.
  const utilDeepLink = searchParams?.get("util");
  useEffect(() => {
    if (pathname !== "/playground" || !utilDeepLink) return;
    if (!UTIL_TABS.some((t) => t.id === utilDeepLink)) return;
    setActiveOperation("utils");
    setUtilTab(utilDeepLink as UtilTab);
    const sample = UTIL_SAMPLES[utilDeepLink as UtilTab];
    if (sample) {
      setInput(sample);
      setUndoStack([sample]);
      setUndoIndex(0);
    }
  }, [utilDeepLink, pathname]);

  // Extended keyboard shortcuts (⌘⇧B / ⌘⇧M / ⌘⇧D / ⌘⇧U / ⌘⇧S, ⌘1–⌘5 views, ⌘F find,
  // ⌘+/−/0 zoom, ⌥1/⌥2 focus, ⌘Y redo, Esc). Core combos (⌘K / ⌘↵ / ⌘V / ⌘Z / ⌘⇧Z)
  // and the Compare-mode undo/redo routing live in the handler further down.
  const shortcutActionsRef = useRef<{
    runOperation: (action: OperationAction) => void;
    downloadOutput: () => void;
    copyOutput: () => void;
    moveHistory: (delta: number) => void;
    moveUtilsHistory: (delta: number) => void;
    newTab: () => void;
    closeTab: () => void;
    reset: () => void;
    busy: boolean;
  }>({ runOperation: () => {}, downloadOutput: () => {}, copyOutput: () => {}, moveHistory: () => {}, moveUtilsHistory: () => {}, newTab: () => {}, closeTab: () => {}, reset: () => {}, busy: false });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const alt = event.altKey && !mod && !event.shiftKey;

      // Esc — close the history panel (dialogs/palette close themselves).
      if (event.key === "Escape") {
        setShowHistoryPanel(false);
        return;
      }

      if (!mod && !alt) return;

      // ⌥1 / ⌥2 — focus input / output pane.
      if (alt && (event.key === "1" || event.key === "2")) {
        event.preventDefault();
        if (event.key === "1") {
          setFocusedPane("input");
          inputEditorApiRef.current?.focus();
        } else {
          setFocusedPane("output");
          outputEditorApiRef.current?.focus();
        }
        return;
      }

      if (modalKind) return;

      // ⌘C — copy output (browser copy still wins inside editors/inputs
      //       OR when the user has selected text in compare/utils output).
      if (mod && !event.shiftKey && event.key.toLowerCase() === "c") {
        // If user has text selected anywhere, let the browser handle native copy.
        const sel = window.getSelection();
        if (sel && sel.toString().length > 0) return;
        if (!isEditableTarget(event.target) && output.trim()) {
          event.preventDefault();
          shortcutActionsRef.current.copyOutput();
        }
        return;
      }

      // ⌥Z — toggle line wrap (VS Code muscle memory).
      if (alt && event.key.toLowerCase() === "z") {
        event.preventDefault();
        setLineWrap((v) => !v);
        return;
      }

      // ⌥M — maximize / restore the output pane.
      if (alt && event.key.toLowerCase() === "m") {
        event.preventDefault();
        setIsOutputMaximized((v) => !v);
        return;
      }

      // ⌥T — cycle theme: light → dark → system.
      if (alt && event.key.toLowerCase() === "t") {
        event.preventDefault();
        setThemeMode((m) => (m === "light" ? "dark" : m === "dark" ? "system" : "light"));
        return;
      }

      // ⌥N / ⌥W — new / close tab (only when the tab bar is visible).
      if (alt && event.key.toLowerCase() === "n") {
        if (showTabs) {
          event.preventDefault();
          shortcutActionsRef.current.newTab();
        }
        return;
      }
      if (alt && event.key.toLowerCase() === "w") {
        if (showTabs && tabs.length > 1) {
          event.preventDefault();
          shortcutActionsRef.current.closeTab();
        }
        return;
      }

      // ⌘F — find in the focused pane; the Tree view gets its own search box.
      if (mod && !event.shiftKey && event.key.toLowerCase() === "f") {
        if (!isEditableTarget(event.target)) {
          if (rightView === "tree" && treeViewRef.current) {
            event.preventDefault();
            treeViewRef.current.focusSearch();
          } else {
            const editor =
              focusedPane === "input"
                ? inputEditorApiRef.current
                : outputEditorApiRef.current;
            if (editor) {
              event.preventDefault();
              editor.find();
            }
          }
        }
        return;
      }

      // ⌘⇧D / ⌘⇧U — open a new Compare / Utils tab on the kind used last (tabs are typed, so no in-place mode switch).
      if (mod && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        openNewTabRef.current({ kind: "compare", compare: loadLastUsed().compare });
        return;
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === "u") {
        event.preventDefault();
        openNewTabRef.current({ kind: "utils", tool: loadLastUsed().utils });
        return;
      }

      // ⌘⇧E — open the share dialog (works in any mode).
      if (mod && event.shiftKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        setShareOpen(true);
        return;
      }

      // ⌘⇧P — palette alias (⌘K works everywhere; Ctrl+Shift+P is browser-owned on Windows).
      if (mod && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        trackEvent("command_palette", { source: "shortcut" });
        setCommandPaletteOpen(true);
        return;
      }

      // ⌘⌥R — reset input & output (works in every mode: transform / compare /
      // utils). ⌘⇧R is the browser's hard reload, so we use Alt instead.
      if (mod && event.altKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        shortcutActionsRef.current.reset();
        return;
      }

      // Compare mode routes ⌘Z / ⌘Y / ⌘⇧Z to the diff panes in the handler below — don't double-handle.
      if (activeOperation === "diff") return;

      // ⌘⇧B — Beautify.
      if (mod && event.shiftKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        if (!inputEmpty && !shortcutActionsRef.current.busy) shortcutActionsRef.current.runOperation("beautify");
        return;
      }

      // ⌘⇧M — Minify.
      if (mod && event.shiftKey && event.key.toLowerCase() === "m") {
        event.preventDefault();
        if (!inputEmpty && !shortcutActionsRef.current.busy) shortcutActionsRef.current.runOperation("minify");
        return;
      }

      // ⌘⇧L — toggle live transform.
      if (mod && event.shiftKey && event.key.toLowerCase() === "l") {
        event.preventDefault();
        setLiveTransform((v) => !v);
        return;
      }

      // ⌘⇧S — download output.
      if (mod && event.shiftKey && event.key.toLowerCase() === "s") {
        if (output.trim()) {
          event.preventDefault();
          shortcutActionsRef.current.downloadOutput();
        }
        return;
      }

      // ⌘1–⌘5 — switch output view.
      if (mod && !event.shiftKey && event.key >= "1" && event.key <= "5") {
        const view = (["raw", "tree", "graph", "query", "table"] as const)[Number(event.key) - 1];
        if (view === "raw" || parsedOutput) {
          event.preventDefault();
          setRightView(view);
          setFocusedPane("output");
        }
        return;
      }

      // ⌘+ / ⌘− / ⌘0 — editor font size.
      if (mod && (event.key === "=" || event.key === "+")) {
        event.preventDefault();
        setEditorFontSize((s) => Math.min(24, s + 1));
        return;
      }
      if (mod && event.key === "-") {
        event.preventDefault();
        setEditorFontSize((s) => Math.max(10, s - 1));
        return;
      }
      if (mod && event.key === "0") {
        event.preventDefault();
        setEditorFontSize(13);
        return;
      }

      // ⌥↑ / ⌥↓ — step through input history (Monaco keeps Alt+Up/Down line-move in editors).
      if (alt && (event.key === "ArrowUp" || event.key === "ArrowDown") && !isEditableTarget(event.target)) {
        event.preventDefault();
        shortcutActionsRef.current.moveHistory(event.key === "ArrowUp" ? -1 : 1);
        return;
      }

      // ⌘Y — redo input history (⌘⇧Z is handled in the core handler below).
      if (mod && !event.shiftKey && event.key.toLowerCase() === "y") {
        if (isPlainTextField(event.target)) return;
        event.preventDefault();
        if (isUtilsMode) shortcutActionsRef.current.moveUtilsHistory(1);
        else shortcutActionsRef.current.moveHistory(1);
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [modalKind, inputEmpty, output, parsedOutput, focusedPane, activeOperation, isUtilsMode, showTabs, tabs.length, rightView]);

  // Refresh the ref with fresh closures for functions declared later in this component,
  // so the shortcut handler above never calls a stale version.
  useEffect(() => {
    shortcutActionsRef.current = {
      runOperation,
      downloadOutput,
      copyOutput,
      moveHistory,
      moveUtilsHistory,
      newTab: () => addTab(),
      closeTab: () => closeTab(activeTabId),
      reset: handleWorkspaceReset,
      busy: showBusy,
    };
  });

  const switchToTab = (tabId: string) => {
    if (tabId === activeTabId) return;
    trackEvent("tab_switch");
    tabSnapshotsRef.current.set(activeTabId, captureTabSnapshot());
    const snap = tabSnapshotsRef.current.get(tabId) ?? emptyTabSnapshot();
    historyLock.current = true;
    setActiveTabId(tabId);
    applyTabSnapshot(snap);
    prevBeforeDiffRef.current = null;
    setTimeout(() => { historyLock.current = false; }, 0);
  };

  const addTab = (overrides?: Partial<TabSnapshot>) => {
    trackEvent("tab_add");
    tabSnapshotsRef.current.set(activeTabId, captureTabSnapshot());
    tabCounterRef.current += 1;
    const newId = `t${tabCounterRef.current}`;
    setTabs((prev) => [...prev, { id: newId, label: `T${tabCounterRef.current}`, num: tabCounterRef.current }]);
    setActiveTabId(newId);
    historyLock.current = true;
    const inherited = captureTabSnapshot();
    applyTabSnapshot({
      ...inherited,
      input: "",
      undoStack: [""],
      undoIndex: 0,
      output: "",
      parsedOutput: null,
      error: null,
      diffLeftInput: "",
      diffRightInput: "",
      listCompareOptions: { ...DEFAULT_LIST_PARSE_OPTIONS },
      utilsByTool: {},
      copyAsMemory: {},
      isOutputMaximized: false,
      ...overrides,
    });
    setUtilsRegenKey((k) => k + 1);
    prevBeforeDiffRef.current = null;
    setTimeout(() => { historyLock.current = false; }, 0);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return;
    trackEvent("tab_close");
    const tabIdx = tabs.findIndex((t) => t.id === tabId);
    const closedSnap = tabId === activeTabId ? captureTabSnapshot() : tabSnapshotsRef.current.get(tabId);
    if (closedSnap) {
      const name = chromeTabs[tabIdx]?.name ?? "tab";
      closedTabsRef.current = [...closedTabsRef.current.slice(-9), { tab: tabs[tabIdx], snap: closedSnap, name }];
      setClosedTabName(name);
    }
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

  const closeAllTabs = useCallback(() => {
    if (tabs.length <= 1) return;
    trackEvent("tab_close_all");
    tabSnapshotsRef.current.clear();
    tabSnapshotsRef.current.set("t1", emptyTabSnapshot());
    clearAllTabSettings();
    tabCounterRef.current = 1;
    setTabs([{ id: "t1", label: "T1", num: 1 }]);
    setActiveTabId("t1");
    historyLock.current = true;
    applyTabSnapshot(emptyTabSnapshot());
    prevBeforeDiffRef.current = null;
    setTimeout(() => { historyLock.current = false; }, 0);
    toast({ message: "Closed all tabs" });
    // emptyTabSnapshot and applyTabSnapshot are plain functions recreated every render. They read no state
    // (a blank snapshot, then setters), so the copies captured here stay correct.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabs.length]);

  const closeOtherTabs = useCallback(() => {
    if (tabs.length <= 1) return;
    trackEvent("tab_close_others");
    const currentSnap = captureTabSnapshot();
    tabSnapshotsRef.current.forEach((_, id) => {
      if (id !== activeTabId) tabSnapshotsRef.current.delete(id);
    });
    const kept = tabs.find((t) => t.id === activeTabId);
    if (kept) {
      tabSnapshotsRef.current.set(activeTabId, currentSnap);
      setTabs([kept]);
    }
    toast({ message: "Closed other tabs" });
  }, [tabs, activeTabId, captureTabSnapshot]);

  /** Tabs as the chrome row shows them: automatic names from what each tab does, numbered when repeated. */
  const chromeTabs = useMemo<ChromeTab[]>(() => {
    const auto = tabs.map((t) => {
      if (t.id === activeTabId) {
        return autoTabName({ operation: activeOperation, convertToFormat, typeLanguage, diffKind, utilTab, inputFormat: inputFormatOverride ?? detectedInputFormat });
      }
      const snap = tabSnapshotsRef.current.get(t.id);
      if (!snap) return "Format JSON";
      return autoTabName({
        operation: snap.activeOperation ?? null,
        convertToFormat: snap.convertToFormat,
        typeLanguage: snap.typeLanguage,
        diffKind: snap.diffKind ?? "document",
        utilTab: snap.utilTab ?? "uuid",
        // ponytail: sniff only the head of background tabs so naming stays cheap on huge inputs
        inputFormat: snap.inputFormatOverride ?? detectFormat(snap.input.slice(0, 4000)),
      });
    });
    const numbered = numberDuplicates(auto);
    return tabs.map((t, i) => ({
      id: t.id,
      name: t.renamed && t.label ? t.label : numbered[i],
      custom: Boolean(t.renamed && t.label),
      kind: tabKindOf(t.id === activeTabId ? activeOperation : (tabSnapshotsRef.current.get(t.id)?.activeOperation ?? null)),
    }));
  }, [tabs, activeTabId, activeOperation, convertToFormat, typeLanguage, diffKind, utilTab, inputFormatOverride, detectedInputFormat]);

  /** Empty name returns the tab to its automatic name. */
  const renameTab = useCallback((id: string, name: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, label: name || t.label, renamed: Boolean(name) } : t)));
  }, []);

  const openNewTab = (spec: NewTabSpec) => {
    if (spec.kind === "compare") {
      saveLastUsed({ compare: spec.compare });
      addTab({ activeOperation: "diff", diffKind: spec.compare, isOutputMaximized: true });
    } else if (spec.kind === "utils") {
      saveLastUsed({ utils: spec.tool });
      addTab({ activeOperation: "utils", utilTab: spec.tool as UtilTab, isOutputMaximized: true });
    } else {
      saveLastUsed({ transform: spec.output });
      const [group, value] = spec.output.split(":");
      if (group === "fmt") addTab({ activeOperation: null, convertToFormat: value as FormatKind, rightView: "raw" });
      else if (group === "type") addTab({ activeOperation: "generateTypes", typeLanguage: value as TypeTargetLanguage, rightView: "raw" });
      else {
        addTab({ activeOperation: value as OperationAction, rightView: "raw" });
        if (value === "validate") setModalKind("validate");
      }
    }
  };

  openNewTabRef.current = openNewTab;

  const reopenTab = () => {
    const closed = closedTabsRef.current.pop();
    setClosedTabName(closedTabsRef.current.at(-1)?.name ?? null);
    if (!closed) return;
    tabSnapshotsRef.current.set(activeTabId, captureTabSnapshot());
    tabCounterRef.current += 1;
    const id = `t${tabCounterRef.current}`;
    setTabs((prev) => [...prev, { ...closed.tab, id, num: tabCounterRef.current }]);
    setActiveTabId(id);
    historyLock.current = true;
    applyTabSnapshot(closed.snap);
    prevBeforeDiffRef.current = null;
    setTimeout(() => { historyLock.current = false; }, 0);
  };

  /** Refs/handlers for the Left/Right/List header rename editor. */
  const renamingListSideRef = useRef<RenameSide | null>(null);
  const startListRename = useCallback(
    (side: RenameSide, el: HTMLElement | null) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      renamingListSideRef.current = side;
      setListRenameRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      setRenamingListSide(side);
      const current = tabs.find((t) => t.id === activeTabId);
      const existing = side === "right" ? current?.rightLabel : current?.leftLabel;
      setListRenameValue(existing ?? (diffKind === "document" ? (side === "left" ? "Document A" : "Document B") : side === "left" ? "Left" : side === "right" ? "Right" : "List"));
    },
    [tabs, activeTabId, diffKind],
  );
  /** Same rename behaviour as tabs: empty or Escape keeps the old name. A single list stores its name under "left". */
  const commitListRename = useCallback((name: string | null) => {
    const side = renamingListSideRef.current;
    renamingListSideRef.current = null;
    setRenamingListSide(null);
    setListRenameRect(null);
    if (!side || !name) return;
    const key = side === "right" ? "rightLabel" : "leftLabel";
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, [key]: name } : t)));
  }, [activeTabId]);

  useEffect(() => {
    try {
      const s = localStorage.getItem("formaty-session");
      if (s) {
        const d = JSON.parse(s) as { themeMode?: ThemeMode };
        if (d.themeMode === "dark" || d.themeMode === "light" || d.themeMode === "system") setThemeMode(d.themeMode);
      }
    } catch {}
    try {
      const learned = JSON.parse(localStorage.getItem("formaty-learned-chips") ?? "null") as OutputId[] | null;
      if (Array.isArray(learned) && learned.length > 0) setLearnedChips(learned.slice(0, 2));
    } catch {}
    try {
      if (localStorage.getItem("formaty-onboarded") !== "1") {
        setShowFirstRunHint(true);
      }
    } catch {}
    setSystemDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    setIsDesktopLayout(window.matchMedia("(min-width: 900px)").matches);
    setIsShortViewport(window.matchMedia("(max-height: 699px)").matches);
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
      style.textContent = themeInlineCss(resolvedTheme);
    }
  }, [resolvedTheme, themeSynced]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 900px)");
    const onChange = (event: MediaQueryListEvent) => setIsDesktopLayout(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-height: 699px)");
    const onChange = (event: MediaQueryListEvent) => setIsShortViewport(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  // Layout effect: the saved session must be in state before the first paint (and before any
  // click can run against the default tab), not whenever React gets to passive effects.
  useLayoutEffect(() => {
    if (initialState) {
      isViewingSharedRef.current = true;
      const s = upgradeListOptions(initialState, initialState.listOptionsVersion) as WorkspaceState & {
        tabs?: Tab[];
        activeTabId?: string;
        showTabs?: boolean;
        tabSnapshots?: Record<string, TabSnapshot>;
      };
      // Multi-tab share: restore full tab rail + snapshots
      if (Array.isArray(s.tabs) && s.tabs.length > 0 && s.tabSnapshots && typeof s.tabSnapshots === "object") {
        const migrated: Tab[] = s.tabs.map((t: Tab, i: number) => ({
          ...t,
          num: (t as Partial<Tab>).num ?? (Number(String((t as Partial<Tab>).label ?? "").replace(/\D/g, "")) || i + 1),
          renamed: Boolean((t as Partial<Tab>).renamed),
        }));
        setTabs(migrated);
        tabCounterRef.current = Math.max(0, ...migrated.map((t: Tab) => t.num));
        const activeId = s.activeTabId && migrated.some((t: Tab) => t.id === s.activeTabId) ? s.activeTabId : migrated[0].id;
        setActiveTabId(activeId);
        const map = new Map<string, TabSnapshot>();
        for (const [k, v] of Object.entries(s.tabSnapshots)) {
          if (v && typeof v === "object") {
            const snap = upgradeListOptions({ ...(v as object) } as { output?: string; listCompareOptions?: Partial<ListParseOptions> }, s.listOptionsVersion);
            if (isStaleDiffOutput(snap.output)) snap.output = "";
            map.set(k, snap as TabSnapshot);
          }
        }
        tabSnapshotsRef.current = map;
        const activeSnap = map.get(activeId) as TabSnapshot | undefined;
        if (activeSnap) {
          historyLock.current = true;
          applyTabSnapshot(activeSnap);
          // Per-tab extras that live outside the snapshot in share payload
          if (activeSnap.listCompareOptions) setListCompareOptions((prev) => ({ ...prev, ...activeSnap.listCompareOptions }));
          if (activeSnap.csvColumn) setCsvColumn(activeSnap.csvColumn);
          if (activeSnap.queryText) setQueryText(activeSnap.queryText);
          if (activeSnap.compareActiveBucket) setActiveBucket(activeSnap.compareActiveBucket);
          if (activeSnap.utilTab) setUtilTab(activeSnap.utilTab as UtilTab);
          setTimeout(() => { historyLock.current = false; }, 0);
        }
        // Also restore top-level single-tab fields that may still be present (e.g. diffKind)
        if (s.diffKind) setDiffKind(s.diffKind as "document" | "list" | "single");
        if (s.listCompareOptions) setListCompareOptions((prev) => ({ ...prev, ...s.listCompareOptions }));
        if (s.csvColumn) setCsvColumn(s.csvColumn);
        if (s.queryText) setQueryText(s.queryText);
        if (s.compareActiveBucket) setActiveBucket(s.compareActiveBucket);
        if (s.utilTab) setUtilTab(s.utilTab as UtilTab);
        if (typeof s.split === "number") setSplit(Math.max(25, Math.min(60, s.split)));
        const urlId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null;
        if (urlId) {
          setSharedLinkId(urlId);
          setSharedLinkUrl(`${window.location.origin}/playground?id=${urlId}`);
        } else if (initialSharedLinkId) {
          setSharedLinkId(initialSharedLinkId);
          if (initialSharedLinkUrl) setSharedLinkUrl(initialSharedLinkUrl);
        }
        sessionRestoredRef.current = true;
        return;
      }
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
      if (typeof initialState.split === "number") setSplit(Math.max(25, Math.min(60, initialState.split)));
      if (initialState.diffKind) setDiffKind(initialState.diffKind as "document" | "list" | "single");
      if (initialState.diffLeftInput) setDiffLeftInput(initialState.diffLeftInput);
      if (initialState.diffRightInput) setDiffRightInput(initialState.diffRightInput);
      if (initialState.listCompareOptions) setListCompareOptions((prev) => ({ ...prev, ...upgradeListOptions(initialState, initialState.listOptionsVersion).listCompareOptions }));
      if (initialState.csvColumn) setCsvColumn(initialState.csvColumn);
      if (initialState.queryText) setQueryText(initialState.queryText);
      if (initialState.compareActiveBucket) setActiveBucket(initialState.compareActiveBucket);
      if (initialState.utilTab) setUtilTab(initialState.utilTab as UtilTab);
      if (initialState.leftLabel || initialState.rightLabel) {
        setTabs((prev) => prev.map((t) => (t.id === activeTabId
          ? { ...t, leftLabel: initialState.leftLabel, rightLabel: initialState.rightLabel }
          : t)));
      }
      if (initialState.activeOperation === "diff" || initialState.activeOperation === "utils") setIsOutputMaximized(true);
      const urlId2 = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("id") : null;
      if (urlId2) {
        setSharedLinkId(urlId2);
        setSharedLinkUrl(`${window.location.origin}/playground?id=${urlId2}`);
      } else if (initialSharedLinkId) {
        setSharedLinkId(initialSharedLinkId);
        if (initialSharedLinkUrl) setSharedLinkUrl(initialSharedLinkUrl);
      }
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
        if (preset.schemaText) setSchemaInput(preset.schemaText);
        if ("diffLeftInput" in preset && preset.diffLeftInput) setDiffLeftInput(preset.diffLeftInput);
        if ("diffRightInput" in preset && preset.diffRightInput) setDiffRightInput(preset.diffRightInput);
        if (preset.diffKind && (preset.diffKind === "document" || preset.diffKind === "list" || preset.diffKind === "single")) {
          setDiffKind(preset.diffKind);
        }
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
      // A shared link opens as extra tab(s) on top of the visitor's own saved tabs (merged by the
      // effect below once the session has loaded), never in place of them.
      pendingShareRef.current = upgradeListOptions(state, state.listOptionsVersion);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    // The saved session loads once. Re-running (Fast Refresh, search-param change) would put
    // the last debounced save over live tabs and replace the in-memory snapshot map.
    if (sessionLoadedRef.current) return;
    sessionLoadedRef.current = true;
    try {
      const raw = localStorage.getItem("formaty-session");
      if (!raw) return;
      const data = JSON.parse(raw) as {
        listOptionsVersion?: number;
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
        lineWrap?: boolean;
        autoFormatOnPaste?: boolean;
        mobileShowOutput?: boolean;
        activeOperation?: OperationAction;
        tabs?: Tab[];
        activeTabId?: string;
        tabCounter?: number;
        tabSnapshots?: Record<string, unknown>;
        showTabs?: boolean;
        outputActionVisibility?: OutputActionVisibility;
      };
    if (data.input) setInput(data.input);
    if (data.output) setOutput(cleanSessionOutput(data.output));
    if (typeof data.split === "number") setSplit(Math.max(25, Math.min(60, data.split)));
    if (data.themeMode) setThemeMode(data.themeMode);
    if (data.typeLanguage) setTypeLanguage(data.typeLanguage);
    if (data.rightView) setRightView(data.rightView);
    if (data.convertToFormat) setConvertToFormat(data.convertToFormat);
    if (typeof data.editorFontSize === "number") setEditorFontSize(data.editorFontSize);
      if (typeof data.liveTransform === "boolean") setLiveTransform(data.liveTransform);
      if (typeof data.lineWrap === "boolean") setLineWrap(data.lineWrap);
      if (typeof data.autoFormatOnPaste === "boolean") setAutoFormatOnPaste(data.autoFormatOnPaste);
      if (typeof data.mobileShowOutput === "boolean") setMobileShowOutput(data.mobileShowOutput);
      if (data.activeOperation) setActiveOperation(data.activeOperation);
      // Restore tabs
      if (Array.isArray(data.tabs) && data.tabs.length > 0) {
        // Migrate tabs saved by older sessions (no num/renamed) and reset the
        // counter per session: new tabs continue from the highest existing number.
        const migrated: Tab[] = data.tabs.map((t, i) => ({
          ...t,
          num: (t as Partial<Tab>).num ?? (Number(String((t as Partial<Tab>).label ?? "").replace(/\D/g, "")) || i + 1),
          renamed: Boolean((t as Partial<Tab>).renamed),
        }));
        setTabs(migrated);
        // Never reuse the id of a tab closed before the reload.
        tabCounterRef.current = Math.max(typeof data.tabCounter === "number" ? data.tabCounter : 0, ...migrated.map((t) => t.num));
        if (data.activeTabId && migrated.some((t: Tab) => t.id === data.activeTabId)) {
          setActiveTabId(data.activeTabId);
        } else {
          setActiveTabId(data.tabs[0].id);
        }
        if (data.tabSnapshots && typeof data.tabSnapshots === "object") {
          const map = new Map<string, TabSnapshot>();
          for (const [k, v] of Object.entries(data.tabSnapshots)) {
            if (v && typeof v === "object") {
              const snap = upgradeListOptions({ ...(v as object) } as { output?: string; listCompareOptions?: Partial<ListParseOptions> }, data.listOptionsVersion);
              if (isStaleDiffOutput(snap.output)) snap.output = "";
              map.set(k, snap as TabSnapshot);
            }
          }
          tabSnapshotsRef.current = map;
          const activeId =
            data.activeTabId && data.tabs.some((t: Tab) => t.id === data.activeTabId)
              ? data.activeTabId
              : data.tabs[0].id;
          const activeSnap = map.get(activeId);
          if (activeSnap) {
            // The tab's own snapshot is the single source for everything per-tab (operation,
            // compare kind, inputs, options); the top-level copies above are only a fallback.
            historyLock.current = true;
            applyTabSnapshot({ ...emptyTabSnapshot(), ...activeSnap });
            setTimeout(() => { historyLock.current = false; }, 0);
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
      if (data.outputActionVisibility && typeof data.outputActionVisibility === "object") {
        setOutputActionVisibility((prev) => ({ ...prev, ...(data.outputActionVisibility as OutputActionVisibility) }));
      }
    } catch {
      // Ignore malformed persisted sessions.
    }
    // Restore-once effect: `initialState` may be a fresh object reference each render, so
    // it is intentionally not a dep - re-running would re-apply shared state and clobber
    // user edits. `executeOperation` is also referenced here (tool-preset restore).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]);

  /**
   * Adds a shared link's tabs and switches to the first. `live` is true when the workspace is already in
   * use (a link pasted into an open playground): the current tab is saved first. Without a saved session
   * the shared tabs replace the blank starter tab.
   */
  const openShared = (shared: WorkspaceState, live: boolean) => {
    const entries = sharedTabEntries(shared);
    if (!entries.length) return;
    if (live) tabSnapshotsRef.current.set(activeTabId, captureTabSnapshot());
    const keep = live || sessionRestoredRef.current;
    let counter = keep ? tabCounterRef.current : 0;
    const added = entries.map(({ tab, snap }) => {
      counter += 1;
      const id = `t${counter}`;
      tabSnapshotsRef.current.set(id, snap);
      return { ...tab, id, num: counter, label: tab.renamed ? tab.label : `T${counter}` };
    });
    tabCounterRef.current = counter;
    if (!keep) tabSnapshotsRef.current.forEach((_, id) => !added.some((t) => t.id === id) && tabSnapshotsRef.current.delete(id));
    setTabs((prev) => (keep ? [...prev, ...added] : added));
    setActiveTabId(added[0].id);
    historyLock.current = true;
    applyTabSnapshot(tabSnapshotsRef.current.get(added[0].id)!);
    setTimeout(() => { historyLock.current = false; }, 0);
    sessionRestoredRef.current = true;
    toast({ message: added.length === 1 ? "Opened the shared tab" : `Opened ${added.length} shared tabs`, type: "info" });
  };
  const openSharedRef = useRef(openShared);
  openSharedRef.current = openShared;

  // A link opened in a new page: the restore effect above parked it until the saved session loaded.
  useEffect(() => {
    const shared = pendingShareRef.current;
    pendingShareRef.current = null;
    if (shared) openSharedRef.current(shared, false);
  }, []);

  // A link pasted into the address bar of an open playground only changes the hash.
  useEffect(() => {
    const onHash = () => {
      const state = decodeState(window.location.hash.slice(1));
      if (!state) return;
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      openSharedRef.current(upgradeListOptions(state, state.listOptionsVersion), true);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (isViewingSharedRef.current) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    // Debounced: serializing every tab snapshot + undo history per keystroke is expensive.
    // The pagehide flush below covers unload within the debounce window.
    const write = () => {
      if (suppressSessionFlushRef.current) return;
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
      // Anything over LARGE_INPUT_BYTES (400 KiB) gets dropped from the
      // persisted session — localStorage quotas (5-10 MB) cannot hold a
      // 10+ MB input. Settings, tabs, and snapshots still persist; the
      // user can reload to recover them, and huge inputs go through the
      // share URL anyway.
      const isHeavyInput = input.length > LARGE_INPUT_BYTES;
      const isHeavyOutput = persistOutput.length > LARGE_INPUT_BYTES;
      const persistInput = isHeavyInput ? "" : input;
      const persistOut = isHeavyOutput ? "" : persistOutput;
      const persistSnapshots: Record<string, unknown> = {};
      if (isHeavyInput) {
        // Keep the active tab metadata but strip its text fields.
        const current = allSnapshots[activeTabId] as Record<string, unknown> | undefined;
        if (current) {
          const meta = { ...current };
          delete meta.input;
          delete meta.output;
          delete meta.undoStack;
          persistSnapshots[activeTabId] = meta;
        }
        // Other tab snapshots are safe to keep only if their text is small;
        // we already cap them implicitly by skipping the whole block.
      } else {
        Object.assign(persistSnapshots, allSnapshots);
      }
      const payload = {
        input: persistInput,
        output: persistOut,
        split,
        themeMode,
        typeLanguage,
        rightView,
        formatOptions,
        convertToFormat,
        liveTransform,
        editorFontSize,
        lineWrap,
        autoFormatOnPaste,

        mobileShowOutput,
        activeOperation,
        outputActionVisibility,
        tabs,
        activeTabId,
        showTabs,
        tabCounter: tabCounterRef.current,
        listOptionsVersion: LIST_OPTIONS_VERSION,
        tabSnapshots: persistSnapshots,
      };
      try {
        localStorage.setItem("formaty-session", JSON.stringify(payload));
      } catch (e) {
        // Last-resort: a stale tab snapshot or a transient setItem failure
        // should never crash the page. Drop the snapshot map and retry; if
        // even the empty-state payload fails, swallow the error.
        if (!(e instanceof Error) || e.name !== "QuotaExceededError") return;
        try {
          localStorage.setItem(
            "formaty-session",
            JSON.stringify({ ...payload, tabSnapshots: {} }),
          );
        } catch {
          // localStorage is unusable (private mode, locked, etc.) — bail.
        }
      }
    };
    // pagehide writes through the same function, so a reload mid-debounce saves one
    // consistent render (tabs, active id, snapshots, active operation) instead of a mix.
    persistSessionRef.current = write;
    const timer = setTimeout(write, 500);
    return () => clearTimeout(timer);
  }, [input, output, split, themeMode, typeLanguage, rightView, formatOptions, convertToFormat, liveTransform, editorFontSize, lineWrap, autoFormatOnPaste, mobileShowOutput, activeOperation, outputActionVisibility, tabs, activeTabId, showTabs, inputFormatOverride, undoStack, undoIndex, outputExt, outputLanguage, diffLeftInput, diffRightInput, diffKind, isOutputMaximized, utilTab, utilsByTool, captureTabSnapshot]);

  // Synchronous safety-net save on tab hide/reload so the new-version
  // toast's `location.reload()` never loses an in-flight edit between the
  // last render commit and the unload.
  useEffect(() => {
    const flush = () => persistSessionRef.current();
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  // Prefer structured parse for views (table/tree/graph/query).
  // Debounced: re-parsing the whole document on every keystroke blocks the main thread.
  useEffect(() => {
    const delay = input.length + output.length > LARGE_INPUT_BYTES ? 600 : 200;
    const timer = setTimeout(() => {
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
    }, delay);
    return () => clearTimeout(timer);
  }, [output, outputLanguage, isDiffMode, isUtilsMode, input]);

  // Auto-select Table once when a new array-of-objects lands on default Raw view
  const lastAutoTableKeyRef = useRef("");
  useEffect(() => {
    if (isDiffMode || isUtilsMode || !parsedOutput) return;
    if (rightView !== "raw") return; // respect explicit view choices
    if (outputLanguage === "csv") return; // keep CSV output on Raw by default
    if (activeOperation === "generateTypes") return; // generated text (types/SQL) stays on Raw
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
  }, [parsedOutput, rightView, isDiffMode, isUtilsMode, outputLanguage, activeOperation]);

  useEffect(() => {
    if (!sessionRestoredRef.current || !input.trim() || !activeOperation) return;
    sessionRestoredRef.current = false;
    if (activeOperation === "diff") return;
    const id = setTimeout(() => {
      if (activeOperation === "generateTypes") {
        trackEvent("generate_types", { language: typeLanguage });
        executeOperationRef.current?.("generateTypes", { typeLanguage });
        return;
      }
      if (activeOperation === "format" || activeOperation === "beautify" || OPERATION_ACTIONS.some(([, a]) => a === activeOperation)) {
        if (activeOperation === "format" || activeOperation === "beautify") {
          runConvertRef.current?.(convertToFormat);
        } else {
          executeOperationRef.current?.(activeOperation);
        }
      }
    }, 500);
    return () => clearTimeout(id);
    // One-shot restore timer guarded by sessionRestoredRef. executeOperation / runConvert
    // are declared later in the component and intentionally not in deps.
  }, [input, output, activeOperation, convertToFormat, typeLanguage]);

  useEffect(() => {
    if (isViewingSharedRef.current) return;
    if ((rightView === "tree" || rightView === "graph" || rightView === "query" || rightView === "table") && !parsedOutput && !output.trim() && !input.trim()) {
      setRightView("raw");
    }
  }, [rightView, parsedOutput, output, input]);

  // Latest-ref: timers below fire after render, so they must call the current
  // executeOperation / runConvert (declared further down), not a captured one.
  const executeOperationRef = useRef<typeof executeOperation | null>(null);
  const runConvertRef = useRef<typeof runConvert | null>(null);
  const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveTransformTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // One-shot lock: recipes load sample input via setInput, which would trigger the
  // debounced live-transform and clobber the recipe's own output. Skip one cycle.
  const recipeInputLockRef = useRef(false);
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
      } catch (e) {
        setInputValid(false);
        setValidationError(e instanceof Error ? e.message : "Not a curl command");
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
    // One-shot recipe lock: consume (and skip) the live-transform cycle that a
    // recipe's setInput(sample) would otherwise trigger, clobbering its output.
    if (recipeInputLockRef.current) {
      recipeInputLockRef.current = false;
      return;
    }
    if (!liveTransform || !input.trim()) return;
    // Don't clobber a user-driven output mode (Types/Schema/Validate/Compare/Utils)
    // with a Transform cycle just because the input was edited.
    if (
      (activeOperation && STICKY_OPS.includes(activeOperation)) ||
      activeOperation === "diff" ||
      activeOperation === "utils"
    ) return;
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
          // Keep Transform mode and the user's chosen output view (don't clobber Compare/Utils,
          // and don't clobber Types/Schema modes when the user picks Sample on a tab
          // that inherited those settings from another tab).
          setActiveOperation((op) => {
            if (op === "diff" || op === "utils" || (op && STICKY_OPS.includes(op))) return op;
            return null;
          });
          // A list of records switching to Table is the auto-table effect's job: it does it once per
          // data shape, so picking Text afterwards sticks.
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
  }, [liveTransform, input, convertToFormat, activeOperation, run]);

  // Re-run Types/Schema/Validate when the input changes so a sample loaded on a
  // tab that inherited these modes from another tab regenerates the output
  // (liveTransform above early-returns for these modes, so they need their own
  // debounce).
  useEffect(() => {
    if (!input.trim()) return;
    if (!activeOperation || !STICKY_OPS.includes(activeOperation)) return;
    const id = setTimeout(() => {
      if (!inputRef.current.trim()) return;
      executeOperationRef.current?.(activeOperation, {
        inputText: inputRef.current,
        ...(activeOperation === "generateTypes" ? { typeLanguage } : {}),
      });
    }, 400);
    return () => clearTimeout(id);
  }, [input, activeOperation, typeLanguage, typeName, sqlTable, sqlDialect]);



  useEffect(() => {
    if (!isResizing) return;

    const onMouseMove = (event: MouseEvent) => {
      const section = splitContainerRef.current;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const nextSplit = ((event.clientX - rect.left) / rect.width) * 100;
      setSplit(Math.max(25, Math.min(60, Math.round(nextSplit))));
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

  // Ctrl/Cmd+Enter can reach parseOnly twice for a single keypress - once via the
  // global window keydown handler and once via Monaco's own keybinding (JsonEditor
  // onCtrlEnter), which Monaco dispatches a beat later (~400ms). Both paths must
  // stay live so the shortcut works on every platform (e.g. plain Ctrl on macOS)
  // and focus state, so the duplicate is deduped here instead of dropping either
  // path: a duplicate call always carries the same input text within a short
  // window, while a deliberate re-run after editing changes the text.
  const lastParseRunRef = useRef<{ at: number; text: string } | null>(null);
  const parseOnly = useCallback((inputOverride?: string, formatOverride?: InputFormatKind) => {
    const text = inputOverride ?? input;
    const now = Date.now();
    const last = lastParseRunRef.current;
    if (last && now - last.at < 1000 && last.text === text) return;
    lastParseRunRef.current = { at: now, text };
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
            if (cache.meta) setCurlMeta(cache.meta);
          } else {
            setCurlFetching(true);
            try {
              const parsed = parseCurl(text);
              const executed = await executeCurlDetailed(parsed);
              toParse = executed.body;
              setCurlMeta(executed);
              setLastExecutedCurlInput(text);
              curlCacheRef.current = { input: text, result: toParse, meta: executed };
            } finally {
              setCurlFetching(false);
            }
          }
          parseFmt = detectFormat(toParse) === "curl" ? "json" : (detectFormat(toParse) as FormatKind);
        }
        let json: JsonValue;
        try {
          json = await run<JsonValue>("parseFormat", {
            input: toParse,
            format: parseFmt,
          });
        } catch (e) {
          if (fmt !== "curl") throw e;
          // The cURL ran fine but the response isn't structured data (plain
          // text, HTML, an error page, a binary download, ...). Show the raw
          // body instead of failing with a JSON parse error, so Ctrl+Enter on
          // any cURL always lands somewhere useful.
          setOutput(toParse);
          setOutputLanguage("plaintext");
          setOutputExt("txt");
          setParsedOutput(null);
          setActiveOperation(null);
          if (!isDesktopLayout) setMobileShowOutput(true);
          return;
        }
        if (activeOperation && STICKY_OPS.includes(activeOperation)) {
          // Keep the chosen output (types, schema, ...) and refresh it for the new input.
          setParsedOutput(json);
          executeOperationRef.current?.(activeOperation, {
            inputText: text,
            ...(activeOperation === "generateTypes" ? { typeLanguage } : {}),
          });
          return;
        }
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
  }, [input, resolvedInputFormat, run, convertJsonToOutput, setOutputData, isDesktopLayout, activeOperation, typeLanguage]);

  /** Open the guided tour (auto-start or explicit replay). Never double-opens. */
  const openTour = useCallback((source: "auto" | "settings" | "palette" | "statusbar") => {
    if (tourOpenedRef.current) return;
    tourOpenedRef.current = true;
    setShowFirstRunHint(false);
    setTourOpen(true);
    trackEvent("tour_started", { source });
  }, []);

  /** Tour finished or was skipped - mark the user onboarded and fire analytics. */
  const closeTour = useCallback((reason: "done" | "skip" | "esc", step: number) => {
    setTourOpen(false);
    // Allow the tour to be replayed later (Settings / ⌘K / status bar).
    tourOpenedRef.current = false;
    try {
      localStorage.setItem("formaty-onboarded", "1");
    } catch {
      /* ignore */
    }
    if (reason === "done") {
      trackEvent("tour_completed", { steps: step + 1 });
    } else {
      trackEvent("tour_skipped", { step: step + 1 });
    }
  }, []);

  // Guided tour: auto-start for first-time users once the workspace settles.
  useEffect(() => {
    if (embed) return;
    let onboarded = false;
    try {
      onboarded = localStorage.getItem("formaty-onboarded") === "1";
    } catch {
      /* ignore */
    }
    if (onboarded) return;
    // Mid-workflow landings (shared link, tool preset, restored session) skip the tour.
    const hasToolPreset = !!searchParams?.get("tool");
    const suppressed = !!initialState || isViewingSharedRef.current || hasToolPreset || !!loadedToolPreset || sessionRestoredRef.current;
    if (suppressed) return;
    // Suppress the quick-tip toast for this session before the tour opens.
    setShowFirstRunHint(false);
    const id = window.setTimeout(() => {
      openTour("auto");
    }, 1200);
    return () => window.clearTimeout(id);
  }, [embed, initialState, loadedToolPreset, searchParams, openTour]);

  // Fill the input with sample data when the tour starts so the output-pane steps show real content.
  const tourSampleLoadedRef = useRef(false);
  useEffect(() => {
    if (!tourOpen) return;
    if (tourSampleLoadedRef.current) return;
    tourSampleLoadedRef.current = true;
    if (input.trim()) return; // user already has data - keep it
    setInput(SAMPLE_JSON);
    setInputFormatOverride(null);
    setError(null);
    setValidationError(null);
    parseOnly(SAMPLE_JSON, "json");
  }, [tourOpen, input, parseOnly]);

  // Replay the tour from the status bar ("formaty:replay-tour" event).
  useEffect(() => {
    const onReplay = () => openTour("statusbar");
    window.addEventListener("formaty:replay-tour", onReplay);
    return () => window.removeEventListener("formaty:replay-tour", onReplay);
  }, [openTour]);

  const executeOperation = useCallback((
    action: OperationAction,
    options?: {
      schemaText?: string;
      leftText?: string;
      rightText?: string;
      inputText?: string;
      typeLanguage?: TypeTargetLanguage;
      formatOptions?: FormatOptions;
    },
  ) => {
    // Snapshot before the action so "Actions → None" can restore the previous output.
    prevActionStateRef.current = { output, parsedOutput };
    setBusy(true);
    setError(null);
    void (async () => {
      try {
        if (action === "diff") {
          // Visual diff + path stats live in Diff UI only - never overwrite the main output
          // panel (that left a leftover `{...}` path-diff JSON after exiting).
          setBusy(false);
          return;
        }

        const left = await getParsedInput(options?.inputText);

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
            rootName: typeName.trim() || undefined,
            sqlOptions: targetLanguage === "sql" ? { dialect: sqlDialect, tableName: sqlTable.trim() || undefined } : undefined,
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

        if (action === "openapi") {
          const spec = generateOpenApiSpec(left);
          setOutputData(spec, action);
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
  }, [getParsedInput, parseSchemaToObject, run, convertJsonToOutput, setOutputData, schemaInput, typeLanguage, formatOptions, convertToFormat, sqlDialect, typeName, sqlTable, output, parsedOutput]);

  const runConvert = useCallback((toFormat: FormatKind, inputText?: string) => {
    trackEvent("convert", { to_format: toFormat, mode: "transform" });
    setConvertToFormat(toFormat);
    setFocusedPane("output");
    if (!isDesktopLayout) setMobileShowOutput(true);
    setBusy(true);
    setError(null);
    void (async () => {
      try {
        const json = await getParsedInput(inputText);
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

  useEffect(() => {
    executeOperationRef.current = executeOperation;
    runConvertRef.current = runConvert;
  });

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
    (side: "left" | "right" | "both", sortKeys = false) => {
      let left = diffEditorRef.current?.getOriginalValue() ?? diffLeftInput;
      let right = diffEditorRef.current?.getModifiedValue() ?? diffRightInput;
      let ok = false;
      try {
        if (side === "left" || side === "both") {
          if (left.trim()) {
            left = formatJson(JSON.parse(left) as JsonValue, { indentation: formatOptions.indentation, sortKeys });
            ok = true;
          }
        }
        if (side === "right" || side === "both") {
          if (right.trim()) {
            right = formatJson(JSON.parse(right) as JsonValue, { indentation: formatOptions.indentation, sortKeys });
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


  const runOperation = (action: OperationAction, inputText?: string) => {
    trackEvent("operation", { action, mode: isUtilsMode ? "utils" : isDiffMode ? "compare" : "transform" });
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
      // Enter Compare - preserve Transform state; do not wipe existing compare panes
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
      // Keep rightView (e.g. table) in state - Compare renders when isDiffMode, independent of view
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
    // Auto-switch to raw when running a transform action from a visual view
    // (tree / graph / query / table) so the user sees the text output.
    if (!isDiffMode && !isUtilsMode && rightView !== "raw") {
      setRightView("raw");
    }
    executeOperation(action, { inputText });
  };

  const downloadOutput = (format?: "png" | "jpg") => {
    trackEvent("download", { format: format ?? "text", mode: isUtilsMode ? "utils" : isDiffMode ? "compare" : "transform" });
    if (isGraphView) {
      void (async () => {
        try {
          if (!graphViewRef.current) {
            throw new Error("Graph export is not ready yet.");
          }
          await graphViewRef.current.downloadImage(format ?? "png");
          toast({ message: "Downloaded" });
        } catch (e) {
          console.warn("Graph download failed:", e);
          toast({ message: "Download failed", type: "error" });
        }
      })();
      return;
    }
    // Query view: download the query result, not the raw output.
    if (!isDiffMode && !isUtilsMode && rightView === "query" && queryResult) {
      const blob = new Blob([queryResult], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "formaty-query-result.json";
      a.click();
      URL.revokeObjectURL(url);
      toast({ message: "Downloaded" });
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
    toast({ message: "Downloaded" });
  };

  const requestShare = () => setShareOpen(true);

  /** Package the workspace for sharing. Builds state only; nothing is sent. */
  const buildShareState = (allTabs: boolean) => {
    // Flush active tab into snapshot map before packaging multi-tab share
    tabSnapshotsRef.current.set(activeTabId, captureTabSnapshot());
    const includeAllTabs = allTabs && tabs.length > 1;
    const workspaceState: import("@/lib/shareState").WorkspaceState & {
      tabs?: Tab[];
      activeTabId?: string;
      showTabs?: boolean;
      tabSnapshots?: Record<string, TabSnapshot>;
      diffLeftInput?: string;
      diffRightInput?: string;
      diffKind?: "document" | "list" | "single";
      utilTab?: UtilTab;
    } = {
      listOptionsVersion: LIST_OPTIONS_VERSION,
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
      queryText: rightView === "query" ? queryText : undefined,
      listCompareOptions: isDiffMode ? listCompareOptions : undefined,
      csvColumn: isDiffMode ? csvColumn ?? undefined : undefined,
      compareActiveBucket: isDiffMode && !includeAllTabs ? activeBucket : undefined,
      leftLabel: !includeAllTabs ? tabs.find((t) => t.id === activeTabId)?.leftLabel : undefined,
      rightLabel: !includeAllTabs ? tabs.find((t) => t.id === activeTabId)?.rightLabel : undefined,
    };
    // Every link carries tab snapshots, so a Compare or Utils tab opens as itself. Undo history and the
    // parsed output are left out: the first is private and long, the second is rebuilt on open.
    const lean = (snap: TabSnapshot): TabSnapshot => ({ ...snap, output: cleanSessionOutput(snap.output), parsedOutput: null, undoStack: [snap.input], undoIndex: 0, error: null });
    const shared = includeAllTabs ? tabs : tabs.filter((t) => t.id === activeTabId);
    const all: Record<string, TabSnapshot> = {};
    for (const t of shared) {
      const snap = tabSnapshotsRef.current.get(t.id);
      if (snap) all[t.id] = lean(snap);
    }
    workspaceState.tabs = shared;
    workspaceState.activeTabId = activeTabId;
    workspaceState.tabSnapshots = all;
    return workspaceState;
  };

  /** Hash links carry only the tabs: the top-level copies of the active tab would double the length. */
  const buildShareHash = (allTabs: boolean) => {
    const { tabs: sharedTabs, activeTabId: sharedActive, tabSnapshots, listOptionsVersion } = buildShareState(allTabs);
    return encodeState({ input: "", listOptionsVersion, tabs: sharedTabs, activeTabId: sharedActive, tabSnapshots });
  };

  /** The only path that uploads workspace data. Called from the Share dialog's explicit button. */
  const uploadShare = async (allTabs: boolean): Promise<string | null> => {
    trackEvent("share", { all_tabs: allTabs && tabs.length > 1 });
    const workspaceState = buildShareState(allTabs);
    let id: string | null = null;
    if (sharedLinkId && (await updatePlayground(sharedLinkId, workspaceState))) id = sharedLinkId;
    if (!id) id = (await savePlayground(workspaceState))?.id ?? null;
    if (!id) return null;
    const url = `${window.location.origin}/playground?id=${id}`;
    setSharedLinkId(id);
    setSharedLinkUrl(url);
    return url;
  };

  const deleteShared = async () => {
    const idToDelete = sharedLinkId;
    setSharedLinkId(null);
    setSharedLinkUrl(null);
    isViewingSharedRef.current = false;
    if (idToDelete) await deletePlayground(idToDelete);
  };

  const copyOutput = async () => {
    trackEvent("copy", { format: isGraphView ? "png" : "text", mode: isUtilsMode ? "utils" : isDiffMode ? "compare" : "transform" });
    setActionBounce("copy");
    setTimeout(() => setActionBounce(null), 300);
    if (isGraphView) {
      try {
        if (!graphViewRef.current) {
          throw new Error("Graph export is not ready yet.");
        }
        await graphViewRef.current.copyPngToClipboard();
        setCopyState("done");
        toast({ message: "Copied graph as PNG" });
      } catch {
        setCopyState("error");
        toast({ message: "Copy failed", type: "error" });
      }
      resetCopySoon();
      return;
    }
    if (!output.trim()) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopyState("done");
      const modeLabel = isUtilsMode ? "utils output" : isDiffMode ? "compare output" : "transform output";
      toast({ message: `Copied ${modeLabel}` });
    } catch {
      setCopyState("error");
      toast({ message: "Copy failed", type: "error" });
    }
    resetCopySoon();
  };

  const getActiveOutputText = useCallback((): string => {
    if (isUtilsMode) {
      const s = utilsByTool[utilTab];
      if (s?.uuidList && s.uuidList.length > 0) return s.uuidList.join("\n");
      if (s?.pwList && s.pwList.length > 0) return s.pwList.join("\n");
      return s?.output ?? "";
    }
    if (isDiffMode) {
      if (diffKind === "list" || diffKind === "single") return listCompareExport?.text ?? "";
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
    // Query view: global copy should copy the query result, not the raw output.
    if (rightView === "query" && queryResult) return queryResult;
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
    rightView,
    queryResult,
    output,
  ]);

  /** Text for a Copy as format. Throws when it cannot be built. */
  const resolveCopyText = (format: CopyAsFormat): string => {
    const raw = getActiveOutputText();
    {
      let text: string;
      // Regex tab: extract match values from JSON for text-based formats.
      if (isUtilsMode && utilTab === "regex") {
        try {
          const parsed = JSON.parse(raw) as { matches?: Array<{ match: string }> };
          const matchTexts = (parsed.matches ?? []).map((m) => m.match);
          if (format === "same-as-output") {
            text = matchTexts.join("\n");
          } else if (format === "json-array") {
            text = JSON.stringify(matchTexts, null, 2);
          } else {
            text = formatCopyAsText(matchTexts.join("\n"), format);
          }
        } catch {
          text = raw;
        }
      }
      // "Same as output" copies the pane exactly as shown. The Summary
      // report is not an item list - formats don't apply, always copy as shown.
      else if (format === "same-as-output" || listCompareExport?.bucket === "summary") {
        text = raw;
      }
      // Compare list/single: build list formats from the raw items so a format
      // pick (e.g. SQL IN) is never applied to already-formatted output text.
      else if (
        isDiffMode &&
        (diffKind === "list" || diffKind === "single") &&
        listCompareExport &&
        listCompareExport.items.length > 0 &&
        (format === "newline" ||
          format === "comma" ||
          format === "single-quotes" ||
          format === "double-quotes" ||
          format === "comma-single" ||
          format === "comma-double" ||
          format === "json-array" ||
          format === "sql-in-single" ||
          format === "sql-in-double")
      ) {
        text = formatCopyItemsAsText(listCompareExport.items, format);
      }
      // Table formats are built from the parsed data, not the raw output text.
      else if (format === "markdown-table" || format === "html-table" || format === "csv" || format === "tsv") {
        let data: JsonValue | null = parsedOutput;
        if (data == null) {
          try {
            data = JSON.parse(raw) as JsonValue;
          } catch {
            data = null;
          }
        }
        if (data == null) throw new Error("Not tabular data");
        text =
          format === "markdown-table"
            ? toMarkdownTable(data)
            : format === "html-table"
              ? toHtmlTable(data)
              : toCsv(data, format === "tsv" ? "\t" : ",");
        if (!text) throw new Error("No rows to export");
      } else {
        text = formatCopyAsText(raw, format);
      }
      return text;
    }
  };
  const copyOutputAs = async (format: CopyAsFormat) => {
    if (!getActiveOutputText().trim()) return;
    trackEvent("copy", { format, mode: isUtilsMode ? "utils" : isDiffMode ? "compare" : "transform" });
    try {
      await navigator.clipboard.writeText(resolveCopyText(format));
      const label = activeCopyAsOptions.find((o) => o.id === format)?.label ?? format;
      toast({ message: `Copied as ${label}` });
    } catch {
      toast({ message: "Copy failed", type: "error" });
    }
  };


  const handleWorkspaceReset = useCallback(() => {
    trackEvent("reset", { mode: isUtilsMode ? "utils" : isDiffMode ? "compare" : "transform" });
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
      toast({ message: "Reset" });
      return;
    }
    if (isDiffMode) {
      if (diffKind === "list" || diffKind === "single") {
        setDiffLeftInput("");
        setDiffRightInput("");
        setListCompareExport(null);
        setListCompareOptions(DEFAULT_LIST_PARSE_OPTIONS);
        setCsvColumn(null);
        setActiveBucket("common");
      } else {
        clearDiffSide("both");
      }
      // Reset clears pane renames too — "everything" means everything.
      setTabs((prev) =>
        prev.map((t) =>
          t.id === activeTabId && (t.leftLabel || t.rightLabel)
            ? { ...t, leftLabel: undefined, rightLabel: undefined, renamed: t.renamed && !!t.label }
            : t,
        ),
      );
      toast({ message: "Reset" });
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
    toast({ message: "Reset" });
  }, [
    isUtilsMode,
    isDiffMode,
    utilTab,
    diffKind,
    clearDiffSide,
    activeTabId,
    pathname,
    searchParams,
    router,
  ]);


  /** Determine the copy mode for the FormatPopover. */
  const copyMode = useMemo(() => {
    if (isDiffMode && diffKind === "list") return "compare-list";
    if (isDiffMode && diffKind === "single") return "compare-single";
    if (isUtilsMode && utilTab === "uuid") return "uuid";
    if (isUtilsMode && utilTab === "password") return "password";
    if (isUtilsMode && utilTab === "regex") return "regex";
    if (isUtilsMode) return `utils-${utilTab}`;
    return "transform";
  }, [isDiffMode, diffKind, isUtilsMode, utilTab]);

  /** Whether this mode uses the FormatPopover (list of items). */
  const isListCopyMode = useMemo(() => {
    if (isDiffMode && (diffKind === "list" || diffKind === "single")) return true;
    if (isUtilsMode && (utilTab === "uuid" || utilTab === "password" || utilTab === "regex")) return true;
    return false;
  }, [isDiffMode, diffKind, isUtilsMode, utilTab]);

  /** Items for the FormatPopover in list modes. */
  const copyItems = useMemo(() => {
    if (isDiffMode && (diffKind === "list" || diffKind === "single") && listCompareExport) {
      return listCompareExport.items;
    }
    if (isUtilsMode && utilTab === "uuid") {
      const state = utilsByTool["uuid"];
      return state?.uuidList ?? [];
    }
    if (isUtilsMode && utilTab === "password") {
      const state = utilsByTool["password"];
      return state?.pwList ?? [];
    }
    if (isUtilsMode && utilTab === "regex") {
      try {
        const raw = getActiveOutputText();
        const parsed = JSON.parse(raw) as { matches?: Array<{ match: string }> };
        return (parsed.matches ?? []).map((m) => m.match);
      } catch {
        return [];
      }
    }
    return [];
  }, [isDiffMode, diffKind, isUtilsMode, utilTab, listCompareExport, utilsByTool, getActiveOutputText]);

  /**
   * Copy-as options: encode-only for transform/JSON modes.
   * List modes use the new FormatPopover instead.
   */
  const activeCopyAsOptions = useMemo(() => {
    // List modes use FormatPopover — return empty to hide legacy dropdown.
    if (isListCopyMode) return [];
    if (!isDiffMode && rightView === "table") return TABLE_COPY_AS_OPTIONS;
    return DEFAULT_COPY_AS_OPTIONS;
  }, [isListCopyMode, isDiffMode, rightView]);

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
    toast({ message: "History exported" });
  };


  const applyFormatWithOptions = (next: FormatOptions) => {
    // Always persist prefs; never kick out of Compare for a settings tweak
    setFormatOptions(next);
    if (activeOperation === "diff") return;
    setFocusedPane("output");
    setActiveOperation("format");
    executeOperation("format", { formatOptions: next });
  };

  /** Apply pasted text: auto-format, set input, parse. Shared by ⌘V and the Allow-paste dialog. */
  const applyClipboardText = useCallback(
    async (text: string) => {
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
    },
    [activeOperation, autoFormatOnPaste, run, convertJsonToOutput, pushHistory, parseOnly, isDesktopLayout],
  );

  const pasteFromClipboard = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      await applyClipboardText(text);
    } catch {
      // Clipboard read blocked (no clipboard-read permission yet) - offer an
      // explicit "Allow paste" action instead of failing silently.
      setShowPastePrompt(true);
    }
  }, [applyClipboardText]);

  /** Retry the clipboard read inside a button click (a user gesture) - this is what
   *  triggers the browser's permission prompt the first time. */
  const allowPasteRetry = useCallback(async () => {
    setPastePromptError(false);
    try {
      const text = await navigator.clipboard.readText();
      setShowPastePrompt(false);
      await applyClipboardText(text);
    } catch {
      setPastePromptError(true);
    }
  }, [applyClipboardText]);

  // Global workspace keyboard shortcuts (Cmd/Ctrl + K / Enter / V / Z). Re-registers
  // whenever the handlers or their state change so the closure is always fresh.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      if (event.key === "k") {
        event.preventDefault();
        trackEvent("command_palette", { source: "shortcut" });
        setCommandPaletteOpen((v) => !v);
        return;
      }
      if (modalKind) return;
      if (activeOperation === "diff") {
        // List mode uses plain textareas - let the browser handle undo/paste.
        if (diffKind === "list" || diffKind === "single") return;
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
        // Run parse for every Ctrl/Cmd+Enter. Inside a Monaco editor the editor's
        // own keybinding (JsonEditor onCtrlEnter) also fires and swallows the chord
        // so no newline is inserted; parseOnly dedupes the duplicate call (Monaco
        // dispatches it a beat later), so the shortcut works regardless of platform
        // modifier (e.g. plain Ctrl on macOS) or which pane has focus.
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
      // Undo in a plain text field is that field's own (native) undo.
      if (event.key.toLowerCase() === "z" && isPlainTextField(event.target)) return;
      if (event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        if (isUtilsMode) moveUtilsHistory(-1);
        else moveHistory(-1);
      }
      if (event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        if (isUtilsMode) moveUtilsHistory(1);
        else moveHistory(1);
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [modalKind, inputEmpty, focusedPane, activeOperation, diffKind, moveHistory, moveUtilsHistory, isUtilsMode, parseOnly, pasteFromClipboard]);

  const readFileAsText = async (file: File): Promise<string> => {
    const result = await readFileAsTextGuarded(file, WORKER_INPUT_CAP_BYTES);
    if (result.truncated) {
      toast({ message: `That file is over the ${WORKER_INPUT_CAP_BYTES / (1024 * 1024)} MB limit and was not loaded. Split it and try again.`, type: "error" });
    }
    return result.text;
  };

  const formatLabelForFile = (name: string, text: string): string => {
    const detected = detectFormat(text);
    if (detected !== "curl") return detected.toUpperCase();
    const ext = name.split(".").pop()?.toUpperCase();
    return ext && ext.length <= 5 ? ext : "TEXT";
  };

  /** Local-first file import: Transform input, or a Compare side. Never uploads. */
  const importFileInto = async (file: File, side?: "left" | "right") => {
    try {
      const text = await readFileAsText(file);
      const label = formatLabelForFile(file.name, text);
      setDroppedFile({ name: file.name, size: file.size, format: label });
      if (isDiffMode) {
        if (side === "left") {
          setDiffLeftInput(text);
        } else if (side === "right") {
          setDiffRightInput(text);
        } else if (!diffLeftInput.trim()) {
          setDiffLeftInput(text);
        } else {
          setDiffRightInput(text);
        }
        toast({ message: `Loaded ${file.name} into ${side === "right" ? "right" : side === "left" ? "left" : diffLeftInput.trim() ? "right" : "left"}` });
        return;
      }
      setInput(text);
      pushHistory(text);
      setInputFormatOverride(null);
      setError(null);
      setValidationError(null);
      parseOnly(text, detectFormat(text));
      setFocusedPane("output");
      if (!isDesktopLayout) setMobileShowOutput(true);
      toast({ message: `Loaded ${file.name}` });
    } catch {
      toast({ message: "Could not read that file. Check that it is a text file and try again.", type: "error" });
    }
  };

  /** Pipe a query result (or any text) into List Compare for ID extraction / SQL. */
  /** Opens the text in a new list Compare tab, so this tab stays as it was and is one click away. */
  const openInListCompare = (text: string) => {
    addTab({ activeOperation: "diff", isOutputMaximized: true, diffKind: "list", diffLeftInput: text, diffRightInput: "" });
    setListCompareExport(null);
    toast({ message: "Opened in a new Compare tab. Your query tab is still open." });
  };

  /** One-click recipes compose existing workspace actions (see src/lib/presets.ts). */
  const runPreset = (id: PresetId) => {
    const preset = getPreset(id);
    if (!preset) return;
    trackEvent("recipe_run", { recipe: id });
    setFocusedPane("output");
    if (!isDesktopLayout) setMobileShowOutput(true);

    const isCompareRecipe =
      id === "compare-db-exports" || id === "extract-ids-to-sql-in" || id === "dedupe-sort-list";

    if (isCompareRecipe) {
      // Compare recipes: leave Utils, enter Compare only when not already there.
      if (isUtilsMode) runOperation("utils");
      if (!isDiffMode) runOperation("diff");
    } else {
      // Transform recipes: leave Compare / Utils so the editors have their context.
      if (isDiffMode) runOperation("diff");
      if (isUtilsMode) runOperation("utils");
    }

    switch (id) {
      case "json-to-typescript":
      case "json-to-sql":
      case "json-to-yaml":
      case "flatten-json":
      case "api-response-types": {
        // Recipes need parseable input. When the editor is empty, load a sample;
        // pass the source text through explicitly because setInput is async and
        // the operation would otherwise read the stale empty input from the closure.
        const sample =
          id === "json-to-sql"
            ? SAMPLE_JSON_TABLE
            : id === "api-response-types"
              ? '{"status":200,"data":{"id":1,"email":"a@b.com","roles":["admin"]}}'
              : SAMPLE_JSON;
        const src = input.trim() || sample;
        const loadedSample = !input.trim();
        if (loadedSample) {
          // Skip the live-transform cycle this setInput would trigger so it
          // can't clobber the recipe's output below.
          recipeInputLockRef.current = true;
          setInput(sample);
          pushHistory(sample);
          setInputFormatOverride(null);
          setError(null);
          setValidationError(null);
        }
        const inputText = loadedSample ? src : undefined;
        if (id === "json-to-sql") {
          setActiveOperation("generateTypes");
          setTypeLanguage("sql");
          setOutputLanguage("sql");
          setOutputExt("sql");
          executeOperation("generateTypes", { typeLanguage: "sql", inputText });
        } else if (id === "json-to-yaml") {
          setConvertToFormat("yaml");
          runConvert("yaml", inputText);
        } else if (id === "flatten-json") {
          runOperation("flatten", inputText);
        } else {
          // json-to-typescript and api-response-types
          setActiveOperation("generateTypes");
          setTypeLanguage("typescript");
          executeOperation("generateTypes", { typeLanguage: "typescript", inputText });
        }
        break;
      }
      case "flatten-to-csv": {
        const src = input.trim() || SAMPLE_JSON_TABLE;
        try {
          const json = parseJsonInput(src);
          const flat = flattenJson(json);
          const csv = toCsv(flat);
          // Skip the live-transform cycle this setInput would trigger so it
          // can't clobber the recipe's CSV output set below.
          recipeInputLockRef.current = true;
          setInput(src);
          pushHistory(src);
          setOutput(csv);
          setParsedOutput(flat);
          setOutputLanguage("csv");
          setOutputExt("csv");
          setConvertToFormat("csv");
          setActiveOperation("format");
          setError(null);
          setValidationError(null);
        } catch {
          toast({ message: "This recipe needs valid JSON in the input. Fix the input and run it again.", type: "error" });
          return;
        }
        break;
      }
      case "compare-db-exports":
        setDiffKind("list");
        if (!diffLeftInput.trim() && !diffRightInput.trim()) {
          setDiffLeftInput("id-1001\nid-1002\nid-1003\nid-1004");
          setDiffRightInput("id-1002\nid-1003\nid-1005");
        }
        break;
      case "extract-ids-to-sql-in":
        setDiffKind("list");
        if (!diffLeftInput.trim() && !diffRightInput.trim()) {
          setDiffLeftInput('["7f9c1e2a-4b3d-4a1e-8c6f-2d9b1a4e5c6d", "a1b2c3d4-5678-4e90-ab12-cdef34567890"]');
          setDiffRightInput("");
        }
        break;
      case "dedupe-sort-list":
        setDiffKind("single");
        if (!diffLeftInput.trim()) {
          setDiffLeftInput("alpha\nbeta\nalpha\ngamma\nbeta\nbeta\ndelta");
        }
        break;
      case "validate-against-schema":
        runOperation("validate");
        break;
    }
    toast({ message: `${preset.label.replace("Recipe: ", "")}` });
  };

  // ---- File drag & drop (local-first; drop zones are the Transform input and Compare sides) ----
  const handleDragEnter = (e: React.DragEvent) => {
    if (e.dataTransfer?.types?.includes("Files")) {
      e.preventDefault();
      dragDepthRef.current += 1;
      if (!dragActive) setDragActive(true);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer?.types?.includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };
  const handleDragLeave = () => {
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setDragActive(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length === 0) return;
    const half = typeof window !== "undefined" && e.clientX < window.innerWidth / 2;
    if (files.length >= 2 && isDiffMode) {
      void importFileInto(files[0]!, "left");
      void importFileInto(files[1]!, "right");
    } else if (isDiffMode) {
      void importFileInto(files[0]!, half ? "left" : "right");
    } else {
      void importFileInto(files[0]!);
    }
  };

  /** Restore every workspace setting to its default - across ALL tabs (each tab's
   *  view/format/types/diff prefs are reset too; inputs, outputs, and history stay). */
  const resetSettingsToDefault = useCallback(() => {
    setFormatOptions(DEFAULT_FORMAT_OPTIONS);
    setConvertToFormat("json");
    setRightView("raw");
    setEditorFontSize(13);
    setLineWrap(true);
    setAutoFormatOnPaste(true);
    setSqlDialect("sqlite");
    const perTabDefaults: Partial<TabSnapshot> = {
      convertToFormat: "json",
      rightView: "raw",
      typeLanguage: "typescript",
      diffKind: "document",
      diffSideBySide: true,
      diffIgnoreWhitespace: false,
      diffShowPaths: false,
      isOutputMaximized: false,
      utilTab: "uuid",
      graphCopyFormat: "png",
    };
    tabSnapshotsRef.current.forEach((snap, id) => {
      tabSnapshotsRef.current.set(id, { ...snap, ...perTabDefaults });
    });
    // Reset the live (current-tab) mirrors too, so the persistence effect re-snapshots cleanly.
    setTypeLanguage("typescript");
    setDiffKind("document");
    setDiffSideBySide(true);
    setDiffIgnoreWhitespace(false);
    setDiffShowPaths(false);
    setIsOutputMaximized(false);
    setUtilTab("uuid");
    setGraphCopyFormat("png");
    // Settings reset also drops pane renames (Left/Right/list labels) everywhere.
    setTabs((prev) =>
      prev.map((t) =>
        t.leftLabel || t.rightLabel
          ? { ...t, leftLabel: undefined, rightLabel: undefined, renamed: t.renamed && !!t.label }
          : t,
      ),
    );
    toast({ message: "Settings reset to default across all tabs" });
  }, []);

  /**
   * Wipe all local app state (localStorage + service-worker caches) and load fresh.
   * A module-level flag stops the pagehide "safety-net" session flush from
   * re-writing the workspace payload right after clear() — otherwise the
   * reload boots with the old tabs/settings/inputs resurrected and "Clear
   * cache" appears to wipe nothing.
   */
  const clearAllCache = async () => {
    suppressSessionFlushRef.current = true;
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    // Drop every service-worker cache before reloading so the fresh build is
    // served instead of the stale cached one.
    try {
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  const selectedOutput: OutputId =
    activeOperation === "generateTypes"
      ? `type:${typeLanguage}`
      : activeOperation && MORE_OPERATIONS.some((o) => o.id === `op:${activeOperation}`)
        ? `op:${activeOperation}`
        : `fmt:${convertToFormat}`;
  const goTransform = (id: OutputId) => {
    if (!isDiffMode && !isUtilsMode) chooseOutput(id);
    else openNewTab({ kind: "transform", output: id });
  };
  /** Clears the active input: the lone input, or both documents in Compare. */
  const clearActiveInput = () => {
    if (isDiffMode && diffKind === "document") {
      clearDiffSide("both");
      return;
    }
    setInput("");
    pushHistory("");
    setOutput("");
    setParsedOutput(null);
    setError(null);
    setValidationError(null);
    setFocusedPane("input");
  };
  const tidyActive = () => {
    if (isDiffMode) beautifyDiffSides("both", true);
    else void tidyInput();
  };
  const inTransform = !isDiffMode && !isUtilsMode;
  const commandPaletteCommands = useMemo((): Command[] => {
    const T = "Transform", C = "Compare", U = "Utils", R = "Recipes", I = "Input", O = "Output", TB = "Tabs", V = "View", S = "Settings", H = "Help";
    const on = (cond: boolean) => (cond ? "Current" : undefined);
    const noOutput = !output.trim();
    const MORE_LABEL: Record<string, string> = {
      "op:schema": "Generate JSON Schema",
      "op:openapi": "Generate OpenAPI spec",
      "op:validate": "Validate against a schema",
      "op:flatten": "Flatten nested keys",
      "op:unflatten": "Unflatten dotted keys",
      "op:minify": "Minify output",
    };
    const MORE_KEYWORDS: Record<string, string[]> = {
      "op:schema": ["infer", "jsonschema"],
      "op:openapi": ["swagger", "api"],
      "op:validate": ["check", "ajv", "jsonschema"],
      "op:flatten": ["dot", "paths", "nested"],
      "op:unflatten": ["dot", "paths", "nest", "expand"],
      "op:minify": ["compact", "compress", "uglify", "whitespace"],
    };
    const UTIL_KEYWORDS: Record<string, string[]> = {
      auto: ["identify", "what is this", "detect"],
      uuid: ["guid", "unique id"],
      password: ["random", "secret", "generate"],
      lorem: ["placeholder", "dummy text", "ipsum"],
      hash: ["sha", "sha256", "md5", "checksum", "digest"],
      instant: ["epoch", "unix", "timestamp", "timezone", "time zone", "date", "utc", "world clock"],
      cron: ["schedule", "crontab"],
      regex: ["regexp", "regular expression", "pattern", "match"],
      case: ["camel", "snake", "kebab", "pascal", "uppercase", "lowercase"],
      stats: ["count", "characters", "words", "lines", "length"],
      clean: ["repair", "fix json", "trailing comma", "single quotes", "broken json"],
      base64: ["b64", "encode", "decode", "atob", "btoa"],
      url: ["percent", "uri", "encode", "decode", "query string"],
      hex: ["bytes", "hexadecimal", "encode", "decode"],
      html: ["entities", "escape", "unescape", "amp"],
      escape: ["backslash", "quote", "string", "stringify"],
      jwt: ["token", "bearer", "decode", "claims"],
      urlparse: ["query", "host", "params", "split url"],
      number: ["binary", "octal", "decimal", "hexadecimal", "radix", "base"],
      color: ["hex", "rgb", "hsl", "colour"],
    };
    const COMPARE_LABEL = { list: "Compare two lists", single: "Dedupe and sort one list", document: "Compare two documents" } as const;
    // Recipes that only repeat another command (Convert to YAML, Flatten, Compare two lists...) are left out.
    const RECIPE_LABEL: Partial<Record<PresetId, string>> = {
      "flatten-to-csv": "Flatten JSON and convert to CSV",
      "api-response-types": "Generate types from an API response",
      "extract-ids-to-sql-in": "Turn a list of IDs into a SQL IN clause",
    };
    const list: Command[] = [
      // Transform: every output. Same kind of tab switches in place, otherwise a new tab opens.
      ...FORMAT_KINDS.map((fmt) => ({
        id: `dest-fmt-${fmt}`,
        label: `Convert to ${FORMAT_LABELS[fmt]}`,
        category: T,
        keywords: [fmt, "convert", "format", "transform", "output", ...(fmt === "yaml" ? ["yml"] : fmt === "xml" ? ["markup"] : fmt === "csv" ? ["spreadsheet", "excel"] : [])],
        badge: on(inTransform && selectedOutput === `fmt:${fmt}`),
        action: () => goTransform(`fmt:${fmt}`),
      })),
      ...TYPE_LANGUAGES.map((t) => ({
        id: `dest-type-${t.id}`,
        label: t.id === "sql" ? "Generate SQL" : `Generate ${t.label} types`,
        category: T,
        keywords: [t.id, t.label, "types", "interface", "struct", "generate"],
        badge: on(inTransform && selectedOutput === `type:${t.id}`),
        action: () => goTransform(`type:${t.id}`),
      })),
      ...MORE_OPERATIONS.map((o) => ({
        id: `dest-${o.id}`,
        label: MORE_LABEL[o.id] ?? o.label,
        category: T,
        keywords: [o.id.slice(3), "schema", "transform", ...(MORE_KEYWORDS[o.id] ?? [])],
        shortcut: o.id === "op:minify" ? "⌘⇧M" : undefined,
        badge: on(inTransform && selectedOutput === o.id),
        action: () => goTransform(o.id),
      })),
      // Compare: three kinds.
      ...(["list", "single", "document"] as const).map((k) => ({
        id: `dest-compare-${k}`,
        label: COMPARE_LABEL[k],
        category: C,
        keywords: ["compare", "diff", "difference", "list", "document", "set", "sql in", ...(k === "single" ? ["dedupe", "duplicates", "unique", "count", "sort"] : k === "list" ? ["common", "union", "intersection", "missing"] : ["json", "changes"])],
        badge: on(isDiffMode && diffKind === k),
        action: () => {
          if (isDiffMode) {
            setDiffKind(k);
            saveLastUsed({ compare: k });
          } else openNewTab({ kind: "compare", compare: k });
        },
      })),
      // Utils: every tool.
      ...UTIL_TABS.map((t) => ({
        id: `util-${t.id}`,
        label: `Open ${t.label}`,
        category: U,
        keywords: [t.id, t.label.toLowerCase(), "utils", "devtools", "tool", ...(UTIL_KEYWORDS[t.id] ?? [])],
        badge: on(isUtilsMode && utilTab === t.id),
        action: () => {
          if (isUtilsMode) {
            setUtilTab(t.id);
            saveLastUsed({ utils: t.id });
          } else openNewTab({ kind: "utils", tool: t.id });
        },
      })),
      // Actions.
      ...INPUT_SAMPLES.map((smp) => ({
        id: `sample-${smp.id}`,
        label: `Load ${smp.label} sample`,
        category: I,
        keywords: ["sample", "example", "demo", smp.group ?? "", smp.id.split(":")[1]],
        disabled: !inTransform,
        action: () => loadInputSample(smp.id),
      })),
      { id: "act-tidy", label: "Tidy input", category: I, keywords: ["tidy", "format", "beautify", "pretty", "indent"], shortcut: "⌘⇧B", disabled: isUtilsMode || (inTransform && inputEmpty), action: tidyActive },
      { id: "act-clear", label: "Clear input", category: I, keywords: ["clear", "empty", "wipe", "input"], disabled: isUtilsMode || (inTransform && inputEmpty), action: clearActiveInput },
      { id: "act-reset", label: "Clear input and output", category: I, keywords: ["reset", "start over", "reset", "input", "output", "new"], shortcut: "⌘⌥R", action: handleWorkspaceReset },
      { id: "act-copy", label: "Copy output", category: O, keywords: ["copy", "clipboard", "output"], shortcut: "⌘C", disabled: noOutput && !isDiffMode, action: copyOutput },
      { id: "act-copy-b64", label: "Copy output as Base64", category: O, keywords: ["base64", "encode", "clipboard"], disabled: noOutput, action: () => void copyOutputAs("base64") },
      { id: "act-copy-esc", label: "Copy output as escaped string", category: O, keywords: ["escaped", "string", "json string"], disabled: noOutput, action: () => void copyOutputAs("escaped") },
      { id: "act-copy-uri", label: "Copy output as URL-encoded", category: O, keywords: ["url", "encoded", "percent", "uri"], disabled: noOutput, action: () => void copyOutputAs("uri") },
      { id: "act-copy-dat", label: "Copy output as Data URI", category: O, keywords: ["data", "uri", "base64"], disabled: noOutput, action: () => void copyOutputAs("datauri") },
      { id: "act-download", label: "Download output", category: O, keywords: ["save", "export", "file"], shortcut: "⌘⇧S", disabled: noOutput && !isDiffMode, action: () => downloadActive() },
      { id: "act-share", label: "Share workspace", category: O, keywords: ["share", "link", "url", "short link"], shortcut: "⌘⇧E", disabled: noOutput && inTransform, action: requestShare },
      ...(sharedLinkUrl
        ? [{ id: "act-embed", label: "Copy embed URL", category: O, keywords: ["embed", "iframe", "share"], action: async () => { await navigator.clipboard.writeText(`${sharedLinkUrl}&embed=1`); toast({ message: "Embed URL copied" }); } }]
        : []),
      { id: "act-paste", label: "Paste from clipboard", category: I, keywords: ["paste", "clipboard"], shortcut: "⌘V", disabled: !inTransform, action: pasteFromClipboard },
      { id: "act-import", label: "Import file", category: I, keywords: ["load", "browse", "upload", "open", "file"], disabled: !inTransform, action: () => document.getElementById("import-json-file")?.click() },
      { id: "act-undo", label: "Undo input change", category: I, keywords: ["undo", "history", "back"], shortcut: "⌘Z", disabled: !canUndo, action: () => moveHistory(-1) },
      { id: "act-redo", label: "Redo input change", category: I, keywords: ["redo", "history", "forward"], shortcut: "⌘⇧Z", disabled: !canRedo, action: () => moveHistory(1) },
      { id: "act-history", label: "Browse input history", category: I, keywords: ["history", "stack", "timeline"], action: () => setShowHistoryPanel(true) },
      { id: "act-history-export", label: "Download input history", category: I, keywords: ["history", "export", "download"], disabled: undoStack.length <= 1, action: exportHistory },
      { id: "act-find", label: "Find in output", category: O, keywords: ["find", "search", "output"], shortcut: "⌘F", disabled: noOutput, action: () => { setFocusedPane("output"); setTimeout(() => outputEditorApiRef.current?.find(), 50); } },
      { id: "act-sort-arrays", label: "Sort array items", category: O, keywords: ["sort", "arrays", "items", "order"], disabled: inputEmpty || showBusy || !inTransform, action: () => { setFocusedPane("output"); runOperation("sortArrays"); } },
      { id: "act-dedup", label: "Remove duplicate array items", category: O, keywords: ["dedupe", "duplicates", "unique", "dedup", "duplicate", "unique", "array"], disabled: inputEmpty || showBusy || !inTransform, action: () => { setFocusedPane("output"); runOperation("dedup"); } },
      { id: "act-diff-prev", label: "Go to previous change", category: C, keywords: ["diff", "previous", "change"], disabled: !(isDiffMode && diffKind === "document"), action: () => diffEditorRef.current?.prevChange() },
      { id: "act-diff-next", label: "Go to next change", category: C, keywords: ["diff", "next", "change"], disabled: !(isDiffMode && diffKind === "document"), action: () => diffEditorRef.current?.nextChange() },
      { id: "act-diff-swap", label: "Swap A and B", category: C, keywords: ["diff", "swap", "exchange", "sides"], disabled: !(isDiffMode && diffKind === "document"), action: swapDiffSides },
      { id: "act-diff-copy-report", label: "Copy comparison report", category: C, keywords: ["diff", "copy", "report", "summary"], disabled: !(isDiffMode && diffKind === "document"), action: () => void copyDiffText("report") },
      { id: "act-tab-new", label: "New tab", category: TB, keywords: ["tab", "new", "add"], shortcut: "⌥N", action: () => addTab() },
      { id: "act-tab-close", label: "Close tab", category: TB, keywords: ["tab", "close", "remove"], shortcut: "⌥W", disabled: tabs.length <= 1, action: () => closeTab(activeTabId) },
      { id: "act-tab-reopen", label: "Reopen closed tab", category: TB, keywords: ["tab", "reopen", "restore", "closed"], badge: closedTabName ?? undefined, disabled: !closedTabName, action: reopenTab },
      { id: "act-tab-close-others", label: "Close other tabs", category: TB, keywords: ["tab", "close", "others", "keep"], disabled: tabs.length <= 1, action: () => closeOtherTabs() },
      { id: "act-tab-close-all", label: "Close all tabs", category: TB, keywords: ["tab", "close", "all"], disabled: tabs.length <= 1, action: () => closeAllTabs() },
      ...PRESETS.filter((pr) => RECIPE_LABEL[pr.id]).map((pr) => ({ id: `recipe-${pr.id}`, label: RECIPE_LABEL[pr.id] as string, category: R, keywords: pr.keywords, action: () => runPreset(pr.id) })),
      // View.
      ...(
        [
          ["raw", "Show text view", "⌘1", "text raw code"],
          ["tree", "Show tree view", "⌘2", "tree explore expand collapse"],
          ["graph", "Show graph view", "⌘3", "graph diagram nodes"],
          ["query", "Show query view", "⌘4", "query jsonpath jmespath filter search"],
          ["table", "Show table view", "⌘5", "table grid rows columns spreadsheet"],
        ] as const
      ).map(([v, label, shortcut, kw]) => ({
        id: `view-${v}`,
        label,
        category: V,
        keywords: kw.split(" "),
        shortcut,
        badge: on(inTransform && rightView === v),
        disabled: !inTransform || (v !== "raw" && !parsedOutput),
        action: () => { setRightView(v); setFocusedPane("output"); },
      })),
      { id: "view-wrap", label: lineWrap ? "Turn off wrap long lines" : "Turn on wrap long lines", category: V, keywords: ["wrap", "line", "long", "scroll"], shortcut: "⌥Z", badge: lineWrap ? "On" : undefined, action: () => setLineWrap((v) => !v) },
      { id: "view-maximize", label: isOutputMaximized ? "Show input" : "Hide input", category: V, keywords: ["maximize", "expand", "output", "pane"], shortcut: "⌥M", disabled: !inTransform, action: () => setIsOutputMaximized((v) => !v) },
      { id: "view-focus-input", label: "Focus input", category: V, keywords: ["focus", "input", "editor"], shortcut: "⌥1", disabled: !inTransform, action: () => { setFocusedPane("input"); inputEditorApiRef.current?.focus(); } },
      { id: "view-focus-output", label: "Focus output", category: V, keywords: ["focus", "output", "editor"], shortcut: "⌥2", disabled: !inTransform, action: () => { setFocusedPane("output"); outputEditorApiRef.current?.focus(); } },
      { id: "view-fold", label: "Fold all in input", category: V, keywords: ["fold", "collapse", "keys"], disabled: inputEmpty || !inTransform, action: () => inputEditorApiRef.current?.collapseAll() },
      { id: "view-unfold", label: "Unfold all in input", category: V, keywords: ["unfold", "expand", "keys"], disabled: inputEmpty || !inTransform, action: () => inputEditorApiRef.current?.expandAll() },
      { id: "view-zoom-in", label: "Increase font size", category: V, keywords: ["zoom in", "zoom", "font", "bigger", "larger"], shortcut: "⌘+", disabled: editorFontSize >= 24, action: () => setEditorFontSize((n) => Math.min(24, n + 1)) },
      { id: "view-zoom-out", label: "Decrease font size", category: V, keywords: ["zoom out", "zoom", "font", "smaller"], shortcut: "⌘−", disabled: editorFontSize <= 10, action: () => setEditorFontSize((n) => Math.max(10, n - 1)) },
      { id: "view-zoom-reset", label: "Reset font size", category: V, keywords: ["reset zoom", "zoom", "font", "reset"], shortcut: "⌘0", disabled: editorFontSize === 13, action: () => setEditorFontSize(13) },
      { id: "view-fullscreen", label: isWindowFullscreen ? "Exit fullscreen" : "Enter fullscreen", category: V, keywords: ["fullscreen", "window"], action: toggleWindowFullscreen },
      { id: "view-diff-layout", label: diffSideBySide ? "Show changes inline" : "Show changes side by side", category: V, keywords: ["diff", "inline", "side by side", "layout"], disabled: !(isDiffMode && diffKind === "document"), action: () => setDiffSideBySide((v) => !v) },
      // Settings.
      { id: "set-live", label: liveTransform ? "Turn off live transform" : "Turn on live transform", category: S, keywords: ["live", "auto", "realtime", "transform"], shortcut: "⌘⇧L", badge: liveTransform ? "On" : undefined, action: () => setLiveTransform((v) => !v) },
      { id: "set-paste", label: autoFormatOnPaste ? "Turn off format on paste" : "Turn on format on paste", category: S, keywords: ["auto", "format", "paste", "beautify"], badge: autoFormatOnPaste ? "On" : undefined, action: () => setAutoFormatOnPaste((v) => !v) },
      { id: "set-sort-keys", label: formatOptions.sortKeys ? "Turn off sort keys" : "Turn on sort keys", category: S, keywords: ["sort", "keys", "alphabetical"], badge: formatOptions.sortKeys ? "On" : undefined, disabled: inputEmpty || !inTransform, action: () => applyFormatWithOptions({ ...formatOptions, sortKeys: !formatOptions.sortKeys }) },
      { id: "set-drop-empty", label: formatOptions.removeEmpty ? "Turn off drop empty values" : "Turn on drop empty values", category: S, keywords: ["remove", "empty", "null"], badge: formatOptions.removeEmpty ? "On" : undefined, disabled: inputEmpty || !inTransform, action: () => applyFormatWithOptions({ ...formatOptions, removeEmpty: !formatOptions.removeEmpty }) },
      ...([2, 4, 0] as const).map((n) => ({
        id: `set-indent-${n}`,
        label: n === 0 ? "Set indent to none" : `Set indent to ${n} spaces`,
        category: S,
        keywords: ["indent", "spaces", "tabs"],
        badge: on(formatOptions.indentation === n),
        disabled: inputEmpty || !inTransform,
        action: () => applyFormatWithOptions({ ...formatOptions, indentation: n }),
      })),
      { id: "set-quote-double", label: "Use double quotes", category: S, keywords: ["quote", "double"], badge: on(formatOptions.quoteStyle === "double"), disabled: inputEmpty || !inTransform, action: () => applyFormatWithOptions({ ...formatOptions, quoteStyle: "double" }) },
      { id: "set-quote-single", label: "Use single quotes", category: S, keywords: ["quote", "single"], badge: on(formatOptions.quoteStyle === "single"), disabled: inputEmpty || !inTransform, action: () => applyFormatWithOptions({ ...formatOptions, quoteStyle: "single" }) },
      ...([[",", "comma"], ["	", "tab"], [";", "semicolon"], ["|", "pipe"]] as const).map(([d, name]) => ({
        id: `set-csv-${name}`,
        label: `Set CSV delimiter to ${name}`,
        category: S,
        keywords: ["csv", "delimiter", name],
        badge: on(csvDelimiter === d),
        action: () => setCsvDelimiter(d),
      })),
      { id: "set-options-reset", label: "Reset options", category: S, keywords: ["reset", "options", "defaults", "indent", "sort"], disabled: !inTransform, action: () => resetTransformOptions() },
      { id: "theme-light", label: "Use light theme", category: S, keywords: ["appearance", "theme", "light"], badge: on(themeMode === "light"), action: () => setThemeMode("light") },
      { id: "theme-dark", label: "Use dark theme", category: S, keywords: ["appearance", "night", "theme", "dark"], badge: on(themeMode === "dark"), action: () => setThemeMode("dark") },
      { id: "theme-system", label: "Use system theme", category: S, keywords: ["appearance", "os", "theme", "system", "auto"], badge: on(themeMode === "system"), action: () => setThemeMode("system") },
      { id: "set-reset", label: "Reset settings", category: S, keywords: ["reset", "default", "restore", "settings"], action: () => resetSettingsToDefault() },
      { id: "set-clear-data", label: "Clear saved data and reload", category: S, keywords: ["clear", "cache", "wipe", "localstorage", "fresh"], action: () => void clearAllCache() },
      // Help.
      { id: "help-tour", label: "Take the tour", category: H, keywords: ["tour", "walkthrough", "guide", "intro", "onboarding"], action: () => { setCommandPaletteOpen(false); openTour("palette"); } },
      { id: "help-shortcuts", label: "Open keyboard shortcuts", category: H, keywords: ["keys", "shortcuts", "hotkeys"], shortcut: "⌘/", action: () => window.dispatchEvent(new Event("formaty:open-shortcuts")) },
      { id: "help-docs", label: "Open documentation", category: H, keywords: ["docs", "help", "guide"], action: () => router.push("/docs") },
      { id: "help-changelog", label: "Open changelog", category: H, keywords: ["whats new", "what's new", "changelog", "release", "version", "updates"], action: () => router.push("/changelog") },
      { id: "help-github", label: "Open GitHub", category: H, keywords: ["github", "source", "issues"], action: () => window.open("https://github.com/kdkumawat/formaty", "_blank", "noopener,noreferrer") },
      { id: "help-reload", label: "Reload app", category: H, keywords: ["reload", "refresh", "restart"], action: () => window.location.reload() },
    ];
    // Output commands preview the active input converted; the sample is built only while the row is highlighted.
    const previewOf = (c: Command): Command["preview"] =>
      inTransform && c.id.startsWith("dest-") && !c.id.startsWith("dest-compare-") && c.id !== "dest-op:validate" && c.id !== "dest-op:openapi" && c.id !== "dest-op:unflatten"
        ? () => previewOutput(inputRef.current, resolvedInputFormat, c.id.slice(5).replace(/^(fmt|type)-/, "$1:"))
        : undefined;
    return list.map((c) => ({ ...c, icon: c.icon ?? commandIcon(c.id), description: c.description ?? describeCommand(c.id, c.label), preview: previewOf(c) }));
    // The handlers above close over live workspace state; the listed values are what changes what the palette shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputEmpty, showBusy, convertToFormat, rightView, parsedOutput, typeLanguage, activeOperation, output, themeMode, editorFontSize, isOutputMaximized, isWindowFullscreen, toggleWindowFullscreen, formatOptions, csvDelimiter, liveTransform, resolvedInputFormat, canUndo, canRedo, lineWrap, diffSideBySide, diffKind, sharedLinkUrl, undoStack.length, tabs.length, activeTabId, autoFormatOnPaste, swapDiffSides, beautifyDiffSides, copyDiffText, isUtilsMode, utilTab, isDiffMode, handleWorkspaceReset, resetSettingsToDefault, openTour, closedTabName, sqlTable, typeName, sqlDialect, clearDiffSide]);

  const settingsPanelContent = (
    <SettingsPanel
      themeMode={themeMode}
      onThemeMode={setThemeMode}
      liveTransform={liveTransform}
      onLiveTransform={setLiveTransform}
      autoFormatOnPaste={autoFormatOnPaste}
      onAutoFormatOnPaste={setAutoFormatOnPaste}
      lineWrap={lineWrap}
      onLineWrap={setLineWrap}
      showInstant={isUtilsMode && utilTab === "instant"}
      indent={formatOptions.indentation}
      onIndent={(n) => setFormatOptions((o) => ({ ...o, indentation: n }))}
      fontSize={editorFontSize}
      onFontSize={setEditorFontSize}
      onReset={resetSettingsToDefault}
      onClearCache={() => void clearAllCache()}
    />
  );

  const loadSampleDocuments = () => {
    const right = SAMPLE_JSON.replace("formaty", "formaty-app").replace("1023", "1100").replace("\"tue\"", "\"wed\"");
    setDiffLeftInput(SAMPLE_JSON);
    setDiffRightInput(right);
    diffEditorRef.current?.setBoth(SAMPLE_JSON, right);
    executeOperation("diff", { leftText: SAMPLE_JSON, rightText: right });
  };
  /** Fills the input from a Sample menu id: `fmt:<format>`, `fmt:curl` or `ex:<example id>`. */
  const loadInputSample = (id: string) => {
    const [group, key] = id.split(":");
    const example = group === "ex" ? EXAMPLES.find((e) => e.id === key) : undefined;
    const kind = (group === "fmt" ? key : "json") as FormatKind | "curl";
    const sample = example ? example.data : kind === "curl" ? SAMPLE_CURL : SAMPLES[kind];
    setInput(sample);
    pushHistory(sample);
    setInputFormatOverride(kind === "curl" ? "curl" : null);
    setError(null);
    setValidationError(null);
    parseOnly(sample, kind);
    setFocusedPane("output");
    if (!isDesktopLayout) setMobileShowOutput(true);
  };
  /** Rewrite the input in its own format with the current indent and sort settings. */
  const tidyInput = async () => {
    if (resolvedInputFormat === "curl" || !input.trim()) return;
    try {
      const json = await getParsedInput();
      const text = await convertJsonToOutput(json, { toFormat: resolvedInputFormat });
      setInput(text);
      pushHistory(text);
    } catch (e) {
      toast({ message: explainProblem({ input, raw: e instanceof Error ? e.message : "", format: resolvedInputFormat, forced: inputFormatOverride }).message, type: "error" });
    }
  };
  /** Problem to show under the input, in plain words with the line it points at and any way out (see explainProblem). */
  const inputProblem = useMemo(() => {
    const raw = validationError ?? error;
    if (!raw) return null;
    return explainProblem({ input, raw, format: resolvedInputFormat, forced: inputFormatOverride });
  }, [validationError, error, input, resolvedInputFormat, inputFormatOverride]);

  /** One click on an output chip, More item or palette entry, inside the current Transform tab. */
  const pickCurlTarget = (id: string) => {
    try {
      const target = getCurlTarget(id as CurlTargetId);
      const code = generateCurlCode(parseCurl(input), id as CurlTargetId);
      prevActionStateRef.current = { output, parsedOutput, outputLanguage, outputExt };
      setCurlTarget(id as CurlTargetId);
      setFocusedPane("output");
      setRightView("raw");
      setOutput(code);
      setOutputLanguage(id === "python" ? "python" : id === "go" ? "go" : "javascript");
      setOutputExt(target?.ext ?? "txt");
      setActiveOperation(null);
    } catch (e) {
      toast({ message: explainProblem({ input, raw: e instanceof Error ? e.message : "", format: "curl", forced: null }).message, type: "error" });
    }
  };
  const chooseOutput = (id: OutputId) => {
    setCurlTarget(null);
    setFocusedPane("output");
    saveLastUsed({ transform: id });
    if (!FIXED_OUTPUT_CHIPS.includes(id) && !learnedChips.includes(id)) {
      const next = [id, learnedChips[0]].filter((x): x is OutputId => Boolean(x)).slice(0, 2);
      setLearnedChips(next);
      try {
        localStorage.setItem("formaty-learned-chips", JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
    }
    const val = id.slice(id.indexOf(":") + 1);
    if (id.startsWith("fmt:")) {
      const fmt = val as FormatKind;
      if (inputEmpty) {
        setConvertToFormat(fmt);
        setActiveOperation(null);
        setOutputExt(EXT_BY_FORMAT[fmt]);
        setOutputLanguage(fmt);
      } else {
        runConvert(fmt);
      }
    } else if (id.startsWith("type:")) {
      const lang = val as TypeTargetLanguage;
      trackEvent("generate_types", { language: lang, source: "chips" });
      setRightView("raw");
      setTypeLanguage(lang);
      setActiveOperation("generateTypes");
      setOutputLanguage(LANGUAGE_BY_TYPE_TARGET[lang]);
      setOutputExt(TYPE_LANGUAGES.find((t) => t.id === lang)?.ext ?? "txt");
      if (!inputEmpty) executeOperation("generateTypes", { typeLanguage: lang });
    } else if (inputEmpty && val !== "validate") {
      setRightView("raw");
      setActiveOperation(val as OperationAction);
    } else {
      runOperation(val as OperationAction);
    }
  };
  const inputInvalid = inputValid === false;
  const staleOutput = inputInvalid && output.trim().length > 0;
  const isTypeOutput = selectedOutput.startsWith("type:") && selectedOutput !== "type:sql";
  /** Image or data copy of the graph view. Throws on failure so the Copy button can say so. */
  const copyGraphAs = async (id: string) => {
    const g = graphViewRef.current;
    if (id === "json") {
      await navigator.clipboard.writeText(JSON.stringify(parsedOutput, null, 2));
    } else if (!g) {
      throw new Error("Graph export is not ready yet.");
    } else if (id === "png") await g.copyPngToClipboard();
    else if (id === "jpg") await g.copyJpgToClipboard();
    else await g.copySvgToClipboard();
    trackEvent("copy", { format: id, mode: "transform" });
  };
  /** The Copy button of the Transform result: format remembered per view. */
  const copyView = rightView === "graph" ? "graph" : rightView === "table" ? "table" : "text";
  const transformCopyFormats: CopyFormat[] =
    copyView === "graph"
      ? GRAPH_COPY_OPTIONS
      : copyView === "table"
        ? TABLE_COPY_AS_OPTIONS
        : [{ id: "same-as-output", label: "As shown", group: "Output" }, ...DEFAULT_COPY_AS_OPTIONS];
  const transformCopyFormat =
    copyView === "graph"
      ? graphCopyFormat
      : (copyAsMemory[copyView] ?? (copyView === "table" ? "markdown-table" : "same-as-output"));
  const transformCopy: CopyButtonProps = {
    formats: transformCopyFormats,
    format: transformCopyFormat,
    onFormatChange: (id) => {
      if (copyView === "graph") setGraphCopyFormat(id as GraphCopyFormat);
      else setCopyAsMemory((m) => ({ ...m, [copyView]: id as CopyAsFormat }));
    },
    disabled: !(canDownload && !inputInvalid),
    onCopy: async (f) => {
      const id = f ?? transformCopyFormat;
      if (copyView === "graph") return copyGraphAs(id);
      trackEvent("copy", { format: id, mode: "transform" });
      const text = resolveCopyText(id as CopyAsFormat);
      if (!text.trim()) throw new Error("Nothing to copy");
      await navigator.clipboard.writeText(text);
    },
  };
  const resetTransformOptions = () => {
    setSqlTable("");
    setTypeName("");
    setSqlDialect("sqlite");
    if (selectedOutput.startsWith("fmt:") && !inputEmpty) applyFormatWithOptions({ ...DEFAULT_FORMAT_OPTIONS });
    else setFormatOptions({ ...DEFAULT_FORMAT_OPTIONS });
  };
  const outputHeader = (
    <OutputHeader
      selected={selectedOutput}
      learned={learnedChips}
      onSelect={chooseOutput}
      curl={
        resolvedInputFormat === "curl"
          ? { targets: CURL_TARGETS.map((t) => ({ id: t.id, label: t.label })), selected: curlTarget, onPick: pickCurlTarget }
          : undefined
      }
      busy={showBusy}
      stale={staleOutput}
      view={rightView}
      onView={(v) => {
        trackEvent("view", { view: v });
        setRightView(v);
        setFocusedPane("output");
      }}
      canVisualize={Boolean(parsedOutput)}
      isData={selectedOutput.startsWith("fmt:")}
      isJson={selectedOutput === "fmt:json"}
      sortKeys={formatOptions.sortKeys}
      onSortKeys={(v) => applyFormatWithOptions({ ...formatOptions, sortKeys: v })}
      indent={formatOptions.indentation}
      onIndent={(n) => applyFormatWithOptions({ ...formatOptions, indentation: n })}
      quoteStyle={formatOptions.quoteStyle}
      onQuoteStyle={(q) => applyFormatWithOptions({ ...formatOptions, quoteStyle: q })}
      removeEmpty={formatOptions.removeEmpty}
      onRemoveEmpty={(v) => applyFormatWithOptions({ ...formatOptions, removeEmpty: v })}
      isSql={selectedOutput === "type:sql"}
      sqlTable={sqlTable}
      onSqlTable={setSqlTable}
      sqlDialect={sqlDialect}
      onSqlDialect={setSqlDialect}
      isType={isTypeOutput}
      typeName={typeName}
      onTypeName={setTypeName}
      onResetOptions={resetTransformOptions}
      canMoveToInput={selectedOutput.startsWith("fmt:") && output.trim().length > 0 && !inputInvalid}
      onMoveToInput={() => {
        setInput(output);
        pushHistory(output);
        setInputFormatOverride(null);
        setFocusedPane("input");
      }}
      canDownload={canDownload && !inputInvalid}
      onDownload={() => downloadOutput()}
      copy={transformCopy}
    />
  );

  const copyActive = () => {
    if (isUtilsMode && utilTab === "instant") {
      getInstantActions()?.onCopy();
      return;
    }
    // List modes: use stored quote+layout preference.
    if (isListCopyMode && copyItems.length > 0) {
      const pref = loadListCopyPref(copyMode);
      const text = pref === "as-seen"
        ? getActiveOutputText()
        : formatListCopyAsText(copyItems, pref.quote, pref.layout, pref.suffix);
      void navigator.clipboard.writeText(text).then(
        () => {
          setCopyState("done");
          resetCopySoon();
        },
        () => setCopyState("error"),
      );
      return;
    }
    const text = getActiveOutputText();
    if (!text.trim() && !isDiffMode) {
      if (!isUtilsMode) void copyOutput();
      return;
    }
    if (!text.trim()) return;
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopyState("done");
        toast({ message: "Copied" });
        resetCopySoon();
      },
      () => setCopyState("error"),
    );
  };
  const saveTextFile = (text: string, filename: string) => {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast({ message: "Downloaded" });
  };
  const downloadActive = () => {
    if (isUtilsMode && utilTab === "instant") {
      getInstantActions()?.onDownload();
      return;
    }
    if (isUtilsMode) {
      const text = getActiveOutputText();
      if (text) saveTextFile(text, `formaty-${utilTab}.txt`);
      return;
    }
    if (isDiffMode) {
      if ((diffKind === "list" || diffKind === "single") && listCompareExport?.text) {
        saveTextFile(listCompareExport.text, listCompareExport.filename);
        return;
      }
      downloadDiffReport();
      return;
    }
    downloadOutput();
  };
  const undoActive = () => {
    if (isDiffMode) diffEditorRef.current?.undo();
    else if (isUtilsMode) moveUtilsHistory(-1);
    else moveHistory(-1);
  };
  const redoActive = () => {
    if (isDiffMode) diffEditorRef.current?.redo();
    else if (isUtilsMode) moveUtilsHistory(1);
    else moveHistory(1);
  };
  const resetActive = () => {
    if (isUtilsMode && utilTab === "instant") {
      getInstantActions()?.onReset();
      return;
    }
    handleWorkspaceReset();
  };
  const actionRow = (
    <ActionRow
      canCopy={
        (isDiffMode && diffKind !== "document" ? Boolean(listCompareExport?.count) : Boolean(getActiveOutputText().trim())) ||
        (!isDiffMode && !isUtilsMode && canDownload) ||
        (isUtilsMode && utilTab === "instant")
      }
      onCopy={copyActive}
      canDownload={isUtilsMode || isDiffMode ? true : canDownload}
      onDownload={downloadActive}
      onUndo={undoActive}
      onRedo={redoActive}
      canUndo={isUtilsMode ? canUtilsUndo : isDiffMode ? undefined : canUndo}
      canRedo={isUtilsMode ? canUtilsRedo : isDiffMode ? undefined : canRedo}
      onReset={isDiffMode ? undefined : resetActive}
      resetLabel={isUtilsMode && utilTab === "instant" ? (getInstantActions()?.resetLabel ?? "Reset") : "Reset"}
      outputActions={isUtilsMode && utilTab === "instant"}
    />
  );


  const cycleIndent = () => {
    const next = { ...formatOptions, indentation: formatOptions.indentation === 2 ? 4 : 2 };
    if (selectedOutput.startsWith("fmt:") && !isDiffMode && !isUtilsMode) applyFormatWithOptions(next);
    else setFormatOptions(next);
  };
  const countLines = (t: string) => (t.trim() ? t.split("\n").filter((l) => l.trim()).length : 0);
  const itemsLabel = (n: number) => `${n.toLocaleString()} ${n === 1 ? "item" : "items"}`;
  const sbItem = "shrink-0 tabular-nums max-sm:hidden";
  const sbAlways = "shrink-0 tabular-nums";
  const statusDetails = isUtilsMode ? (
    <span className={sbItem}>{UTIL_TABS.find((t) => t.id === utilTab)?.label ?? utilTab}</span>
  ) : isDiffMode ? (
    <>
      {diffKind === "single" ? (
        <span className={sbItem}>{itemsLabel(listCounts.left)}</span>
      ) : diffKind === "list" ? (
        <>
          <span className={sbItem}>
            <span className="text-side-a">A</span> {itemsLabel(listCounts.left)}
          </span>
          <span className={sbItem}>
            <span className="text-side-b">B</span> {itemsLabel(listCounts.right)}
          </span>
        </>
      ) : (
        <span className={sbItem}>
          <span className="text-side-a">A</span> {countLines(diffLeftInput).toLocaleString()} lines
        </span>
      )}
    </>
  ) : inputEmpty ? null : (
    <>
      <span className={sbItem}>{getInputFormatLabel(resolvedInputFormat)}</span>
      <span className={sbItem}>{inputSizeFormatted}</span>
      <span className={sbItem}>{inputLineCount.toLocaleString()} {inputLineCount === 1 ? "line" : "lines"}</span>
      {cursorPosition && <span className={sbItem}>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>}
      {inputValid === true && <span className={`${sbAlways} text-ok`}>Valid {getInputFormatLabel(resolvedInputFormat)}</span>}
      {inputValid === false &&
        (inputProblem?.line ? (
          <Tooltip content={inputProblem.message}>
            <button
              type="button"
              className="shrink-0 text-bad outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
              onClick={() => inputEditorApiRef.current?.goToLine(inputProblem.line as number, 1)}
            >
              Invalid: line {inputProblem.line}
            </button>
          </Tooltip>
        ) : (
          <Tooltip content={inputProblem?.message}>
            <span className={`${sbAlways} text-bad`}>Invalid</span>
          </Tooltip>
        ))}
    </>
  );

  return (
    <KitTooltipProvider>
    <main
      id="main"
      className="relative flex flex-col overflow-hidden bg-[var(--workspace-background)] text-[var(--workspace-text)]"
      style={{ height: "100dvh", minHeight: "100dvh", maxHeight: "100dvh" }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragActive && (
        <div className="pointer-events-none absolute inset-0 z-[100] flex items-center justify-center bg-[var(--workspace-background)]/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-primary/50 bg-[var(--workspace-panel)]/90 px-10 py-8 shadow-2xl shadow-primary/10">
            <DocumentArrowDownIcon className="h-8 w-8 text-primary" />
            <p className="text-[13px] font-semibold text-[var(--workspace-text)]">
              Drop {isDiffMode ? "one or two files" : "a file"} to import
            </p>
            <p className="text-[13px] text-[var(--workspace-text-muted)]">
              {isDiffMode
                ? "Two files → left / right · one file → side you drop on"
                : "JSON · XML · YAML · TOML · CSV · TXT — stays in your browser"}
            </p>
          </div>
        </div>
      )}
      {!embed && (
        <WorkspaceHeader
          tabs={chromeTabs}
          activeTabId={activeTabId}
          onSwitchTab={switchToTab}
          onCloseTab={closeTab}
          onRenameTab={renameTab}
          onNewTab={openNewTab}
          onReopenTab={reopenTab}
          closedTabName={closedTabName}
          onOpenCommandPalette={() => {
            trackEvent("command_palette", { source: "header" });
            setCommandPaletteOpen(true);
          }}
          onOpenTour={() => openTour("settings")}
          shareOpen={shareOpen}
          onShareOpenChange={setShareOpen}
          shareContent={
            <SharePanel
              open={shareOpen}
              tabCount={tabs.length}
              buildHash={buildShareHash}
              onUpload={uploadShare}
              sharedUrl={sharedLinkUrl}
              onDeleteShared={deleteShared}
            />
          }
          settingsOpen={transformConfigOpen}
          onSettingsOpenChange={setTransformConfigOpen}
          settingsContent={settingsPanelContent}
        />
      )}

      {embed && (
        <div className="flex shrink-0 items-center justify-end gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1">
          <a
            href="/playground"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
          >
            <Logo size={14} className="shrink-0" />
            Open in Formaty
          </a>
        </div>
      )}

      {loadedToolPreset && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-4 w-0.5 shrink-0 rounded-full bg-primary/70" aria-hidden />
            <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="text-[13px] font-semibold text-primary">
                {TOOL_PAGES[loadedToolPreset]?.h1 ?? loadedToolPreset}
              </span>
            </span>
            <span className="hidden text-[13px] text-[var(--workspace-text-muted)] sm:inline">preset loaded</span>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <a
              href={`/${loadedToolPreset}`}
              className="hidden items-center gap-1 text-[13px] text-[var(--workspace-text-muted)] transition-colors hover:text-primary sm:inline-flex"
            >
              <ArrowLeftCircleIcon className="size-4" />
              Tool page
            </a>
            <IconButton label="Dismiss" onClick={() => setLoadedToolPreset(null)}>
              <XMarkIcon />
            </IconButton>
          </div>
        </div>
      )}

      {/* Outer: tab rail (sidebar) + workspace. Tabs must never sit in a column stack with the editors. */}
      <div className="flex min-h-0 flex-1 flex-row overflow-hidden p-2">
        {renamingListSide && listRenameRect && (
          // Sits exactly over the name button it replaces: same box, no border, an inset ring as the only cue.
          <div
            className="fixed z-[90] flex items-center rounded-md bg-[var(--workspace-panel)] px-1.5 text-[14px] font-semibold text-[var(--workspace-text)] ring-[1.5px] ring-inset ring-[var(--focus)]"
            style={{ top: listRenameRect.top, left: listRenameRect.left, height: listRenameRect.height, minWidth: listRenameRect.width }}
          >
            <InlineRename initial={listRenameValue} label="Rename" onDone={commitListRename} />
          </div>
        )}
      {/* Column: stable full-width tool row + split (icons never jump when left panel hides) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-hidden text-[var(--workspace-text)]">
        {isDiffMode && (
          <div className="shrink-0 rounded-[10px] border border-[var(--workspace-border)] bg-[var(--workspace-panel)]">
          <CompareBar
            kind={diffKind}
            onKind={(k) => {
              setDiffKind(k);
              saveLastUsed({ compare: k });
            }}
            options={listCompareOptions}
            onOptions={setListCompareOptions}
            setToolbarHost={setListToolbarHost}
            split={split}
            actions={actionRow}
          />
          </div>
        )}

      {stackSwitch && (
        <div className="flex shrink-0 items-center justify-center rounded-[10px] border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1">
          <Segmented
            aria-label="Pane"
            value={mobileShowOutput ? "output" : "input"}
            onChange={(v) => setMobileShowOutput(v === "output")}
            options={[
              { value: "input", label: "Input" },
              { value: "output", label: "Output" },
            ]}
            className="w-full max-w-xs [&>button]:flex-1"
          />
        </div>
      )}
      <div
        ref={splitContainerRef}
        className={`flex min-h-0 min-w-0 flex-1 ${isDesktopLayout ? "overflow-hidden" : "gap-2 overflow-y-auto"} ${isDesktopLayout && !hideInputPanel ? "flex-row" : "flex-col"}`}
      >
        {inputCollapsed && (
          <div className="flex w-9 shrink-0 flex-col items-center gap-2 border-r border-[var(--workspace-border)] py-1.5">
            <IconButton label="Show input" tooltipSide="right" onClick={() => setIsOutputMaximized(false)}>
              <ChevronRightIcon />
            </IconButton>
            <span className="text-[12px] font-medium text-[var(--workspace-text-muted)] [writing-mode:vertical-rl]">Input</span>
          </div>
        )}
        {showInputPane && (
        <div
          className={`flex min-w-0 flex-col overflow-hidden rounded-[10px] border border-[var(--workspace-border)] bg-[var(--workspace-panel)] ${isDesktopLayout ? "shrink-0" : "min-h-[280px] flex-1"}`}
          style={isDesktopLayout ? { width: `${split}%`, minWidth: 240 } : undefined}
        >
          <input
            id="import-json-file"
            type="file"
            accept=".json,.yaml,.yml,.xml,.toml,.csv,.txt,application/json,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void importFileInto(file);
                e.currentTarget.value = "";
              }
            }}
          />
          <InputHeader
            formatLabel={getInputFormatLabel(resolvedInputFormat)}
            detected={resolvedInputFormat}
            hasInput={!inputEmpty}
            onCollapse={isDesktopLayout ? () => setIsOutputMaximized(true) : undefined}
            onSample={loadInputSample}
            onClear={() => {
              setInput("");
              pushHistory("");
              setOutput("");
              setParsedOutput(null);
              setError(null);
              setValidationError(null);
              setFocusedPane("input");
            }}
            override={inputFormatOverride}
            onOverride={setInputFormatOverride}
            wrap={lineWrap}
            onWrap={setLineWrap}
            onTidy={() => void tidyInput()}
            canTidy={inputValid === true && resolvedInputFormat !== "curl"}
          />
          <div
            data-tour="input-editor"
            className="relative min-h-0 flex-1 cursor-text overflow-hidden"
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
              onCtrlEnter={parseOnly}
              onCursorChange={(line, column) => { setCursorPosition({ line, column }); cursorPositionRef.current = { line, column }; }}
              disableLargeMode={forceFullEditor}
            />
            {inputEmpty && (
              <EmptyInput onChooseFile={() => document.getElementById("import-json-file")?.click()} onSample={loadInputSample} />
            )}
          </div>
          {resolvedInputFormat === "curl" && !inputEmpty && (
            <CurlSendStrip
              // A click always sends again; only Ctrl+Enter may reuse the last response.
              onSend={() => { curlCacheRef.current = null; parseOnly(); setFocusedPane("input"); }}
              sending={curlFetching}
              disabled={inputValid === false}
              sent={input === lastExecutedCurlInput}
            />
          )}
          {inputProblem && (
            <InputErrorStrip
              message={inputProblem.message}
              line={inputProblem.line}
              onGoToLine={(l) => inputEditorApiRef.current?.goToLine(l, 1)}
              actions={inputProblem.actions.map((a) => ({ label: a.label, onClick: () => setInputFormatOverride(a.format) }))}
            />
          )}
        </div>
        )}
        {isDesktopLayout && showInputPane && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize input and output"
            aria-valuenow={split}
            aria-valuemin={25}
            aria-valuemax={60}
            tabIndex={0}
            className="group relative flex shrink-0 cursor-col-resize items-stretch justify-center outline-none"
            style={{ width: 8, zIndex: 10 }}
            onMouseDown={() => setIsResizing(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                nudgeSplit((e.key === "ArrowLeft" ? -1 : 1) * (e.shiftKey ? 10 : 2));
              }
            }}
          >
            <div className="pointer-events-none absolute inset-y-2 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-transparent transition-colors group-hover:bg-[var(--workspace-text-muted)] group-focus-visible:bg-[var(--focus)] group-active:bg-[var(--workspace-text)]" />
          </div>
        )}
                {showOutputPane && (
        <div className={`flex min-w-0 flex-1 flex-col overflow-hidden rounded-[10px] border border-[var(--workspace-border)] bg-[var(--workspace-panel)] ${isDesktopLayout ? "" : "min-h-[320px]"}`}>
          {!hideInputPanel && outputHeader}
          <div data-tour="output-pane" className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              key={
                isUtilsMode
                  ? `utils-${utilTab}`
                  : isDiffMode
                    ? `diff-${diffKind}`
                    : `transform-${rightView}`
              }
              className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${staleOutput ? "opacity-60" : ""}`}
            >
            {isUtilsMode ? (
              <UtilsPanel
                headerActions={actionRow}
                linkBtnClass=""
                panelClass={outputPanelClass}
                isDark={isDark}
                activeTab={utilTab}
                onActiveTabChange={(t) => {
                  trackEvent("util_tool", { tool: t });
                  setUtilTab(t);
                }}
                stateByTool={utilsByTool}
                regenKey={utilsRegenKey}
                tabId={activeTabId}
                onStateByToolChange={(next) => {
                  setUtilsByTool(next);
                  if (!utilsHistoryLock.current) pushUtilsHistory(next);
                }}
                fontSize={editorFontSize}
              />
            ) : isDiffMode ? (
              <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                {diffKind === "list" ? (
                  <ListComparePanel
                    left={diffLeftInput}
                    right={diffRightInput}
                    onLeftChange={setDiffLeftInput}
                    onRightChange={setDiffRightInput}
                    isDark={isDark}
                    toolbarHost={listToolbarHost}
                    split={split}
                    onResizeStart={startResize}
                    onNudgeSplit={nudgeSplit}
                    onExportChange={setListCompareExport}
                    fontSize={editorFontSize}
                    options={listCompareOptions}
                    onOptionsChange={setListCompareOptions}
                    onCountsChange={reportListCounts}
                    initialCsvColumn={csvColumn}
                    onCsvColumnChange={setCsvColumn}
                    activeBucket={activeBucket}
                    onActiveBucketChange={setActiveBucket}
                    leftLabel={tabs.find((t) => t.id === activeTabId)?.leftLabel}
                    rightLabel={tabs.find((t) => t.id === activeTabId)?.rightLabel}
                    onStartListRename={startListRename}
                  />
                ) : diffKind === "single" ? (
                  <SingleListPanel
                    value={diffLeftInput}
                    onChange={setDiffLeftInput}
                    isDark={isDark}
                    toolbarHost={listToolbarHost}
                    split={split}
                    onResizeStart={startResize}
                    onNudgeSplit={nudgeSplit}
                    onExportChange={setListCompareExport}
                    fontSize={editorFontSize}
                    options={listCompareOptions}
                    onOptionsChange={setListCompareOptions}
                    onCountChange={reportListCount}
                    listLabel={tabs.find((t) => t.id === activeTabId)?.leftLabel ?? tabs.find((t) => t.id === activeTabId)?.rightLabel}
                    onStartListRename={startListRename}
                  />
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <DocumentHeader
                      host={listToolbarHost}
                      onDownload={downloadDiffReport}
                      leftName={tabs.find((t) => t.id === activeTabId)?.leftLabel ?? "Document A"}
                      rightName={tabs.find((t) => t.id === activeTabId)?.rightLabel ?? "Document B"}
                      onRename={startListRename}
                      view={diffShowPaths ? "fields" : diffSideBySide ? "side" : "lines"}
                      onView={(v) => {
                        trackEvent("diff_toggle", { setting: "view", value: v });
                        setDiffShowPaths(v === "fields");
                        if (v !== "fields") setDiffSideBySide(v === "side");
                      }}
                      canFields={canShowPathDiff}
                      stats={diffLineStats}
                      structural={structuralDiff}
                      hasContent={Boolean(diffLeftInput.trim() || diffRightInput.trim())}
                      nav={diffNav}
                      onPrev={() => diffEditorRef.current?.prevChange()}
                      onNext={() => diffEditorRef.current?.nextChange()}
                      onSample={loadSampleDocuments}
                      onTidy={() => beautifyDiffSides("both", true)}
                      canTidy={documentDiffLanguage === "json" && Boolean(diffLeftInput.trim() || diffRightInput.trim())}
                      onClear={() => clearDiffSide("both")}
                      onSwap={swapDiffSides}
                      ignoreWhitespace={diffIgnoreWhitespace}
                      onIgnoreWhitespace={setDiffIgnoreWhitespace}
                      copyFormat={docCopyFormat}
                      onCopyFormat={setDocCopyFormat}
                      onCopy={(what) => copyDiffText(what)}
                      language={documentDiffLanguage}
                    />
                    {diffShowPaths && <FieldTable summary={structuralDiff} />}
                    <div className={diffShowPaths ? "hidden" : "flex min-h-0 flex-1 flex-col overflow-hidden"}>
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
                        // Shared wrap setting: both sides wrap identically so
                        // corresponding lines stay visually aligned.
                        wordWrap={lineWrap ? "on" : "off"}
                        originalEditable
                        modifiedEditable
                        onOriginalChange={handleDiffLeftChange}
                        onModifiedChange={handleDiffRightChange}
                        onLineStatsChange={setDiffLineStats}
                        onNavChange={setDiffNav}
                        outputPanelClass={outputPanelClass}
                        disableLargeMode={forceFullEditor}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : rightView === "raw" ? (
              output.trim() || curlFetching ? (
                <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                  {curlMeta && resolvedInputFormat === "curl" && (
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2.5 py-1.5">
                      <StatusText tone={curlMeta.ok ? "ok" : "bad"} className="tabular-nums">
                        HTTP {curlMeta.status}{curlMeta.statusText ? ` ${curlMeta.statusText}` : ""}
                      </StatusText>
                      <span className="text-[13px] tabular-nums text-[var(--workspace-text-muted)]">
                        {curlMeta.size} B
                      </span>
                      {curlMeta.timingMs >= 0 && (
                        <span className="text-[13px] tabular-nums text-[var(--workspace-text-muted)]">
                          {curlMeta.timingMs} ms
                        </span>
                      )}
                      {curlMeta.headers["content-type"] && (
                        <span className="hidden truncate font-mono text-[13px] text-[var(--workspace-text-muted)] sm:inline">
                          {curlMeta.headers["content-type"]}
                        </span>
                      )}
                      <span className="ml-auto text-[13px] text-[var(--workspace-text-muted)]">Response</span>
                    </div>
                  )}
                  {curlFetching ? (
                    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-[var(--workspace-panel)] px-3 py-2" aria-label="Fetching response">
                      {[70, 45, 55, 80, 40, 65, 30].map((w, i) => (
                        <div
                          key={i}
                          className="h-3 animate-pulse rounded bg-[var(--workspace-border)]/60"
                          style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }}
                        />
                      ))}
                      <p className="mt-1 text-[13px] font-medium text-[var(--workspace-text-muted)]">
                        Executing request…
                      </p>
                    </div>
                  ) : (
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
                    disableLargeMode={forceFullEditor}
                  />
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-[120px] items-start p-3 text-[13px] text-[var(--workspace-text-muted)]">
                  {inputInvalid ? "Fix the input to see the result." : "The result appears here."}
                </div>
              )
            ) : null}
            {!isUtilsMode && !isDiffMode && rightView === "tree" ? (
              parsedOutput ? (
                isHugeRight ? (
                  <div className={`flex h-full min-h-[200px] flex-col items-center justify-center gap-3 border p-6 text-center text-[13px] text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
                    <p>Tree view is disabled for inputs over ~2MB to keep the UI responsive.</p>
                    <Button variant="secondary" onClick={() => setRightView("raw")}>Switch to text</Button>
                  </div>
                ) : (
                  <TreeView
                    ref={treeViewRef}
                    data={parsedOutput}
                    isDark={isDark}
                    largeFile={isLargeInput}
                    fontSize={editorFontSize}
                    byteSize={effectiveRightByteSize}
                    onNotify={(msg) => toast({ message: msg })}
                    className={`${outputPanelClass} min-h-0 flex-1 overflow-auto`}
                  />
                )
              ) : (
                <div className={`flex h-full min-h-[200px] items-center justify-center border text-[13px] text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
                  Current output is not valid JSON.
                </div>
              )
            ) : null}
            {!isUtilsMode && !isDiffMode && rightView === "graph" ? (
              parsedOutput ? (
                isLargeRight ? (
                  <div className={`flex h-full min-h-[200px] flex-col items-center justify-center gap-3 border p-6 text-center text-[13px] text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
                    <p>Graph view is disabled for inputs over ~400KB. Use Raw, Query, or download instead.</p>
                    <Button variant="secondary" onClick={() => setRightView("raw")}>Switch to text</Button>
                  </div>
                ) : (
                  <GraphView
                    ref={graphViewRef}
                    data={parsedOutput}
                    isDark={isDark}
                    byteSize={effectiveRightByteSize}
                    className={`${outputPanelClass} min-h-0 flex-1`}
                  />
                )
              ) : (
                <div className={`flex h-full min-h-[200px] items-center justify-center border text-[13px] text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
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
                  onResultChange={setQueryResult}
                  initialQuery={queryText || undefined}
                  onQueryChange={setQueryText}
                  onOpenInListCompare={openInListCompare}
                />
              ) : (
                <div className={`flex h-full min-h-[200px] items-center justify-center border text-[13px] text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
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
                if (!isLargeRight) {
                  if (data == null && output.trim()) data = tryParse(output);
                  if (data == null && input.trim()) data = tryParse(input);
                }
                if (isLargeRight) {
                  return (
                    <div className={`flex h-full min-h-[200px] flex-col items-center justify-center gap-3 border p-6 text-center text-[13px] text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
                      <p>Table view is disabled for inputs over ~400KB to keep the UI responsive.</p>
                      <Button variant="secondary" onClick={() => setRightView("raw")}>Switch to text</Button>
                    </div>
                  );
                }
                return data != null ? (
                  <TableView
                    data={data}
                    className={`${outputPanelClass} min-h-0 flex-1 overflow-auto`}
                    isDark={isDark}
                    fontSize={editorFontSize}
                    byteSize={effectiveRightByteSize}
                  />
                ) : (
                  <div className={`flex h-full min-h-[200px] flex-col items-center justify-center gap-2 border p-6 text-center text-[13px] text-[var(--workspace-text-muted)] ${outputPanelClass}`}>
                    <p>No tabular data yet. Paste a JSON <strong className="text-[var(--workspace-text)]">array of objects</strong>.</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button
                        variant="secondary"
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
                        Sample
                      </Button>
                      <Button variant="ghost" onClick={() => setRightView("raw")}>
                        Switch to text
                      </Button>
                    </div>
                  </div>
                );
              })()
            ) : null}
            </div>
          </div>
        </div>
        )}
      </div>
      </div>
      </div>

      {embed && <div className="h-px shrink-0 bg-[var(--workspace-border)]" aria-hidden />}

      {!embed && (
        <StatusBar
          details={statusDetails}
          liveTransform={liveTransform}
          onLiveTransform={setLiveTransform}
          indent={formatOptions.indentation}
          onCycleIndent={cycleIndent}
          onShortcuts={() => window.dispatchEvent(new Event("formaty:open-shortcuts"))}
        />
      )}

      {isHugeInput && !embed ? (
        <div className="flex shrink-0 items-center gap-2 border-b border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-[13px] text-amber-700 dark:text-amber-300">
          <span className="font-semibold">Huge input — read-only mode.</span>
          <span>Tree/Table/Graph show the first 200 rows. Editor is hardened (no syntax worker, max 5 000 lines visible).</span>
          {forceFullEditor ? (
            <Button variant="secondary" className="ml-auto" onClick={() => setForceFullEditor(false)}>
              Re-enable safety
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="ml-auto"
              onClick={() => {
                setForceFullEditor(true);
                toast({ message: "Full editor on — page may lag at this size", type: "info" });
              }}
            >
              Edit anyway
            </Button>
          )}
        </div>
      ) : null}

      <Toaster />

        <CommandPalette
          open={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          commands={commandPaletteCommands}
          context={isUtilsMode ? { label: "Utils", categories: ["Utils"], suggested: ["util-auto", "util-uuid", "util-jwt", "util-base64", "util-hash"] } : isDiffMode ? { label: "Compare", categories: ["Compare"], suggested: ["act-diff-next", "act-diff-swap", "dest-compare-document", "dest-compare-list"] } : { label: "Transform", categories: ["Transform", "Input", "Output"], suggested: ["dest-fmt-yaml", "dest-fmt-csv", "act-tidy", "act-copy", "act-share", "act-find"] }}
        />

        {/* Guided product tour - first-run onboarding + explicit replay. */}
        <GuidedTour
          open={tourOpen}
          onOpenChange={setTourOpen}
          onExit={closeTour}
        />

        {/* History Panel */}
        {showHistoryPanel && (
          <div className="fixed inset-0 z-[200] flex items-stretch justify-end bg-black/30 backdrop-blur-[2px]" onClick={() => setShowHistoryPanel(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-label="History"
              className="flex h-full w-full max-w-sm flex-col border-l border-[var(--workspace-border)] bg-popover shadow-menu"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-11 shrink-0 items-center justify-between border-b border-[var(--workspace-border)] px-3">
                <div className="flex items-center gap-2">
                  <ClockIcon className="size-4 text-[var(--workspace-text-muted)]" />
                  <span className="text-[14px] font-semibold text-[var(--workspace-text)]">Input history</span>
                  <span className="text-[12px] tabular-nums text-[var(--workspace-text-muted)]">{undoIndex + 1}/{undoStack.length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" icon={<ArrowDownTrayIcon />} onClick={exportHistory}>Download</Button>
                  <IconButton label="Close history" onClick={() => setShowHistoryPanel(false)}><XMarkIcon /></IconButton>
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
                      className={`relative flex w-full flex-col items-start gap-1 border-b border-[var(--workspace-border)] px-3 py-2.5 text-left transition-colors ${isCurrent ? "bg-control" : "hover:bg-control"}`}
                      onClick={() => {
                        const delta = idx - undoIndex;
                        if (delta !== 0) moveHistory(delta as -1 | 1);
                        setShowHistoryPanel(false);
                      }}
                    >
                      <div className="flex w-full items-center gap-2">
                        {isCurrent && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-action" />}
                        <span className={`text-[13px] font-medium ${isCurrent ? "text-[var(--workspace-text)]" : "text-[var(--workspace-text-muted)]"}`}>
                          {isCurrent ? "Current" : `Version ${idx + 1}`}
                        </span>
                        <span className="ml-auto text-[12px] tabular-nums text-[var(--workspace-text-muted)]">{getSizeFormatted(content)}</span>
                      </div>
                      <span className="line-clamp-2 font-mono text-[12px] leading-[1.5] text-[var(--workspace-text-muted)]">
                        {content.slice(0, 120) || "(empty)"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <Dialog
          open={modalKind === "validate"}
          onOpenChange={(open) => {
            if (!open) setModalKind(null);
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-sm">Validate against a schema</DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed">
                Paste a{" "}
                <strong className="text-[var(--workspace-text)]">JSON Schema</strong> or{" "}
                <strong className="text-[var(--workspace-text)]">YAML schema</strong> to validate
                the current input against. Validation runs locally - nothing leaves your device.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              className="h-60 w-full font-mono text-[13px]"
              value={modalValue}
              onChange={(e) => setModalValue(e.target.value)}
              placeholder="Paste a JSON Schema or YAML schema…"
            />
            <DialogFooter>
              <Button variant="secondary" onClick={() => setModalKind(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={!isModalInputValid}
                onClick={() => {
                  if (!isModalInputValid) return;
                  setSchemaInput(modalValue);
                  setModalKind(null);
                  executeOperation("validate", { schemaText: modalValue });
                }}
              >
                Validate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPastePrompt} onOpenChange={setShowPastePrompt}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Allow paste</DialogTitle>
              <DialogDescription className="text-[13px] leading-relaxed">
                Formaty reads your clipboard when you use{" "}
                <kbd className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1 py-px font-mono text-[13px]">
                  ⌘V
                </kbd>{" "}
                on an empty workspace. Your browser blocked that read - click{" "}
                <strong className="text-[var(--workspace-text)]">Allow paste</strong> to grant
                clipboard access. Everything stays on your device; nothing is uploaded.
              </DialogDescription>
            </DialogHeader>
            {pastePromptError && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] leading-snug text-red-500">
                Paste is still blocked. Use the editor&apos;s own Ctrl/⌘+V instead, or allow
                clipboard access in this site&apos;s permission settings.
              </p>
            )}
            <DialogFooter>
              <Button variant="secondary" onClick={() => setShowPastePrompt(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => void allowPasteRetry()}>Allow paste</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {showFirstRunHint && (
          <div className="fixed bottom-6 left-1/2 z-50 flex max-w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-3 rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)]/95 px-3 py-2 text-[13px] shadow-xl backdrop-blur-md">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--workspace-text)]">Quick tip</p>
              <p className="mt-0.5 text-[var(--workspace-text-muted)]">{quickTip ?? QUICK_TIPS[0]}</p>
            </div>
            <IconButton
              label="Dismiss"
              onClick={() => {
                setShowFirstRunHint(false);
                try {
                  localStorage.setItem("formaty-onboarded", "1");
                } catch {
                  /* ignore */
                }
              }}
            >
              <XMarkIcon />
            </IconButton>
          </div>
        )}

    </main>
    </KitTooltipProvider>
  );
}
