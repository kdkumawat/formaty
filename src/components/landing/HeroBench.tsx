"use client";

import { useMemo, useState } from "react";
import { Bars3BottomLeftIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { Highlighted } from "@/components/Highlighted";
import { CopyButton, IconButton, KitTooltipProvider } from "@/components/kit";
import type { OutputId } from "@/components/workspace/constants";
import { detectFormat, getInputFormatLabel, stringifyOutput, type FormatKind } from "@/lib/formats";
import { langForOutput } from "@/lib/highlight";
import { cn } from "@/lib/utils";
import { CodeInput } from "./demo/CodeInput";
import { SELECTED, TAG_GLYPH, type TagId } from "./FormatTag";
import { DEFAULTS, run } from "./live/runTransform";

/** The brief's record, pretty-printed one key per line. */
const START = JSON.stringify(
  [
    { id: 4821, email: "alice@example.com", plan: "pro", active: true, seats: 12 },
    { id: 4822, email: "bo@example.com", plan: "team", active: false, seats: 3 },
  ],
  null,
  2,
);

/** Output chips: label and the engine's output id. */
const TAGS: { label: string; id: OutputId }[] = [
  { label: "SQL", id: "type:sql" },
  { label: "TypeScript", id: "type:typescript" },
  { label: "YAML", id: "fmt:yaml" },
  { label: "CSV", id: "fmt:csv" },
  { label: "Go", id: "type:go" },
];
const OPTS = { ...DEFAULTS, table: "users", typeName: "User" };
const EXT: Record<TagId, string> = { json: "json", xml: "xml", yaml: "yaml", toml: "toml", csv: "csv", curl: "sh" };

const HEAD = "flex h-9 shrink-0 items-center gap-2 border-b border-[var(--workspace-border)] px-3 max-[900px]:h-11";
const PANE = "flex min-w-0 flex-col";
const CODE_H = "h-[330px] max-[900px]:h-[240px]";

/** The hero bench: a compact playground window, running the playground's own conversion functions. */
export function HeroBench() {
  const [text, setText] = useState(START);
  const [sel, setSel] = useState<OutputId>("type:sql");

  const kind = detectFormat(text);
  const res = useMemo(() => run(text, kind, sel, OPTS), [text, kind, sel]);
  // An edit that breaks the input keeps the last good result on screen, with the reason in the status bar.
  const [good, setGood] = useState(res.ok ? res : null);
  if (res.ok && res !== good) setGood(res);
  const shown = res.ok ? res : good;
  const output = shown?.output ?? "";

  const rows = res.ok && Array.isArray(res.data) ? res.data : null;
  const first = rows?.[0];
  const fields = first && typeof first === "object" && !Array.isArray(first) ? Object.keys(first).length : 0;

  return (
    <KitTooltipProvider>
      <div className="mk-plate overflow-hidden rounded-[14px]">
        <div className="flex h-9 items-end border-b border-[var(--workspace-border)] bg-[var(--sunk)] px-2 pt-1">
          <span className={cn("inline-flex h-8 items-center gap-2 rounded-t-md border border-b-0 px-3 font-mono text-[12px]", SELECTED)}>
            <span aria-hidden className="opacity-70">{TAG_GLYPH[kind as TagId]}</span>
            users.{EXT[kind as TagId]}
          </span>
        </div>
        <div className="grid min-[901px]:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
          <section aria-label="Input" className={PANE}>
            <div className={HEAD}>
              <span className="text-[12px] text-[var(--workspace-text-muted)]">Input · auto-detected</span>
              <span className="flex-1" />
              <IconButton
                label="Format input"
                disabled={!res.ok || kind === "curl"}
                onClick={() => res.ok && setText(stringifyOutput(res.data, kind as FormatKind))}
              >
                <Bars3BottomLeftIcon />
              </IconButton>
              <IconButton label="Clear input" disabled={!text} onClick={() => setText("")}>
                <XMarkIcon />
              </IconButton>
            </div>
            <CodeInput
              label="Input"
              value={text}
              onChange={setText}
              lang={kind === "curl" ? "bash" : kind}
              placeholder="Paste JSON, XML, YAML, TOML or CSV"
              className={cn(CODE_H, "flex-none bg-[var(--sunk)]")}
            />
          </section>

          <section aria-label="Output" className={cn(PANE, "border-[var(--workspace-border)] min-[901px]:border-l max-[900px]:border-t")}>
            <div className={HEAD}>
              <div role="group" aria-label="Output format" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                {TAGS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={t.id === sel}
                    onClick={() => setSel(t.id)}
                    className={cn(
                      "inline-flex h-6 shrink-0 items-center justify-center rounded-[4px] border px-2 font-mono text-[12px] outline-none transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-[var(--focus)] pointer-coarse:h-9",
                      t.id === sel
                        ? SELECTED
                        : "border-transparent text-[var(--workspace-text-muted)] hover:bg-control hover:text-[var(--workspace-text)]",
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <CopyButton getText={() => output} disabled={!output} variant="secondary" />
            </div>
            <pre
              role="group"
              tabIndex={0}
              aria-label="Output"
              className={cn(CODE_H, "m-0 overflow-auto bg-[var(--sunk)] px-3 py-2 font-mono text-[13px] leading-[1.6] whitespace-pre-wrap [overflow-wrap:anywhere] text-[var(--workspace-text)]")}
            >
              <Highlighted code={output} lang={langForOutput(sel)} />
            </pre>
          </section>
        </div>

        <div className="flex min-h-6 flex-wrap items-center gap-x-4 border-t border-[var(--workspace-border)] px-3 py-0.5 text-[12px] text-[var(--workspace-text-muted)]">
          {res.ok ? (
            <span>
              Valid {getInputFormatLabel(kind)}
              {rows ? ` · ${rows.length} ${rows.length === 1 ? "record" : "records"}` : ""}
              {fields ? ` · ${fields} fields` : ""}
            </span>
          ) : (
            <span role="status" className="min-w-0 truncate text-bad">{res.error}</span>
          )}
          <span className="ml-auto inline-flex items-center gap-2">
            <span aria-hidden className="size-1.5 rounded-full bg-[var(--ok)]" />
            Runs in this tab
          </span>
        </div>
      </div>
    </KitTooltipProvider>
  );
}
