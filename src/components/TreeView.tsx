"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { Button, IconButton, Segmented, TextField, Tooltip } from "@/components/kit";
import type { JsonValue } from "@/lib/json/core";
import { searchJson, type SearchMatch } from "@/lib/json/core";
import { HUGE_INPUT_BYTES } from "@/lib/io/size";
import { ReadOnlyTextViewer } from "@/components/editor/ReadOnlyTextViewer";

type SearchMode = "key" | "value";

/** Convert a searchJson path (`users[0].name`) to tree path form (`$.users[0].name`). */
function toTreePath(p: string): string {
  return p.startsWith("$") ? p : `$.${p}`;
}

function ancestorPaths(p: string): string[] {
  const out: string[] = [];
  const segs = p.split(".");
  for (let i = 1; i < segs.length; i++) {
    out.push(segs.slice(0, i).join("."));
  }
  out.push(p);
  return out;
}

const MAX_EXPAND_MATCHES = 200;

export interface TreeViewRef {
  focusSearch: () => void;
}

export interface TreeViewProps {
  data: JsonValue;
  className?: string;
  isDark?: boolean;
  /** Soft cap: skip expanding huge branches to keep UI responsive */
  largeFile?: boolean;
  onNotify?: (msg: string) => void;
  /** Hide the "string · 12" type badge next to each key (used by JWT tree). */
  showTypeBadges?: boolean;
  /** Open every node by default (JWT tree). */
  defaultExpanded?: boolean;
  /** Content font size (px) - kept in sync with the editor font size. */
  fontSize?: number;
  /** Parent-known size of the source string. When set, the huge-mode gate
   *  uses this directly instead of stringifying samples (which OOMs). */
  byteSize?: number;
}

const MAX_INITIAL_DEPTH = 2;
const MAX_CHILDREN_PREVIEW = 200;

function valueType(value: JsonValue): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function prettyValue(value: JsonValue): string {
  if (typeof value === "string") {
    const s = value.length > 120 ? `${value.slice(0, 120)}…` : value;
    return `"${s}"`;
  }
  if (value === null) return "null";
  return String(value);
}

function valueForCopy(value: JsonValue): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function pathJoin(parent: string, key: string, isIndex: boolean): string {
  if (!parent || parent === "$") {
    return isIndex ? `$[${key}]` : `$.${key}`;
  }
  return isIndex ? `${parent}[${key}]` : `${parent}.${key}`;
}

interface SearchState {
  /** Tree-path of the currently selected match (highlighted + scrolled to). */
  currentPath: string | null;
  /** Tree-paths of every match (subtle marker). */
  matchPaths: Set<string>;
  /** Ancestor paths that should be force-expanded. */
  expandedPaths: Set<string>;
}

const EMPTY_SEARCH: SearchState = { currentPath: null, matchPaths: new Set(), expandedPaths: new Set() };

function Node({
  nodeKey,
  value,
  depth,
  path,
  isDark,
  expandAll,
  collapseGen,
  largeFile,
  onNotify,
  showTypeBadges = true,
  defaultExpanded = false,
  search,
}: {
  nodeKey: string;
  value: JsonValue;
  depth: number;
  path: string;
  isDark: boolean;
  expandAll: boolean | null;
  collapseGen: number;
  largeFile?: boolean;
  onNotify?: (msg: string) => void;
  showTypeBadges?: boolean;
  defaultExpanded?: boolean;
  search: SearchState;
}) {
  const canExpand = value !== null && typeof value === "object";
  const childCount = canExpand
    ? Array.isArray(value)
      ? value.length
      : Object.keys(value as object).length
    : 0;
  const [open, setOpen] = useState(
    defaultExpanded ? true : depth < MAX_INITIAL_DEPTH,
  );
  const [showAll, setShowAll] = useState(false);

  // Sync expand/collapse all
  useEffect(() => {
    if (expandAll === true) setOpen(true);
    else if (expandAll === false) setOpen(false);
  }, [expandAll, collapseGen]);

  // Force-open ancestors of search matches
  const isSearchExpanded = search.expandedPaths.has(path);
  useEffect(() => {
    if (isSearchExpanded) setOpen(true);
  }, [isSearchExpanded, path]);

  const isMatch = search.matchPaths.has(path);
  const isCurrent = search.currentPath === path;

  const copy = useCallback(
    async (kind: "path" | "value") => {
      const text = kind === "path" ? path : valueForCopy(value);
      try {
        await navigator.clipboard.writeText(text);
        onNotify?.(kind === "path" ? "Path copied" : "Value copied");
      } catch {
        onNotify?.("Copy failed");
      }
    },
    [path, value, onNotify],
  );

  const branchClass = "border-[var(--input)]";
  const keyClass = "font-mono text-[var(--syn-key)]";
  const text =
    typeof value === "string"
      ? "text-[var(--syn-string)]"
      : typeof value === "number"
        ? "text-[var(--syn-number)]"
        : typeof value === "boolean" || value === null
          ? "text-[var(--syn-bool)]"
          : "text-[var(--workspace-text)]";

  const children: { key: string; val: JsonValue; isIndex: boolean }[] = [];
  if (canExpand && open) {
    if (Array.isArray(value)) {
      const list = showAll || value.length <= MAX_CHILDREN_PREVIEW
        ? value
        : value.slice(0, MAX_CHILDREN_PREVIEW);
      list.forEach((item, idx) => {
        children.push({ key: String(idx), val: item, isIndex: true });
      });
    } else {
      const entries = Object.entries(value as Record<string, JsonValue>);
      const list =
        showAll || entries.length <= MAX_CHILDREN_PREVIEW
          ? entries
          : entries.slice(0, MAX_CHILDREN_PREVIEW);
      list.forEach(([k, v]) => {
        children.push({ key: k, val: v, isIndex: false });
      });
    }
  }

  const truncated =
    canExpand &&
    childCount > MAX_CHILDREN_PREVIEW &&
    !showAll &&
    open;

  const rowHighlight = isCurrent
    ? "rounded-md bg-selected text-selected-foreground"
    : isMatch
      ? "rounded-md bg-control-hover"
      : "";

  return (
    <div className={depth > 0 ? `ml-3 border-l pl-2.5 ${branchClass}` : ""}>
      <div
        data-path={path}
        className={`group flex items-center gap-1.5 py-0.5 pl-0.5 leading-[1.6] ${rowHighlight}`}
      >
        {canExpand ? (
          <button
            type="button"
            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--workspace-text-muted)] hover:bg-control hover:text-[var(--workspace-text)] ${largeFile && depth > 4 ? "opacity-70" : ""}`}
            onClick={() => setOpen((s) => !s)}
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? (
              <ChevronDownIcon className="size-4" />
            ) : (
              <ChevronRightIcon className="size-4" />
            )}
          </button>
        ) : (
          <span className="inline-block h-5 w-5 shrink-0" />
        )}
        <Tooltip content={`Copy path ${path}`}>
        <button
          type="button"
          className={`${keyClass} hover:underline`}
          onClick={() => void copy("path")}
        >
          {nodeKey}
        </button>
        </Tooltip>
        {showTypeBadges ? (
          <span
            className="shrink-0 rounded bg-control-hover px-1 py-px text-[12px] font-medium text-[var(--workspace-text-muted)]"
          >
            {valueType(value)}
            {canExpand ? ` · ${childCount}` : ""}
          </span>
        ) : null}
        {!canExpand ? (
          <Tooltip content="Copy value">
          <button
            type="button"
            className={`min-w-0 truncate font-mono ${text} hover:underline`}
            onClick={() => void copy("value")}
          >
            {prettyValue(value)}
          </button>
          </Tooltip>
        ) : null}
      </div>
      {open && canExpand ? (
        <div>
          {children.map(({ key, val, isIndex }) => (
            <Node
              key={`${path}.${key}`}
              nodeKey={key}
              value={val}
              depth={depth + 1}
              path={pathJoin(path, key, isIndex)}
              isDark={isDark}
              expandAll={expandAll}
              collapseGen={collapseGen}
              largeFile={largeFile}
              onNotify={onNotify}
              showTypeBadges={showTypeBadges}
              defaultExpanded={defaultExpanded}
              search={search}
            />
          ))}
          {truncated ? (
            <Button variant="ghost" className="ml-8" onClick={() => setShowAll(true)}>
              Show all {childCount} items
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export const TreeView = forwardRef<TreeViewRef, TreeViewProps>(function TreeView(
  {
    data,
    className,
    isDark = false,
    largeFile = false,
    onNotify,
    showTypeBadges = true,
    defaultExpanded = false,
    fontSize = 13,
    byteSize,
  }: TreeViewProps,
  ref,
) {
  const rootLabel = useMemo(
    () => (Array.isArray(data) ? "$[]" : "$"),
    [data],
  );
  const [expandAll, setExpandAll] = useState<boolean | null>(null);
  const [collapseGen, setCollapseGen] = useState(0);

  // Prefer the parent-supplied byte size (known from the source string).
  // Fall back to the sample-and-extrapolate estimate only when no size is
  // provided; stringifying a 2+ MiB object OOMs and would silently disable
  // the gate by returning null.
  const estimatedSize = useMemo<number | null>(() => {
    if (byteSize !== undefined) return byteSize;
    if (data == null) return 2;
    try {
      if (Array.isArray(data)) {
        if (data.length === 0) return 2;
        const sample = data.length > 100 ? data.slice(0, 100) : data;
        const sampleBytes = sample.reduce<number>((acc, v) => acc + JSON.stringify(v).length, 0);
        if (sampleBytes > HUGE_INPUT_BYTES) return sampleBytes;
        return Math.ceil((sampleBytes / sample.length) * data.length) + 2;
      }
      return JSON.stringify(data).length;
    } catch {
      return null;
    }
  }, [data, byteSize]);
  const isHuge = estimatedSize !== null && estimatedSize > HUGE_INPUT_BYTES;

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("value");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  /** Search magnifier nudges when the box is hovered or focused. */

  const matches = useMemo((): SearchMatch[] => {
    if (!query.trim()) return [];
    try {
      return searchJson(data, query, mode, caseSensitive);
    } catch {
      return [];
    }
  }, [data, query, mode, caseSensitive]);

  const search = useMemo((): SearchState => {
    if (matches.length === 0) return EMPTY_SEARCH;
    const clamped = Math.min(currentIdx, matches.length - 1);
    const current = matches[clamped];
    const matchPaths = new Set<string>();
    const expanded = new Set<string>();
    const slice = matches.length <= MAX_EXPAND_MATCHES ? matches : [matches[clamped] ?? current];
    for (const m of slice) {
      const tp = toTreePath(m.path);
      matchPaths.add(tp);
      for (const a of ancestorPaths(tp)) expanded.add(a);
    }
    return {
      currentPath: toTreePath(current?.path ?? ""),
      matchPaths,
      expandedPaths: expanded,
    };
  }, [matches, currentIdx]);

  const goTo = useCallback(
    (delta: number) => {
      if (matches.length === 0) return;
      setCurrentIdx((i) => (i + delta + matches.length) % matches.length);
    },
    [matches.length],
  );

  // Scroll the current match into view when navigating
  useEffect(() => {
    if (!search.currentPath) return;
    const el = scrollRef.current?.querySelector<HTMLElement>(
      `[data-path="${search.currentPath.replace(/"/g, '\\"')}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [search.currentPath]);

  const clearSearch = () => {
    setQuery("");
    setCurrentIdx(0);
  };

  useImperativeHandle(ref, () => ({
    focusSearch: () => searchInputRef.current?.focus(),
  }));

  const hugePreview = useMemo<string>(() => {
    if (!isHuge) return "";
    try {
      if (Array.isArray(data)) {
        // Render the first 200 elements then a summary line for the rest.
        const head = data.slice(0, 200);
        const headText = head.map((v) => JSON.stringify(v)).join(",\n");
        return head.length < data.length
          ? `${headText},\n… (${data.length - head.length} more items, view in editor)`
          : headText;
      }
      return JSON.stringify(data, null, 2);
    } catch {
      return "(unable to preview)";
    }
  }, [data, isHuge]);

  if (isHuge) {
    return (
      <div
        className={`flex h-full min-h-0 flex-col overflow-hidden border border-[var(--workspace-border)] bg-[var(--workspace-panel)] ${className ?? ""}`}
      >
        <div className="shrink-0 border-b border-[var(--workspace-border)] px-3 py-1.5 text-[12px] text-[var(--workspace-text-muted)]">
          Huge input — tree view disabled. Showing the first 200 items.
        </div>
        <ReadOnlyTextViewer value={hugePreview} language="json" className="flex-1" />
      </div>
    );
  }

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden border border-[var(--workspace-border)] bg-[var(--workspace-panel)] ${className ?? ""}`}
    >
      <div className="flex min-h-9 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-[var(--workspace-border)] px-3 py-1">
        <Button
          variant="ghost"
          onClick={() => {
            setExpandAll(true);
            setCollapseGen((g) => g + 1);
          }}
        >
          Expand all
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setExpandAll(false);
            setCollapseGen((g) => g + 1);
          }}
        >
          Collapse all
        </Button>
        {largeFile && <span className="hidden text-[12px] text-[var(--workspace-text-muted)] sm:inline">Large file: expand carefully</span>}
        <div className="ml-auto flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1 sm:max-w-[30rem]">
          <TextField
            ref={searchInputRef}
            aria-label="Search JSON tree"
            icon={<MagnifyingGlassIcon />}
            placeholder={`Search ${mode === "key" ? "keys" : "values"}`}
            spellCheck={false}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentIdx(0);
            }}
            onClear={clearSearch}
            wrapperClassName="min-w-[8rem] flex-1"
          />
          <Segmented
            aria-label="Search in"
            value={mode}
            onChange={(m) => {
              setMode(m);
              setCurrentIdx(0);
            }}
            options={[
              { value: "key", label: "Keys" },
              { value: "value", label: "Values" },
            ]}
          />
          <IconButton
            label={caseSensitive ? "Case-sensitive" : "Case-insensitive"}
            variant={caseSensitive ? "selected" : "ghost"}
            aria-pressed={caseSensitive}
            onClick={() => setCaseSensitive((v) => !v)}
          >
            <span className="text-[12px] font-semibold">Aa</span>
          </IconButton>
          {matches.length > 0 && (
            <>
              <span className="shrink-0 text-[12px] font-medium tabular-nums text-[var(--workspace-text-muted)]">
                {Math.min(currentIdx + 1, matches.length)}/{matches.length}
              </span>
              <IconButton label="Previous match" onClick={() => goTo(-1)}>
                <ChevronUpIcon />
              </IconButton>
              <IconButton label="Next match" onClick={() => goTo(1)}>
                <ChevronDownIcon />
              </IconButton>
            </>
          )}
        </div>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto p-3" style={{ fontSize }}>
        {query.trim() && matches.length === 0 ? (
          <p className="px-2 py-2 text-[12px] text-[var(--workspace-text-muted)]">
            No matches for “{query}”.
          </p>
        ) : null}
        <Node
          nodeKey={rootLabel}
          value={data}
          depth={0}
          path="$"
          isDark={isDark}
          expandAll={expandAll}
          collapseGen={collapseGen}
          largeFile={largeFile}
          onNotify={onNotify}
          showTypeBadges={showTypeBadges}
          defaultExpanded={defaultExpanded}
          search={search}
        />
      </div>
    </div>
  );
});
