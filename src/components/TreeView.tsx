"use client";

import { useMemo, useState } from "react";
import type { JsonValue } from "@/lib/json/core";

interface TreeViewProps {
  data: JsonValue;
  className?: string;
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
}: {
  nodeKey: string;
  value: JsonValue;
  depth: number;
}) {
  const canExpand = value && typeof value === "object";
  const [open, setOpen] = useState(depth < MAX_INITIAL_DEPTH);

  return (
    <div className={depth > 0 ? "ml-4 border-l pl-3" : ""}>
      <div className="flex items-center gap-2 py-0.5 text-sm">
        {canExpand ? (
          <button
            type="button"
            className="btn btn-ghost btn-xs h-5 min-h-5 w-5 px-0"
            onClick={() => setOpen((s) => !s)}
          >
            {open ? "-" : "+"}
          </button>
        ) : (
          <span className="inline-block h-5 w-5" />
        )}
        <span className="font-medium text-primary">{nodeKey}</span>
        <span className="badge badge-ghost badge-xs">
          {valueType(value)}
        </span>
        {!canExpand ? <span className="text-base-content/90">{prettyValue(value)}</span> : null}
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
                />
              ))
            : Object.entries(value).map(([k, v]) => (
                <Node key={`${nodeKey}.${k}`} nodeKey={k} value={v} depth={depth + 1} />
              ))}
        </div>
      ) : null}
    </div>
  );
}

export function TreeView({ data, className }: TreeViewProps) {
  const rootLabel = useMemo(() => (Array.isArray(data) ? "root[]" : "root"), [data]);

  return (
    <div className={`h-full min-h-0 overflow-auto rounded-xl border border-base-300 bg-base-100 p-3 ${className ?? ""}`}>
      <Node nodeKey={rootLabel} value={data} depth={0} />
    </div>
  );
}
