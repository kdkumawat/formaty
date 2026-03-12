"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import "jsoncrack-react/style.css";
import type { JsonValue } from "@/lib/json/core";

const JSONCrack = dynamic(
  () => import("jsoncrack-react").then((module) => module.JSONCrack),
  { ssr: false },
);

interface GraphViewProps {
  data: JsonValue;
  className?: string;
  isDark?: boolean;
}

export function GraphView({ data, className, isDark = false }: GraphViewProps) {
  const normalizedData = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") return data;
    return { value: data };
  }, [data]);

  return (
    <div className={`relative h-full overflow-hidden rounded-xl border ${className ?? ""}`}>
      <JSONCrack
        json={normalizedData}
        theme={isDark ? "dark" : "light"}
        layoutDirection="LEFT"
        showControls
        showGrid
        centerOnLayout
        maxRenderableNodes={1200}
      />
    </div>
  );
}
