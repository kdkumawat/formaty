"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarsArrowDownIcon,
  BarsArrowUpIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";
import type { JsonValue } from "@/lib/json/core";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/workspace/Tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TableViewProps {
  data: JsonValue;
  className?: string;
  isDark?: boolean;
}

type Row = Record<string, JsonValue>;

type NavFrame = {
  label: string;
  data: JsonValue;
};

function isNested(val: JsonValue | undefined): val is JsonValue {
  return val !== null && val !== undefined && typeof val === "object";
}

function nestedMeta(val: JsonValue): string {
  if (Array.isArray(val)) return `array · ${val.length}`;
  if (val && typeof val === "object") {
    return `object · ${Object.keys(val as object).length}`;
  }
  return "object";
}

function cellDisplay(val: JsonValue | undefined): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}

/** Normalize any JsonValue into tabular rows when possible. */
export function toTableRows(data: JsonValue): { rows: Row[]; headers: string[] } | null {
  if (data === null || data === undefined) return null;

  // Array of objects
  if (Array.isArray(data)) {
    if (data.length === 0) return { rows: [], headers: [] };
    const allObjects = data.every((item) => item !== null && typeof item === "object" && !Array.isArray(item));
    if (allObjects) {
      const rows = data as Row[];
      const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
      return { rows, headers };
    }
    // Array of primitives / mixed → single "value" column
    const rows = data.map((v, i) => ({ index: i, value: v as JsonValue }));
    return { rows, headers: ["index", "value"] };
  }

  // Single object → one row (nested cell values can still open as tables)
  if (typeof data === "object" && !Array.isArray(data)) {
    const row = data as Row;
    return { rows: [row], headers: Object.keys(row) };
  }

  return null;
}

export function TableView({ data, className = "" }: TableViewProps) {
  const [stack, setStack] = useState<NavFrame[]>([{ label: "Root", data }]);

  // Reset navigation when the root data identity/content changes from parent
  useEffect(() => {
    setStack([{ label: "Root", data }]);
  }, [data]);

  const current = stack[stack.length - 1]!;
  const base = useMemo(() => toTableRows(current.data), [current.data]);
  const allHeaders = useMemo(() => base?.headers ?? [], [base]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [query, setQuery] = useState("");
  const [colsOpen, setColsOpen] = useState(false);

  // Reset filters when drilling
  useEffect(() => {
    setHidden(new Set());
    setSortKey(null);
    setSortDir("asc");
    setQuery("");
    setColsOpen(false);
  }, [stack.length, current.data]);

  const visibleHeaders = useMemo(
    () => allHeaders.filter((h) => !hidden.has(h)),
    [allHeaders, hidden],
  );

  const processed = useMemo(() => {
    if (!base) return [];
    let rows = [...base.rows];
    const q = query.trim().toLowerCase();
    if (q) {
      rows = rows.filter((row) =>
        visibleHeaders.some((h) => cellDisplay(row[h]).toLowerCase().includes(q)),
      );
    }
    if (sortKey && visibleHeaders.includes(sortKey)) {
      rows.sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        const as = cellDisplay(av);
        const bs = cellDisplay(bv);
        const an = Number(as);
        const bn = Number(bs);
        let cmp: number;
        if (Number.isFinite(an) && Number.isFinite(bn) && as.trim() !== "" && bs.trim() !== "") {
          cmp = an - bn;
        } else {
          cmp = as.localeCompare(bs, undefined, { numeric: true, sensitivity: "base" });
        }
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [base, query, sortKey, sortDir, visibleHeaders]);

  const drillInto = (label: string, value: JsonValue) => {
    setStack((prev) => [...prev, { label, data: value }]);
  };

  const goToDepth = (depth: number) => {
    setStack((prev) => prev.slice(0, depth + 1));
  };

  if (!base) {
    return (
      <div
        className={`flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-6 text-center text-sm text-[var(--workspace-text-muted)] ${className}`}
      >
        <p>
          Table view works best with an{" "}
          <strong className="text-[var(--workspace-text)]">array of objects</strong>.
        </p>
        <p className="max-w-sm text-[11px] leading-relaxed">
          Example:{" "}
          <code className="rounded bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--workspace-text)]">
            {`[{"id":1,"name":"a"},{"id":2,"name":"b"}]`}
          </code>
          . Nested arrays and objects open as separate tables when you click them.
        </p>
        <p className="text-[11px]">
          Load the <strong className="text-[var(--workspace-text)]">Table</strong> sample from the
          empty workspace, or switch to Raw / Query.
        </p>
      </div>
    );
  }

  const toggleSort = (h: string) => {
    if (sortKey === h) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(h);
      setSortDir("asc");
    }
  };

  const toggleCol = (h: string) => {
    setHidden((prev) => {
      const n = new Set(prev);
      if (n.has(h)) n.delete(h);
      else {
        if (allHeaders.length - n.size <= 1) return prev;
        n.add(h);
      }
      return n;
    });
  };

  const cellClass =
    "border border-[var(--workspace-border)] bg-[var(--workspace-panel)] text-[var(--workspace-text)]";
  const headerClass = "bg-[var(--workspace-background)] text-[var(--workspace-text)]";

  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden ${className ?? ""}`}>
      {/* Breadcrumbs when nested */}
      {stack.length > 1 && (
        <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-[var(--workspace-border)] px-2 py-1.5">
          {stack.map((frame, i) => (
            <span key={`${frame.label}-${i}`} className="flex items-center gap-0.5">
              {i > 0 && (
                <ChevronRightIcon className="h-3 w-3 shrink-0 text-[var(--workspace-text-muted)]" />
              )}
              <Tooltip content={frame.label}>
              <button
                type="button"
                disabled={i === stack.length - 1}
                onClick={() => goToDepth(i)}
                className={`max-w-[10rem] truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                  i === stack.length - 1
                    ? "text-primary"
                    : "text-[var(--workspace-text-muted)] hover:bg-primary/10 hover:text-primary"
                }`}
              >
                {frame.label}
              </button>
              </Tooltip>
            </span>
          ))}
        </div>
      )}

      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[var(--workspace-border)] px-2 py-1.5">
        <div className="relative flex min-w-[10rem] flex-1 items-center">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-[var(--workspace-text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rows…"
            className="h-7 w-full rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] py-1 pl-7 pr-2 text-[11px] text-[var(--workspace-text)] outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <span className="text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
          {processed.length}
          {processed.length !== base.rows.length ? ` / ${base.rows.length}` : ""} rows
          {visibleHeaders.length !== allHeaders.length
            ? ` · ${visibleHeaders.length}/${allHeaders.length} cols`
            : ""}
        </span>
        <div className="relative">
          <button
            type="button"
            className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-[var(--workspace-border)] px-2 text-[11px] font-medium text-[var(--workspace-text-muted)] hover:bg-primary/10 hover:text-primary"
            onClick={() => setColsOpen((v) => !v)}
          >
            <ViewColumnsIcon className="h-3.5 w-3.5" />
            Columns
          </button>
          {colsOpen && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default"
                aria-label="Close"
                onClick={() => setColsOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 max-h-56 w-48 overflow-y-auto rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-1.5 shadow-2xl shadow-black/30 ring-1 ring-black/5 dark:ring-white/10">
                <button
                  type="button"
                  className="mb-1 w-full rounded-md px-2 py-1 text-left text-[10px] font-medium text-primary hover:bg-primary/10"
                  onClick={() => setHidden(new Set())}
                >
                  Show all
                </button>
                {allHeaders.map((h) => (
                  <label
                    key={h}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-[var(--workspace-text)] hover:bg-primary/5"
                  >
                    <Checkbox
                      checked={!hidden.has(h)}
                      onCheckedChange={() => toggleCol(h)}
                    />
                    <span className="truncate font-mono">{h}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {visibleHeaders.length === 0 ? (
          <div className="p-6 text-center text-sm text-[var(--workspace-text-muted)]">No columns visible</div>
        ) : (
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow className={cn(headerClass, "sticky top-0 z-10 hover:bg-[var(--workspace-background)]")}>
                {visibleHeaders.map((h) => (
                  <TableHead key={h} className={`${cellClass} whitespace-nowrap p-0`}>
                    <Tooltip content="Sort">
                    <button
                      type="button"
                      className="inline-flex h-8 w-full cursor-pointer items-center gap-1 px-2 text-left font-medium hover:bg-primary/5"
                      onClick={() => toggleSort(h)}
                    >
                      <span className="truncate font-mono text-[11px] leading-none">{h}</span>
                      <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                        {sortKey === h ? (
                          sortDir === "asc" ? (
                            <BarsArrowUpIcon className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <BarsArrowDownIcon className="h-3.5 w-3.5 text-primary" />
                          )
                        ) : (
                          <span className="flex h-3.5 w-3.5 items-center justify-center text-[10px] leading-none opacity-30" aria-hidden>
                            ↕
                          </span>
                        )}
                      </span>
                    </button>
                    </Tooltip>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {processed.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleHeaders.length}
                    className={`${cellClass} px-3 py-6 text-center text-[var(--workspace-text-muted)]`}
                  >
                    No rows match search
                  </TableCell>
                </TableRow>
              ) : (
                processed.map((row, i) => (
                  <TableRow key={i} className={cellClass}>
                    {visibleHeaders.map((h) => {
                      const val = row[h];
                      const display = cellDisplay(val);
                      const nested = isNested(val);

                      if (nested) {
                        const label =
                          h === "value" && typeof row.key === "string"
                            ? String(row.key)
                            : h === "value" && typeof row.index === "number"
                              ? String(row.index)
                              : h;
                        return (
                          <TableCell key={h} className={`${cellClass} max-w-[280px] px-1.5 py-0.5`}>
                            <Tooltip content={`Open as table: ${nestedMeta(val)}`} className="block max-w-full">
                            <button
                              type="button"
                              onClick={() => drillInto(label, val)}
                              className="group inline-flex max-w-full items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-left transition-colors hover:border-primary/40 hover:bg-primary/10"
                            >
                              <TableCellsIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <span className="min-w-0 truncate font-mono text-[11px] text-[var(--workspace-text)]">
                                {display.length > 48 ? `${display.slice(0, 48)}…` : display}
                              </span>
                              <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-primary/80">
                                {nestedMeta(val)}
                              </span>
                              <ChevronRightIcon className="h-3 w-3 shrink-0 text-primary opacity-60 group-hover:opacity-100" />
                            </button>
                            </Tooltip>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={h} className={`${cellClass} max-w-[240px] px-2 py-1 font-mono text-[11px]`}>
                          <Tooltip content={display} className="block max-w-full truncate">
                            {display}
                          </Tooltip>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
