"use client";

import { useEffect, useMemo, useState } from "react";
import { TreeView } from "@/components/TreeView";
import type { JsonValue } from "@/lib/json/core";
import { cleanJson, sha1Hex, sha256Hex, shaHex, utilPlaceholder, UTIL_TABS, type UtilTab } from "@/lib/utils/devtools";
import { selectFieldAll, type UtilToolState } from "@/components/utils/state";
import { TOOL_META, detectReadings, looksEncoded, toolReadings, type Dir, type Reading } from "@/components/utils/readings";
import { Button, EmptyState, InputActions, PaneHeader, ResultActions, RowCopy, Segmented } from "@/components/kit";
import { editorClass } from "@/components/compare/shared";

interface Props {
  tool: UtilTab;
  state: UtilToolState;
  patch: (p: Partial<UtilToolState>) => void;
  onOpen: (tool: UtilTab, input: string) => void;
  isDark?: boolean;
  fontSize: number;
}

const label = (id: UtilTab) => UTIL_TABS.find((t) => t.id === id)?.label ?? id;
/** Readings of these kinds make generic encoding readings noise, so Auto-detect hides the hash too. */
const SPECIFIC = new Set<UtilTab>(["jwt", "cron", "color", "clean"]);

export function ValueTool({ tool, state, patch, onOpen, isDark }: Props) {
  const meta = TOOL_META[tool];
  const input = state.input;
  const twoWay = !!meta.dirLabels;
  const dir: Dir = state.dir ?? (looksEncoded(tool, input) ? "decode" : "encode");
  const [jwtTree, setJwtTree] = useState(false);

  // SHA digests are async; keyed by input so stale results are ignored.
  const wantsHash = tool === "hash" || tool === "auto";
  const [hashes, setHashes] = useState<{ for: string; sha1: string; sha256: string; sha384: string; sha512: string } | null>(null);
  useEffect(() => {
    if (!wantsHash || !input) return;
    let cancelled = false;
    void Promise.all([sha1Hex(input), sha256Hex(input), shaHex("SHA-384", input), shaHex("SHA-512", input)]).then(([a, b, c, d]) => {
      if (!cancelled) setHashes({ for: input, sha1: a, sha256: b, sha384: c, sha512: d });
    });
    return () => {
      cancelled = true;
    };
  }, [wantsHash, input]);

  const rows = useMemo<Reading[]>(() => {
    const base = tool === "auto" ? detectReadings(input) : toolReadings(tool, input, dir);
    if (!wantsHash || !input.trim() || hashes?.for !== input) return base;
    if (tool === "hash") return [{ label: "SHA-256", value: hashes.sha256 }, { label: "SHA-512", value: hashes.sha512 }, { label: "SHA-384", value: hashes.sha384 }, { label: "SHA-1", value: hashes.sha1 }];
    const first = base[0];
    if (first?.open && SPECIFIC.has(first.open)) return base;
    return [...base, { label: "SHA-256", value: hashes.sha256 }];
  }, [tool, input, dir, wantsHash, hashes]);

  // Keep the parent's copy/export text in step with what is shown.
  const primary = rows.find((r) => !r.error);
  const outText = tool === "jwt" ? null : (primary?.value ?? "");
  useEffect(() => {
    if (outText !== null && outText !== state.output) patch({ output: outText, error: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outText]);

  const parsed = useMemo<unknown>(() => {
    if (tool !== "jwt" || !state.output) return null;
    try {
      return JSON.parse(state.output) as unknown;
    } catch {
      return null;
    }
  }, [tool, state.output]);

  const showEmpty = !input.trim() && tool !== "stats";

  const copyText = tool === "jwt" ? state.output : (primary?.value ?? "");

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 min-[901px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section className="flex min-w-0 flex-col border-b border-[var(--workspace-border)] min-[901px]:min-h-0 min-[901px]:border-b-0 min-[901px]:border-r" aria-label="Input">
        <PaneHeader
          title="Input"
          left={
            <>
              {twoWay && (
                <Segmented<Dir>
                  aria-label="Direction"
                  value={dir}
                  options={[
                    { value: "encode", label: meta.dirLabels![0] },
                    { value: "decode", label: meta.dirLabels![1] },
                  ]}
                  onChange={(v) => patch({ dir: v })}
                />
              )}
              {input && <span className="text-[12px] tabular-nums text-[var(--workspace-text-muted)]">{input.length} characters</span>}
            </>
          }
          right={
            <InputActions
              samples={meta.example ? [{ id: "sample", label: "Sample" }] : undefined}
              onSample={() => patch({ input: meta.example })}
              onTidy={tool === "clean" ? () => patch({ input: tidyClean(input) }) : undefined}
              canTidy={!!input.trim()}
              onClear={() => patch({ input: "" })}
              canClear={!!input}
            />
          }
        />
        <textarea
          aria-label="Input"
          className={`${editorClass} h-32 break-all min-[901px]:h-auto`}
          value={input}
          onChange={(e) => patch({ input: e.target.value })}
          onKeyDown={selectFieldAll}
          placeholder={utilPlaceholder(tool)}
          spellCheck={false}
        />
      </section>

      <section className="flex min-h-0 min-w-0 flex-col" aria-label="Result" aria-live="polite">
        <PaneHeader
          title="Result"
          left={rows.length > 0 && <span className="text-[12px] tabular-nums text-[var(--workspace-text-muted)]">{rows.length} {rows.length === 1 ? "reading" : "readings"}</span>}
          right={
            <ResultActions copy={{ getText: () => copyText, disabled: !copyText }}>
              {tool === "jwt" && parsed !== null && (
                <Segmented<"rows" | "tree">
                  aria-label="JWT view"
                  value={jwtTree ? "tree" : "rows"}
                  options={[
                    { value: "rows", label: "Rows" },
                    { value: "tree", label: "Tree" },
                  ]}
                  onChange={(v) => setJwtTree(v === "tree")}
                />
              )}
            </ResultActions>
          }
        />
        <div className="min-h-0 flex-1 overflow-auto px-3 pb-3 pt-1">
          {showEmpty ? (
            <EmptyState title="Nothing to read yet" description="Paste a value on the left, or use Sample." />
          ) : tool === "jwt" && jwtTree && parsed !== null ? (
            <TreeView data={parsed as JsonValue} isDark={isDark} showTypeBadges={false} defaultExpanded fontSize={13} onNotify={() => {}} />
          ) : (
            rows.map((r, i) => {
              const body = (
                <span className="grid min-w-0 grid-cols-1 gap-x-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                  <span className="font-semibold">{r.label}</span>
                  <span className="flex min-w-0 items-start gap-2">
                    {r.swatch && <span aria-hidden className="mt-0.5 size-5 shrink-0 rounded-md" style={{ backgroundColor: r.swatch }} />}
                    <span className={`max-h-56 min-w-0 overflow-auto whitespace-pre-wrap break-all font-mono leading-[1.6] ${r.error ? "text-bad" : ""}`}>{r.value}</span>
                  </span>
                </span>
              );
              return (
                <div key={`${r.label}-${i}`} className="flex items-start gap-1 border-b border-[var(--workspace-border)] py-0.5">
                  {r.error ? (
                    <div className="min-w-0 flex-1 px-2 py-1 text-[13px]">{body}</div>
                  ) : (
                    <RowCopy text={r.value} className="h-auto min-h-7 flex-1 items-start py-1 max-[900px]:h-auto">
                      {body}
                    </RowCopy>
                  )}
                  {r.open && r.open !== tool && (
                    <Button variant="ghost" onClick={() => onOpen(r.open!, input)}>
                      Open in {label(r.open)}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

/** Tidy for Clean JSON: apply the cleanup to the input itself. */
function tidyClean(text: string): string {
  try {
    return cleanJson(text);
  } catch {
    return text;
  }
}
