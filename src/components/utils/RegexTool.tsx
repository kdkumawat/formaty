"use client";

import { useMemo } from "react";
import { regexTest, utilPlaceholder, UTIL_SAMPLES } from "@/lib/utils/devtools";
import { selectFieldAll, type UtilToolState } from "@/components/utils/state";
import { Cog6ToothIcon } from "@heroicons/react/16/solid";
import {
  Chip, CopyButton, EmptyState, IconButton, InputActions, Menu, MenuCheckboxItem, MenuContent, MenuItem, MenuLabel,
  MenuSeparator, MenuTrigger, PaneHeader, ResultActions, RowCopy, TextField,
} from "@/components/kit";
import { SplitHandle, editorClass, inputPaneClass, resultPaneClass, splitRowClass, splitStyle } from "@/components/compare/shared";

const LOG_SAMPLE =
  "2026-03-09 10:42:17 INFO  user=ada@example.com ip=192.168.1.24 GET https://api.example.com/v1/orders?id=4821 200 38ms\n" +
  "2026-03-09 10:42:19 WARN  user=bob@example.org ip=10.0.0.7 POST https://api.example.com/v1/pay 402 112ms\n" +
  '2026-03-09 10:43:02 ERROR user=carol@example.net ip=172.16.4.9 msg="card declined" trace=550e8400-e29b-41d4-a716-446655440000';

/** Handy patterns, shown as one-click chips. Each brings text it matches when the current text is a sample. */
const REGEX_PRESETS: Array<{ label: string; pattern: string; flags?: string; sample?: string }> = [
  { label: "Email", pattern: "[\\w.+-]+@[\\w-]+\\.[\\w.-]+" },
  { label: "URL", pattern: "https?:\\/\\/[^\\s\"']+" },
  { label: "IPv4", pattern: "\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b" },
  { label: "UUID", pattern: "\\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\b", flags: "gi" },
  { label: "Date", pattern: "\\b(\\d{4})-(\\d{2})-(\\d{2})\\b" },
  { label: "Time", pattern: "\\b([01]\\d|2[0-3]):([0-5]\\d)(?::([0-5]\\d))?\\b" },
  { label: "Key=value", pattern: "(\\w+)=(\"[^\"]*\"|\\S+)" },
  { label: "Quoted", pattern: "\"([^\"]*)\"" },
  { label: "Numbers", pattern: "-?\\b\\d+(?:\\.\\d+)?\\b" },
  { label: "Hex color", pattern: "#(?:[0-9a-f]{3}){1,2}\\b", flags: "gi", sample: "Brand #F2B544, ink #111214, paper #fff and a broken #12345." },
  { label: "HTML tag", pattern: "<\\/?([a-z][\\w-]*)[^>]*>", flags: "gi", sample: '<p class="lead">Hello <b>world</b><br/></p>' },
  { label: "Blank lines", pattern: "^\\s*$", flags: "gm", sample: "first\n\n   \nsecond\n\nthird" },
  { label: "Between", pattern: "(?<=\\[)(.*?)(?=\\])", sample: "Tags: [alpha] [beta release] [v2]" },
];
const SAMPLE_TEXTS = new Set([UTIL_SAMPLES.regex, LOG_SAMPLE, ...REGEX_PRESETS.map((p) => p.sample)]);

const FLAGS: Array<[string, string]> = [
  ["i", "Ignore case"],
  ["m", "^ and $ match each line"],
  ["s", "Dot matches newlines"],
  ["u", "Unicode"],
];

export function RegexTool({ state, patch, split, onResizeStart, onNudgeSplit }: { state: UtilToolState; patch: (p: Partial<UtilToolState>) => void; fontSize?: number; split: number; onResizeStart?: () => void; onNudgeSplit?: (delta: number) => void }) {
  const { regexPattern: pattern, regexFlags: flags, input: text } = state;
  const repl = state.regexReplace ?? "";

  const result = useMemo(() => {
    if (!pattern.trim()) return { matches: [], error: null as string | null, replaced: null as string | null };
    try {
      const { matches } = regexTest(pattern, flags, text);
      let replaced: string | null = null;
      if (repl) replaced = text.replace(new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`), repl);
      return { matches, error: null, replaced };
    } catch (e) {
      return { matches: [], error: e instanceof Error ? e.message : "Invalid pattern", replaced: null };
    }
  }, [pattern, flags, text, repl]);

  const segs = useMemo(() => {
    const out: Array<{ t: string; hit: boolean }> = [];
    let last = 0;
    for (const m of result.matches) {
      if (!m.match || m.index < last) continue;
      if (m.index > last) out.push({ t: text.slice(last, m.index), hit: false });
      out.push({ t: m.match, hit: true });
      last = m.index + m.match.length;
    }
    if (last < text.length) out.push({ t: text.slice(last), hit: false });
    return out;
  }, [result.matches, text]);

  const toggle = (f: string, on: boolean) => patch({ regexFlags: on ? flags + f : flags.replaceAll(f, "") });
  const matchTexts = result.matches.map((m) => m.match).join("\n");

  // A preset brings text it matches, but never replaces text the user typed.
  const applyPreset = (p: (typeof REGEX_PRESETS)[number]) => {
    const keepText = text.trim() && !SAMPLE_TEXTS.has(text);
    patch({ regexPattern: p.pattern, regexFlags: p.flags ?? "g", ...(keepText ? {} : { input: p.sample ?? LOG_SAMPLE }) });
  };
  const resetOptions =() => patch({ regexFlags: "g", regexReplace: "" });
  const panel = "bg-sunk px-2.5 py-1.5 font-mono text-[13px] leading-[1.6] text-[var(--workspace-text)]";

  return (
    <div className={splitRowClass}>
      <section className={`${inputPaneClass} min-[901px]:overflow-auto`} style={splitStyle(split)}>
        <PaneHeader
          title="Pattern"
          right={
            <InputActions
              onClear={() => patch({ regexPattern: "" })}
              canClear={!!pattern}
            />
          }
        />
        <div className="flex flex-col gap-2 px-3 py-2">
          <TextField
            aria-label="Pattern"
            wrapperClassName="w-full"
            className="font-mono"
            value={pattern}
            onChange={(e) => patch({ regexPattern: e.target.value })}
            placeholder="\b(\w+)@(\w+)\b"
            spellCheck={false}
          />
          {result.error && <p className="text-[13px] text-bad">{result.error}</p>}
          <TextField
            aria-label="Replace with (optional, $1 is the first group)"
            wrapperClassName="w-full"
            className="font-mono"
            value={repl}
            onChange={(e) => patch({ regexReplace: e.target.value })}
            placeholder="Replace with, e.g. $1 at $2"
            spellCheck={false}
          />
          <div role="group" aria-label="Handy patterns" className="-mx-1 flex flex-wrap items-center gap-1">
            <span className="px-1 text-[12px] text-[var(--workspace-text-muted)]">Patterns</span>
            {REGEX_PRESETS.map((p) => (
              <Chip key={p.label} on={pattern === p.pattern} onClick={() => applyPreset(p)}>
                {p.label}
              </Chip>
            ))}
          </div>
        </div>
        <PaneHeader
          className="border-t"
          title="Text to test"
          right={
            <InputActions
              samples={[{ id: "sample", label: "Sample" }]}
              onSample={() => patch({ input: UTIL_SAMPLES.regex })}
              onClear={() => patch({ input: "" })}
              canClear={!!text}
            />
          }
        />
        <textarea
          aria-label="Text to test"
          className={`${editorClass} h-32 min-[901px]:h-auto`}
          value={text}
          onChange={(e) => patch({ input: e.target.value })}
          onKeyDown={selectFieldAll}
          placeholder={utilPlaceholder("regex")}
          spellCheck={false}
        />
      </section>
      <SplitHandle onResizeStart={onResizeStart} onNudge={onNudgeSplit} value={split} />

      <section className={resultPaneClass} aria-live="polite">
        <PaneHeader
          title="Matches"
          left={<span className="text-[12px] tabular-nums text-[var(--workspace-text-muted)]">{result.matches.length}</span>}
          right={
            <ResultActions
              options={
                <Menu>
                  <MenuTrigger asChild>
                    <IconButton label="Options"><Cog6ToothIcon /></IconButton>
                  </MenuTrigger>
                  <MenuContent align="end">
                    <MenuLabel>Flags</MenuLabel>
                    {FLAGS.map(([f, name]) => (
                      <MenuCheckboxItem key={f} checked={flags.includes(f)} onCheckedChange={(v) => toggle(f, !!v)} onSelect={(e) => e.preventDefault()}>
                        {name}
                      </MenuCheckboxItem>
                    ))}
                    <MenuSeparator />
                    <MenuItem onSelect={resetOptions}>Reset</MenuItem>
                  </MenuContent>
                </Menu>
              }
              copy={{ getText: () => matchTexts, count: result.matches.length > 1 ? result.matches.length : undefined, disabled: result.matches.length === 0 }}
            />
          }
        />
        <div className="min-h-0 flex-1 overflow-auto px-3 pb-3 pt-2">
          {!pattern.trim() ? (
            <EmptyState title="No pattern yet" description="Type a pattern, or pick one from Sample, then add text to test." />
          ) : (
            <>
              <pre className={`mb-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md ${panel}`}>
                {segs.length ? segs.map((s, i) => (s.hit ? <mark key={i} className="rounded-sm bg-primary/25 text-inherit">{s.t}</mark> : <span key={i}>{s.t}</span>)) : <span className="text-[var(--workspace-text-muted)]">Matches are highlighted here.</span>}
              </pre>
              {result.matches.length === 0 && !result.error && text && (
                <p className="py-2 text-[13px] text-[var(--workspace-text-muted)]">No matches in this text.</p>
              )}
              {result.matches.map((m, i) => (
                <RowCopy key={i} text={m.match} className="h-auto min-h-7 items-start py-1 max-[900px]:h-auto">
                  <span className="flex gap-2">
                    <span aria-hidden className="w-10 shrink-0 text-right font-mono text-[12px] tabular-nums text-[var(--workspace-text-muted)]">{m.index}</span>
                    <span className="min-w-0 flex-1 font-mono leading-[1.6]">
                      <span className="block whitespace-pre-wrap break-all">{m.match || "(empty)"}</span>
                      {m.groups.map((g, k) => (
                        <span key={k} className="block whitespace-pre-wrap break-all text-[12px] text-[var(--workspace-text-muted)]">
                          {g.name ? g.name : `$${k + 1}`} = {g.value ?? "(none)"}
                        </span>
                      ))}
                    </span>
                  </span>
                </RowCopy>
              ))}
              {result.replaced !== null && (
                <div className="mt-3 border-t border-[var(--workspace-border)] pt-2">
                  <div className="flex min-h-9 items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-[var(--workspace-text)]">After replacing</h3>
                    <span className="ml-auto">
                      <CopyButton variant="secondary" getText={() => result.replaced ?? ""} />
                    </span>
                  </div>
                  <pre className={`mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-md ${panel}`}>{result.replaced}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
