"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Highlighted } from "@/components/Highlighted";
import { Button } from "@/components/kit";
import type { HighlightLang } from "@/lib/highlight";
import { cn } from "@/lib/utils";
import { CODE, LINK_SM, PLATE } from "./ui";

export interface Cell {
  /** "JSON to YAML", "JSON formatter". */
  label: string;
  href: string;
  /** Text of the link under the example. */
  open: string;
  input: string;
  output: string;
}

const BAND = "transition-colors duration-[120ms]";
/** The 36px header row the grid and both panes share, so the three line up across the plate. */
const HEAD = "flex h-9 shrink-0 items-center gap-1.5 border-b border-[var(--workspace-border)] px-3 text-[13px] leading-none text-[var(--workspace-text-muted)]";

function Pane({ verb, name, code, lang, className, height }: { verb: string; name: string; code: string; lang: HighlightLang; className?: string; height: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col", className)}>
      <p className={HEAD}>
        {verb}
        <span className="font-semibold text-[var(--workspace-text)]">{name}</span>
      </p>
      <pre role="group" tabIndex={0} aria-label={`${verb} ${name}`} className={`${CODE} ${height} focus-visible:-outline-offset-2`}>
        <Highlighted code={code} lang={lang} />
      </pre>
    </div>
  );
}

/**
 * Rows are what you paste, columns what you copy. Pointing at a cell, or moving focus to it, selects that pair:
 * its row and column light up and the example beside the grid shows the record crossing over. Every cell is a
 * plain link, so the grid works without JavaScript and each pair can be opened in a new tab.
 */
export function ConvertMatrix({ formats, cells }: { formats: { id: HighlightLang; name: string }[]; cells: Cell[][] }) {
  const [[a, b], setPair] = useState<[number, number]>([0, 2]);
  const cell = cells[a][b];
  const last = formats.length - 1;
  // Whether the cell under the last touch was already the selected one. Read at pointerdown, because the tap
  // also focuses the link, which selects it before the click arrives.
  const wasOn = useRef(true);

  return (
    <div className={`${PLATE} grid lg:grid-cols-12`}>
      <div className="flex min-w-0 flex-col lg:col-span-5">
        <p className={HEAD}>Paste the row, copy the column</p>
        <table className="m-1 w-[calc(100%-0.5rem)] flex-1 table-fixed border-separate border-spacing-0">
          <caption className="sr-only">Every conversion. Rows are the format you paste, columns the format you copy.</caption>
          <colgroup>
            <col className="w-[3.5rem] sm:w-[4.5rem]" />
          </colgroup>
          {/* The column names are on the cells themselves; this row only names the columns for a screen reader. */}
          <thead>
            <tr>
              <th scope="col" className="h-0 p-0">
                <span className="sr-only">Paste</span>
              </th>
              {formats.map((f) => (
                <th key={f.id} scope="col" className="h-0 p-0">
                  <span className="sr-only">Copy as {f.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {formats.map((from, i) => (
              <tr key={from.id}>
                <th
                  scope="row"
                  className={cn(
                    BAND,
                    "rounded-l-lg pl-2 text-left font-sans text-[13px] font-semibold leading-none tracking-normal",
                    i === a ? "bg-control text-[var(--workspace-text)]" : "text-[var(--workspace-text-muted)]",
                  )}
                >
                  {from.name}
                </th>
                {formats.map((to, j) => {
                  const on = i === a && j === b;
                  return (
                    <td
                      key={to.id}
                      className={cn(
                        BAND,
                        "p-1",
                        (i === a || j === b) && "bg-control",
                        i === a && j === last && "rounded-r-lg",
                        j === b && i !== a && i === 0 && "rounded-t-lg",
                        j === b && i !== a && i === last && "rounded-b-lg",
                      )}
                    >
                      <Button asChild size="md" variant={on ? "selected" : "ghost"} className="w-full px-0 pointer-coarse:h-11">
                        <Link
                          href={cells[i][j].href}
                          aria-label={cells[i][j].label}
                          aria-current={on ? "true" : undefined}
                          onPointerEnter={(e) => e.pointerType === "mouse" && setPair([i, j])}
                          onFocus={() => setPair([i, j])}
                          onPointerDown={() => (wasOn.current = on)}
                          onClick={(e) => {
                            // Touch has no hover: the first tap shows the pair, the second opens it.
                            if (!wasOn.current && window.matchMedia("(hover: none)").matches) e.preventDefault();
                            wasOn.current = true;
                            setPair([i, j]);
                          }}
                        >
                          {i === j ? "Format" : to.name}
                        </Link>
                      </Button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex min-w-0 flex-col border-t border-[var(--workspace-border)] lg:col-span-7 lg:border-l lg:border-t-0">
        <div className="grid min-w-0 flex-1 sm:grid-cols-2">
          <Pane verb="Paste" name={formats[a].name} code={cell.input} lang={formats[a].id} height="h-[162px] sm:h-[204px]" className="border-[var(--workspace-border)] max-sm:border-b sm:border-r" />
          <Pane verb="Copy" name={formats[b].name} code={cell.output} lang={formats[b].id} height="h-[204px]" />
        </div>
        <div className="flex min-h-11 shrink-0 items-center border-t border-[var(--workspace-border)] px-3">
          <Link href={cell.href} className={LINK_SM}>
            {cell.open}
          </Link>
        </div>
      </div>
    </div>
  );
}
