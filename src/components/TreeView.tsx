"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
} from "@heroicons/react/24/outline";
import type { JsonValue } from "@/lib/json/core";

interface TreeViewProps {
  data: JsonValue;
  className?: string;
  isDark?: boolean;
  /** Soft cap: skip expanding huge branches to keep UI responsive */
  largeFile?: boolean;
  onNotify?: (msg: string) => void;
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
}) {
  const canExpand = value !== null && typeof value === "object";
  const childCount = canExpand
    ? Array.isArray(value)
      ? value.length
      : Object.keys(value as object).length
    : 0;
  const [open, setOpen] = useState(depth < MAX_INITIAL_DEPTH);
  const [showAll, setShowAll] = useState(false);

  // Sync expand/collapse all
  useEffect(() => {
    if (expandAll === true) setOpen(true);
    else if (expandAll === false) setOpen(false);
  }, [expandAll, collapseGen]);

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

  const branchClass = "border-[var(--workspace-border)]";
  const keyClass = "font-medium text-primary";
  const muted = "text-[var(--workspace-text-muted)]";
  const text = "text-[var(--workspace-text)]";

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

  return (
    <div className={depth > 0 ? `ml-3 border-l pl-2.5 ${branchClass}` : ""}>
      <div className="group flex items-center gap-1.5 py-0.5 text-[13px] leading-5">
        {canExpand ? (
          <button
            type="button"
            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--workspace-text-muted)] hover:bg-primary/10 hover:text-primary ${largeFile && depth > 4 ? "opacity-70" : ""}`}
            onClick={() => setOpen((s) => !s)}
            aria-label={open ? "Collapse" : "Expand"}
          >
            {open ? (
              <ChevronDownIcon className="h-3.5 w-3.5" />
            ) : (
              <ChevronRightIcon className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="inline-block h-5 w-5 shrink-0" />
        )}
        <button
          type="button"
          className={`${keyClass} hover:underline`}
          title={path}
          onClick={() => void copy("path")}
        >
          {nodeKey}
        </button>
        <span
          className={`shrink-0 rounded px-1 py-px text-[10px] font-medium ${
            isDark ? "bg-white/10 text-white/80" : "bg-black/5 text-black/65"
          }`}
        >
          {valueType(value)}
          {canExpand ? ` · ${childCount}` : ""}
        </span>
        {!canExpand ? (
          <button
            type="button"
            className={`min-w-0 truncate font-mono text-[12px] ${text} hover:text-primary`}
            title="Copy value"
            onClick={() => void copy("value")}
          >
            {prettyValue(value)}
          </button>
        ) : null}
        <span className="ml-auto hidden shrink-0 items-center gap-0.5 group-hover:flex">
          <button
            type="button"
            className={`inline-flex h-5 items-center gap-0.5 rounded px-1 text-[10px] ${muted} hover:bg-primary/10 hover:text-primary`}
            title="Copy path"
            onClick={() => void copy("path")}
          >
            <ClipboardDocumentIcon className="h-3 w-3" />
            path
          </button>
          <button
            type="button"
            className={`inline-flex h-5 items-center gap-0.5 rounded px-1 text-[10px] ${muted} hover:bg-primary/10 hover:text-primary`}
            title="Copy value"
            onClick={() => void copy("value")}
          >
            value
          </button>
        </span>
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
            />
          ))}
          {truncated ? (
            <button
              type="button"
              className={`ml-8 py-1 text-[11px] text-primary hover:underline`}
              onClick={() => setShowAll(true)}
            >
              Show all {childCount} items…
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function TreeView({
  data,
  className,
  isDark = false,
  largeFile = false,
  onNotify,
}: TreeViewProps) {
  const rootLabel = useMemo(
    () => (Array.isArray(data) ? "$[]" : "$"),
    [data],
  );
  const [expandAll, setExpandAll] = useState<boolean | null>(null);
  const [collapseGen, setCollapseGen] = useState(0);

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden border border-[var(--workspace-border)] bg-[var(--workspace-panel)] ${className ?? ""}`}
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-[var(--workspace-border)] px-2 py-1">
        <button
          type="button"
          className="rounded-md px-2 py-1 text-[11px] font-medium text-[var(--workspace-text-muted)] hover:bg-primary/10 hover:text-primary"
          onClick={() => {
            setExpandAll(true);
            setCollapseGen((g) => g + 1);
          }}
        >
          Expand all
        </button>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-[11px] font-medium text-[var(--workspace-text-muted)] hover:bg-primary/10 hover:text-primary"
          onClick={() => {
            setExpandAll(false);
            setCollapseGen((g) => g + 1);
          }}
        >
          Collapse all
        </button>
        {largeFile && (
          <span className="ml-auto text-[10px] text-amber-600 dark:text-amber-400">
            Large file - expand carefully
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
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
        />
      </div>
    </div>
  );
}
