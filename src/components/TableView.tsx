"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarsArrowDownIcon,
  BarsArrowUpIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  ViewColumnsIcon,
} from "@heroicons/react/16/solid";
import type { JsonValue } from "@/lib/json/core";
import {
  Button,
  IconButton,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  TextField,
  Tooltip,
  TruncatedText,
} from "@/components/kit";
import { WrapText } from "lucide-react";
import { HUGE_INPUT_BYTES } from "@/lib/io/size";
import { ReadOnlyTextViewer } from "@/components/editor/ReadOnlyTextViewer";
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
  /** Content font size (px) - kept in sync with the editor font size. */
  fontSize?: number;
  /** Parent-known size of the source string. When set, the huge-mode gate
   *  uses this directly instead of stringifying samples (which OOMs). */
  byteSize?: number;
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

const CELL_PREVIEW_LIMIT = 240;
/** Truncate a cell preview for the single-line (no-wrap) mode. The full
 *  value is still exposed via the tooltip and the native title attribute. */
function truncateCell(s: string): string {
  if (s.length <= CELL_PREVIEW_LIMIT) return s;
  return `${s.slice(0, CELL_PREVIEW_LIMIT)}…`;
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

export function TableView({ data, className = "", fontSize = 13, byteSize }: TableViewProps) {
  // Prefer the parent-supplied byte size (known from the source string). Fall
  // back to a sample-and-extrapolate estimate only if no byteSize is given;
  // a sample of 100 elements of a >2 MiB array is enough to tip into huge.
  const estimatedSize = useMemo<number | null>(() => {
    if (byteSize !== undefined) return byteSize;
    if (data == null) return 2;
    try {
      if (Array.isArray(data)) {
        if (data.length === 0) return 2;
        const sample = data.length > 100 ? data.slice(0, 100) : data;
        const sampleBytes = sample.reduce<number>((acc, v) => acc + JSON.stringify(v).length, 0);
        if (sampleBytes > HUGE_INPUT_BYTES) return sampleBytes;
        return Math.ceil((sampleBytes / sample.length) * data.length) + 2;
      }
      return JSON.stringify(data).length;
    } catch {
      return null;
    }
  }, [data, byteSize]);
  const isHuge = estimatedSize !== null && estimatedSize > HUGE_INPUT_BYTES;

  const hugePreview = useMemo<string>(() => {
    if (!isHuge) return "";
    try {
      if (Array.isArray(data)) {
        const head = data.slice(0, 200);
        const headText = head.map((v) => JSON.stringify(v)).join(",\n");
        return head.length < data.length
          ? `${headText},\n… (${data.length - head.length} more items, view in editor)`
          : headText;
      }
      return JSON.stringify(data, null, 2);
    } catch {
      return "(unable to preview)";
    }
  }, [data, isHuge]);

  const [stack, setStack] = useState<NavFrame[]>([{ label: "Root", data }]);

  // Reset navigation when the root data identity/content changes from parent
  useEffect(() => {
    setStack([{ label: "Root", data }]);
  }, [data]);

  const current = stack[stack.length - 1]!;
  const base = useMemo(() => (isHuge ? null : toTableRows(current.data)), [current.data, isHuge]);
  const allHeaders = useMemo(() => base?.headers ?? [], [base]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [query, setQuery] = useState("");
  // Word-wrap cell content. Off (default) keeps each cell to one line with
  // ellipsis + tooltip; on wraps long values inside the cell.
  const [wordWrap, setWordWrap] = useState(false);

  // Reset filters when drilling
  useEffect(() => {
    setHidden(new Set());
    setSortKey(null);
    setSortDir("asc");
    setQuery("");
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

  if (isHuge) {
    return (
      <div className={`flex h-full min-h-0 flex-col overflow-hidden ${className ?? ""}`} style={{ fontSize }}>
        <div className="shrink-0 border-b border-[var(--workspace-border)] px-3 py-1.5 text-[12px] text-[var(--workspace-text-muted)]">
          Huge input: table view disabled. Showing the first 200 rows.
        </div>
        <ReadOnlyTextViewer value={hugePreview} language="json" className="flex-1" />
      </div>
    );
  }

  if (!base) {
    return (
      <div
        className={`flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-6 text-center text-[13px] text-[var(--workspace-text-muted)] ${className}`}
      >
        <p>
          Table view works best with an{" "}
          <strong className="text-[var(--workspace-text)]">array of objects</strong>.
        </p>
        <p className="max-w-sm text-[12px] leading-relaxed">
          Example:{" "}
          <code className="rounded bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--workspace-text)]">
            {`[{"id":1,"name":"a"},{"id":2,"name":"b"}]`}
          </code>
          . Nested arrays and objects open as separate tables when you click them.
        </p>
        <p className="text-[12px]">
          Load a table sample from the empty input, or switch to the text view.
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
    "border border-[var(--workspace-border)] text-[var(--workspace-text)]";
  const headerClass = "bg-[var(--workspace-background)] text-[var(--workspace-text)]";

  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden ${className ?? ""}`} style={{ fontSize }}>
      {/* Breadcrumbs when nested */}
      {stack.length > 1 && (
        <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-[var(--workspace-border)] px-3 py-1">
          {stack.map((frame, i) => (
            <span key={`${frame.label}-${i}`} className="flex items-center gap-0.5">
              {i > 0 && <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-[var(--workspace-text-muted)]" />}
              {i === stack.length - 1 ? (
                <span className="max-w-[10rem] truncate px-2 text-[13px] font-semibold text-[var(--workspace-text)]">{frame.label}</span>
              ) : (
                <Button variant="ghost" className="max-w-[10rem]" onClick={() => goToDepth(i)}>
                  <span className="truncate">{frame.label}</span>
                </Button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="flex min-h-9 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-[var(--workspace-border)] px-3 py-1">
        <TextField
          aria-label="Search rows"
          icon={<MagnifyingGlassIcon />}
          placeholder="Search rows"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery("")}
          wrapperClassName="min-w-[10rem] flex-1 sm:max-w-xs"
        />
        <span className="text-[12px] tabular-nums text-[var(--workspace-text-muted)]">
          {processed.length}
          {processed.length !== base.rows.length ? ` / ${base.rows.length}` : ""} rows
          {visibleHeaders.length !== allHeaders.length ? ` · ${visibleHeaders.length}/${allHeaders.length} cols` : ""}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <IconButton
            label={wordWrap ? "Single-line cells" : "Wrap long cell text"}
            variant={wordWrap ? "selected" : "ghost"}
            aria-pressed={wordWrap}
            onClick={() => setWordWrap((v) => !v)}
          >
            <WrapText />
          </IconButton>
          <Menu>
            <MenuTrigger asChild>
              <Button variant="ghost" icon={<ViewColumnsIcon />} iconRight={<ChevronDownIcon />}>
                Columns
              </Button>
            </MenuTrigger>
            <MenuContent align="end" className="max-h-72 w-56">
              <MenuItem onSelect={() => setHidden(new Set())}>Show all</MenuItem>
              <MenuSeparator />
              {allHeaders.map((h) => (
                <MenuCheckboxItem key={h} checked={!hidden.has(h)} onCheckedChange={() => toggleCol(h)} onSelect={(e) => e.preventDefault()}>
                  <span className="font-mono">{h}</span>
                </MenuCheckboxItem>
              ))}
            </MenuContent>
          </Menu>
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {visibleHeaders.length === 0 ? (
          <div className="p-6 text-center text-[13px] text-[var(--workspace-text-muted)]">No columns visible</div>
        ) : (
          <Table className="w-full border-collapse text-[length:inherit]">
            <TableHeader>
              <TableRow className={cn(headerClass, "sticky top-0 z-10 hover:bg-[var(--workspace-background)]")}>
                {visibleHeaders.map((h) => (
                  <TableHead key={h} className={`${cellClass} whitespace-nowrap p-0`}>
                    <Button
                      variant="ghost"
                      aria-label={`Sort by ${h}`}
                      className="w-full justify-between rounded-none"
                      iconRight={sortKey === h ? (sortDir === "asc" ? <BarsArrowUpIcon /> : <BarsArrowDownIcon />) : <ChevronDownIcon />}
                      onClick={() => toggleSort(h)}
                    >
                      <TruncatedText className="min-w-0 flex-1 text-left font-mono">{h}</TruncatedText>
                    </Button>
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
                  <TableRow
                    key={i}
                    className={`${cellClass} ${
                      i % 2 === 1 ? "bg-[var(--workspace-background)]" : "bg-transparent"
                    }`}
                  >
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
                            <Tooltip content={`Open as table: ${nestedMeta(val)}`}>
                              <Button variant="secondary" icon={<TableCellsIcon />} className="max-w-full" onClick={() => drillInto(label, val)}>
                                <span className="min-w-0 truncate font-mono">{display.length > 48 ? `${display.slice(0, 48)}…` : display}</span>
                                <span className="shrink-0 text-[12px] font-normal text-[var(--workspace-text-muted)]">{nestedMeta(val)}</span>
                              </Button>
                            </Tooltip>
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={h} className={`${cellClass} max-w-[240px] px-2 py-1 font-mono align-top`}>
                          {wordWrap ? (
                            <span className="block max-w-full whitespace-pre-wrap break-words">{display}</span>
                          ) : (
                            <Tooltip content={display} disabled={display.length <= 80}>
                              <span className="block max-w-full truncate">{truncateCell(display)}</span>
                            </Tooltip>
                          )}
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
