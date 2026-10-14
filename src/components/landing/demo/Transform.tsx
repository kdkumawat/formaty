"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { detectFormat, getInputFormatLabel, stringifyOutput, type FormatKind, type InputFormatKind } from "@/lib/formats";
import { downloadText } from "@/components/compare/shared";
import { Highlighted } from "@/components/Highlighted";
import { langForOutput } from "@/lib/highlight";
import type { JsonValue } from "@/lib/json/core";
import { InputHeader, InputErrorStrip, OutputHeader } from "@/components/workspace/PaneHeaders";
import {
  DEFAULT_LEARNED_CHIPS,
  EXAMPLES,
  EXT_BY_FORMAT,
  FIXED_OUTPUT_CHIPS,
  SAMPLES,
  TYPE_LANGUAGES,
  type OutputId,
} from "@/components/workspace/constants";
import type { WorkspaceState } from "@/lib/shareState";
import { playHref } from "../live/playLink";
import { DEFAULTS, run, type Opts } from "../live/runTransform";
import { CodeInput } from "./CodeInput";
import { DemoFooter } from "./Footer";

const SAMPLE = JSON.stringify(
  [
    { id: 4821, email: "alice@example.com", plan: "pro", active: true },
    { id: 4917, email: "bob@example.com", plan: "free", active: false },
    { id: 5033, email: "chen@example.com", plan: "pro", active: true },
  ],
  null,
  2,
);

type View = "raw" | "tree" | "graph" | "query" | "table";
type Row = Record<string, JsonValue>;
const isRow = (v: JsonValue): v is Row => !!v && typeof v === "object" && !Array.isArray(v);

function stateFor(sel: OutputId): Partial<WorkspaceState> {
  const [group, key] = sel.split(":");
  if (group === "op") return { activeOperation: key as WorkspaceState["activeOperation"] };
  if (group === "type") return { activeOperation: "generateTypes", typeLanguage: key as WorkspaceState["typeLanguage"], outputLanguage: key as WorkspaceState["outputLanguage"] };
  return group === "fmt" ? { activeOperation: "format", convertToFormat: key as FormatKind } : {};
}

function Table({ rows }: { rows: Row[] }) {
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).slice(0, 10);
  return (
    <div tabIndex={0} aria-label="Table view" className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c} scope="col" className="sticky top-0 h-7 whitespace-nowrap border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((r, i) => (
            <tr key={i} className="border-b border-[var(--workspace-border)]">
              {cols.map((c) => (
                <td key={c} className="h-7 whitespace-nowrap px-3 font-mono">
                  {r[c] === undefined ? "" : typeof r[c] === "object" ? JSON.stringify(r[c]) : String(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Where a Transform scene starts. The landing hero uses the defaults; a tool page sets what it is about. */
export interface TransformPreset {
  text?: string;
  override?: InputFormatKind | null;
  sel?: OutputId;
}

/** The playground's Transform tab: the real input and output headers over the real conversion functions. */
export default function Transform({ preset = {} }: { preset?: TransformPreset }) {
  const router = useRouter();
  const [text, setText] = useState(preset.text ?? SAMPLE);
  const [override, setOverride] = useState<InputFormatKind | null>(preset.override ?? null);
  const [wrap, setWrap] = useState(false);
  const [sel, setSel] = useState<OutputId>(preset.sel ?? "type:sql");
  // A starting output that has no chip of its own takes the first learned slot, as it would after being picked.
  const [learned, setLearned] = useState<OutputId[]>(() =>
    !preset.sel || FIXED_OUTPUT_CHIPS.includes(preset.sel) || DEFAULT_LEARNED_CHIPS.includes(preset.sel) || !/^(fmt|type):/.test(preset.sel)
      ? DEFAULT_LEARNED_CHIPS
      : [preset.sel, DEFAULT_LEARNED_CHIPS[0]],
  );
  const [o, setO] = useState<Opts>(DEFAULTS);
  const [view, setView] = useState<View>("raw");

  const kind = override ?? detectFormat(text);
  const res = useMemo(() => run(text, kind, sel, o), [text, kind, sel, o]);
  const [good, setGood] = useState(res.ok ? res : null);
  if (res.ok && res !== good) setGood(res);
  const shown = res.ok ? res : good;

  const rows = shown && Array.isArray(shown.data) && shown.data.length > 0 && shown.data.every(isRow) ? (shown.data as Row[]) : null;
  const isFmt = sel.startsWith("fmt:");
  const showTable = view === "table" && isFmt && rows;
  const output = shown?.output ?? "";
  const [group, key] = sel.split(":");
  const ext = group === "fmt" ? EXT_BY_FORMAT[key as FormatKind] : (TYPE_LANGUAGES.find((t) => t.id === key)?.ext ?? "json");

  const select = (id: OutputId) => {
    setSel(id);
    if (!FIXED_OUTPUT_CHIPS.includes(id) && !learned.includes(id) && (id.startsWith("fmt:") || id.startsWith("type:"))) {
      setLearned([id, learned[0]]);
    }
    if (!id.startsWith("fmt:")) setView("raw");
  };
  const load = (next: string, as: InputFormatKind | null = null) => {
    setText(next);
    setOverride(as);
  };
  const sample = (id: string) => {
    const [g, k] = id.split(":");
    if (k === "curl") return router.push(playHref({ input: 'curl -X GET "https://api.example.com/v1/users"' }));
    load(g === "ex" ? (EXAMPLES.find((e) => e.id === k)?.data ?? SAMPLE) : SAMPLES[k as FormatKind]);
  };
  // Tree, Graph and Query need the full viewers, which live in the playground.
  const pickView = (v: View) =>
    v === "raw" || v === "table" ? setView(v) : router.push(playHref({ input: text, viewMode: v }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
    <div className="flex min-h-0 flex-1 flex-col overflow-auto min-[901px]:flex-row min-[901px]:overflow-hidden">
      <section aria-label="Input" className="flex h-[240px] shrink-0 flex-col border-b border-[var(--workspace-border)] min-[901px]:h-auto min-[901px]:min-h-0 min-[901px]:w-[40%] min-[901px]:border-b-0 min-[901px]:border-r">
        <InputHeader
          formatLabel={getInputFormatLabel(kind)}
          hasInput={!!text}
          onClear={() => load("")}
          override={override}
          onOverride={setOverride}
          wrap={wrap}
          onWrap={setWrap}
          onSample={sample}
          onTidy={() => {
            if (res.ok) setText(stringifyOutput(res.data, kind as FormatKind));
          }}
          canTidy={res.ok}
          isCurl={false}
          onRunCurl={() => {}}
        />
        <CodeInput
          label="Input"
          value={text}
          onChange={setText}
          lang={kind === "curl" ? "bash" : kind}
          wrap={wrap}
          placeholder="Paste JSON, XML, YAML, TOML or CSV"
        />
        {!res.ok && <InputErrorStrip message={res.error} line={null} onGoToLine={() => {}} />}
      </section>

      <section aria-label="Output" className="flex min-h-[260px] min-w-0 flex-1 flex-col min-[901px]:min-h-0">
        <OutputHeader
          selected={sel}
          learned={learned}
          onSelect={select}
          busy={false}
          stale={!res.ok && !!good}
          view={view}
          onView={pickView}
          canVisualize={!!shown}
          isData={isFmt}
          isJson={sel === "fmt:json"}
          sortKeys={o.sortKeys}
          onSortKeys={(v) => setO((p) => ({ ...p, sortKeys: v }))}
          indent={o.indent}
          onIndent={(n) => setO((p) => ({ ...p, indent: n }))}
          quoteStyle={o.quote}
          onQuoteStyle={(q) => setO((p) => ({ ...p, quote: q }))}
          removeEmpty={o.removeEmpty}
          onRemoveEmpty={(v) => setO((p) => ({ ...p, removeEmpty: v }))}
          isSql={sel === "type:sql"}
          sqlTable={o.table}
          onSqlTable={(v) => setO((p) => ({ ...p, table: v }))}
          sqlDialect={o.dialect}
          onSqlDialect={(d) => setO((p) => ({ ...p, dialect: d }))}
          isType={group === "type" && sel !== "type:sql"}
          typeName={o.typeName}
          onTypeName={(v) => setO((p) => ({ ...p, typeName: v }))}
          onResetOptions={() => setO(DEFAULTS)}
          canMoveToInput={!!shown && isFmt}
          onMoveToInput={() => load(output)}
          canDownload={!!output}
          onDownload={() => downloadText(`formaty.${ext}`, output)}
          copy={{ getText: () => output, disabled: !output, variant: "primary" }}
        />
        {showTable ? (
          <Table rows={rows} />
        ) : (
          <pre role="group" tabIndex={0} aria-label="Output" className="m-0 min-h-0 flex-1 overflow-auto bg-[var(--workspace-panel)] px-3 py-2 font-mono text-[13px] leading-[1.6] whitespace-pre text-[var(--workspace-text)]">
            <Highlighted code={output} lang={langForOutput(sel)} />
          </pre>
        )}
      </section>
    </div>
    <DemoFooter href={playHref({ input: text, ...stateFor(sel) })} />
    </div>
  );
}
