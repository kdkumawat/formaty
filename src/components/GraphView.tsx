"use client";

import { useMemo } from "react";
import ReactFlow, { Background, Controls, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import type { JsonValue } from "@/lib/json/core";

interface GraphViewProps {
  data: JsonValue;
}

const MAX_NODES = 250;

function shortValue(value: JsonValue): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === "object") return "Object";
  return String(value).slice(0, 32);
}

export function GraphView({ data }: GraphViewProps) {
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
          background: "#111827",
          color: "#e5e7eb",
          border: "1px solid #374151",
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
  }, [data]);

  return (
    <div className="h-[52vh] rounded-xl border border-zinc-800 overflow-hidden">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
