"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  ArrowPathIcon,
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
  Cog6ToothIcon,
  BoltIcon,
  CodeBracketIcon,
  EyeIcon,
  Squares2X2Icon,
  DocumentTextIcon,
  QueueListIcon,
  ShareIcon,
  TableCellsIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  RectangleStackIcon,
  CheckBadgeIcon,
  EqualsIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import {
  AnimatedBracesIcon,
  AnimatedCodeIcon,
  AnimatedCopyIcon,
  AnimatedMagnifierIcon,
  AnimatedSparklesIcon,
  AnimatedUploadIcon,
  useIconAnimation,
  type AnimatedIconHandle,
} from "@/components/icons";
import { JsonDiffEditor, type DiffNavState, type JsonDiffEditorRef } from "@/components/JsonDiffEditor";
import { ListComparePanel, type ListCompareExport } from "@/components/ListComparePanel";
import { SingleListPanel } from "@/components/SingleListPanel";
import { DEFAULT_LIST_PARSE_OPTIONS, type ListParseOptions } from "@/lib/json/listCompare";
import {
  menuItemClass as sharedMenuItemClass,
  menuItemActiveClass as sharedMenuItemActiveClass,
  menuSectionLabel as sharedMenuSectionLabel,
  menuCheck as sharedMenuCheck,
} from "@/components/workspace/menuStyles";
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
import { JsonEditor } from "@/components/JsonEditor";
import { GraphView, type GraphViewRef } from "@/components/GraphView";
import { TreeView, type TreeViewRef } from "@/components/TreeView";
import { QueryView } from "@/components/QueryView";
import { TableView } from "@/components/TableView";
import { trackEvent } from "@/components/Analytics";
import {
  Dropdown,
  getSizeFormatted,
  Header as WorkspaceHeader,
  OutputActionBar,
  StatusBar,
  Tooltip,
  ACTION_LABELS,
  loadVisibility,
  saveVisibility,
  formatCopyAsText,
  formatCopyItemsAsText,
  DEFAULT_COPY_AS_OPTIONS,
  LIST_COPY_AS_OPTIONS,
  UUID_COPY_AS_OPTIONS,
  BATCH_COPY_AS_OPTIONS,
  TABLE_COPY_AS_OPTIONS,
  type CopyAsFormat,
  type GraphCopyFormat,
  type OutputActionId,
  type OutputActionVisibility,
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
import { detectFormat, FORMAT_LABELS, getInputFormatLabel, parseInput, type FormatKind, type InputFormatKind } from "@/lib/formats";
import { ALL_TOOL_ROUTES, TOOL_PAGES, TOOL_PRESETS, type ToolRoute } from "@/lib/seo";
import { executeCurlDetailed, parseCurl, type CurlExecutionResult } from "@/lib/curl/parseCurl";
import { CURL_TARGETS, generateCurlCode, getCurlTarget, type CurlTargetId } from "@/lib/curl/codegen";
import type { SqlDialect } from "@/lib/json/core";
import { formatJson } from "@/lib/json/core";
import { decodeState, encodeState } from "@/lib/shareState";
import { savePlayground, updatePlayground, deletePlayground } from "@/lib/playgroundApi";
import { PRESETS, getPreset, type PresetId } from "@/lib/presets";
import { themeInlineCss } from "@/lib/utils/themeTokens";
import { CommandPalette, type Command } from "@/components/CommandPalette";
import { isEditableTarget } from "@/lib/shortcuts";
import { Toaster, toast } from "@/components/Toast";
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

/** Array of objects - best starting point for Table view */
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

/** Rotating quick tips shown in the first-run hint and empty state. */
const QUICK_TIPS = [
  "Press Ctrl+K (⌘K) to run any action from the command palette.",
  "Press ? (or ⌘/) for a full list of keyboard shortcuts.",
  "⌘1–⌘5 switch between Raw, Tree, Graph, Query, and Table views.",
  "Copy the output from any view with ⌘C / Ctrl+C.",
  "⌥↑ / ⌥↓ step through your input history like a shell.",
  "Everything runs locally - your data never leaves the browser.",
  "Share is the only action that can leave your device - use it on purpose.",
  "Pin favorites to the toolbar from Settings ⚙ for one-click access.",
  "Live Transform refreshes the output as you type.",
  "Compare does document diff AND list compare (SQL IN lists, etc.).",
  "Copy as… encodes output as base64, URI, escaped, or SQL IN.",
  "Maximize the output pane (top-right) for a distraction-free view.",
  "Input format is auto-detected - JSON, XML, YAML, TOML, CSV, cURL.",
  "Copy the output and paste it back into the input to chain transforms.",
  "The status bar shows line count, size, validity, and cursor position.",
  "Tabs keep separate sessions - share them all from the Share menu.",
];

/** Transform actions only - Compare is a separate workspace tool (not nested here). */
const OPERATION_ACTIONS = [
  ["Beautify", "beautify"],
  ["Minify", "minify"],
  ["Flatten", "flatten"],
  ["Unflatten", "unflatten"],
  ["Schema", "schema"],
  ["OpenAPI spec", "openapi"],
  ["Validate", "validate"],
] as const;

const OPERATION_ACTION_LABELS = Object.fromEntries(
  OPERATION_ACTIONS.map(([label, id]) => [id, label]),
) as Record<string, string>;

/** Icons shown next to the selected value in the View / Actions triggers. */
const VIEW_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  raw: DocumentTextIcon,
  tree: QueueListIcon,
  graph: ShareIcon,
  /** High-value interactive icon - animates on hover/focus. */
  query: AnimatedMagnifierIcon,
  table: TableCellsIcon,
};

const ACTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  /** Main action - sparkles twinkle once on hover/focus. */
  beautify: AnimatedSparklesIcon,
  minify: MinusIcon,
  flatten: ArrowsPointingInIcon,
  unflatten: ArrowsPointingOutIcon,
  schema: RectangleStackIcon,
  openapi: CodeBracketIcon,
  validate: CheckBadgeIcon,
};

/** Per-format icons shown in the Format trigger: JSON {}, XML <>, CSV table… */
const FORMAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  /** JSON braces spread on hover/focus (Formaty's own glyph, itsHover motion). */
  json: AnimatedBracesIcon,
  /** XML angle brackets spread on hover/focus. */
  xml: AnimatedCodeIcon,
  yaml: QueueListIcon,
  toml: EqualsIcon,
  csv: TableCellsIcon,
};

/**
 * Renders a toolbar trigger icon and forwards the imperative animation ref.
 * Static heroicons glyphs ignore the ref (their own ref is an SVG element);
 * animated icons (from @/components/icons) use it for hover/focus control.
 */
function TriggerIcon({
  Icon,
  iconRef,
  className,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  iconRef: React.Ref<AnimatedIconHandle>;
  className?: string;
}) {
  const Animated = Icon as React.ComponentType<{ className?: string; ref?: React.Ref<AnimatedIconHandle> }>;
  return <Animated ref={iconRef} className={className} />;
}

/** Brand-tinted 2-letter badges for the Types trigger (no icon dependency). */
const TYPE_BADGES: Record<string, { text: string; bg: string; fg: string }> = {
  typescript: { text: "TS", bg: "#3178c6", fg: "#fff" },
  zod: { text: "Z", bg: "#1e3a8a", fg: "#fff" },
  java: { text: "Jv", bg: "#e76f00", fg: "#fff" },
  csharp: { text: "C#", bg: "#68217a", fg: "#fff" },
  python: { text: "Py", bg: "#3776ab", fg: "#ffd43b" },
  pydantic: { text: "Pd", bg: "#3d7ea6", fg: "#fff" },
  go: { text: "Go", bg: "#00add8", fg: "#00273b" },
  protobuf: { text: "Pb", bg: "#4f5b93", fg: "#fff" },
  kotlin: { text: "Kt", bg: "#7f52ff", fg: "#fff" },
  swift: { text: "Sw", bg: "#f05138", fg: "#fff" },
  rust: { text: "Rs", bg: "#ce422b", fg: "#fff" },
  sql: { text: "SQL", bg: "#336791", fg: "#fff" },
  fetch: { text: "JS", bg: "#f7df1e", fg: "#000" },
  axios: { text: "JS", bg: "#5a29e4", fg: "#fff" },
};

function TypeBadge({ id }: { id: string }) {
  const b = TYPE_BADGES[id] ?? { text: id.slice(0, 2).toUpperCase(), bg: "var(--workspace-border)", fg: "var(--workspace-text-muted)" };
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-[7px] font-bold"
      style={{ backgroundColor: b.bg, color: b.fg }}
      aria-hidden
    >
      {b.text}
    </span>
  );
}

const FORMAT_KINDS: FormatKind[] = ["json", "xml", "yaml", "toml", "csv"];

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
  | "javascript"
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
type Tab = { id: string; label: string; num: number; renamed?: boolean };
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
  /** Embed mode: hide chrome (header, status bar, footer links) for iframes. */
  embed?: boolean;
}

import type { ButtonHTMLAttributes } from "react";
import { Button as UiButton } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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

/** Settings panel (redesigned) helpers. */

/** Section rule header: uppercase label + hairline rule. */
function SettingsRule({ title }: { title: string }) {
  return (
    <div className="mt-3 flex items-center gap-2.5">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--workspace-text-muted)]">
        {title}
      </span>
      <span className="h-px flex-1 bg-[var(--workspace-border)]/60" aria-hidden />
    </div>
  );
}

/** Settings row - label left, control right, hover pill. */
function SettingsRow({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3 rounded-md px-1.5 py-1 transition-colors hover:bg-primary/5">
      <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-[var(--workspace-text)]">
        {label}
      </span>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  );
}

/** Star pin toggle for settings rows. */
function PinButton({
  pinned,
  label,
  onClick,
}: {
  pinned: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip content={pinned ? `Unpin ${label} from toolbar` : `Pin ${label} to toolbar`}>
    <button
      type="button"
      onClick={onClick}
      aria-label={pinned ? `Unpin ${label}` : `Pin ${label}`}
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all ${
        pinned
          ? "text-amber-500 hover:bg-amber-500/10"
          : "text-[var(--workspace-text-muted)]/55 hover:bg-primary/10 hover:text-primary"
      }`}
    >
      {pinned ? <StarSolidIcon className="h-3 w-3" /> : <StarIcon className="h-3 w-3" />}
    </button>
    </Tooltip>
  );
}

/** Compact -/+ stepper pill used in settings rows. */
function SettingsStepper({
  value,
  onDec,
  onInc,
  onReset,
  decLabel,
  incLabel,
  resetLabel,
  minWidth = "min-w-[1.75rem]",
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  onReset: () => void;
  decLabel: string;
  incLabel: string;
  resetLabel: string;
  minWidth?: string;
}) {
  const stepBtn =
    "flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] transition-colors duration-100 hover:bg-primary/10 hover:text-primary active:bg-primary/15";
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-[var(--workspace-border)]/50 bg-muted/50">
      <button type="button" aria-label={decLabel} className={stepBtn} onClick={onDec}>
        <MinusIcon className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span
        className={`flex h-7 ${minWidth} items-center justify-center border-x border-[var(--workspace-border)]/40 px-1.5 text-xs font-medium tabular-nums text-[var(--workspace-text)]`}
      >
        {value}
      </span>
      <button type="button" aria-label={incLabel} className={stepBtn} onClick={onInc}>
        <PlusIcon className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button type="button" aria-label={resetLabel} className={stepBtn} onClick={onReset}>
        <ArrowPathIcon className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}

/** One labelled row of pin-to-toolbar chips. */
function PinChipRow({
  label,
  items,
  pinned,
  onToggle,
}: {
  label: string;
  items: Array<{ id: string; label: string }>;
  pinned: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 w-12 shrink-0 text-[9px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => {
          const on = pinned(item.id);
          return (
            <Tooltip key={item.id} content={on ? `Unpin ${item.label}` : `Pin ${item.label}`}>
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              className={`inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-[10px] font-medium transition-colors ${
                on
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-[var(--workspace-border)]/70 text-[var(--workspace-text-muted)] hover:border-primary/25 hover:text-[var(--workspace-text)]"
              }`}
            >
              {on ? <StarSolidIcon className="h-3 w-3 text-amber-500" /> : <StarIcon className="h-3 w-3 opacity-50" />}
              {item.label}
            </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

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
  const [shareAllTabs, setShareAllTabs] = useState(false);
  const [listToolbarHost, setListToolbarHost] = useState<HTMLElement | null>(null);
  /** Active list-compare result for shared OutputActionBar copy/download */
  const [listCompareExport, setListCompareExport] = useState<ListCompareExport | null>(null);
  const [listCompareOptions, setListCompareOptions] = useState<ListParseOptions>(DEFAULT_LIST_PARSE_OPTIONS);
  /** CSV key column for compare-by-column (persisted in share links). */
  const [csvColumn, setCsvColumn] = useState<string | null>(null);
  /** Query-view text, lifted for share links. */
  const [queryText, setQueryText] = useState("");
  /** Ref into TreeView search box (Cmd/Ctrl+F). */
  const treeViewRef = useRef<TreeViewRef | null>(null);
  /** Info about the last file dropped/imported (shown as a chip, cleared on demand). */
  const [droppedFile, setDroppedFile] = useState<{ name: string; size: number; format: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const dragDepthRef = useRef(0);
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
  /** Latest query-view result - lifted so the global toolbar copies / downloads it. */
  const [queryResult, setQueryResult] = useState("");
  /** Last 'copy as' format per tool (keyed by tool id) - preserved per tab. */
  const [copyAsMemory, setCopyAsMemory] = useState<Record<string, CopyAsFormat>>({});
  /** Last graph copy format (PNG / JPG / SVG / JSON) - preserved per tab. */
  const [graphCopyFormat, setGraphCopyFormat] = useState<GraphCopyFormat>("png");
  const [typeLanguage, setTypeLanguage] = useState<TypeTargetLanguage>("typescript");
  const [copyState, setCopyState] = useState<"idle" | "done" | "error">("idle");
  const [shareState, setShareState] = useState<"idle" | "done" | "error">("idle");
  const [sharedLinkId, setSharedLinkId] = useState<string | null>(initialSharedLinkId ?? null);
  const [sharedLinkUrl, setSharedLinkUrl] = useState<string | null>(initialSharedLinkUrl ?? null);
  const [isOutputMaximized, setIsOutputMaximized] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(true);
  const [focusedPane, setFocusedPane] = useState<"input" | "output">("input");
  const [formatOptions, setFormatOptions] = useState<FormatOptions>(DEFAULT_FORMAT_OPTIONS);
  const [convertToFormat, setConvertToFormat] = useState<FormatKind>("json");
  const [inputFormatOverride, setInputFormatOverride] = useState<InputFormatKind | null>(null);
  const [transformConfigOpen, setTransformConfigOpen] = useState(false);
  /** Which settings-panel tab is open (General / Compare / Utils). */
  const [settingsTab, setSettingsTab] = useState<"general" | "compare" | "utils">("general");
  /** Menu-first chrome by default - cleaner for new users; uncheck in settings for pinned toolbar. */
  const [viewAsMenu, setViewAsMenu] = useState(true);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [typesMenuOpen, setTypesMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [curlCodeOpen, setCurlCodeOpen] = useState(false);
  const [curlTarget, setCurlTarget] = useState<CurlTargetId | null>(null);
  const [pinnedItems, setPinnedItems] = useState<Set<string>>(
    () => new Set(["fmt:json", "view:raw", "view:query", "action:beautify", "action:minify", "type:typescript", "type:zod"])
  );
  const [outputActionVisibility, setOutputActionVisibility] = useState<OutputActionVisibility>(() => loadVisibility());
  const [shareConfirmOpen, setShareConfirmOpen] = useState(false);
  const [showFirstRunHint, setShowFirstRunHint] = useState(false);

  const [liveTransform, setLiveTransform] = useState(true);
  const [editorFontSize, setEditorFontSize] = useState(13);
  const [lineWrap, setLineWrap] = useState(true);
  const [diffSideBySide, setDiffSideBySide] = useState(true);
  const [diffIgnoreWhitespace, setDiffIgnoreWhitespace] = useState(false);
  const [diffIgnoreOrder, setDiffIgnoreOrder] = useState(false);
  const [diffShowPaths, setDiffShowPaths] = useState(false);
  /** cURL response metadata (status / headers / size / timing) shown for curl input. */
  const [curlMeta, setCurlMeta] = useState<CurlExecutionResult | null>(null);
  /** True while a cURL request is in flight (cache miss) - drives the skeleton. */
  const [curlFetching, setCurlFetching] = useState(false);
  /** Last input value actually executed - drives the "Press ⌘⏎ to run" hint. */
  const [lastExecutedCurlInput, setLastExecutedCurlInput] = useState("");
  /** SQL dialect used by the JSON → SQL type generator. */
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>("sqlite");
  const [diffPathFilter, setDiffPathFilter] = useState<"all" | "added" | "removed" | "changed">("all");
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
  const [showTabs, setShowTabs] = useState(true);
  const tabCounterRef = useRef(1);
  /** Inline tab-rename editor state (floating input next to the rail). */
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameRect, setRenameRect] = useState<{ top: number; left: number } | null>(null);
  // Recent command palette actions
  const [recentActions, setRecentActions] = useState<string[]>([]);
  // Split input
  const [splitInputOpen, setSplitInputOpen] = useState(false);
  const [splitInput2, setSplitInput2] = useState("");
  const [splitRatio, setSplitRatio] = useState(50);
  const [isSplitResizing, setIsSplitResizing] = useState(false);
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
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [actionBounce, setActionBounce] = useState<"share" | "copy" | null>(null);
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
    diffKind: "document" | "list" | "single";
    /** Per-tab list parsing options / CSV column / query text (persisted with tab snapshots). */
    listCompareOptions?: Partial<ListParseOptions>;
    csvColumn?: string | null;
    queryText?: string;
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
    diffSideBySide: true,
    diffIgnoreWhitespace: false,
    diffShowPaths: false,
    isOutputMaximized: false,
    utilTab: "uuid",
    utilsByTool: {},
    copyAsMemory: {},
    graphCopyFormat: "png",
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
    diffSideBySide,
    diffIgnoreWhitespace,
    diffShowPaths,
    isOutputMaximized,
    utilTab,
    utilsByTool,
    copyAsMemory,
    graphCopyFormat,
  }), [input, inputFormatOverride, undoStack, undoIndex, output, parsedOutput, outputExt, outputLanguage, activeOperation, error, convertToFormat, typeLanguage, rightView, diffLeftInput, diffRightInput, diffKind, diffSideBySide, diffIgnoreWhitespace, diffShowPaths, isOutputMaximized, utilTab, utilsByTool, copyAsMemory, graphCopyFormat]);
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
    if (snap.listCompareOptions) {
      setListCompareOptions((prev) => ({ ...prev, ...snap.listCompareOptions }));
    }
    if (snap.csvColumn) setCsvColumn(snap.csvColumn);
    if (snap.queryText) setQueryText(snap.queryText);
    setDiffSideBySide(snap.diffSideBySide ?? true);
    setDiffIgnoreWhitespace(snap.diffIgnoreWhitespace ?? false);
    setDiffShowPaths(snap.diffShowPaths ?? false);
    setIsOutputMaximized(
      Boolean(snap.isOutputMaximized) ||
        snap.activeOperation === "diff" ||
        snap.activeOperation === "utils",
    );
    setUtilTab(snap.utilTab ?? "uuid");
    setUtilsByTool(snap.utilsByTool ?? {});
    setCopyAsMemory(snap.copyAsMemory ?? {});
    setGraphCopyFormat(snap.graphCopyFormat ?? "png");
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
  const tabSnapshotsRef = useRef<Map<string, TabSnapshot>>(new Map());
  const splitContainerInputRef = useRef<HTMLDivElement | null>(null);
  const diffDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRestoredRef = useRef(false);
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
  const inputEditorBgClass = "border border-[var(--workspace-border)] border-t-0 bg-[var(--workspace-panel)]";
  const canUndo = undoIndex > 0;
  const canRedo = undoIndex < undoStack.length - 1;
  /** Diff mode always uses full-width left/right panes (no main input panel). */
  const isDiffMode = activeOperation === "diff";
  const isUtilsMode = activeOperation === "utils";
  const hideInputPanel = isOutputMaximized || isDiffMode || isUtilsMode;

  // Opening settings auto-selects the tab matching the current workspace tool.
  useEffect(() => {
    if (transformConfigOpen) {
      setSettingsTab(isDiffMode ? "compare" : isUtilsMode ? "utils" : "general");
    }
  }, [transformConfigOpen, isDiffMode, isUtilsMode]);

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
    toast({ message: msg, type: /failed|needs valid JSON/i.test(msg) ? "error" : "success" });
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

  const settingsBtnGroupClass =
    "inline-flex w-fit max-w-full items-center overflow-hidden rounded-lg border border-[var(--workspace-border)]/50 bg-muted/50 divide-x divide-[var(--workspace-border)]/40";
  /** Stepper for the pinned toolbar row (matches h-7 pill buttons). */
  const pinnedStepBtnClass =
    "flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] transition-colors duration-100 hover:bg-primary/10 hover:text-primary active:bg-primary/15";
  const toolbarSep = (
    <span className="mx-1 h-4 w-px shrink-0 self-center bg-[var(--workspace-border)]" role="separator" aria-hidden />
  );
  const linkBtnClass =
    "inline-flex items-center justify-center gap-1 cursor-pointer rounded-lg border-0 bg-transparent px-1.5 py-1 text-xs font-medium whitespace-nowrap text-[var(--workspace-text-muted)] hover:bg-primary/10 hover:text-primary transition-all duration-100";
  /* Select-style trigger for toolbar dropdowns (Format / View / Actions / Types) - greyed squarish, no border */
  const selectBtnClass =
    "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-muted px-2 text-xs font-medium text-[var(--workspace-text)] transition-colors hover:bg-primary/10 hover:text-primary";
  const selectBtnOpenClass = "!bg-primary/12 !text-primary";
  /** Hover/focus drivers for the animated toolbar trigger icons (Format / View / Actions). */
  const formatIcon = useIconAnimation();
  const viewIcon = useIconAnimation();
  const actionsIcon = useIconAnimation();
  const uploadIcon = useIconAnimation();
  const copyLinkIcon = useIconAnimation();
  /* Pinned toolbar shortcut (non-compact mode) - same greyed squarish language as select triggers */
  const pinnedBtnClass =
    "inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-muted px-2 text-xs font-medium text-[var(--workspace-text)] transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40";
  /* Compare-document toolbar buttons - match the standard toolbar button design */
  const diffToolBtn =
    "inline-flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-muted px-2 text-xs font-medium text-[var(--workspace-text)] transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40";
  /* Dropdown menu row - shared design (see menuStyles) */
  const menuItemClass = sharedMenuItemClass;
  const menuItemActiveClass = sharedMenuItemActiveClass;
  const menuSectionLabel = sharedMenuSectionLabel;
  const tbActiveClass = "!bg-primary/12 !text-primary font-semibold";
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
  const resolvedParseFormat: FormatKind = resolvedInputFormat === "curl" ? "json" : resolvedInputFormat;

  const getParsedInput = useCallback(async (): Promise<JsonValue> => {
    if (resolvedInputFormat === "curl") {
      const cache = curlCacheRef.current;
      let responseText: string;
      if (cache && cache.input === input) {
        responseText = cache.result;
        if (cache.meta) setCurlMeta(cache.meta);
      } else {
        setCurlFetching(true);
        try {
          const parsed = parseCurl(input);
          const executed = await executeCurlDetailed(parsed);
          responseText = executed.body;
          setCurlMeta(executed);
          setLastExecutedCurlInput(input);
          curlCacheRef.current = { input, result: responseText, meta: executed };
        } finally {
          setCurlFetching(false);
        }
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
    newTab: () => void;
    closeTab: () => void;
    reset: () => void;
    busy: boolean;
  }>({ runOperation: () => {}, downloadOutput: () => {}, copyOutput: () => {}, moveHistory: () => {}, newTab: () => {}, closeTab: () => {}, reset: () => {}, busy: false });

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

      // ⌘C — copy output (browser copy still wins inside editors/inputs).
      if (mod && !event.shiftKey && event.key.toLowerCase() === "c") {
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

      // ⌘⇧D / ⌘⇧U — toggle Compare / Utils modes (work even while one is open).
      if (mod && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        shortcutActionsRef.current.runOperation("diff");
        return;
      }
      if (mod && event.shiftKey && event.key.toLowerCase() === "u") {
        event.preventDefault();
        shortcutActionsRef.current.runOperation("utils");
        return;
      }

      // ⌘⇧E — open the share dialog (works in any mode).
      if (mod && event.shiftKey && event.key.toLowerCase() === "e") {
        event.preventDefault();
        setShareConfirmOpen(true);
        return;
      }

      // ⌘⇧P — palette alias (⌘K works everywhere; Ctrl+Shift+P is browser-owned on Windows).
      if (mod && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        trackEvent("command_palette", { source: "shortcut" });
        setCommandPaletteOpen(true);
        return;
      }

      // ⌘⇧R — reset input & output (works in every mode: transform / compare / utils).
      if (mod && event.shiftKey && event.key.toLowerCase() === "r") {
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
        setEditorFontSize(14);
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
        event.preventDefault();
        shortcutActionsRef.current.moveHistory(1);
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [modalKind, inputEmpty, output, parsedOutput, focusedPane, activeOperation, showTabs, tabs.length, rightView]);

  // Refresh the ref with fresh closures for functions declared later in this component,
  // so the shortcut handler above never calls a stale version.
  useEffect(() => {
    shortcutActionsRef.current = {
      runOperation,
      downloadOutput,
      copyOutput,
      moveHistory,
      newTab: addTab,
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

  const addTab = () => {
    trackEvent("tab_add");
    tabSnapshotsRef.current.set(activeTabId, captureTabSnapshot());
    tabCounterRef.current += 1;
    const newId = `t${tabCounterRef.current}`;
    setTabs((prev) => [...prev, { id: newId, label: `T${tabCounterRef.current}`, num: tabCounterRef.current }]);
    setActiveTabId(newId);
    historyLock.current = true;
    applyTabSnapshot(emptyTabSnapshot());
    prevBeforeDiffRef.current = null;
    setTimeout(() => { historyLock.current = false; }, 0);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return;
    trackEvent("tab_close");
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

  /** Short context label letter: T (Transform), C (Compare), U (Utils). */
  const letterForTab = useCallback(
    (tabId: string): string => {
      const op =
        tabId === activeTabId
          ? activeOperation
          : (tabSnapshotsRef.current.get(tabId)?.activeOperation ?? null);
      return op === "diff" ? "C" : op === "utils" ? "U" : "T";
    },
    [activeTabId, activeOperation],
  );

  /** Keep the live rename target in a ref so blur-after-Escape never commits. */
  const renamingTabIdRef = useRef<string | null>(null);

  const startRename = useCallback(
    (tab: Tab, el: HTMLElement | null) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      renamingTabIdRef.current = tab.id;
      setRenameRect({ top: r.top, left: r.right + 6 });
      setRenamingTabId(tab.id);
      setRenameValue(tab.renamed ? tab.label : `${letterForTab(tab.id)}${tab.num}`);
    },
    [letterForTab],
  );

  const commitRename = useCallback(() => {
    const id = renamingTabIdRef.current;
    const v = renameValue.trim();
    renamingTabIdRef.current = null;
    setRenamingTabId(null);
    setRenameRect(null);
    if (!id || !v) return;
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, label: v, renamed: true } : t)));
  }, [renameValue]);

  const cancelRename = useCallback(() => {
    renamingTabIdRef.current = null;
    setRenamingTabId(null);
    setRenameRect(null);
  }, []);

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
      style.textContent = themeInlineCss(resolvedTheme);
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
        // Migrate tabs saved by older sessions (no num/renamed) and reset the
        // counter per session: new tabs continue from the highest existing number.
        const migrated: Tab[] = data.tabs.map((t, i) => ({
          ...t,
          num: (t as Partial<Tab>).num ?? (Number(String((t as Partial<Tab>).label ?? "").replace(/\D/g, "")) || i + 1),
          renamed: Boolean((t as Partial<Tab>).renamed),
        }));
        setTabs(migrated);
        tabCounterRef.current = Math.max(0, ...migrated.map((t) => t.num));
        if (data.activeTabId && migrated.some((t: Tab) => t.id === data.activeTabId)) {
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
            if (typeof activeSnap.diffSideBySide === "boolean") setDiffSideBySide(activeSnap.diffSideBySide);
            if (typeof activeSnap.diffIgnoreWhitespace === "boolean") setDiffIgnoreWhitespace(activeSnap.diffIgnoreWhitespace);
            if (typeof activeSnap.diffShowPaths === "boolean") setDiffShowPaths(activeSnap.diffShowPaths);
            if (activeSnap.copyAsMemory && typeof activeSnap.copyAsMemory === "object") setCopyAsMemory(activeSnap.copyAsMemory);
            if (activeSnap.graphCopyFormat) setGraphCopyFormat(activeSnap.graphCopyFormat);
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
    // it is intentionally not a dep - re-running would re-apply shared state and clobber
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
    if (outputLanguage === "csv") return; // keep CSV output on Raw by default
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
  }, [parsedOutput, rightView, isDiffMode, isUtilsMode, outputLanguage]);

  useEffect(() => {
    if (!sessionRestoredRef.current || !input.trim() || !activeOperation) return;
    sessionRestoredRef.current = false;
    if (activeOperation === "diff") return;
    const id = setTimeout(() => {
      if (activeOperation === "generateTypes") {
        trackEvent("generate_types", { language: typeLanguage });
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
            convertToFormat !== "csv" && // never yank CSV output away from Raw
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
            sqlOptions: targetLanguage === "sql" ? { dialect: sqlDialect } : undefined,
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
  }, [getParsedInput, parseSchemaToObject, run, convertJsonToOutput, setOutputData, schemaInput, typeLanguage, formatOptions, convertToFormat, sqlDialect, output, parsedOutput]);

  const runConvert = useCallback((toFormat: FormatKind) => {
    trackEvent("convert", { to_format: toFormat, mode: "transform" });
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

  /** Actions → None: restore the output that existed before the last transform action. */
  const restorePreviousActionOutput = useCallback(() => {
    const prev = prevActionStateRef.current;
    prevActionStateRef.current = null;
    if (prev) {
      setOutput(prev.output);
      setParsedOutput(prev.parsedOutput);
      if (prev.outputLanguage) setOutputLanguage(prev.outputLanguage);
      if (prev.outputExt) setOutputExt(prev.outputExt);
      setActiveOperation(null);
      toast({ message: "Restored previous output" });
    } else {
      setActiveOperation(null);
    }
  }, []);

  const runOperation = (action: OperationAction) => {
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
    executeOperation(action);
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
      setDownloadMenuOpen(false);
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
    toast({ message: "Downloaded" });
    setDownloadMenuOpen(false);
  };

  const requestShare = () => {
    // Updating an existing share still re-uploads payload - always confirm once per open.
    setShareConfirmOpen(true);
  };

  const shareWorkspace = async () => {
    trackEvent("share", { all_tabs: shareAllTabs && showTabs && tabs.length > 1 });
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
      diffKind?: "document" | "list" | "single";
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
      queryText: rightView === "query" ? queryText : undefined,
      listCompareOptions: isDiffMode ? listCompareOptions : undefined,
      csvColumn: isDiffMode && diffKind === "list" ? csvColumn ?? undefined : undefined,
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
      toast({
        message: includeAllTabs ? `Link copied (${tabs.length} tabs)` : "Link copied",
        url,
        duration: 4000,
      });
    } catch {
      setShareState("error");
    }
    window.setTimeout(() => setShareState("idle"), 1400);
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
        toast({ message: "Copied" });
      } catch {
        setCopyState("error");
        toast({ message: "Copy failed", type: "error" });
      }
      window.setTimeout(() => setCopyState("idle"), 1400);
      return;
    }
    if (!output.trim()) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopyState("done");
      toast({ message: "Copied" });
    } catch {
      setCopyState("error");
      toast({ message: "Copy failed", type: "error" });
    }
    window.setTimeout(() => setCopyState("idle"), 1400);
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

  const copyOutputAs = async (format: CopyAsFormat) => {
    const raw = getActiveOutputText();
    if (!raw.trim()) return;
    trackEvent("copy", { format, mode: isUtilsMode ? "utils" : isDiffMode ? "compare" : "transform" });
    try {
      let text: string;
      // "Same as output" copies the pane exactly as shown.
      if (format === "same-as-output") {
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
      await navigator.clipboard.writeText(text);
      const label = activeCopyAsOptions.find((o) => o.id === format)?.label ?? format;
      toast({ message: `Copied as ${label}` });
    } catch {
      toast({ message: "Copy failed", type: "error" });
    }
  };

  /** Graph view image/data copy - PNG / JPG / SVG blobs or raw JSON text. */
  const graphCopy = useCallback(
    async (format: GraphCopyFormat) => {
      trackEvent("graph_copy", { format });
      setActionBounce("copy");
      setTimeout(() => setActionBounce(null), 300);
      try {
        if (format === "json") {
          const text = getActiveOutputText();
          if (!text.trim()) return;
          await navigator.clipboard.writeText(text);
          toast({ message: "JSON copied" });
        } else {
          if (!graphViewRef.current) throw new Error("Graph export is not ready yet.");
          if (format === "svg") await graphViewRef.current.copySvgToClipboard();
          else if (format === "jpg") await graphViewRef.current.copyJpgToClipboard();
          else await graphViewRef.current.copyPngToClipboard();
          toast({ message: format.toUpperCase() + " copied" });
        }
        setCopyState("done");
      } catch {
        setCopyState("error");
        toast({ message: "Copy failed", type: "error" });
      }
      window.setTimeout(() => setCopyState("idle"), 1400);
    },
    [getActiveOutputText],
  );

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
      } else {
        clearDiffSide("both");
      }
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
    pathname,
    searchParams,
    router,
  ]);

  /**
   * Copy-as variants must relate to the active tool's output. Batch tools (UUID /
   * password) offer list formats; everything else in Utils copies its plain output
   * (its own copy-as variants would re-encode the result - meaningless).
   */
  const activeCopyAsOptions = useMemo(() => {
    if (isUtilsMode && utilTab === "uuid") return UUID_COPY_AS_OPTIONS;
    if (isUtilsMode && utilTab === "password") return BATCH_COPY_AS_OPTIONS;
    if (isUtilsMode) return [];
    if (isDiffMode && (diffKind === "list" || diffKind === "single")) return LIST_COPY_AS_OPTIONS;
    if (!isDiffMode && rightView === "table") return TABLE_COPY_AS_OPTIONS;
    return DEFAULT_COPY_AS_OPTIONS;
  }, [isUtilsMode, utilTab, isDiffMode, diffKind, rightView]);

  /** Stable per-tool key used for the per-tab 'last copy as' memory. */
  const copyMemoryKey = isUtilsMode
    ? `utils:${utilTab}`
    : isDiffMode
      ? `diff:${diffKind}`
      : `transform:${rightView}`;

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
        // Inside a Monaco editor, Ctrl+Enter is handled by the editor's own
        // keybinding (JsonEditor onCtrlEnter) which consumes it without
        // inserting a newline - skip here to avoid running parse twice.
        const target = event.target as HTMLElement | null;
        if (target && target.closest?.(".monaco-editor")) {
          event.preventDefault();
          return;
        }
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

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Unable to read file"));
      reader.readAsText(file);
    });

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
      toast({ message: "Could not read that file", type: "error" });
    }
  };

  /** Pipe a query result (or any text) into List Compare for ID extraction / SQL. */
  const openInListCompare = (text: string) => {
    if (!isDiffMode) runOperation("diff");
    setDiffKind("list");
    setDiffLeftInput(text);
    setDiffRightInput("");
    setListCompareExport(null);
    toast({ message: "Opened in List Compare — pick a bucket, then copy SQL" });
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
        setActiveOperation("generateTypes");
        setTypeLanguage("typescript");
        executeOperation("generateTypes", { typeLanguage: "typescript" });
        break;
      case "json-to-sql":
        setActiveOperation("generateTypes");
        setTypeLanguage("sql");
        setOutputLanguage("sql");
        setOutputExt("sql");
        executeOperation("generateTypes", { typeLanguage: "sql" });
        break;
      case "json-to-yaml":
        setConvertToFormat("yaml");
        runConvert("yaml");
        break;
      case "flatten-json":
        runOperation("flatten");
        break;
      case "flatten-to-csv": {
        const src = input.trim() || SAMPLE_JSON_TABLE;
        try {
          const json = parseJsonInput(src);
          const flat = flattenJson(json);
          const csv = toCsv(flat);
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
          toast({ message: "Recipe needs valid JSON input", type: "error" });
          return;
        }
        break;
      }
      case "api-response-types":
        if (!input.trim()) {
          const sample = '{"status":200,"data":{"id":1,"email":"a@b.com","roles":["admin"]}}';
          setInput(sample);
          pushHistory(sample);
          setInputFormatOverride(null);
        }
        setActiveOperation("generateTypes");
        setTypeLanguage("typescript");
        executeOperation("generateTypes", { typeLanguage: "typescript" });
        break;
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
      action: () => { trackEvent("generate_types", { language: t.id, source: "palette" }); setFocusedPane("output"); setActiveOperation("generateTypes"); executeOperation("generateTypes", { typeLanguage: t.id }); },
    })),
    // Recipes (presets compose existing actions)
    ...PRESETS.map((p) => ({
      id: `recipe-${p.id}`,
      label: p.label,
      category: "Recipes" as const,
      keywords: p.keywords,
      action: () => runPreset(p.id),
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

    ...(sharedLinkUrl ? [{ id: "ws-embed", label: "Copy embed / iframe URL", category: "Workspace" as const, keywords: ["embed", "iframe", "share"], disabled: false, action: async () => { await navigator.clipboard.writeText(`${sharedLinkUrl}&embed=1`); toast({ message: "Embed URL copied" }); } }] : []),
    { id: "ws-clear",    label: "Reset input & output",  category: "Workspace", shortcut: "⌘⇧R", keywords: ["reset", "clear", "new", "empty"], action: handleWorkspaceReset },
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
    { id: "diff-kind-single", label: "Diff: Single list (dedupe / count / sort)", category: "Workspace", keywords: ["diff", "single", "dedupe", "duplicates", "count", "sort", "list"], disabled: activeOperation !== "diff", action: () => setDiffKind("single") },
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
  ], [inputEmpty, showBusy, convertToFormat, rightView, parsedOutput, typeLanguage, activeOperation, output, themeMode, editorFontSize, isOutputMaximized, isWindowFullscreen, toggleWindowFullscreen, formatOptions, liveTransform, viewAsMenu, canUndo, canRedo, lineWrap, diffSideBySide, diffIgnoreWhitespace, diffShowPaths, diffKind, csvDelimiter, sharedLinkUrl, pinnedItems, undoStack.length, tabs.length, activeTabId, splitInputOpen, autoFormatOnPaste, showTabs, swapDiffSides, beautifyDiffSides, copyDiffText, downloadDiffReport, isUtilsMode, utilTab, isDiffMode, handleWorkspaceReset]);

  const settingsPanelContent = (
                <div className="w-[20rem] max-w-[85vw]">
  {/* Header */}
  <div className="flex items-center gap-2">
    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
      <Cog6ToothIcon className="h-3.5 w-3.5" aria-hidden />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-semibold leading-tight tracking-tight text-[var(--workspace-text)]">Settings</p>
      <p className="truncate text-[10px] leading-snug text-[var(--workspace-text-muted)]">
        Saved automatically · applies to this tab
      </p>
    </div>
    <span className="inline-flex h-4 shrink-0 items-center rounded-full bg-emerald-500/10 px-1.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
      Local
    </span>
  </div>

  {/* Settings tabs - General / Compare / Utils */}
  <div
    className="mb-2 mt-2 flex items-center gap-px rounded-lg border border-[var(--workspace-border)] bg-muted/50 p-0.5"
    role="tablist"
    aria-label="Settings sections"
  >
    {(
      [
        ["general", "General"],
        ["compare", "Compare"],
        ["utils", "Utils"],
      ] as const
    ).map(([tab, label]) => (
      <button
        key={tab}
        type="button"
        role="tab"
        aria-selected={settingsTab === tab}
        className={`h-6 flex-1 rounded-md text-[11px] font-semibold transition-colors ${
          settingsTab === tab
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"
        }`}
        onClick={() => setSettingsTab(tab)}
      >
        {label}
      </button>
    ))}
  </div>

  {settingsTab === "general" && (
  <>
  {/* Behavior */}
  <SettingsRule title="Behavior" />
  <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-px">
    {(
      [
        ["Compact menus", viewAsMenu, (v: boolean) => setViewAsMenu(v)],
        ["Multi-tab mode", showTabs, (v: boolean) => setShowTabs(v)],
        ["Live transform", liveTransform, (v: boolean) => setLiveTransform(v)],
        ["Line wrap", lineWrap, (v: boolean) => setLineWrap(v)],
        ["Format on paste", autoFormatOnPaste, (v: boolean) => setAutoFormatOnPaste(v)],
      ] as const
    ).map(([label, on, setOn]) => (
      <label
        key={label}
        className="flex min-h-7 cursor-pointer items-center justify-between gap-2 rounded-md px-1.5 py-1 text-xs text-[var(--workspace-text)] transition-colors hover:bg-primary/5"
      >
        <span className="min-w-0">{label}</span>
        <Switch checked={on} onCheckedChange={setOn} />
      </label>
    ))}
  </div>
  </>)}

  {/* Toolbar pins - kept next to the Compact menus toggle */}
  {settingsTab === "general" && (
    <>
      <SettingsRule title="Toolbar" />
      <div className="mt-1 space-y-2">
        {!viewAsMenu ? (
          <div className="space-y-1.5">
            <PinChipRow
              label="Format"
              items={FORMAT_KINDS.map((fmt) => ({ id: `fmt:${fmt}`, label: FORMAT_LABELS[fmt] }))}
              pinned={(id) => pinnedItems.has(id)}
              onToggle={(id) =>
                setPinnedItems((s) => {
                  const n = new Set(s);
                  if (n.has(id)) n.delete(id);
                  else n.add(id);
                  return n;
                })
              }
            />
            <PinChipRow
              label="View"
              items={(["raw", "tree", "graph", "query", "table"] as const).map((view) => ({
                id: `view:${view}`,
                label: view[0].toUpperCase() + view.slice(1),
              }))}
              pinned={(id) => pinnedItems.has(id)}
              onToggle={(id) =>
                setPinnedItems((s) => {
                  const n = new Set(s);
                  if (n.has(id)) n.delete(id);
                  else n.add(id);
                  return n;
                })
              }
            />
            <PinChipRow
              label="Action"
              items={OPERATION_ACTIONS.map(([label, action]) => ({ id: `action:${action}`, label }))}
              pinned={(id) => pinnedItems.has(id)}
              onToggle={(id) =>
                setPinnedItems((s) => {
                  const n = new Set(s);
                  if (n.has(id)) n.delete(id);
                  else n.add(id);
                  return n;
                })
              }
            />
            <PinChipRow
              label="Types"
              items={TYPE_LANGUAGES.slice(0, 8).map((item) => ({ id: `type:${item.id}`, label: item.label }))}
              pinned={(id) => pinnedItems.has(id)}
              onToggle={(id) =>
                setPinnedItems((s) => {
                  const n = new Set(s);
                  if (n.has(id)) n.delete(id);
                  else n.add(id);
                  return n;
                })
              }
            />
          </div>
        ) : (
          <p className="rounded-md bg-primary/5 px-2 py-1.5 text-[10px] leading-snug text-[var(--workspace-text-muted)]">
            Compact menus is on - the toolbar uses{" "}
            <strong className="text-primary">Format · View · Actions · Types</strong> dropdowns. Turn off{" "}
            <strong className="text-primary">Compact menus</strong> in Behavior to show pinned shortcuts instead.
          </p>
        )}
      </div>
    </>
  )}

  {settingsTab === "general" && (
  <>
  {/* Editor */}
  <SettingsRule title="Editor" />
  <div className="mt-1">
    <SettingsRow
      label={
        <>
          Font size
          <PinButton
            pinned={pinnedItems.has("fontSize")}
            label="font size"
            onClick={() =>
              setPinnedItems((s) => {
                const n = new Set(s);
                if (n.has("fontSize")) n.delete("fontSize");
                else n.add("fontSize");
                return n;
              })
            }
          />
        </>
      }
    >
      <SettingsStepper
        value={editorFontSize}
        decLabel="Decrease font size"
        incLabel="Increase font size"
        resetLabel="Reset font size"
        onDec={() => setEditorFontSize((s) => Math.max(10, s - 1))}
        onInc={() => setEditorFontSize((s) => Math.min(24, s + 1))}
        onReset={() => setEditorFontSize(14)}
      />
    </SettingsRow>
  </div>
  </>)}

  {settingsTab === "compare" && (
    <>
      <SettingsRule title="List parsing" />
      <div className="mt-1 space-y-2">
        <div>
          <p className="pb-1 text-[10px] font-medium text-[var(--workspace-text-muted)]">Split by</p>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["auto", "Auto"],
                ["comma", "Comma"],
                ["semicolon", "Semicolon"],
                ["pipe", "Pipe"],
                ["whitespace", "Whitespace"],
                ["json", "JSON array"],
              ] as const
            ).map(([delim, label]) => (
              <button
                key={delim}
                type="button"
                onClick={() => setListCompareOptions((prev) => ({ ...prev, delimiter: delim }))}
                className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
                  listCompareOptions.delimiter === delim
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-[var(--workspace-text-muted)] hover:bg-primary/10 hover:text-[var(--workspace-text)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="pb-1 text-[10px] font-medium text-[var(--workspace-text-muted)]">Parsing</p>
          <div className="flex flex-wrap gap-1">
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
                className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
                  listCompareOptions[key as keyof ListParseOptions]
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-[var(--workspace-text-muted)] hover:bg-primary/10 hover:text-[var(--workspace-text)]"
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
      </div>
      <p className="mt-3 rounded-md bg-primary/5 px-2 py-1.5 text-[10px] leading-snug text-[var(--workspace-text-muted)]">
        Document diff options (hunks, inline vs side-by-side, whitespace, paths) live in the Compare toolbar.
      </p>
    </>
  )}
  {settingsTab === "utils" && (
    <>
      <p className="mt-3 rounded-md bg-primary/5 px-2 py-1.5 text-[10px] leading-snug text-[var(--workspace-text-muted)]">
        Each utility keeps its own options (count, length, character sets) right in the tool pane.
      </p>
    </>
  )}

  {settingsTab === "general" && (
    <>
      {/* Formatting */}
      <SettingsRule title="Formatting" />
      <div className="mt-1 space-y-px">
        <SettingsRow
          label={
            <>
              Indent
              <PinButton
                pinned={pinnedItems.has("indent")}
                label="indent"
                onClick={() =>
                  setPinnedItems((s) => {
                    const n = new Set(s);
                    if (n.has("indent")) n.delete("indent");
                    else n.add("indent");
                    return n;
                  })
                }
              />
            </>
          }
        >
          <SettingsStepper
            value={formatOptions.indentation}
            decLabel="Decrease indent"
            incLabel="Increase indent"
            resetLabel="Reset indent"
            minWidth="min-w-[1.5rem]"
            onDec={() => {
              const v = Math.max(0, formatOptions.indentation - 1);
              applyFormatWithOptions({ ...formatOptions, indentation: v });
            }}
            onInc={() => {
              const v = Math.min(10, formatOptions.indentation + 1);
              applyFormatWithOptions({ ...formatOptions, indentation: v });
            }}
            onReset={() => applyFormatWithOptions({ ...formatOptions, indentation: 2 })}
          />
        </SettingsRow>
        <SettingsRow label="Quotes">
          <div className="inline-flex overflow-hidden rounded-md border border-[var(--workspace-border)]/60 bg-muted/50">
            {(["double", "single"] as const).map((q) => (
              <button
                key={q}
                type="button"
                className={`flex h-7 min-w-[2.25rem] items-center justify-center px-2 text-xs font-medium transition-colors ${
                  formatOptions.quoteStyle === q
                    ? "bg-primary/15 text-primary"
                    : "text-[var(--workspace-text-muted)] hover:bg-primary/5 hover:text-[var(--workspace-text)]"
                }`}
                onClick={() => applyFormatWithOptions({ ...formatOptions, quoteStyle: q })}
              >
                {q === "double" ? "\u201C \u201D" : "' '"}
              </button>
            ))}
          </div>
        </SettingsRow>
        <SettingsRow label="JSON">
          <div className="flex items-center gap-1">
            <label className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-[var(--workspace-border)]/60 bg-muted/30 px-2 text-xs font-medium text-[var(--workspace-text)] transition-colors hover:border-primary/30 hover:bg-primary/5 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/10">
              <Checkbox checked={formatOptions.sortKeys} onCheckedChange={(c) => applyFormatWithOptions({ ...formatOptions, sortKeys: c === true })} />
              Sort keys
            </label>
            <label className="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-[var(--workspace-border)]/60 bg-muted/30 px-2 text-xs font-medium text-[var(--workspace-text)] transition-colors hover:border-primary/30 hover:bg-primary/5 has-[[data-state=checked]]:border-primary/40 has-[[data-state=checked]]:bg-primary/10">
              <Checkbox checked={formatOptions.removeEmpty} onCheckedChange={(c) => applyFormatWithOptions({ ...formatOptions, removeEmpty: c === true })} />
              Drop empty
            </label>
          </div>
        </SettingsRow>
      </div>
      <div className="mt-2">
        <SettingsRule title="SQL generation" />
        <div className="mt-1 flex flex-wrap gap-1">
          {([
            ["sqlite", "SQLite"],
            ["postgres", "PostgreSQL"],
            ["mysql", "MySQL"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSqlDialect(id)}
              className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
                sqlDialect === id
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-[var(--workspace-text-muted)] hover:bg-primary/10 hover:text-[var(--workspace-text)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 rounded-md bg-primary/5 px-2 py-1.5 text-[10px] leading-snug text-[var(--workspace-text-muted)]">
          Used by “Types → SQL”. Types are inferred from your data - review before running.
        </p>
      </div>
    </>
  )}

  {settingsTab === "general" && (
  <>
  {/* Toolbar buttons visibility - moved up from output action bar */}
  <div className="mt-2.5 border-t border-[var(--workspace-border)]/60 pt-2">
    <div className="flex items-center gap-2.5 pb-1">
      <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--workspace-text-muted)]">
        Toolbar buttons
      </p>
      <span className="h-px flex-1 bg-[var(--workspace-border)]/60" aria-hidden />
    </div>
    <div className="grid grid-cols-2 gap-x-2">
      {(Object.keys(ACTION_LABELS) as OutputActionId[]).map((id) => {
        if (id === "copyAs") return null; // merged into Copy
        if (id === "useAsInput") return null; // removed
        if (id === "share") return null; // always on
        if (id === "reset") return null; // always on
        if (id === "maximize" && (isDiffMode || isUtilsMode)) return null;
        return (
          <label
            key={id}
            className="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs text-[var(--workspace-text)] transition-colors hover:bg-primary/5"
          >
            <Checkbox
              checked={outputActionVisibility[id] !== false}
              onCheckedChange={() => {
                setOutputActionVisibility((prev) => {
                  const next = { ...prev, [id]: !prev[id] };
                  const anyOn = (Object.keys(next) as OutputActionId[]).some(
                    (k) => next[k] && k !== "share" && k !== "reset" && !(k === "maximize" && (isDiffMode || isUtilsMode)),
                  );
                  if (!anyOn) return prev;
                  saveVisibility(next);
                  return next;
                });
              }}
            />
            {ACTION_LABELS[id]}
          </label>
        );
      })}
    </div>
  </div>

  {/* Footer */}
  <div className="mt-2.5 border-t border-[var(--workspace-border)]/60 pt-2">
    <button
      type="button"
      className="flex h-7 w-full items-center justify-center gap-1.5 rounded-md border border-[var(--workspace-border)]/60 bg-muted/40 text-xs font-medium text-[var(--workspace-text-muted)] transition-all hover:border-primary/25 hover:bg-primary/10 hover:text-primary"
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
  </div>
  </>
  )}
</div>
  );

  return (
    <main
      className="relative flex flex-col overflow-hidden bg-[var(--workspace-background)] text-[var(--workspace-text)]"
      style={{ height: "100dvh", minHeight: "100dvh", maxHeight: "100dvh" }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragActive && (
        <div className="pointer-events-none absolute inset-0 z-[100] flex items-center justify-center bg-[var(--workspace-background)]/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary/50 bg-[var(--workspace-panel)]/90 px-10 py-8 shadow-2xl shadow-primary/10">
            <DocumentArrowDownIcon className="h-8 w-8 text-primary" />
            <p className="text-sm font-semibold text-[var(--workspace-text)]">
              Drop {isDiffMode ? "one or two files" : "a file"} to import
            </p>
            <p className="text-[11px] text-[var(--workspace-text-muted)]">
              {isDiffMode
                ? "Two files → left / right · one file → side you drop on"
                : "JSON · XML · YAML · TOML · CSV · TXT — stays in your browser"}
            </p>
          </div>
        </div>
      )}
      {!embed && (
        <WorkspaceHeader
          themeMode={themeMode}
          onThemeChange={(m) => {
            trackEvent("theme", { mode: m });
            setThemeMode(m);
          }}
          onOpenCommandPalette={() => {
            trackEvent("command_palette", { source: "header" });
            setCommandPaletteOpen(true);
          }}
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
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
          >
            <Logo size={14} className="shrink-0" />
            Open in Formaty
          </a>
        </div>
      )}

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
          <div className="flex h-full w-8 shrink-0 flex-col overflow-y-auto border-r border-[var(--workspace-border)] bg-[var(--workspace-panel)] pb-1 pt-1">
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              const displayName = tab.renamed ? tab.label : `${letterForTab(tab.id)}${tab.num}`;
              return (
              <div
                key={tab.id}
                role="tab"
                tabIndex={0}
                className={`group relative flex min-h-9 cursor-pointer items-center justify-center overflow-hidden py-0.5 transition-all duration-150 ${isActive ? "bg-primary/10 text-primary" : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)]/60 hover:text-[var(--workspace-text)]"}`}
                onClick={() => switchToTab(tab.id)}
                onDoubleClick={(e) => { e.stopPropagation(); startRename(tab, e.currentTarget); }}
                onKeyDown={(e) => e.key === "Enter" && switchToTab(tab.id)}
              >
                {isActive && (
                  <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-primary" />
                )}
                <Tooltip
                  content={tab.renamed ? `${tab.label} · double-click to rename` : `${displayName} · double-click to rename`}
                  side="right"
                >
                  <span
                    className="max-h-16 truncate px-px text-[10px] font-medium leading-none tracking-wide"
                    style={{ writingMode: "vertical-rl", textOrientation: "upright" }}
                  >
                    {displayName}
                  </span>
                </Tooltip>
                {tabs.length > 1 && (
                  <button
                    type="button"
                    className="absolute -right-0.5 -top-0.5 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--workspace-border)] text-[var(--workspace-text-muted)] group-hover:flex hover:bg-red-500/20 hover:text-red-400"
                    onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                    aria-label={`Close ${displayName}`}
                  >
                    <XMarkIcon className="h-2 w-2" />
                  </button>
                )}
              </div>
              );
            })}
            <Tooltip content="New tab">
            <button
              type="button"
              className="mt-0.5 flex h-7 items-center justify-center text-[var(--workspace-text-muted)] transition-all duration-100 hover:bg-primary/5 hover:text-primary"
              onClick={addTab}
            >
              <PlusIcon className="h-3.5 w-3.5" />
            </button>
            </Tooltip>
          </div>
        )}
        {renamingTabId && renameRect && (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              else if (e.key === "Escape") cancelRename();
            }}
            onBlur={commitRename}
            aria-label="Rename tab"
            className="fixed z-[90] h-7 w-36 rounded-md border border-primary/40 bg-[var(--workspace-panel)] px-2 text-xs text-[var(--workspace-text)] shadow-lg outline-none"
            style={{ top: renameRect.top, left: renameRect.left }}
          />
        )}
      {/* Column: stable full-width tool row + split (icons never jump when left panel hides) */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* ── Full-width secondary toolbar (Transform | Compare | Utils + output actions) ── */}
        <div
          className={`flex min-h-9 shrink-0 flex-wrap items-center gap-0.5 overflow-hidden border-b px-1.5 py-0.5 text-xs ${inputEditorBgClass} text-[var(--workspace-text-muted)]`}
        >
          <div
            className="relative flex h-7 shrink-0 overflow-hidden rounded-md bg-muted"
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
              <Tooltip key={tab.id} content={tab.title}>
              <button
                type="button"
                className={`relative h-7 cursor-pointer px-3 text-xs font-semibold transition-colors duration-150 ${
                  i > 0 ? "border-l border-[var(--workspace-border)]" : ""
                } ${
                  tab.active
                    ? "text-primary"
                    : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"
                }`}
                onClick={tab.onClick}
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
              </Tooltip>
            ))}
          </div>

            {!isDiffMode && !isUtilsMode && (
            <>
            <div className="mx-1 h-5 w-px shrink-0 bg-[var(--workspace-border)]" aria-hidden />
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
                      <button key={fmt} type="button" disabled={inputEmpty} className={`${pinnedBtnClass} ${convertToFormat === fmt ? tbActiveClass : ""}`} onClick={() => { setFocusedPane("output"); runConvert(fmt); }}>{FORMAT_LABELS[fmt]}</button>
                    ))}
                  </span>,
                );
              }
              if (viewPins.length > 0) {
                groups.push(
                  <span key="view" className="flex shrink-0 items-center gap-0.5">
                    {viewPins.map((view) => (
                      <button key={view} type="button" disabled={inputEmpty || ((view === "tree" || view === "graph" || view === "query" || view === "table") && !parsedOutput)} className={`${pinnedBtnClass} ${rightView === view ? tbActiveClass : ""}`} onClick={() => { setRightView(view); setFocusedPane("output"); }}>{view[0].toUpperCase() + view.slice(1)}</button>
                    ))}
                  </span>,
                );
              }
              if (actionPins.length > 0) {
                groups.push(
                  <span key="act" className="flex shrink-0 items-center gap-0.5">
                    {actionPins.map(([label, action]) => (
                      <button key={action} type="button" disabled={showBusy || inputEmpty} className={`${pinnedBtnClass} ${activeOperation === action ? tbActiveClass : ""}`} onClick={() => runOperation(action)}>{label}</button>
                    ))}
                  </span>,
                );
              }
              if (typePins.length > 0) {
                groups.push(
                  <span key="type" className="flex shrink-0 items-center gap-0.5">
                    {typePins.map((item) => (
                      <button key={item.id} type="button" disabled={inputEmpty} className={`${pinnedBtnClass} ${activeOperation === "generateTypes" && typeLanguage === item.id ? tbActiveClass : ""}`} onClick={() => { trackEvent("generate_types", { language: item.id, source: "pinned" }); setFocusedPane("output"); setActiveOperation("generateTypes"); executeOperation("generateTypes", { typeLanguage: item.id }); }}>{item.label}</button>
                    ))}
                  </span>,
                );
              }
              if (pinnedItems.has("fontSize") || pinnedItems.has("indent")) {
                groups.push(
                  <span key="steps" className="flex shrink-0 items-center gap-1">
                    {pinnedItems.has("fontSize") && (
                      <Tooltip content="Font size" className="shrink-0">
                      <div className={settingsBtnGroupClass}>
                        <button type="button" aria-label="Decrease font size" className={pinnedStepBtnClass} onClick={() => setEditorFontSize((s) => Math.max(10, s - 1))}><MinusIcon className="h-3.5 w-3.5" /></button>
                        <span className="flex h-7 min-w-[1.5rem] items-center justify-center px-1 text-xs font-medium tabular-nums text-[var(--workspace-text)]">{editorFontSize}</span>
                        <button type="button" aria-label="Increase font size" className={pinnedStepBtnClass} onClick={() => setEditorFontSize((s) => Math.min(24, s + 1))}><PlusIcon className="h-3.5 w-3.5" /></button>
                      </div>
                      </Tooltip>
                    )}
                    {pinnedItems.has("indent") && (
                      <Tooltip content="Indent" className="shrink-0">
                      <div className={settingsBtnGroupClass}>
                        <button type="button" aria-label="Decrease indent" className={pinnedStepBtnClass} onClick={() => { const v = Math.max(0, formatOptions.indentation - 1); applyFormatWithOptions({ ...formatOptions, indentation: v }); }}><MinusIcon className="h-3.5 w-3.5" /></button>
                        <span className="flex h-7 min-w-[1.25rem] items-center justify-center px-1 text-xs font-medium tabular-nums text-[var(--workspace-text)]">{formatOptions.indentation}</span>
                        <button type="button" aria-label="Increase indent" className={pinnedStepBtnClass} onClick={() => { const v = Math.min(10, formatOptions.indentation + 1); applyFormatWithOptions({ ...formatOptions, indentation: v }); }}><PlusIcon className="h-3.5 w-3.5" /></button>
                      </div>
                      </Tooltip>
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
                  {toolbarSep}
                </>
              );
            })()}
            {!viewAsMenu && (
            <Dropdown open={moreMenuOpen} onOpenChange={setMoreMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`w-max min-w-[8rem] max-h-[min(70vh,32rem)] overflow-y-auto`} trigger={<Tooltip content="More actions"><div className={`${selectBtnClass} ${moreMenuOpen ? selectBtnOpenClass : ""}`}><span className="font-medium">More</span><ChevronDownIcon className="h-3 w-3" aria-hidden /></div></Tooltip>}>
              <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                {menuSectionLabel("Format")}
                {(["json", "xml", "yaml", "toml", "csv"] as const).map((fmt) => (
                  <button key={fmt} type="button" disabled={inputEmpty} className={`${menuItemClass} ${convertToFormat === fmt ? menuItemActiveClass : ""}`} onClick={() => { setFocusedPane("output"); runConvert(fmt); setMoreMenuOpen(false); }}>
                    {sharedMenuCheck(convertToFormat === fmt)}
                    <span className="min-w-0 flex-1 truncate text-left">{FORMAT_LABELS[fmt]}</span>
                  </button>
                ))}
                <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" aria-hidden />
                {menuSectionLabel("View")}
                {(["raw", "tree", "graph", "query", "table"] as const).map((view) => (
                  <button key={view} type="button" disabled={inputEmpty || ((view === "tree" || view === "graph" || view === "query" || view === "table") && !parsedOutput)} className={`${menuItemClass} ${rightView === view ? menuItemActiveClass : ""}`} onClick={() => { setRightView(view); setFocusedPane("output"); setMoreMenuOpen(false); }}>
                    {sharedMenuCheck(rightView === view)}
                    <span className="min-w-0 flex-1 truncate text-left">{view[0].toUpperCase() + view.slice(1)}</span>
                  </button>
                ))}
                <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" aria-hidden />
                {menuSectionLabel("Actions")}
                {(["beautify", "minify", "flatten", "unflatten", "schema", "validate"] as const).map((action) => {
                  const [label] = OPERATION_ACTIONS.find(([, a]) => a === action) ?? [action, action];
                  return (
                    <button key={action} type="button" disabled={showBusy || inputEmpty} className={`${menuItemClass} ${activeOperation === action ? menuItemActiveClass : ""}`} onClick={() => { runOperation(action); setMoreMenuOpen(false); }}>
                      {sharedMenuCheck(activeOperation === action)}
                      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
                    </button>
                  );
                })}
                <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" aria-hidden />
                {menuSectionLabel("Types")}
                <button type="button" disabled={inputEmpty} className={`${menuItemClass} ${activeOperation === "generateTypes" ? "" : "!bg-primary/12 !text-primary"}`} onClick={() => { setFocusedPane("output"); runOperation("beautify"); setMoreMenuOpen(false); }}>
                  {sharedMenuCheck(activeOperation !== "generateTypes")}
                  <span className="min-w-0 flex-1 truncate text-left">None - format output</span>
                </button>
                {TYPE_LANGUAGES.map((item) => (
                  <button key={item.id} type="button" disabled={inputEmpty} className={`${menuItemClass} ${activeOperation === "generateTypes" && typeLanguage === item.id ? menuItemActiveClass : ""}`} onClick={() => { trackEvent("generate_types", { language: item.id, source: "menu" }); setFocusedPane("output"); setActiveOperation("generateTypes"); executeOperation("generateTypes", { typeLanguage: item.id }); setMoreMenuOpen(false); }}>
                    {sharedMenuCheck(activeOperation === "generateTypes" && typeLanguage === item.id)}
                    <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                  </button>
                ))}
              </div>
            </Dropdown>
            )}
            {viewAsMenu && (<>
            <Dropdown open={formatMenuOpen} onOpenChange={setFormatMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`w-max min-w-[8rem]`} trigger={<Tooltip content={`Format: ${FORMAT_LABELS[convertToFormat]}`}><div className={`${selectBtnClass} ${formatMenuOpen ? selectBtnOpenClass : ""}`} {...formatIcon.bind}><TriggerIcon Icon={FORMAT_ICONS[convertToFormat] ?? Squares2X2Icon} iconRef={formatIcon.ref} className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="font-medium">Format</span><ChevronDownIcon className="h-3 w-3 shrink-0" aria-hidden /></div></Tooltip>}>
              <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                {menuSectionLabel("Structured")}
                {(["json", "xml", "yaml", "toml"] as const).map((fmt) => (
                  <button key={fmt} type="button" disabled={inputEmpty} className={`${menuItemClass} ${convertToFormat === fmt ? menuItemActiveClass : ""}`} onClick={() => { setFocusedPane("output"); runConvert(fmt); setFormatMenuOpen(false); }}>
                    {sharedMenuCheck(convertToFormat === fmt)}
                    <span className="min-w-0 flex-1 truncate text-left">{FORMAT_LABELS[fmt]}</span>
                  </button>
                ))}
                <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" aria-hidden />
                {menuSectionLabel("Tabular")}
                <button type="button" disabled={inputEmpty} className={`${menuItemClass} ${convertToFormat === "csv" ? menuItemActiveClass : ""}`} onClick={() => { setFocusedPane("output"); runConvert("csv"); setFormatMenuOpen(false); }}>
                  {sharedMenuCheck(convertToFormat === "csv")}
                  <span className="min-w-0 flex-1 truncate text-left">{FORMAT_LABELS.csv}</span>
                </button>
              </div>
            </Dropdown>
            <Dropdown open={viewMenuOpen} onOpenChange={setViewMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`w-max min-w-[9rem]`} trigger={<Tooltip content={`View: ${rightView[0].toUpperCase()}${rightView.slice(1)}`}><div className={`${selectBtnClass} ${viewMenuOpen ? selectBtnOpenClass : ""}`} {...viewIcon.bind}><TriggerIcon Icon={VIEW_ICONS[rightView] ?? EyeIcon} iconRef={viewIcon.ref} className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="font-medium">View</span><ChevronDownIcon className="h-3 w-3 shrink-0" aria-hidden /></div></Tooltip>}>
              <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                {menuSectionLabel("Text")}
                <button type="button" disabled={inputEmpty} className={`${menuItemClass} ${rightView === "raw" ? menuItemActiveClass : ""}`} onClick={() => { setRightView("raw"); setFocusedPane("output"); setViewMenuOpen(false); }}>
                  {sharedMenuCheck(rightView === "raw")}
                  <span className="min-w-0 flex-1 truncate text-left">Raw</span>
                  <kbd className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1 py-px font-mono text-[9px] text-[var(--workspace-text-muted)]">⌘1</kbd>
                </button>
                <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" aria-hidden />
                {menuSectionLabel("Visualize")}
                {(["tree", "graph", "table"] as const).map((view, vi) => (                    <button key={view} type="button" disabled={inputEmpty || !parsedOutput} className={`${menuItemClass} ${rightView === view ? menuItemActiveClass : ""}`} onClick={() => { trackEvent("view", { view }); setRightView(view); setFocusedPane("output"); setViewMenuOpen(false); }}>
                    {sharedMenuCheck(rightView === view)}
                    <span className="min-w-0 flex-1 truncate text-left">{view[0].toUpperCase() + view.slice(1)}</span>
                    <kbd className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1 py-px font-mono text-[9px] text-[var(--workspace-text-muted)]">⌘{vi + 2}</kbd>
                  </button>
                ))}
                <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" aria-hidden />
                {menuSectionLabel("Query")}
                <button type="button" disabled={inputEmpty || !parsedOutput} className={`${menuItemClass} ${rightView === "query" ? menuItemActiveClass : ""}`} onClick={() => { trackEvent("view", { view: "query" }); setRightView("query"); setFocusedPane("output"); setViewMenuOpen(false); }}>
                  {sharedMenuCheck(rightView === "query")}
                  <span className="min-w-0 flex-1 truncate text-left">Query</span>
                  <kbd className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1 py-px font-mono text-[9px] text-[var(--workspace-text-muted)]">⌘4</kbd>
                </button>
              </div>
            </Dropdown>
            <Dropdown open={actionsMenuOpen} onOpenChange={setActionsMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`w-max min-w-[9rem]`} trigger={<Tooltip content={activeOperation && OPERATION_ACTION_LABELS[activeOperation] ? `Actions: ${OPERATION_ACTION_LABELS[activeOperation]}` : "Transform actions"}><div className={`${selectBtnClass} ${actionsMenuOpen ? selectBtnOpenClass : ""}`} {...actionsIcon.bind}><TriggerIcon Icon={activeOperation ? (ACTION_ICONS[activeOperation] ?? BoltIcon) : BoltIcon} iconRef={actionsIcon.ref} className={`h-3.5 w-3.5 shrink-0 ${activeOperation && ACTION_ICONS[activeOperation] ? "text-primary" : "text-[var(--workspace-text-muted)]"}`} /><span className="font-medium">Actions</span><ChevronDownIcon className="h-3 w-3 shrink-0" aria-hidden /></div></Tooltip>}>
              <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                <button type="button" disabled={inputEmpty} className={`${menuItemClass} ${!OPERATION_ACTION_LABELS[activeOperation ?? ""] ? menuItemActiveClass : ""}`} onClick={() => { restorePreviousActionOutput(); setActionsMenuOpen(false); }}>
                  {sharedMenuCheck(!OPERATION_ACTION_LABELS[activeOperation ?? ""])}
                  <span className="min-w-0 flex-1 truncate text-left">None</span>
                  <span className="text-[10px] opacity-60">restore output</span>
                </button>
                <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" aria-hidden />
                {menuSectionLabel("Format")}
                {(["beautify", "minify"] as const).map((action) => {
                  const [label] = OPERATION_ACTIONS.find(([, a]) => a === action) ?? [action, action];
                  return (
                    <button key={action} type="button" disabled={showBusy || inputEmpty} className={`${menuItemClass} ${activeOperation === action ? menuItemActiveClass : ""}`} onClick={() => { runOperation(action); setActionsMenuOpen(false); }}>
                      {sharedMenuCheck(activeOperation === action)}
                      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
                      <kbd className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1 py-px font-mono text-[9px] text-[var(--workspace-text-muted)]">{action === "beautify" ? "⌘⇧B" : "⌘⇧M"}</kbd>
                    </button>
                  );
                })}
                <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" aria-hidden />
                {menuSectionLabel("Structure")}
                {(["flatten", "unflatten"] as const).map((action) => {
                  const [label] = OPERATION_ACTIONS.find(([, a]) => a === action) ?? [action, action];
                  return (
                    <button key={action} type="button" disabled={showBusy || inputEmpty} className={`${menuItemClass} ${activeOperation === action ? menuItemActiveClass : ""}`} onClick={() => { runOperation(action); setActionsMenuOpen(false); }}>
                      {sharedMenuCheck(activeOperation === action)}
                      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
                    </button>
                  );
                })}
                <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" aria-hidden />
                {menuSectionLabel("Inspect / Spec")}
                {(["schema", "openapi", "validate"] as const).map((action) => {
                  const [label] = OPERATION_ACTIONS.find(([, a]) => a === action) ?? [action, action];
                  return (
                    <button key={action} type="button" disabled={showBusy || inputEmpty} className={`${menuItemClass} ${activeOperation === action ? menuItemActiveClass : ""}`} onClick={() => { runOperation(action); setActionsMenuOpen(false); }}>
                      {sharedMenuCheck(activeOperation === action)}
                      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
                    </button>
                  );
                })}
              </div>
            </Dropdown>
            <Dropdown open={typesMenuOpen} onOpenChange={setTypesMenuOpen} side="bottom" align="start" rootClassName="shrink-0" contentClassName={`w-max min-w-[8rem] max-h-[60vh] overflow-y-auto`} trigger={<Tooltip content={activeOperation === "generateTypes" ? `Types: ${TYPE_LANGUAGES.find((t) => t.id === typeLanguage)?.label ?? ""}` : "Generate Types"}><div className={`${selectBtnClass} ${typesMenuOpen || activeOperation === "generateTypes" ? selectBtnOpenClass : ""}`}>{activeOperation === "generateTypes" ? <TypeBadge id={typeLanguage} /> : <CodeBracketIcon className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-text-muted)]" />}<span className="font-medium">Types</span><ChevronDownIcon className="h-3 w-3 shrink-0" aria-hidden /></div></Tooltip>}>
              <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                <button type="button" disabled={inputEmpty} className={`${menuItemClass} ${activeOperation === "generateTypes" ? "" : "!bg-primary/12 !text-primary"}`} onClick={() => { setFocusedPane("output"); runOperation("beautify"); setTypesMenuOpen(false); }}>
                  {sharedMenuCheck(activeOperation !== "generateTypes")}
                  <span className="min-w-0 flex-1 truncate text-left">None - format output</span>
                </button>
                <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" aria-hidden />
                {(
                  [
                    { label: "TypeScript", ids: ["typescript", "zod"] as const },
                    { label: "Python", ids: ["python", "pydantic"] as const },
                    { label: "Compiled", ids: ["java", "csharp", "go", "kotlin", "swift", "rust"] as const },
                    { label: "Schemas", ids: ["protobuf", "sql"] as const },
                  ] as const
                ).map((group, gi) => (
                  <React.Fragment key={group.label}>
                    {gi > 0 && <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" aria-hidden />}
                    {menuSectionLabel(group.label)}
                    {TYPE_LANGUAGES.filter((t) => (group.ids as readonly string[]).includes(t.id)).map((item) => (
                      <button key={item.id} type="button" disabled={inputEmpty} className={`${menuItemClass} ${activeOperation === "generateTypes" && typeLanguage === item.id ? menuItemActiveClass : ""}`} onClick={() => { trackEvent("generate_types", { language: item.id, source: "types_menu" }); setFocusedPane("output"); setActiveOperation("generateTypes"); executeOperation("generateTypes", { typeLanguage: item.id }); setTypesMenuOpen(false); }}>
                        {sharedMenuCheck(activeOperation === "generateTypes" && typeLanguage === item.id)}
                        <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                      </button>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </Dropdown>
            {resolvedInputFormat === "curl" && !isDiffMode && !isUtilsMode && (
              <Dropdown
                open={curlCodeOpen}
                onOpenChange={setCurlCodeOpen}
                side="bottom"
                align="start"
                rootClassName="shrink-0"
                contentClassName="w-max min-w-[10rem]"
                trigger={
                  <Tooltip content={curlTarget ? `Output shows ${getCurlTarget(curlTarget)?.label ?? ""} - pick another to regenerate` : "Generate code from this cURL command"}>
                  <div className={`${selectBtnClass} ${curlCodeOpen ? selectBtnOpenClass : ""}`}>
                    {curlTarget ? <TypeBadge id={curlTarget} /> : <CodeBracketIcon className="h-3.5 w-3.5" />}
                    <span className="font-medium">Code</span>
                    <ChevronDownIcon className="h-3 w-3 shrink-0" aria-hidden />
                  </div>
                  </Tooltip>
                }
              >
                <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                  {CURL_TARGETS.map((target) => (
                    <button
                      key={target.id}
                      type="button"
                      className={`${sharedMenuItemClass} ${curlTarget === target.id ? sharedMenuItemActiveClass : ""}`}
                      onClick={() => {
                        try {
                          prevActionStateRef.current = { output, parsedOutput, outputLanguage, outputExt };
                          const parsed = parseCurl(input);
                          const code = generateCurlCode(parsed, target.id as CurlTargetId);
                          setCurlTarget(target.id as CurlTargetId);
                          setFocusedPane("output");
                          setOutput(code);
                          setOutputLanguage(target.id === "python" ? "python" : target.id === "go" ? "go" : "javascript");
                          setOutputExt(target.ext);
                          setActiveOperation(null);
                          if (!isDesktopLayout) setMobileShowOutput(true);
                        } catch {
                          toast({ message: "Could not parse this cURL command", type: "error" });
                        }
                        setCurlCodeOpen(false);
                      }}
                    >
                      {sharedMenuCheck(curlTarget === target.id)}
                      <span className="min-w-0 flex-1 text-left">{target.label}</span>
                    </button>
                  ))}
                  <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" aria-hidden />
                  <button
                    type="button"
                    className={`${sharedMenuItemClass} ${!curlTarget ? sharedMenuItemActiveClass : ""}`}
                    onClick={() => {
                      restorePreviousActionOutput();
                      setCurlTarget(null);
                      setCurlCodeOpen(false);
                    }}
                  >
                    {sharedMenuCheck(!curlTarget)}
                    <span className="min-w-0 flex-1 text-left">None</span>
                    <span className="text-[10px] opacity-60">restore output</span>
                  </button>
                </div>
              </Dropdown>
            )}
            </>)}
            </>)}

          {isDiffMode && (
            <>
              <div className="mx-1 h-5 w-px shrink-0 bg-[var(--workspace-border)]" aria-hidden />
              <div className="flex h-7 shrink-0 overflow-hidden rounded-md bg-muted">
                <Tooltip content="Document text/JSON diff">
                <button
                  type="button"
                  className={`relative h-7 cursor-pointer px-3 text-xs font-semibold transition-colors duration-150 ${diffKind === "document" ? "text-primary" : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"}`}
                  onClick={() => setDiffKind("document")}
                >
                  {diffKind === "document" && (
                    <motion.span
                      layoutId="diff-kind-pill"
                      className="absolute inset-0 bg-primary/15"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-[1]">Document</span>
                </button>
                </Tooltip>
                <Tooltip content="List / set compare">
                <button
                  type="button"
                  className={`relative h-7 cursor-pointer border-l border-[var(--workspace-border)] px-3 text-xs font-semibold transition-colors duration-150 ${diffKind === "list" ? "text-primary" : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"}`}
                  onClick={() => setDiffKind("list")}
                >
                  {diffKind === "list" && (
                    <motion.span
                      layoutId="diff-kind-pill"
                      className="absolute inset-0 bg-primary/15"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-[1]">Lists</span>
                </button>
                </Tooltip>
                <Tooltip content="Single list: dedupe, count, sort">
                <button
                  type="button"
                  className={`relative h-7 cursor-pointer border-l border-[var(--workspace-border)] px-3 text-xs font-semibold transition-colors duration-150 ${diffKind === "single" ? "text-primary" : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"}`}
                  onClick={() => setDiffKind("single")}
                >
                  {diffKind === "single" && (
                    <motion.span
                      layoutId="diff-kind-pill"
                      className="absolute inset-0 bg-primary/15"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-[1]">Single</span>
                </button>
                </Tooltip>
              </div>

              {diffKind !== "document" && (
                <div
                  ref={setListToolbarHost}
                  className="flex min-h-7 min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-hidden"
                />
              )}
              {diffKind === "document" && (
                <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-hidden">
                  <div className="flex h-7 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Tooltip content="Previous difference" className="shrink-0">
                    <button type="button" className="flex h-7 w-7 cursor-pointer items-center justify-center text-[var(--workspace-text-muted)] transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40" disabled={!diffNav.total} onClick={() => diffEditorRef.current?.prevChange()}>
                      <ChevronUpIcon className="h-3.5 w-3.5" />
                    </button>
                    </Tooltip>
                    <Tooltip content="Current / total hunks" className="shrink-0">
                    <span className="flex h-7 min-w-[2.75rem] items-center justify-center border-x border-[var(--workspace-border)]/60 px-1 text-center text-[11px] font-medium tabular-nums text-[var(--workspace-text)]">
                      {diffNav.total ? `${diffNav.current}/${diffNav.total}` : "0"}
                    </span>
                    </Tooltip>
                    <Tooltip content="Next difference" className="shrink-0">
                    <button type="button" className="flex h-7 w-7 cursor-pointer items-center justify-center text-[var(--workspace-text-muted)] transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40" disabled={!diffNav.total} onClick={() => diffEditorRef.current?.nextChange()}>
                      <ChevronDownIcon className="h-3.5 w-3.5" />
                    </button>
                    </Tooltip>
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
                  <Tooltip content={diffSideBySide ? "Inline view" : "Side-by-side"} className="shrink-0">
                  <button type="button" className={diffToolBtn} onClick={() => { trackEvent("diff_toggle", { setting: "layout", value: !diffSideBySide }); setDiffSideBySide((v) => !v); }}>
                    {diffSideBySide ? "Inline" : "Side-by-side"}
                  </button>
                  </Tooltip>
                  <Tooltip content="Ignore trim whitespace" className="shrink-0">
                  <button type="button" className={`${diffToolBtn} ${diffIgnoreWhitespace ? "!bg-primary/12 !text-primary" : ""}`} onClick={() => { trackEvent("diff_toggle", { setting: "ignore_ws", value: !diffIgnoreWhitespace }); setDiffIgnoreWhitespace((v) => !v); }}>
                    {diffIgnoreWhitespace ? "Ignore WS ✓" : "Ignore WS"}
                  </button>
                  </Tooltip>
                  <Tooltip content="Ignore array order in structural diff (arrays matched as sets)" className="shrink-0">
                  <button
                    type="button"
                    className={`${diffToolBtn} ${diffIgnoreOrder ? "!bg-primary/12 !text-primary" : ""}`}
                    onClick={() => setDiffIgnoreOrder((v) => !v)}
                  >
                    {diffIgnoreOrder ? "Order-free ✓" : "Order-free"}
                  </button>
                  </Tooltip>
                  <Tooltip content={canShowPathDiff ? "Structural path-level changes (JSON/XML/YAML/CSV)" : "Path diff needs parseable data on both sides"} className="shrink-0">
                  <button
                    type="button"
                    disabled={!canShowPathDiff}
                    className={`${diffToolBtn} ${diffShowPaths ? "!bg-primary/12 !text-primary" : ""}`}
                    onClick={() => { trackEvent("diff_toggle", { setting: "paths", value: !diffShowPaths }); setDiffShowPaths((v) => !v); }}
                  >
                    <ListBulletIcon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">Paths</span>
                    {canShowPathDiff && structuralDiff && structuralDiff.total > 0 && (
                      <span className="tabular-nums opacity-80">{structuralDiff.total}</span>
                    )}
                  </button>
                  </Tooltip>
                  <Tooltip content="Beautify both sides" className="shrink-0">
                  <button type="button" className={diffToolBtn} onClick={() => beautifyDiffSides("both")}>
                    Beautify
                  </button>
                  </Tooltip>
                </div>
              )}
            </>
          )}

          {isDiffMode ? (
            <span className="w-2 shrink-0" aria-hidden />
          ) : (
            <span className="min-w-2 flex-1" />
          )}

          <OutputActionBar
              canCopy={Boolean(getActiveOutputText().trim()) || (!isDiffMode && !isUtilsMode && canDownload)}
              canShare
              canShareAll={showTabs && tabs.length > 1}
              isGraphView={!isDiffMode && !isUtilsMode && isGraphView}
              isMaximized={isOutputMaximized}
              copyLabel={copyLabel}
              shareLabel={shareLabel}
              actionBounce={actionBounce}
              downloadMenuOpen={downloadMenuOpen && !isDiffMode}
              onDownloadMenuOpenChange={setDownloadMenuOpen}
              visibility={outputActionVisibility}
              onUndo={() => {
                if (isDiffMode) diffEditorRef.current?.undo();
                else if (!isUtilsMode) moveHistory(-1);
              }}
              onRedo={() => {
                if (isDiffMode) diffEditorRef.current?.redo();
                else if (!isUtilsMode) moveHistory(1);
              }}
              canUndo={!isDiffMode && !isUtilsMode ? canUndo : undefined}
              canRedo={!isDiffMode && !isUtilsMode ? canRedo : undefined}
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
                    toast({ message: "Copied" });
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
                  toast({ message: "Downloaded" });
                  return;
                }
                if (isDiffMode) {
                  if ((diffKind === "list" || diffKind === "single") && listCompareExport?.text) {
                    const blob = new Blob([listCompareExport.text], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = listCompareExport.filename;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast({ message: "Downloaded" });
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
              onCopyAs={copyOutputAs}
              copyAsOptions={activeCopyAsOptions}
              lastCopyAsId={copyAsMemory[copyMemoryKey]}
              onLastCopyAsIdChange={(id) =>
                setCopyAsMemory((m) => ({ ...m, [copyMemoryKey]: id }))
              }
              onGraphCopy={graphCopy}
              graphCopyFormat={graphCopyFormat}
              onGraphCopyFormatChange={setGraphCopyFormat}
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
                undo: isUtilsMode,
                redo: isUtilsMode,
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

          {droppedFile && !isDiffMode && (
            <div className="flex shrink-0 items-center gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1.5">
              <span className="inline-flex h-4 shrink-0 items-center rounded-full bg-primary/10 px-1.5 text-[9px] font-semibold uppercase tracking-wide text-primary">
                {droppedFile.format}
              </span>
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--workspace-text)]">
                {droppedFile.name}
              </span>
              <span className="shrink-0 text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
                {getSizeFormatted(String(droppedFile.size))}
              </span>
              <button
                type="button"
                className={`${linkBtnClass} h-6 w-6 shrink-0 !p-0`}
                title="Dismiss file info"
                onClick={() => setDroppedFile(null)}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

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
                  onCtrlEnter={parseOnly}
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
                <div className="absolute inset-y-0 left-1/2 w-px -translate-x-px bg-[var(--workspace-border)] transition-all duration-200 group-hover:w-[2px] group-hover:bg-gradient-to-b group-hover:from-transparent group-hover:via-primary group-hover:to-transparent group-hover:opacity-100 group-hover:[box-shadow:0_0_8px_rgba(109,109,244,0.4)]" />
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
                onCtrlEnter={parseOnly}
                onCursorChange={(line, column) => setCursorPosition({ line, column })}
              />
              {resolvedInputFormat === "curl" && input.trim() && input !== lastExecutedCurlInput && !curlFetching && (
                <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center">
                  <button
                    type="button"
                    className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-[var(--workspace-panel)]/95 px-3 py-1 text-[10px] font-medium text-primary shadow-lg backdrop-blur transition-colors hover:bg-primary/10"
                    onClick={() => { parseOnly(); setFocusedPane("input"); }}
                  >
                    Press
                    <kbd className="rounded border border-primary/30 bg-[var(--workspace-background)] px-1 py-px font-mono text-[9px]">
                      {typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl"}
                    </kbd>
                    <kbd className="rounded border border-primary/30 bg-[var(--workspace-background)] px-1 py-px font-mono text-[9px]">Enter</kbd>
                    to execute
                  </button>
                </div>
              )}
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
                    <p className="mt-1.5 text-[11px] text-[var(--workspace-text-muted)]">
                      Format · Inspect · Query · Convert · Compare · Generate code
                    </p>
                    <button
                      type="button"
                      className="pointer-events-auto mt-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/20"
                      onClick={() => {
                        const sample = JSON.stringify(
                          { id: 1, name: "Alice", roles: ["admin", "dev"], active: true, meta: { plan: "pro", expires: "2026-01-01" } },
                          null,
                          2,
                        );
                        setInput(sample);
                        pushHistory(sample);
                        setFocusedPane("output");
                      }}
                    >
                      Load sample
                    </button>
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
            <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[var(--workspace-border)] transition-all duration-150 group-hover:w-[3px] group-hover:bg-primary/60 group-hover:shadow-[0_0_6px_rgba(109,109,244,0.35)] group-active:w-[3px] group-active:bg-primary group-active:shadow-[0_0_8px_rgba(109,109,244,0.5)]" />
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
                onActiveTabChange={(t) => {
                  trackEvent("util_tool", { tool: t });
                  setUtilTab(t);
                }}
                stateByTool={utilsByTool}
                onStateByToolChange={setUtilsByTool}
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
                    linkBtnClass={linkBtnClass}
                    panelClass={outputPanelClass}
                          isDark={isDark}
                    toolbarHost={listToolbarHost}
                    onExportChange={setListCompareExport}
                    fontSize={editorFontSize}
                    options={listCompareOptions}
                    initialCsvColumn={csvColumn}
                    onCsvColumnChange={setCsvColumn}
                  />
                ) : diffKind === "single" ? (
                  <SingleListPanel
                    value={diffLeftInput}
                    onChange={setDiffLeftInput}
                    linkBtnClass={linkBtnClass}
                    panelClass={outputPanelClass}
                    isDark={isDark}
                    toolbarHost={listToolbarHost}
                    onExportChange={setListCompareExport}
                    fontSize={editorFontSize}
                    options={listCompareOptions}
                  />
                ) : (
                  <div className="flex min-h-0 flex-1 overflow-hidden">
                    <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${diffShowPaths ? "" : "w-full"}`}>
                      {diffSideBySide && (
                        <div className={`relative flex h-7 shrink-0 border-b text-[11px] font-medium ${outputPanelClass}`}>
                          <div className="flex min-w-0 flex-1 items-center gap-1.5 border-r border-[var(--workspace-border)] px-2 text-[var(--workspace-text-muted)]">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/80" />
                            <span className="truncate">Left</span>
                          </div>
                          {/* Swap button centered on the divider - mirrors List Compare */}
                          <div className="flex w-6 shrink-0 items-center justify-center group/swap">
                            <Tooltip content="Swap left and right">
                            <button
                              type="button"
                              onClick={swapDiffSides}
                              className={`${linkBtnClass} h-6 min-h-6 w-6 rounded-md opacity-0 transition-opacity duration-150 group-hover/swap:opacity-100`}
                              aria-label="Swap left and right"
                            >
                              <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
                            </button>
                            </Tooltip>
                          </div>
                          <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2 text-[var(--workspace-text-muted)]">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400/80" />
                            <span className="truncate">Right</span>
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
                            {structuralDiff ? structuralDiff.total : "-"}
                          </span>
                          <Tooltip content="Close path list">
                          <SquareBtn
                            className={`${linkBtnClass} h-6 min-h-6 w-6`}
                            onClick={() => setDiffShowPaths(false)}
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                          </SquareBtn>
                          </Tooltip>
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
                                      <Tooltip content={row.path} className="block max-w-full">
                                      <p className="truncate font-mono text-[10px] font-semibold text-[var(--workspace-text)]">
                                        {row.path}
                                      </p>
                                      </Tooltip>
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
                  <Tooltip content="Clear input and error">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] px-3 py-1.5 text-xs font-medium text-[var(--workspace-text)] hover:bg-primary/10 hover:text-primary"
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
                  </Tooltip>
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
                  {rightView === "table" ? (
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
                  ) : (
                    <button
                      type="button"
                      className="rounded-lg border border-[var(--workspace-border)] px-3 py-1.5 text-xs font-medium text-[var(--workspace-text-muted)] hover:bg-primary/10 hover:text-primary"
                      onClick={() => setRightView("raw")}
                    >
                      Switch to Raw
                    </button>
                  )}
                </div>
              </div>
            ) : rightView === "raw" ? (
              output.trim() || curlFetching ? (
                <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                  {curlMeta && resolvedInputFormat === "curl" && (
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2.5 py-1.5">
                      <span
                        className={`inline-flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-bold tabular-nums ${
                          curlMeta.ok
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/15 text-red-600 dark:text-red-400"
                        }`}
                      >
                        HTTP {curlMeta.status}
                      </span>
                      <span className="text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
                        {curlMeta.size} B
                      </span>
                      {curlMeta.timingMs >= 0 && (
                        <span className="text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
                          {curlMeta.timingMs} ms
                        </span>
                      )}
                      {curlMeta.headers["content-type"] && (
                        <span className="hidden truncate font-mono text-[10px] text-[var(--workspace-text-muted)] sm:inline">
                          {curlMeta.headers["content-type"]}
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-[var(--workspace-text-muted)]">Response</span>
                    </div>
                  )}
                  {curlFetching ? (
                    <div className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden bg-[var(--workspace-panel)] px-4 py-3" aria-label="Fetching response">
                      {[70, 45, 55, 80, 40, 65, 30].map((w, i) => (
                        <div
                          key={i}
                          className="h-3 animate-pulse rounded bg-[var(--workspace-border)]/60"
                          style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }}
                        />
                      ))}
                      <p className="mt-1 text-[10px] font-medium text-[var(--workspace-text-muted)]">
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
                  />
                  )}
                </div>
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
                      Format, convert, compare, and developer utils - JSON, XML, YAML, and more. Everything runs locally in your browser.
                    </p>
                    <p className="text-[11px] text-[var(--workspace-text-muted)]">{quickTip ?? QUICK_TIPS[0]}</p>
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
                    <button type="button" className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3 py-1.5 text-xs font-medium text-[var(--workspace-text-muted)] transition-all hover:border-primary/30 hover:text-primary hover:shadow-sm" onClick={() => document.getElementById("import-json-file")?.click()} {...uploadIcon.bind}>
                      <AnimatedUploadIcon ref={uploadIcon.ref} className="h-3.5 w-3.5" />
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
                    ref={treeViewRef}
                    data={parsedOutput}
                    isDark={isDark}
                    largeFile={isLargeInput}
                    fontSize={editorFontSize}
                    onNotify={(msg) => toast({ message: msg })}
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
                      Large file - graph may be slow. Prefer Query or Tree for exploration.
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
                  onResultChange={setQueryResult}
                  initialQuery={queryText || undefined}
                  onQueryChange={setQueryText}
                  onOpenInListCompare={openInListCompare}
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
                    fontSize={editorFontSize}
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

      {embed && <div className="h-px shrink-0 bg-[var(--workspace-border)]" aria-hidden />}

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
        hide={embed}
        rightActions={
          <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] tracking-wide text-[var(--workspace-text-muted)]">
            {isDiffMode ? (
              <>
                <span className="font-semibold text-[var(--workspace-text)]">Compare</span>
                <span className="text-primary">·</span>
                <span className="font-semibold text-[var(--workspace-text)]">{diffKind === "document" ? "Document" : diffKind === "single" ? "Single list" : "Lists"}</span>
              </>
            ) : isUtilsMode ? (
              <>
                <span className="font-semibold text-[var(--workspace-text)]">Utils</span>
                <span className="text-primary">·</span>
                <span className="font-semibold text-[var(--workspace-text)]">{UTIL_TABS.find((t) => t.id === utilTab)?.label ?? utilTab}</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-[var(--workspace-text)]">{getInputFormatLabel(resolvedInputFormat)}</span>
                <span className="text-primary">→</span>
                <span className="font-semibold text-[var(--workspace-text)]">{activeOperation === "generateTypes" ? selectedTypeLanguageLabel : FORMAT_LABELS[convertToFormat]}</span>
              </>
            )}
          </span>
        }
        sharedLink={
          sharedLinkUrl ? (
            <span className="flex shrink-0 items-center gap-1">
              <span className="shrink-0 text-primary">Shared</span>
              <Tooltip content={sharedLinkUrl} className="min-w-0 flex-1">
              <a
                href={sharedLinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-[8rem] truncate hover:underline sm:max-w-[12rem]"
              >
                {sharedLinkUrl.replace(/^https?:\/\/[^/]+/, "")}
              </a>
              </Tooltip>
              <Tooltip content="Copy link">
              <UiButton
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 rounded text-[var(--workspace-text-muted)] hover:text-[var(--workspace-text)] [&_svg]:!h-3.5 [&_svg]:!w-3.5"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(sharedLinkUrl);
                    toast({ message: "Link copied", url: sharedLinkUrl, duration: 4000 });
                  } catch {
                    /* ignore */
                  }
                }}
                {...copyLinkIcon.bind}
              >
                <AnimatedCopyIcon ref={copyLinkIcon.ref} className="h-3.5 w-3.5" />
              </UiButton>
              </Tooltip>
              <Tooltip content="Disable sharing">
              <UiButton
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0 rounded text-[var(--workspace-text-muted)] hover:text-[var(--workspace-text)] [&_svg]:!h-3.5 [&_svg]:!w-3.5"
                onClick={async () => {
                  const idToDelete = sharedLinkId;
                  setSharedLinkId(null);
                  setSharedLinkUrl(null);
                  isViewingSharedRef.current = false;
                  if (idToDelete) await deletePlayground(idToDelete);
                  toast({ message: "Link disabled" });
                }}
              >
                <LinkSlashIcon className="h-3.5 w-3.5" />
              </UiButton>
              </Tooltip>
            </span>
          ) : undefined
        }
      />
      <Toaster />

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
              className={`flex h-full w-full max-w-sm flex-col shadow-2xl shadow-black/20 border-l ${isDark ? "bg-[var(--workspace-panel)]/95 backdrop-blur-xl border-[var(--workspace-border)]/60" : "bg-white/95 backdrop-blur-xl border-black/[0.06]"}`}
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

        <Dialog
          open={modalKind === "validate"}
          onOpenChange={(open) => {
            if (!open) setModalKind(null);
          }}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-sm">Validate against a schema</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                Paste a{" "}
                <strong className="text-[var(--workspace-text)]">JSON Schema</strong> or{" "}
                <strong className="text-[var(--workspace-text)]">YAML schema</strong> to validate
                the current input against. Validation runs locally - nothing leaves your device.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              className="h-60 w-full font-mono text-xs"
              value={modalValue}
              onChange={(e) => setModalValue(e.target.value)}
              placeholder="Paste a JSON Schema or YAML schema…"
            />
            <DialogFooter>
              <UiButton variant="outline" onClick={() => setModalKind(null)}>
                Cancel
              </UiButton>
              <UiButton
                disabled={!isModalInputValid}
                onClick={() => {
                  if (!isModalInputValid) return;
                  setSchemaInput(modalValue);
                  setModalKind(null);
                  executeOperation("validate", { schemaText: modalValue });
                }}
              >
                Validate
              </UiButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={shareConfirmOpen}
          onOpenChange={(open) => {
            if (!open) setShareConfirmOpen(false);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">Share this workspace?</DialogTitle>
              <DialogDescription className="text-xs leading-relaxed">
                Everything else in Formaty runs{" "}
                <strong className="text-[var(--workspace-text)]">locally in your browser</strong>.
                Sharing uploads your current input (and related settings) so others can open a link.
                Do not share secrets, tokens, or personal data.
              </DialogDescription>
            </DialogHeader>
            {showTabs && tabs.length > 1 && (
              <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)]/60 px-3 py-2.5">
                <Checkbox
                  className="mt-0.5"
                  checked={shareAllTabs}
                  onCheckedChange={(c) => setShareAllTabs(c === true)}
                />
                <span className="text-xs leading-relaxed text-[var(--workspace-text)]">
                  <strong className="font-semibold">Share all {tabs.length} tabs</strong>
                  <span className="mt-0.5 block text-[var(--workspace-text-muted)]">
                    Include every tab’s input, output, Compare sides, and Utils state. Unchecked shares only the active tab.
                  </span>
                </span>
              </label>
            )}
            <ul className="list-inside list-disc text-[11px] text-[var(--workspace-text-muted)]">
              <li>Link can be disabled later from the status bar</li>
              <li>If cloud share is unavailable, a URL hash fallback is used in the browser</li>
            </ul>
            <DialogFooter>
              <UiButton variant="outline" onClick={() => setShareConfirmOpen(false)}>
                Cancel
              </UiButton>
              <UiButton onClick={() => void shareWorkspace()}>Create link &amp; copy</UiButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {showFirstRunHint && (
          <div className="fixed bottom-20 left-1/2 z-50 flex max-w-[min(92vw,28rem)] -translate-x-1/2 items-start gap-3 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)]/95 px-4 py-3 text-xs shadow-xl backdrop-blur-md">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[var(--workspace-text)]">Quick tip</p>
              <p className="mt-0.5 text-[var(--workspace-text-muted)]">{quickTip ?? QUICK_TIPS[0]}</p>
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
