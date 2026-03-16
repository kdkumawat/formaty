"use client";

import React from "react";
import type { JsonValue } from "@/lib/json/core";

interface TableViewProps {
  data: JsonValue;
  className?: string;
  isDark?: boolean;
}

function isTableData(data: JsonValue): data is Record<string, JsonValue>[] {
  if (!Array.isArray(data) || data.length === 0) return false;
  return data.every((item) => item !== null && typeof item === "object" && !Array.isArray(item));
}

export function TableView({ data, className = "", isDark = false }: TableViewProps) {
  if (!isTableData(data)) {
    return (
      <div className={`flex h-full min-h-[200px] items-center justify-center text-sm text-base-content/70 ${className}`}>
        Table view requires an array of objects.
      </div>
    );
  }

  const headers = Array.from(
    new Set(data.flatMap((item) => Object.keys(item as Record<string, JsonValue>)))
  );

  const cellClass = isDark
    ? "border-[#3c3c3c] bg-[#252526]"
    : "border-base-300 bg-base-100";
  const headerClass = isDark ? "bg-[#2d2d30] text-base-content" : "bg-base-200 text-base-content";

  return (
    <div className={`overflow-auto h-full ${className}`}>
      <table className="table table-xs table-pin-rows w-full">
        <thead>
          <tr className={headerClass}>
            {headers.map((h) => (
              <th key={h} className={`${cellClass} font-medium whitespace-nowrap`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={cellClass}>
              {headers.map((h) => {
                const val = (row as Record<string, JsonValue>)[h];
                const display =
                  val === null || val === undefined
                    ? ""
                    : typeof val === "object"
                      ? JSON.stringify(val)
                      : String(val);
                return (
                  <td key={h} className={`${cellClass} max-w-[200px] truncate`} title={display}>
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
