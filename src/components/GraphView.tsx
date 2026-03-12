"use client";

import { memo, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import type { JsonValue } from "@/lib/json/core";

interface GraphViewProps {
  data: JsonValue;
  className?: string;
  isDark?: boolean;
}

type GraphRow = {
  key: string;
  value: string;
  isNested: boolean;
};

type GraphNodeData = {
  title?: string;
  rows: GraphRow[];
  isDark: boolean;
};

type GraphNodeEntry = {
  id: string;
  rows: GraphRow[];
  level: number;
  parentId?: string;
  edgeLabel?: string;
  children: GraphNodeEntry[];
};

const MAX_NODES = 280;
const NODE_WIDTH = 250;
const X_SPACING = 290;
const Y_SPACING = 42;

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function formatPrimitive(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  return String(value);
}

function summarizeNested(value: JsonValue): string {
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (value && typeof value === "object") return `{${Object.keys(value).length} keys}`;
  return formatPrimitive(value);
}

function isNestedValue(value: JsonValue): value is JsonValue[] | Record<string, JsonValue> {
  return Array.isArray(value) || (Boolean(value) && typeof value === "object");
}

function countLeafSlots(entry: GraphNodeEntry): number {
  if (!entry.children.length) return 1;
  return entry.children.reduce((sum, child) => sum + countLeafSlots(child), 0);
}

function toNodeTitle(value: JsonValue, fallback: string): string {
  if (Array.isArray(value)) return `${fallback}: [${value.length} items]`;
  if (value && typeof value === "object") return fallback;
  return `${fallback}: ${formatPrimitive(value)}`;
}

const GraphCardNode = memo(function GraphCardNode({ data }: NodeProps<GraphNodeData>) {
  return (
    <div
      className="relative overflow-hidden rounded-md border"
      style={{
        width: NODE_WIDTH,
        background: data.isDark ? "#232326" : "#ffffff",
        color: data.isDark ? "#e5e7eb" : "#1f2937",
        borderColor: data.isDark ? "#424248" : "#d4d4d8",
        boxShadow: data.isDark ? "0 6px 14px rgba(0,0,0,0.28)" : "0 8px 20px rgba(15,23,42,0.1)",
      }}
    >
      <Handle type="target" position={Position.Right} style={{ opacity: 0, pointerEvents: "none" }} />
      {data.title ? (
        <div
          className="px-3 py-2 text-[12px] font-semibold"
          style={{ borderBottom: `1px solid ${data.isDark ? "#3f3f46" : "#e5e7eb"}` }}
        >
          {data.title}
        </div>
      ) : null}
      <div>
        {data.rows.length ? (
          data.rows.map((row, index) => {
            const showColor = row.key.toLowerCase().includes("color") && HEX_COLOR.test(row.value.trim());
            return (
              <div
                key={`${row.key}-${index}`}
                className="flex items-center gap-2 px-3 py-2 text-[11px]"
                style={{
                  borderTop: index === 0 && !data.title ? "none" : `1px solid ${data.isDark ? "#3b3b41" : "#ececf0"}`,
                }}
              >
                <span className="font-semibold text-sky-400">{row.key}:</span>
                {showColor ? (
                  <>
                    <span
                      className="inline-block h-3 w-3 rounded-[2px] border border-black/20"
                      style={{ backgroundColor: row.value.trim() }}
                    />
                    <span>{row.value}</span>
                  </>
                ) : (
                  <span className={row.isNested ? "text-zinc-400" : "text-inherit"}>{row.value}</span>
                )}
              </div>
            );
          })
        ) : (
          <div className="px-3 py-2 text-[11px] text-zinc-500">(empty)</div>
        )}
      </div>
      <Handle type="source" position={Position.Left} style={{ opacity: 0, pointerEvents: "none" }} />
    </div>
  );
});

const nodeTypes: NodeTypes = { graphCard: GraphCardNode };

function buildGraphEntry(value: JsonValue, id: string, label: string, level: number, edgeLabel?: string): GraphNodeEntry {
  const rows: GraphRow[] = [];
  const children: GraphNodeEntry[] = [];

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const key = `[${index}]`;
      if (isNestedValue(item)) {
        const childId = `${id}[${index}]`;
        rows.push({ key, value: summarizeNested(item), isNested: true });
        children.push(buildGraphEntry(item, childId, toNodeTitle(item, key), level + 1, label));
      } else {
        rows.push({ key, value: formatPrimitive(item), isNested: false });
      }
    });
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, nested]) => {
      if (isNestedValue(nested)) {
        const childId = `${id}.${key}`;
        rows.push({ key, value: summarizeNested(nested), isNested: true });
        children.push(buildGraphEntry(nested, childId, toNodeTitle(nested, key), level + 1, key));
      } else {
        rows.push({ key, value: formatPrimitive(nested), isNested: false });
      }
    });
  } else {
    rows.push({ key: "value", value: formatPrimitive(value), isNested: false });
  }

  return { id, rows, level, edgeLabel, children };
}

export function GraphView({ data, className, isDark = false }: GraphViewProps) {
  const { nodes, edges } = useMemo(() => {
    const nextNodes: Node<GraphNodeData>[] = [];
    const nextEdges: Edge[] = [];

    const rootKey = Array.isArray(data) ? "$" : data && typeof data === "object" ? Object.keys(data)[0] ?? "$" : "$";
    const rootValue =
      data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length === 1
        ? (data as Record<string, JsonValue>)[rootKey]
        : data;
    const rootLabel = toNodeTitle(rootValue, rootKey);
    const rootEntry = buildGraphEntry(rootValue, "$", rootLabel, 0);

    let nodeCount = 0;
    let yCursor = 0;

    const layout = (entry: GraphNodeEntry, parentId?: string) => {
      if (nodeCount >= MAX_NODES) return 0;

      const childCenters: number[] = [];
      entry.children.forEach((child) => {
        const top = layout(child, entry.id);
        if (top > 0 || childCenters.length) {
          const childSlots = countLeafSlots(child);
          childCenters.push(top + ((childSlots - 1) * Y_SPACING) / 2);
        }
      });

      const ownY = childCenters.length ? childCenters.reduce((a, b) => a + b, 0) / childCenters.length : yCursor;
      if (!childCenters.length) yCursor += Y_SPACING;

      nodeCount += 1;
      nextNodes.push({
        id: entry.id,
        type: "graphCard",
        position: { x: -entry.level * X_SPACING, y: ownY },
        data: { title: entry.level === 0 ? undefined : undefined, rows: entry.rows, isDark },
        draggable: false,
        selectable: false,
      });

      if (parentId) {
        nextEdges.push({
          id: `${entry.id}=>${parentId}`,
          source: entry.id,
          target: parentId,
          label: entry.edgeLabel,
          labelStyle: { fill: isDark ? "#c6c6cc" : "#374151", fontSize: 11, fontWeight: 500 },
          type: "smoothstep",
          style: { stroke: isDark ? "#4a4a52" : "#9ca3af", strokeWidth: 1.8 },
        });
      }

      return ownY;
    };

    layout(rootEntry);

    return { nodes: nextNodes, edges: nextEdges };
  }, [data, isDark]);

  return (
    <div className={`relative h-full overflow-hidden rounded-xl border ${className ?? ""}`}>
      <div className="absolute left-2 top-2 z-10 rounded bg-black/25 p-1 text-zinc-300">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.25}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        panOnScroll
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
      >
        <Background color={isDark ? "#222229" : "#e4e4e7"} gap={28} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
