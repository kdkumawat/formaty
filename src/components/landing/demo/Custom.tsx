"use client";

import { useEffect, useRef, useState } from "react";
import { Highlighted } from "@/components/Highlighted";
import { InputActions, PaneHeader, ResultActions, Segmented, TextField } from "@/components/kit";
import { InputErrorStrip } from "@/components/workspace/PaneHeaders";
import { downloadText } from "@/components/compare/shared";
import type { HighlightLang } from "@/lib/highlight";
import type { WorkspaceState } from "@/lib/shareState";
import { runCustom } from "../live/engines";
import { optionsFor, type LiveSpec } from "../live/kinds";
import { playHref } from "../live/playLink";
import { CodeInput } from "./CodeInput";
import { DemoFooter } from "./Footer";

type Spec = Extract<LiveSpec, { kind: "custom" }>;

const LABELS: Record<Spec["tool"], [string, string]> = {
  query: ["JSON document", "Query"],
  curl: ["cURL command", ""],
  diff: ["Original", "Modified"],
  validate: ["JSON document", "JSON Schema"],
};
const JMES = "store.book[*].title";

/**
 * Query, cURL code, document diff and schema check. Their playground views run inside Monaco or need a
 * request, so this scene gives them the same headers, controls and colours with the pure functions.
 */
export default function Custom({
  spec,
  a0,
  b0,
  initialOutput,
  playBase,
}: {
  spec: Spec;
  a0: string;
  b0: string;
  /** The static example from seo.ts, shown until the function has run. */
  initialOutput: string;
  playBase: Partial<WorkspaceState>;
}) {
  const { options, initial } = optionsFor(spec);
  const [a, setA] = useState(a0);
  const [b, setB] = useState(b0);
  const [option, setOption] = useState(initial);
  const [out, setOut] = useState(initialOutput);
  const [error, setError] = useState("");
  const seq = useRef(0);
  const { tool } = spec;
  const [first, second] = LABELS[tool];
  const twoPanes = tool === "diff" || tool === "validate";
  const inputLang: HighlightLang = tool === "curl" ? "bash" : "json";
  const outLang: HighlightLang = tool === "query" ? "json" : tool === "curl" ? "code" : "text";

  useEffect(() => {
    const id = ++seq.current;
    runCustom(tool, a, b, option)
      .then((r) => {
        if (id !== seq.current) return;
        setOut(r);
        setError("");
      })
      .catch((e: unknown) => {
        if (id !== seq.current) return;
        setError(e instanceof Error ? e.message : "Could not process this input.");
      });
  }, [tool, a, b, option]);

  // Each query language has its own syntax: switch to a query that is valid in the new one.
  const pick = (o: string) => {
    setOption(o);
    if (tool === "query") setB(o === "jmespath" ? JMES : b0);
  };
  const sample = () => {
    setA(a0);
    setB(b0);
  };
  const pretty = (s: string) => {
    try {
      return JSON.stringify(JSON.parse(s), null, 2);
    } catch {
      return s;
    }
  };

  const href =
    tool === "diff"
      ? playHref({ ...playBase, diffLeftInput: a, diffRightInput: b, diffKind: "document" })
      : tool === "query"
        ? playHref({ ...playBase, input: a, queryText: b })
        : playHref({ ...playBase, input: a });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col overflow-auto min-[901px]:flex-row min-[901px]:overflow-hidden">
        <section aria-label="Input" className="flex h-[300px] shrink-0 flex-col border-b border-[var(--workspace-border)] min-[901px]:h-auto min-[901px]:min-h-0 min-[901px]:w-[40%] min-[901px]:border-b-0 min-[901px]:border-r">
          <PaneHeader
            title={first}
            right={
              <InputActions
                samples={[{ id: "sample", label: "Sample" }]}
                onSample={sample}
                onTidy={tool === "curl" ? undefined : () => setA(pretty(a))}
                canTidy={!!a.trim()}
                onClear={() => setA("")}
                canClear={!!a}
              />
            }
          />
          {tool === "query" && (
            <div className="flex shrink-0 items-center gap-2 border-b border-[var(--workspace-border)] px-3 py-1">
              <span className="text-[13px] text-[var(--workspace-text-muted)]">Query</span>
              <TextField
                aria-label="Query"
                value={b}
                onChange={(e) => setB(e.target.value)}
                spellCheck={false}
                className="font-mono"
                wrapperClassName="min-w-0 flex-1"
              />
            </div>
          )}
          <CodeInput label={first} value={a} onChange={setA} lang={inputLang} className={twoPanes ? "min-h-[72px]" : undefined} />
          {twoPanes && (
            <>
              <PaneHeader title={second} className="border-t" right={<InputActions onClear={() => setB("")} canClear={!!b} />} />
              <CodeInput label={second} value={b} onChange={setB} lang={tool === "validate" ? "json" : inputLang} className="min-h-[72px]" />
            </>
          )}
          {error && <InputErrorStrip message={error} line={null} onGoToLine={() => {}} />}
        </section>

        <section aria-label="Output" className="flex min-h-[220px] min-w-0 flex-1 flex-col min-[901px]:min-h-0">
          <PaneHeader
            title={options.length ? undefined : tool === "diff" ? "Differences" : "Result"}
            left={options.length ? <Segmented aria-label="Output" value={option} onChange={pick} options={options.map((o) => ({ value: o.id, label: o.label }))} /> : undefined}
            right={<ResultActions onDownload={() => downloadText("formaty.txt", out)} canDownload={!!out} copy={{ getText: () => out, disabled: !out }} />}
          />
          <pre
            role="group"
            tabIndex={0}
            aria-label="Result"
            className={`m-0 min-h-0 flex-1 overflow-auto bg-[var(--workspace-panel)] px-3 py-2 font-mono text-[13px] leading-[1.6] whitespace-pre text-[var(--workspace-text)] ${error ? "opacity-60" : ""}`}
          >
            <Highlighted code={out} lang={outLang} />
          </pre>
        </section>
      </div>
      <DemoFooter href={href} />
    </div>
  );
}
