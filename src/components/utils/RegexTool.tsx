"use client";

import { useMemo } from "react";
import { regexTest, utilPlaceholder, UTIL_SAMPLES } from "@/lib/utils/devtools";
import { selectFieldAll, type UtilToolState } from "@/components/utils/state";
import { Cog6ToothIcon } from "@heroicons/react/16/solid";
import {
  CopyButton, EmptyState, IconButton, InputActions, Menu, MenuCheckboxItem, MenuContent, MenuItem, MenuLabel,
  MenuSeparator, MenuTrigger, PaneHeader, ResultActions, RowCopy, TextField,
} from "@/components/kit";
import { editorClass } from "@/components/compare/shared";

/** Quick regex presets: common patterns users reach for often. */
const REGEX_PRESETS: Array<{ label: string; pattern: string; flags?: string; hint: string }> = [
  { label: "Between two strings", pattern: "(?<=START)(.*?)(?=END)", flags: "gs", hint: "Anything between two strings. Replace START and END." },
  { label: "Email", pattern: "\\b[\\w.-]+@[\\w.-]+\\.\\w+\\b", hint: "Email addresses" },
  { label: "URL", pattern: "https?:\\/\\/[^\\s]+", hint: "HTTP and HTTPS URLs" },
  { label: "IPv4", pattern: "\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b", hint: "IPv4 addresses" },
  { label: "Phone (US)", pattern: "\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}", hint: "US phone numbers" },
  { label: "Date", pattern: "\\d{4}-\\d{2}-\\d{2}", hint: "YYYY-MM-DD dates" },
  { label: "Quoted", pattern: '"([^"]*)"', hint: "Double-quoted strings (capture group)" },
  { label: "HTML tag", pattern: "<[^>]+>", flags: "g", hint: "HTML tags" },
  { label: "Numbers", pattern: "\\b\\d+\\.\\d*\\b", flags: "g", hint: "Decimal numbers" },
  { label: "Words", pattern: "\\b\\w+\\b", flags: "g", hint: "Whole words" },
  { label: "Lines", pattern: "^.+$", flags: "gm", hint: "Non-empty lines" },
  { label: "Whitespace", pattern: "\\s+", flags: "g", hint: "Whitespace runs" },
];

const FLAGS: Array<[string, string]> = [
  ["i", "Ignore case"],
  ["m", "^ and $ match each line"],
  ["s", "Dot matches newlines"],
  ["u", "Unicode"],
];

export function RegexTool({ state, patch }: { state: UtilToolState; patch: (p: Partial<UtilToolState>) => void; fontSize?: number }) {
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

  const resetOptions = () => patch({ regexFlags: "g", regexReplace: "" });
  const panel = "bg-sunk px-2.5 py-1.5 font-mono text-[13px] leading-[1.6] text-[var(--workspace-text)]";

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 min-[901px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section className="flex min-w-0 flex-col border-b border-[var(--workspace-border)] min-[901px]:overflow-auto min-[901px]:border-b-0 min-[901px]:border-r">
        <PaneHeader
          title="Pattern"
          right={
            <InputActions
              samples={REGEX_PRESETS.map((p) => ({ id: p.label, label: p.label }))}
              onSample={(id) => {
                const p = REGEX_PRESETS.find((x) => x.label === id);
                if (p) patch({ regexPattern: p.pattern, regexFlags: p.flags ?? "g" });
              }}
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

      <section className="flex min-h-0 min-w-0 flex-col" aria-live="polite">
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
                    <span className="w-10 shrink-0 text-right font-mono text-[12px] tabular-nums text-[var(--workspace-text-muted)]">{m.index}</span>
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
