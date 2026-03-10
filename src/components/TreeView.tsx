"use client";

import { useMemo, useState } from "react";
import type { JsonValue } from "@/lib/json/core";

interface TreeViewProps {
  data: JsonValue;
  className?: string;
  isDark?: boolean;
}

const MAX_INITIAL_DEPTH = 2;

function valueType(value: JsonValue): string {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function prettyValue(value: JsonValue): string {
  if (typeof value === "string") return `"${value}"`;
  if (value === null) return "null";
  return String(value);
}

function Node({
  nodeKey,
  value,
  depth,
  isDark,
}: {
  nodeKey: string;
  value: JsonValue;
  depth: number;
  isDark: boolean;
}) {
  const canExpand = value && typeof value === "object";
  const [open, setOpen] = useState(depth < MAX_INITIAL_DEPTH);

  const branchClass = isDark ? "border-[#6b7280]" : "border-[#7a7a7a]";

  return (
    <div className={depth > 0 ? `ml-4 border-l pl-3 ${branchClass}` : ""}>
      <div className="flex items-center gap-2 py-0.5 text-sm">
        {canExpand ? (
          <button
            type="button"
            className={`btn btn-ghost btn-xs h-5 min-h-5 w-5 px-0 ${isDark ? "text-[#d4d4d4] hover:bg-white/5" : "text-[#1f1f1f] hover:bg-black/5"}`}
            onClick={() => setOpen((s) => !s)}
          >
            {open ? "-" : "+"}
          </button>
        ) : (
          <span className="inline-block h-5 w-5" />
        )}
        <span className="font-medium text-[#646CFF]">{nodeKey}</span>
        <span className={`badge badge-xs border-0 ${isDark ? "bg-white/10 text-white/85" : "bg-black/5 text-black/70"}`}>
          {valueType(value)}
        </span>
        {!canExpand ? (
          <span className={isDark ? "text-[#d4d4d4]" : "text-[#1f1f1f]"}>{prettyValue(value)}</span>
        ) : null}
      </div>
      {open && canExpand ? (
        <div>
          {Array.isArray(value)
            ? value.map((item, idx) => (
                <Node
                  key={`${nodeKey}[${idx}]`}
                  nodeKey={String(idx)}
                  value={item}
                  depth={depth + 1}
                  isDark={isDark}
                />
              ))
            : Object.entries(value).map(([k, v]) => (
                <Node
                  key={`${nodeKey}.${k}`}
                  nodeKey={k}
                  value={v}
                  depth={depth + 1}
                  isDark={isDark}
                />
              ))}
        </div>
      ) : null}
    </div>
  );
}

export function TreeView({ data, className, isDark = false }: TreeViewProps) {
  const rootLabel = useMemo(() => (Array.isArray(data) ? "root[]" : "root"), [data]);

  return (
    <div className={`h-full min-h-0 overflow-auto rounded-xl border p-3 ${className ?? ""}`}>
      <Node nodeKey={rootLabel} value={data} depth={0} isDark={isDark} />
    </div>
  );
}
