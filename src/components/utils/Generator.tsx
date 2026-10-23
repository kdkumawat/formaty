"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowPathIcon, Cog6ToothIcon } from "@heroicons/react/16/solid";
import {
  Button, Checkbox, IconButton, Kbd, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, NumberField, PaneHeader,
  ResultActions, RowCopy, Select, TextField, TruncatedText, type CopyFormat,
} from "@/components/kit";
import { SplitHandle, downloadText, inputPaneClass, resultPaneClass, splitRowClass, splitStyle } from "@/components/compare/shared";
import { modEnterProps } from "@/hooks/modEnter";
import {
  generateLorem,
  generatePassword,
  generateUuid,
  passwordBits,
  uuidNil,
  type UuidVariant,
} from "@/lib/utils/devtools";
import { UUID_VARIANT_LABELS, type UtilToolState } from "@/components/utils/state";

const V5_NS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const PAGE = 300;
type Fmt = NonNullable<UtilToolState["genFmt"]>;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n) || lo));

function formatList(list: string[], fmt: Fmt, paragraphs: boolean): string {
  if (paragraphs) return list.join("\n\n");
  if (fmt === "comma") return list.join(", ");
  if (fmt === "json") return JSON.stringify(list, null, 2);
  if (fmt === "sql") return `IN (${list.map((v) => `'${v.replace(/'/g, "''")}'`).join(", ")})`;
  return list.join("\n");
}

const FORMATS: CopyFormat[] = [
  { id: "lines", label: "Lines" },
  { id: "comma", label: "Commas" },
  { id: "json", label: "JSON array" },
  { id: "sql", label: "SQL IN" },
];

const DIM = "text-[var(--workspace-text-muted)]";

/** Split a generated value into coloured runs: version digit, v7 time, hyphens, password digits and symbols. */
function parts(tool: "uuid" | "password", value: string, v7: boolean): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  let hex = 0;
  for (const ch of value) {
    let cls = "";
    if (tool === "uuid") {
      if (ch === "-") cls = DIM;
      else {
        if (hex === 12) cls = "rounded-sm bg-primary/15 font-bold text-primary";
        else if (v7 && hex < 12) cls = "font-semibold text-primary";
        hex++;
      }
    } else if (/\d/.test(ch)) cls = "font-semibold text-primary";
    else if (!/[A-Za-z]/.test(ch)) cls = "font-semibold text-bad";
    const last = out[out.length - 1];
    if (last && last[1] === cls) last[0] += ch;
    else out.push([ch, cls]);
  }
  return out;
}

interface Props {
  tool: "uuid" | "password" | "lorem";
  state: UtilToolState;
  patch: (p: Partial<UtilToolState>) => void;
  regenKey: number;
  fontSize: number;
  split: number;
  onResizeStart?: () => void;
  onNudgeSplit?: (delta: number) => void;
}

export function Generator({ tool, state, patch, regenKey, split, onResizeStart, onNudgeSplit }: Props) {
  const [seed, setSeed] = useState(0);
  const [shown, setShown] = useState(PAGE);

  const upper = !!state.uuidUpper;
  const plain = !!state.uuidPlain;
  const fmt: Fmt = state.genFmt ?? "lines";
  const isV7 = state.uuidVariant === "v7";
  const pwOpts = { lower: state.pwLower, upper: state.pwUpper, digits: state.pwDigits, symbols: state.pwSymbols };
  const noSets = !state.pwLower && !state.pwUpper && !state.pwDigits && !state.pwSymbols;

  // Regenerate whenever an option changes, "Generate" is pressed, a workspace tab is created, or a reset emptied the list.
  const needsList = tool === "uuid" ? state.uuidList.length === 0 : tool === "password" ? state.pwList.length === 0 : false;
  useEffect(() => {
    let cancelled = false;
    setShown(PAGE);
    if (tool === "uuid") {
      const n = clamp(state.uuidCount, 1, 1000);
      const fmtOne = (id: string) => {
        const v = plain ? id.replace(/-/g, "") : id;
        return upper ? v.toUpperCase() : v;
      };
      void Promise.all(
        Array.from({ length: n }, (_, i) =>
          Promise.resolve(
            generateUuid(state.uuidVariant, V5_NS, state.uuidVariant === "v5" ? `${state.uuidName || "formaty"}-${i + 1}` : state.uuidName),
          ),
        ),
      )
        .then((list) => {
          if (cancelled) return;
          const f = list.map(fmtOne);
          patch({ uuidList: f, output: f.join("\n"), error: null });
        })
        .catch((e) => {
          if (!cancelled) patch({ error: e instanceof Error ? e.message : "Failed", output: "", uuidList: [] });
        });
    } else {
      // Deferred a tick: on first open the parent seeds this tool's default state in its own
      // effect, and a synchronous patch here would be overwritten by it.
      void Promise.resolve().then(() => {
        if (cancelled) return;
        if (tool !== "password") {
          patch({ output: generateLorem(clamp(state.loremCount, 1, 50), "paragraphs"), loremUnit: "paragraphs", error: null });
        } else if (noSets) {
          patch({ pwList: [], output: "", error: "Pick at least one kind of character." });
        } else {
          const list = Array.from({ length: clamp(state.pwCount, 1, 1000) }, () => generatePassword(state.passwordLen, pwOpts));
          patch({ pwList: list, output: list.join("\n"), error: null });
        }
      });
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tool, seed, regenKey, needsList,
    state.uuidCount, state.uuidVariant, state.uuidName, upper, plain,
    state.pwCount, state.passwordLen, state.pwLower, state.pwUpper, state.pwDigits, state.pwSymbols,
    state.loremCount,
  ]);

  const list = useMemo(
    () => (tool === "uuid" ? state.uuidList : tool === "password" ? state.pwList : state.output ? state.output.split("\n\n") : []),
    [tool, state.uuidList, state.pwList, state.output],
  );
  const all = formatList(list, fmt, tool === "lorem");
  const bits = passwordBits(state.passwordLen, pwOpts);
  const strength = bits >= 90 ? "Strong" : bits >= 60 ? "Good" : bits >= 35 ? "Fair" : "Weak";

  const resetOptions = () => {
    if (tool === "uuid") patch({ uuidCount: 5, uuidVariant: "v4", uuidName: "formaty", uuidUpper: false, uuidPlain: false, genFmt: "lines" });
    else if (tool === "password") patch({ pwCount: 5, passwordLen: 16, pwLower: true, pwUpper: true, pwDigits: true, pwSymbols: true, genFmt: "lines" });
    else patch({ loremCount: 3 });
  };

  const one = list.length === 1;
  // Columns as wide as one value in the mono font (ch) plus the number and the Copy tag, so short values pack side by side and never wrap.
  const chars = tool === "password" ? clamp(state.passwordLen, 8, 64) : plain ? 32 : 36;
  const colMin = `calc(${chars}ch + 6.5rem)`;
  const noun = tool === "uuid" ? "UUID" : tool === "password" ? "password" : "paragraph";
  const legend =
    tool === "uuid"
      ? isV7
        ? "Version 7. The bold start is the creation time, so these sort in the order they were made."
        : "The highlighted digit is the version. Hyphens are dimmed."
      : tool === "password"
        ? "Digits are bold and symbols are red, so look-alike characters are easy to tell apart."
        : "Select a paragraph to copy just that one.";

  return (
    <div className={splitRowClass} {...modEnterProps(() => setSeed((n) => n + 1))}>
      <section className={`${inputPaneClass} min-[901px]:overflow-auto`} style={splitStyle(split)} aria-label="Options">
      <PaneHeader title="Options" />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
        {tool === "uuid" && (
          <>
            <NumberField label="How many" min={1} max={1000} value={state.uuidCount} onChange={(n) => patch({ uuidCount: clamp(n, 1, 1000) })} />
            <Select<UuidVariant>
              label="Version"
              options={UUID_VARIANT_LABELS.map((v) => ({ value: v.id, label: v.title }))}
              value={state.uuidVariant}
              onChange={(v) => patch({ uuidVariant: v })}
            />
            {state.uuidVariant === "v5" && (
              <TextField
                aria-label="Name for version 5"
                placeholder="Name to hash"
                value={state.uuidName}
                onChange={(e) => patch({ uuidName: e.target.value })}
                wrapperClassName="w-40 max-[900px]:w-full"
              />
            )}
            <Checkbox label="Uppercase" checked={upper} onCheckedChange={(v) => patch({ uuidUpper: v === true })} />
            <Checkbox label="No hyphens" checked={plain} onCheckedChange={(v) => patch({ uuidPlain: v === true })} />
          </>
        )}
        {tool === "password" && (
          <>
            <NumberField label="How many" min={1} max={1000} value={state.pwCount} onChange={(n) => patch({ pwCount: clamp(n, 1, 1000) })} />
            <NumberField label="Length" min={8} max={64} value={clamp(state.passwordLen, 8, 64)} onChange={(n) => patch({ passwordLen: clamp(n, 8, 64) })} />
            <Checkbox label="a-z" checked={state.pwLower} onCheckedChange={(v) => patch({ pwLower: v === true })} />
            <Checkbox label="A-Z" checked={state.pwUpper} onCheckedChange={(v) => patch({ pwUpper: v === true })} />
            <Checkbox label="0-9" checked={state.pwDigits} onCheckedChange={(v) => patch({ pwDigits: v === true })} />
            <Checkbox label="Symbols" checked={state.pwSymbols} onCheckedChange={(v) => patch({ pwSymbols: v === true })} />
          </>
        )}
        {tool === "lorem" && <NumberField label="Paragraphs" min={1} max={50} value={state.loremCount} onChange={(n) => patch({ loremCount: clamp(n, 1, 50) })} />}
      </div>
      </section>
      <SplitHandle onResizeStart={onResizeStart} onNudge={onNudgeSplit} value={split} />

      <section className={resultPaneClass} aria-label="Generated">
      <PaneHeader
        title="Generated"
        left={
          <span className="text-[12px] tabular-nums text-[var(--workspace-text-muted)]">
            {list.length} {noun}
            {list.length === 1 ? "" : "s"}
            {tool === "password" && bits > 0 && ` · ${strength}, about ${bits} bits`}
          </span>
        }
        right={
          <ResultActions
            options={
              <Menu>
                <MenuTrigger asChild>
                  <IconButton label="Options"><Cog6ToothIcon /></IconButton>
                </MenuTrigger>
                <MenuContent align="end">
                  {tool === "uuid" && (
                    <>
                      <MenuItem onSelect={() => patch({ uuidList: [uuidNil()], output: uuidNil(), error: null })}>Nil UUID</MenuItem>
                      <MenuSeparator />
                    </>
                  )}
                  <MenuItem onSelect={resetOptions}>Reset</MenuItem>
                </MenuContent>
              </Menu>
            }
            onDownload={() => downloadText(`formaty-${tool}.txt`, all)}
            canDownload={list.length > 0}
            copy={{
              getText: (f) => formatList(list, (f as Fmt | undefined) ?? fmt, tool === "lorem"),
              formats: tool === "lorem" ? undefined : FORMATS,
              format: fmt,
              onFormatChange: (id) => patch({ genFmt: id as Fmt }),
              count: list.length > 1 ? list.length : undefined,
              disabled: list.length === 0,
            }}
          >
            <Kbd keys="⌘↵" className="max-[900px]:hidden" />
            <Button icon={<ArrowPathIcon />} onClick={() => setSeed((n) => n + 1)}>
              Generate
            </Button>
          </ResultActions>
        }
      />
      {state.error && <p className="px-3 pt-2 text-[13px] text-bad">{state.error}</p>}
      <div className="min-h-0 flex-1 overflow-auto px-3 pb-3 max-[900px]:px-1.5">
        <div className="py-1.5 text-[12px] text-[var(--workspace-text-muted)]">
          <TruncatedText>{legend}</TruncatedText>
        </div>
        {tool === "lorem" ? (
          <div className="max-w-[90ch]">
            {list.map((p, i) => (
              <RowCopy key={i} text={p} className="h-auto items-start py-2 leading-relaxed max-[900px]:h-auto">
                <span className="block whitespace-normal">{p}</span>
              </RowCopy>
            ))}
          </div>
        ) : (
          <>
            <div
              className="grid font-mono"
              style={{ gridTemplateColumns: one ? "minmax(0,1fr)" : `repeat(auto-fill, minmax(min(100%, ${colMin}), 1fr))`, columnGap: 24 }}
            >
              {list.slice(0, shown).map((v, i) => (
                <RowCopy key={`${i}-${v}`} text={v} className="h-auto min-h-7 py-0.5 max-[900px]:h-auto max-[900px]:min-h-9">
                  <span className="flex items-center gap-2">
                    {!one && <span aria-hidden className="w-8 shrink-0 text-right font-sans max-[900px]:w-5 text-[12px] tabular-nums text-[var(--workspace-text-muted)]">{i + 1}</span>}
                    <span className="min-w-0 flex-1 whitespace-normal break-all font-mono leading-[1.6]">
                      {parts(tool, v, isV7).map(([t, cls], k) => (
                        <span key={k} className={cls}>{t}</span>
                      ))}
                    </span>
                  </span>
                </RowCopy>
              ))}
            </div>
            {list.length > shown && (
              <Button className="mt-2" onClick={() => setShown((n) => n + PAGE)}>
                Show {Math.min(PAGE, list.length - shown)} more ({list.length - shown} not shown)
              </Button>
            )}
          </>
        )}
      </div>
      </section>
    </div>
  );
}
