"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import type { JsonValue } from "@/lib/json/core";

interface GraphViewProps {
  data: JsonValue;
  className?: string;
  isDark?: boolean;
}

const MAX_NODES = 250;

function shortValue(value: JsonValue): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === "object") return "Object";
  return String(value).slice(0, 32);
}

export function GraphView({ data, className, isDark = false }: GraphViewProps) {
  const { nodes, edges } = useMemo(() => {
    const nextNodes: Node[] = [];
    const nextEdges: Edge[] = [];
    let count = 0;

    const addNode = (id: string, label: string, depth: number, index: number) => {
      nextNodes.push({
        id,
        position: { x: depth * 220, y: index * 72 },
        data: { label },
        style: {
          background: isDark ? "#111827" : "#ffffff",
          color: isDark ? "#e5e7eb" : "#1f2937",
          border: isDark ? "1px solid #374151" : "1px solid #d4d4d8",
          borderRadius: 8,
          fontSize: 12,
          padding: 6,
          width: 190,
        },
      });
    };

    const visit = (value: JsonValue, id: string, depth: number, parentId?: string) => {
      if (count > MAX_NODES) return;
      count += 1;
      addNode(id, `${id.split(".").at(-1) || "$"}: ${shortValue(value)}`, depth, count);
      if (parentId) {
        nextEdges.push({ id: `${parentId}-${id}`, source: parentId, target: id });
      }
      if (Array.isArray(value)) {
        value.forEach((item, idx) => visit(item, `${id}[${idx}]`, depth + 1, id));
      } else if (value && typeof value === "object") {
        Object.entries(value).forEach(([key, nested]) => {
          visit(nested, `${id}.${key}`, depth + 1, id);
        });
      }
    };

    visit(data, "$", 0);
    return { nodes: nextNodes, edges: nextEdges };
  }, [data, isDark]);

  return (
    <div className={`h-full rounded-xl border overflow-hidden ${className ?? ""}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        defaultEdgeOptions={{ style: { stroke: isDark ? "#4b5563" : "#9ca3af" } }}
      >
        <Background color={isDark ? "#27272a" : "#e4e4e7"} gap={24} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
