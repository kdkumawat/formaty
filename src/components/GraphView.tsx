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
  title: string;
  rows: GraphRow[];
  isDark: boolean;
};

const MAX_NODES = 250;
const NODE_WIDTH = 260;
const X_SPACING = 340;
const Y_SPACING = 210;

function formatPrimitive(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "string") return value.length > 36 ? `${value.slice(0, 33)}...` : value;
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

const GraphCardNode = memo(function GraphCardNode({ data }: NodeProps<GraphNodeData>) {
  return (
    <div
      className="relative overflow-hidden rounded-lg border"
      style={{
        width: NODE_WIDTH,
        background: data.isDark ? "#20242b" : "#ffffff",
        color: data.isDark ? "#e4e4e7" : "#1f2937",
        borderColor: data.isDark ? "#3f3f46" : "#d4d4d8",
        boxShadow: data.isDark ? "0 6px 20px rgba(0,0,0,0.25)" : "0 6px 20px rgba(15,23,42,0.08)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div
        className="px-3 py-2 text-xs font-semibold"
        style={{
          borderBottom: `1px solid ${data.isDark ? "#3f3f46" : "#e4e4e7"}`,
          background: data.isDark ? "#18181b" : "#fafafa",
        }}
      >
        {data.title}
      </div>
      <div className="px-2 py-1.5">
        {data.rows.length ? (
          data.rows.map((row) => (
            <div key={row.key} className="flex items-start gap-2 px-1 py-1 text-xs leading-5">
              <span className="font-semibold text-sky-500">{row.key}:</span>
              <span className={row.isNested ? "text-zinc-500" : "text-inherit"}>{row.value}</span>
            </div>
          ))
        ) : (
          <div className="px-1 py-1 text-xs text-zinc-500">(empty)</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
});

const nodeTypes: NodeTypes = { graphCard: GraphCardNode };

export function GraphView({ data, className, isDark = false }: GraphViewProps) {
  const { nodes, edges } = useMemo(() => {
    const nextNodes: Node<GraphNodeData>[] = [];
    const nextEdges: Edge[] = [];
    const depthCounts = new Map<number, number>();
    let count = 0;

    const getPosition = (depth: number) => {
      const index = depthCounts.get(depth) ?? 0;
      depthCounts.set(depth, index + 1);
      return { x: depth * X_SPACING, y: index * Y_SPACING };
    };

    const visit = (value: JsonValue, id: string, title: string, depth: number, parentId?: string, edgeLabel?: string) => {
      if (count >= MAX_NODES) return;
      count += 1;

      const rows: GraphRow[] = [];
      const children: Array<{ key: string; value: JsonValue; id: string; title: string }> = [];

      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const key = `[${index}]`;
          if (isNestedValue(item)) {
            rows.push({ key, value: summarizeNested(item), isNested: true });
            children.push({ key, value: item, id: `${id}[${index}]`, title: key });
          } else {
            rows.push({ key, value: formatPrimitive(item), isNested: false });
          }
        });
      } else if (value && typeof value === "object") {
        Object.entries(value).forEach(([key, nested]) => {
          if (isNestedValue(nested)) {
            rows.push({ key, value: summarizeNested(nested), isNested: true });
            children.push({ key, value: nested, id: `${id}.${key}`, title: key });
          } else {
            rows.push({ key, value: formatPrimitive(nested), isNested: false });
          }
        });
      } else {
        rows.push({ key: "value", value: formatPrimitive(value), isNested: false });
      }

      nextNodes.push({
        id,
        position: getPosition(depth),
        type: "graphCard",
        data: { title, rows, isDark },
        draggable: false,
        selectable: false,
      });

      if (parentId) {
        nextEdges.push({
          id: `${parentId}=>${id}`,
          source: parentId,
          target: id,
          label: edgeLabel,
          labelStyle: {
            fill: isDark ? "#d4d4d8" : "#374151",
            fontSize: 12,
          },
          style: {
            stroke: isDark ? "#52525b" : "#a1a1aa",
            strokeWidth: 1.5,
          },
          type: "smoothstep",
        });
      }

      children.forEach((child) => visit(child.value, child.id, child.title, depth + 1, id, child.key));
    };

    const rootTitle = Array.isArray(data) ? "$ [array]" : data && typeof data === "object" ? "$ {object}" : "$";
    visit(data, "$", rootTitle, 0);

    return { nodes: nextNodes, edges: nextEdges };
  }, [data, isDark]);

  return (
    <div className={`h-full rounded-xl border overflow-hidden ${className ?? ""}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={isDark ? "#27272a" : "#e4e4e7"} gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
