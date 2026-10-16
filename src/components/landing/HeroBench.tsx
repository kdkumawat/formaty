"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowsRightLeftIcon, Bars3BottomLeftIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { Highlighted } from "@/components/Highlighted";
import { CopyButton, IconButton, KitTooltipProvider } from "@/components/kit";
import type { OutputId } from "@/components/workspace/constants";
import { generateCurlCode, CURL_TARGETS, type CurlTargetId } from "@/lib/curl/codegen";
import { parseCurl } from "@/lib/curl/parseCurl";
import { detectFormat, getInputFormatLabel, stringifyOutput, type FormatKind } from "@/lib/formats";
import { langForOutput, type HighlightLang } from "@/lib/highlight";
import { DEFAULT_LIST_PARSE_OPTIONS, compareLists, formatListItems, getBucketItems, type ListBucket, type ListExportFormat } from "@/lib/json/listCompare";
import { cn } from "@/lib/utils";
import { CodeInput } from "./demo/CodeInput";
import { SELECTED } from "./FormatTag";
import { DEFAULTS, run } from "./live/runTransform";

const HEAD = "flex h-9 shrink-0 items-center gap-2 border-b border-[var(--workspace-border)] px-3 max-[900px]:h-11";
const PANE = "flex min-w-0 flex-col";
const CODE_H = "h-[330px] max-[900px]:h-[240px]";
const OUT = cn(CODE_H, "m-0 overflow-auto bg-[var(--sunk)] px-3 py-2 font-mono text-[13px] leading-[1.6] whitespace-pre-wrap [overflow-wrap:anywhere] text-[var(--workspace-text)]");
const muted = "text-[12px] text-[var(--workspace-text-muted)]";

/** The three things Formaty does that a plain formatter does not. One is picked at random per visit. */
const SCENES = [
  { id: "types", file: "users.json", glyph: "{}" },
  { id: "lists", file: "customers.txt", glyph: <ArrowsRightLeftIcon className="size-3.5" /> },
  { id: "curl", file: "request.sh", glyph: "$_" },
] as const;
type SceneId = (typeof SCENES)[number]["id"];

/** Small mono choice chip used for outputs, buckets and targets. */
function Pick({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-6 shrink-0 items-center justify-center gap-1.5 rounded-[4px] border px-2 font-mono text-[12px] outline-none transition-colors duration-[120ms] focus-visible:ring-2 focus-visible:ring-[var(--focus)] pointer-coarse:h-9",
        on ? SELECTED : "border-transparent text-[var(--workspace-text-muted)] hover:bg-control hover:text-[var(--workspace-text)]",
      )}
    >
      {children}
    </button>
  );
}

function Status({ left }: { left: ReactNode }) {
  return (
    <div className="flex min-h-6 flex-wrap items-center gap-x-4 border-t border-[var(--workspace-border)] px-3 py-0.5 text-[12px] text-[var(--workspace-text-muted)]">
      {left}
      <span className="ml-auto inline-flex items-center gap-2">
        <span aria-hidden className="size-1.5 rounded-full bg-[var(--ok)]" />
        Runs in this tab
      </span>
    </div>
  );
}

/* ── Scene 1: data to types and SQL ── */

const USERS = JSON.stringify(
  [
    { id: 4821, email: "alice@example.com", plan: "pro", active: true, seats: 12 },
    { id: 4822, email: "bo@example.com", plan: "team", active: false, seats: 3 },
  ],
  null,
  2,
);
const TAGS: { label: string; id: OutputId }[] = [
  { label: "TypeScript", id: "type:typescript" },
  { label: "SQL", id: "type:sql" },
  { label: "Go", id: "type:go" },
  { label: "YAML", id: "fmt:yaml" },
  { label: "CSV", id: "fmt:csv" },
];
const OPTS = { ...DEFAULTS, table: "users", typeName: "User" };

function TypesScene() {
  const [text, setText] = useState(USERS);
  const [sel, setSel] = useState<OutputId>("type:typescript");
  const kind = detectFormat(text);
  const res = useMemo(() => run(text, kind, sel, OPTS), [text, kind, sel]);
  // A broken edit keeps the last good result on screen, with the reason in the status bar.
  const [good, setGood] = useState(res.ok ? res : null);
  if (res.ok && res !== good) setGood(res);
  const output = (res.ok ? res : good)?.output ?? "";
  const rows = res.ok && Array.isArray(res.data) ? res.data : null;
  const first = rows?.[0];
  const fields = first && typeof first === "object" && !Array.isArray(first) ? Object.keys(first).length : 0;

  return (
    <>
      <div className="grid min-[901px]:grid-cols-[minmax(0,42fr)_minmax(0,58fr)]">
        <section aria-label="Input" className={PANE}>
          <div className={HEAD}>
            <span className={muted}>Input · auto-detected</span>
            <span className="flex-1" />
            <IconButton label="Format input" disabled={!res.ok || kind === "curl"} onClick={() => res.ok && setText(stringifyOutput(res.data, kind as FormatKind))}>
              <Bars3BottomLeftIcon />
            </IconButton>
            <IconButton label="Clear input" disabled={!text} onClick={() => setText("")}>
              <XMarkIcon />
            </IconButton>
          </div>
          <CodeInput label="Input" value={text} onChange={setText} lang={kind === "curl" ? "bash" : kind} placeholder="Paste JSON, XML, YAML, TOML or CSV" className={cn(CODE_H, "flex-none bg-[var(--sunk)]")} />
        </section>
        <section aria-label="Output" className={cn(PANE, "border-[var(--workspace-border)] min-[901px]:border-l max-[900px]:border-t")}>
          <div className={HEAD}>
            <div role="group" aria-label="Output format" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {TAGS.map((t) => (
                <Pick key={t.id} on={t.id === sel} onClick={() => setSel(t.id)}>
                  {t.label}
                </Pick>
              ))}
            </div>
            <CopyButton getText={() => output} disabled={!output} variant="secondary" />
          </div>
          <pre role="group" tabIndex={0} aria-label="Output" className={OUT}>
            <Highlighted code={output} lang={langForOutput(sel)} />
          </pre>
        </section>
      </div>
      <Status
        left={
          res.ok ? (
            <span>
              Valid {getInputFormatLabel(kind)}
              {rows ? ` · ${rows.length} ${rows.length === 1 ? "record" : "records"}` : ""}
              {fields ? ` · ${fields} fields` : ""}
            </span>
          ) : (
            <span role="status" className="min-w-0 truncate text-bad">{res.error}</span>
          )
        }
      />
    </>
  );
}

/* ── Scene 2: compare two lists, copy the difference as SQL ── */

const CRM = "cus_8F2kQ\ncus_3Lm9X\ncus_Q7wPz\ncus_Za41T\ncus_0vRn8\ncus_Kd5sY\ncus_Hh2Ue";
const BILLING = "CUS_3LM9X\ncus_q7wpz\ncus_Za41T\ncus_Mp6Ew\ncus_Kd5sY";
const BUCKETS: Array<{ id: ListBucket; label: string }> = [
  { id: "leftOnly", label: "CRM only" },
  { id: "common", label: "Both" },
  { id: "rightOnly", label: "Billing only" },
];
const SHAPES: Array<{ id: ListExportFormat; label: string; lang: HighlightLang }> = [
  { id: "sql-in-single", label: "SQL IN", lang: "sql" },
  { id: "json-array", label: "JSON", lang: "json" },
  { id: "newline", label: "Lines", lang: "text" },
];
const LIST_OPTS = { ...DEFAULT_LIST_PARSE_OPTIONS, caseInsensitive: true };

function ListArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      aria-label={label}
      value={value}
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-0 flex-1 resize-none bg-[var(--sunk)] px-3 py-2 font-mono text-[13px] leading-[1.6] text-[var(--workspace-text)] outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--focus)]"
    />
  );
}

function ListsScene() {
  const [a, setA] = useState(CRM);
  const [b, setB] = useState(BILLING);
  const [bucket, setBucket] = useState<ListBucket>("leftOnly");
  const [shape, setShape] = useState<ListExportFormat>("sql-in-single");
  // Match ignoring case, so CUS_3LM9X in billing is the same customer as cus_3Lm9X in the CRM.
  const result = useMemo(() => compareLists(a, b, LIST_OPTS), [a, b]);
  const items = getBucketItems(result, bucket);
  const output = formatListItems(items, shape);
  const lang = SHAPES.find((s) => s.id === shape)?.lang ?? "text";
  const head = (name: string, n: number, dot: string) => (
    <div className={cn(HEAD, "h-8")}>
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      <span className="text-[12px] font-medium">{name}</span>
      <span className={cn(muted, "tabular-nums")}>{n} ids</span>
    </div>
  );

  return (
    <>
      <div className="grid min-[901px]:grid-cols-[minmax(0,38fr)_minmax(0,62fr)]">
        <section aria-label="Lists" className={cn(PANE, "h-[300px] min-[901px]:h-[366px]")}>
          {head("CRM export", result.left.rawCount, "bg-side-a")}
          <ListArea label="CRM export" value={a} onChange={setA} />
          <div className="border-t border-[var(--workspace-border)]">{head("Billing export", result.right.rawCount, "bg-side-b")}</div>
          <ListArea label="Billing export" value={b} onChange={setB} />
        </section>
        <section aria-label="Result" className={cn(PANE, "border-[var(--workspace-border)] min-[901px]:border-l max-[900px]:border-t")}>
          <div className={HEAD}>
            <div role="group" aria-label="Which items" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {BUCKETS.map((x) => (
                <Pick key={x.id} on={x.id === bucket} onClick={() => setBucket(x.id)}>
                  {x.label}
                  <span className="tabular-nums opacity-70">{getBucketItems(result, x.id).length}</span>
                </Pick>
              ))}
            </div>
            <CopyButton getText={() => output} disabled={!output} variant="secondary" />
          </div>
          <div className="flex h-8 shrink-0 items-center gap-1 border-b border-[var(--workspace-border)] px-3">
            <span className={cn(muted, "mr-1")}>Copy as</span>
            {SHAPES.map((s) => (
              <Pick key={s.id} on={s.id === shape} onClick={() => setShape(s.id)}>
                {s.label}
              </Pick>
            ))}
          </div>
          <pre role="group" tabIndex={0} aria-label="Result" className={cn(OUT, "h-[298px] max-[900px]:h-[200px]")}>
            {output ? <Highlighted code={output} lang={lang} /> : <span className="text-[var(--workspace-text-muted)]">Nothing in this group.</span>}
          </pre>
        </section>
      </div>
      <Status left={<span>Case-insensitive match · {result.stats.common} shared, {result.stats.leftOnly + result.stats.rightOnly} differ</span>} />
    </>
  );
}

/* ── Scene 3: a cURL command to client code ── */

const CURL = `curl https://api.acme.dev/orders \\
  -H "Authorization: Bearer sk_42" \\
  -H "Content-Type: application/json" \\
  -d '{"customer":"cus_8F2kQ","qty":3}'`;

function CurlScene() {
  const [text, setText] = useState(CURL);
  const [target, setTarget] = useState<CurlTargetId>("fetch");
  const res = useMemo(() => {
    try {
      const parsed = parseCurl(text);
      return { ok: true as const, parsed, code: generateCurlCode(parsed, target) };
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : "Not a cURL command." };
    }
  }, [text, target]);
  const [good, setGood] = useState(res.ok ? res : null);
  if (res.ok && res !== good) setGood(res);
  const shown = res.ok ? res : good;
  const code = shown?.code ?? "";

  return (
    <>
      <div className="grid min-[901px]:grid-cols-[minmax(0,47fr)_minmax(0,53fr)]">
        <section aria-label="cURL command" className={PANE}>
          <div className={HEAD}>
            <span className={muted}>cURL, as copied from DevTools</span>
            <span className="flex-1" />
            <IconButton label="Clear input" disabled={!text} onClick={() => setText("")}>
              <XMarkIcon />
            </IconButton>
          </div>
          <CodeInput label="cURL command" value={text} onChange={setText} lang="bash" wrap placeholder="Paste a curl command" className={cn(CODE_H, "flex-none bg-[var(--sunk)]")} />
        </section>
        <section aria-label="Code" className={cn(PANE, "border-[var(--workspace-border)] min-[901px]:border-l max-[900px]:border-t")}>
          <div className={HEAD}>
            <div role="group" aria-label="Language" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {CURL_TARGETS.map((t) => (
                <Pick key={t.id} on={t.id === target} onClick={() => setTarget(t.id)}>
                  {t.short}
                </Pick>
              ))}
            </div>
            <CopyButton getText={() => code} disabled={!code} variant="secondary" />
          </div>
          <pre role="group" tabIndex={0} aria-label="Code" className={OUT}>
            <Highlighted code={code} lang="code" />
          </pre>
        </section>
      </div>
      <Status
        left={
          res.ok ? (
            <span className="min-w-0 truncate">
              {res.parsed.method} {res.parsed.url.replace(/^https?:\/\//, "")} · {Object.keys(res.parsed.headers).length} headers{res.parsed.body ? " · JSON body" : ""}
            </span>
          ) : (
            <span role="status" className="min-w-0 truncate text-bad">{res.error}</span>
          )
        }
      />
    </>
  );
}

/** The hero bench: a compact playground window running the playground's own functions, on one of three scenes. */
export function HeroBench() {
  const [scene, setScene] = useState<SceneId>("types");
  // Picked after hydration so the static HTML stays stable; every scene has the same height, so nothing shifts.
  useEffect(() => setScene(SCENES[Math.floor(Math.random() * SCENES.length)].id), []);

  return (
    <KitTooltipProvider>
      <div className="mk-plate overflow-hidden rounded-[14px]">
        <div role="tablist" aria-label="Examples" className="flex h-9 items-end gap-0.5 overflow-x-auto border-b border-[var(--workspace-border)] bg-[var(--sunk)] px-2 pt-1 [scrollbar-width:none]">
          {SCENES.map((s) => {
            const on = s.id === scene;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setScene(s.id)}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-2 rounded-t-md border border-b-0 px-3 font-mono text-[12px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--focus)]",
                  on ? SELECTED : "border-transparent text-[var(--workspace-text-muted)] hover:text-[var(--workspace-text)]",
                )}
              >
                <span aria-hidden className="inline-flex opacity-70">{s.glyph}</span>
                {s.file}
              </button>
            );
          })}
        </div>
        <div role="tabpanel">{scene === "types" ? <TypesScene /> : scene === "lists" ? <ListsScene /> : <CurlScene />}</div>
      </div>
    </KitTooltipProvider>
  );
}
