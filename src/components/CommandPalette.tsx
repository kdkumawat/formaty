"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { COMMAND_GROUPS } from "@/components/workspace/commandIcons";
import { loadRecents, pushRecent, rank, saveRecents, RECENT_LIMIT } from "@/lib/commandSearch";
import { isMacOS } from "@/lib/shortcuts";
import { cn } from "@/lib/utils";

export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  keywords?: string[];
  action: () => void;
  disabled?: boolean;
  /** Why a disabled command cannot run now. Disabled commands without a reason are hidden. */
  disabledReason?: string;
  /** Right-hand context text, e.g. "Current" or "On". */
  badge?: string;
  icon?: React.ReactNode;
  /** Second action on Cmd/Ctrl+Enter, shown in the footer while the command is active. */
  alt?: { label: string; action: () => void };
}

/** Where the user is: ranks matching commands first and drives the Suggested section. */
export interface PaletteContext {
  /** Chip text, e.g. "Transform" or "Utils: JWT decoder". */
  label: string;
  /** Command categories that apply to the current tab. */
  categories: string[];
  /** Command ids worth offering right now, best first. */
  suggested: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
  context?: PaletteContext;
}

interface Row {
  /** Unique across sections (a command can appear under Recent and its group). */
  key: string;
  cmd: Command;
  indices: number[];
  /** Quiet group label shown on the right while searching. */
  group?: string;
  /** Index among selectable rows, or -1 when disabled. */
  fi: number;
  sec: number;
}
interface Section {
  id: string;
  title?: string;
  rows: Row[];
}

const muted = "text-[var(--workspace-text-muted)]";
const SUGGESTED_LIMIT = 6;
const EMPTY_TRIES = ["yaml", "uuid", "compare"];
const visible = (c: Command) => !c.disabled || !!c.disabledReason;

function build(commands: Command[], query: string, ctx: PaletteContext | undefined, recents: string[]): { sections: Section[]; flat: Row[] } {
  const cats = new Set(ctx?.categories);
  const plan: { id: string; title?: string; rows: { cmd: Command; indices: number[]; group?: string }[] }[] = [];

  if (query.trim()) {
    const ranked = rank(commands.filter(visible), query, { recent: recents, inContext: (c) => cats.has(c.category) });
    if (ranked.length) plan.push({ id: "results", rows: ranked.map((r) => ({ cmd: r.item, indices: r.indices, group: r.item.category })) });
  } else {
    const byId = new Map(commands.map((c) => [c.id, c]));
    const pick = (ids: string[]) => ids.map((id) => byId.get(id)).filter((c): c is Command => !!c && !c.disabled);
    const recent = pick(recents).slice(0, RECENT_LIMIT);
    const taken = new Set(recent.map((c) => c.id));
    const suggested = pick(ctx?.suggested ?? []).filter((c) => !taken.has(c.id)).slice(0, SUGGESTED_LIMIT);
    if (recent.length) plan.push({ id: "recent", title: "Recent", rows: recent.map((cmd) => ({ cmd, indices: [] })) });
    if (suggested.length) plan.push({ id: "suggested", title: ctx ? `Suggested for ${ctx.label.split(":")[0]}` : "Suggested", rows: suggested.map((cmd) => ({ cmd, indices: [] })) });
    const known: string[] = [...COMMAND_GROUPS];
    const names = [...known, ...new Set(commands.map((c) => c.category).filter((c) => !known.includes(c)))];
    // Groups that apply to the current tab come first; otherwise the product's group order stands.
    const ordered = [...names.filter((n) => cats.has(n)), ...names.filter((n) => !cats.has(n))];
    for (const name of ordered) {
      const inGroup = commands.filter((c) => c.category === name && visible(c));
      const rows = [...inGroup.filter((c) => !c.disabled), ...inGroup.filter((c) => c.disabled)];
      if (rows.length) plan.push({ id: name, title: name, rows: rows.map((cmd) => ({ cmd, indices: [] })) });
    }
  }

  const flat: Row[] = [];
  const sections = plan.map((p, sec): Section => ({
    id: p.id,
    title: p.title,
    rows: p.rows.map((r) => {
      const row: Row = { key: `${p.id}:${r.cmd.id}`, cmd: r.cmd, indices: r.indices, group: r.group, fi: r.cmd.disabled ? -1 : flat.length, sec };
      if (!r.cmd.disabled) flat.push(row);
      return row;
    }),
  }));
  return { sections, flat };
}

function Highlighted({ text, indices }: { text: string; indices: number[] }) {
  if (!indices.length) return <>{text}</>;
  const on = new Set(indices);
  const parts: React.ReactNode[] = [];
  let i = 0;
  while (i < text.length) {
    const hit = on.has(i);
    let j = i;
    while (j < text.length && on.has(j) === hit) j++;
    const chunk = text.slice(i, j);
    parts.push(hit ? <span key={i} className="font-semibold underline decoration-current/45 decoration-[1.5px] underline-offset-[3px]">{chunk}</span> : chunk);
    i = j;
  }
  return <>{parts}</>;
}

const noop = () => () => {};
const MODS: Record<string, string> = { "⌘": "Ctrl", "⇧": "Shift", "⌥": "Alt" };
const capClass =
  "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[5px] bg-control px-1 font-sans text-[11px] font-medium leading-none text-[var(--workspace-text-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,.22),0_1px_0_var(--input)] group-aria-selected:bg-popover";

/** One keycap per key. Mac notation in, platform notation out. ponytail: kit Kbd renders a chord as one cap; swap to a kit variant when it offers one. */
function Keys({ keys, className }: { keys: string; className?: string }) {
  const mac = useSyncExternalStore(noop, isMacOS, () => false);
  const caps = keys === "Esc" ? [keys] : [...keys];
  return (
    <span className={cn("inline-flex items-center gap-[3px]", className)}>
      {caps.map((k, i) => (
        <kbd key={i} className={capClass}>
          {mac ? k : (MODS[k] ?? k)}
        </kbd>
      ))}
    </span>
  );
}

const STYLE = `
@keyframes cmdk-in{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:none}}
@keyframes cmdk-out{to{opacity:0;transform:scale(.98)}}
@keyframes cmdk-fade-in{from{opacity:0}}
@keyframes cmdk-fade-out{to{opacity:0}}
.cmdk-surface[data-state=open]{animation:cmdk-in 140ms cubic-bezier(.16,1,.3,1)}
.cmdk-surface[data-state=closed]{animation:cmdk-out 90ms ease-in forwards}
.cmdk-scrim[data-state=open]{animation:cmdk-fade-in 140ms ease-out}
.cmdk-scrim[data-state=closed]{animation:cmdk-fade-out 90ms ease-in forwards}
@media (prefers-reduced-motion:reduce){.cmdk-surface,.cmdk-scrim{animation:none!important}}
`;

type Handle = { clear: () => boolean; ran: boolean };

function Body({ onClose, commands, context, handle }: Omit<CommandPaletteProps, "open"> & { handle: React.MutableRefObject<Handle> }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [stuck, setStuck] = useState(-1);
  const [recents] = useState(loadRecents);
  const uid = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const viaKey = useRef(false);
  const lastPointer = useRef({ x: -1, y: -1 });
  const { sections, flat } = useMemo(() => build(commands, query, context, recents), [commands, query, context, recents]);
  const cur: Row | undefined = flat[Math.min(active, flat.length - 1)];
  const optId = (r: Row) => `${uid}-${r.key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  useEffect(() => {
    handle.current.clear = () => {
      if (!query) return false;
      setQuery("");
      setActive(0);
      return true;
    };
  });

  // A menu that was closing as the palette opened hands focus back to its own trigger a moment
  // later; take it back so typing and Enter always land here.
  useEffect(() => {
    const timers = [60, 220].map((ms) => window.setTimeout(() => inputRef.current?.focus(), ms));
    return () => timers.forEach(window.clearTimeout);
  }, []);

  const run = useCallback(
    (cmd: Command, useAlt: boolean) => {
      if (cmd.disabled) return;
      const fn = useAlt && cmd.alt ? cmd.alt.action : cmd.action;
      saveRecents(pushRecent(loadRecents(), cmd.id));
      handle.current.ran = true;
      onClose();
      fn();
    },
    [onClose, handle],
  );

  const change = (q: string) => {
    setQuery(q);
    setActive(0);
    setStuck(-1);
    if (listRef.current) listRef.current.scrollTop = 0;
  };

  // Keyboard moves keep the active row in view; pointer moves never scroll.
  const curFi = cur?.fi ?? -1;
  useEffect(() => {
    if (!viaKey.current) return;
    viaKey.current = false;
    const list = listRef.current;
    if (!list || curFi < 0) return;
    if (curFi === 0) list.scrollTop = 0;
    else list.querySelector(`[data-fi="${curFi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [curFi]);

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    let s = -1;
    e.currentTarget.querySelectorAll<HTMLElement>("[data-sec]").forEach((el, i) => {
      if (el.offsetTop < top) s = i;
    });
    setStuck(s);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target !== inputRef.current && e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) inputRef.current?.focus();
    if (e.key === "Enter") {
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      if (cur) run(cur.cmd, e.metaKey || e.ctrlKey);
      return;
    }
    const n = flat.length;
    if (!n) return;
    const el = inputRef.current;
    const atStart = !el || (el.selectionStart === 0 && el.selectionEnd === 0);
    const atEnd = !el || (el.selectionStart === el.value.length && el.selectionEnd === el.value.length);
    const page = Math.max(1, Math.floor((listRef.current?.clientHeight ?? 360) / 36) - 1);
    const idx = Math.min(active, n - 1);
    let next: number | null = null;
    if (e.key === "ArrowDown") next = (idx + 1) % n;
    else if (e.key === "ArrowUp") next = (idx - 1 + n) % n;
    else if (e.key === "PageDown") next = Math.min(idx + page, n - 1);
    else if (e.key === "PageUp") next = Math.max(idx - page, 0);
    else if (e.key === "Home" && atStart) next = 0;
    else if (e.key === "End" && atEnd) next = n - 1;
    else if (e.key === "Tab") {
      const dir = e.shiftKey ? -1 : 1;
      const starts = flat.flatMap((r, i) => (i === 0 || flat[i - 1].sec !== r.sec ? [i] : []));
      if (query || starts.length < 2) next = (idx + dir + n) % n;
      else {
        const at = starts.filter((s) => s <= idx).length - 1;
        next = starts[(at + dir + starts.length) % starts.length];
      }
      e.preventDefault();
    }
    if (next !== null) {
      e.preventDefault();
      viaKey.current = true;
      setActive(next);
    }
  };

  const onPointerMove = (e: React.PointerEvent, fi: number) => {
    if (e.clientX === lastPointer.current.x && e.clientY === lastPointer.current.y) return;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    if (fi >= 0 && fi !== active) setActive(fi);
  };

  const q = query.trim();
  const alt = cur?.cmd.alt;
  let secIdx = -1;

  return (
    <div onKeyDown={onKeyDown}>
      <style>{STYLE}</style>
      <div className="flex h-[52px] items-center gap-2.5 border-b border-[var(--workspace-border)] px-4">
        <MagnifyingGlassIcon aria-hidden className="size-[18px] shrink-0 text-[var(--workspace-text)] opacity-70" />
        {context && (
          <span className="inline-flex h-6 max-w-[42%] shrink-0 items-center truncate rounded-md bg-control px-2 text-[12px] font-medium text-[var(--workspace-text-muted)]">{context.label}</span>
        )}
        <input
          ref={inputRef}
          autoFocus
          role="combobox"
          aria-expanded
          aria-autocomplete="list"
          aria-controls={`${uid}-list`}
          aria-activedescendant={cur ? optId(cur) : undefined}
          aria-label="Search every tool"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={query}
          onChange={(e) => change(e.target.value)}
          placeholder="Search every tool, e.g. Convert to YAML, UUID"
          className="min-w-0 flex-1 bg-transparent text-[16px] text-[var(--workspace-text)] outline-none placeholder:text-[var(--workspace-text-muted)]"
        />
        {query && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              change("");
              inputRef.current?.focus();
            }}
            className={cn("grid size-6 shrink-0 place-items-center rounded-md hover:bg-control-hover", muted)}
          >
            <XMarkIcon aria-hidden className="size-4" />
          </button>
        )}
        <Keys keys="Esc" className="max-sm:hidden" />
      </div>

      <div
        ref={listRef}
        id={`${uid}-list`}
        role="listbox"
        aria-label="Results"
        onScroll={onScroll}
        className="relative h-[min(420px,calc(60dvh-96px))] overflow-y-auto overscroll-contain"
      >
        {sections.length === 0 ? (
          <div role="presentation" className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <p className={cn("max-w-full break-words text-[13px]", muted)}>
              Nothing matched “<span className="text-[var(--workspace-text)]">{q}</span>”
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {EMPTY_TRIES.map((t) => (
                <button
                  key={t}
                  type="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => change(t)}
                  className="h-7 rounded-md bg-control px-2.5 text-[12px] text-[var(--workspace-text)] transition-colors duration-100 hover:bg-control-hover"
                >
                  Try “{t}”
                </button>
              ))}
            </div>
          </div>
        ) : (
          sections.map((s, si) => {
            const hasTitle = !!s.title;
            if (hasTitle) secIdx++;
            const thisSec = secIdx;
            return (
              <div key={s.id} role="group" aria-label={s.title ?? "Results"} className={cn(!hasTitle && "pt-1.5", si === sections.length - 1 && "pb-1.5")}>
                {hasTitle && (
                  <div
                    data-sec={thisSec}
                    aria-hidden
                    className={cn(
                      "sticky top-0 z-10 flex h-8 items-end border-b bg-popover px-[18px] pb-1 text-[12px] font-medium",
                      muted,
                      stuck === thisSec ? "border-[var(--workspace-border)]" : "border-transparent",
                    )}
                  >
                    {s.title}
                  </div>
                )}
                <div role="presentation" className="px-1.5">
                  {s.rows.map((r) => {
                    const on = r.fi >= 0 && r.fi === cur?.fi;
                    const { cmd } = r;
                    const off = !!cmd.disabled;
                    const right = off ? cmd.disabledReason : cmd.badge;
                    return (
                      <div
                        key={r.key}
                        id={optId(r)}
                        role="option"
                        data-fi={r.fi}
                        aria-selected={on}
                        aria-disabled={off || undefined}
                        onPointerMove={(e) => onPointerMove(e, r.fi)}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => run(cmd, false)}
                        className={cn(
                          "group relative flex h-9 scroll-mb-2 scroll-mt-9 items-center gap-3 rounded-lg px-3 text-[13.5px] text-[var(--workspace-text)] [@media(pointer:coarse)]:h-10",
                          off ? "cursor-default" : "cursor-pointer",
                          on && "bg-control-hover",
                        )}
                      >
                        {on && <span aria-hidden className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-action" />}
                        <span
                          aria-hidden
                          className={cn(
                            "grid size-6 shrink-0 place-items-center rounded-md bg-control transition-colors duration-100 [&>svg]:size-4 [&>svg]:opacity-70",
                            on && "bg-brand text-brand-foreground [&>svg]:opacity-100",
                            off && "opacity-45",
                          )}
                        >
                          {cmd.icon}
                        </span>
                        <span className={cn("min-w-0 flex-1 truncate", off && "opacity-45")}>
                          <Highlighted text={cmd.label} indices={r.indices} />
                        </span>
                        {right && <span className={cn("shrink-0 text-[12px]", muted)}>{right}</span>}
                        {r.group && <span className={cn("shrink-0 text-[12px] opacity-80 max-sm:hidden", muted)}>{r.group}</span>}
                        {cmd.shortcut && !off && <Keys keys={cmd.shortcut} className="max-sm:hidden" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {q ? (flat.length ? `${flat.length} ${flat.length === 1 ? "result" : "results"}` : "No results") : ""}
      </div>

      <div className={cn("flex h-10 items-center gap-4 border-t border-[var(--workspace-border)] px-4 text-[12px]", muted)}>
        <span className="min-w-0 flex-1 truncate">{cur ? <span className="text-[var(--workspace-text)]">{cur.cmd.label}</span> : "No command selected"}</span>
        <span className="flex shrink-0 items-center gap-4 max-sm:hidden">
          <span className="inline-flex items-center gap-1.5"><Keys keys="↑↓" /> Navigate</span>
          <span className="inline-flex items-center gap-1.5"><Keys keys="↵" /> Run</span>
          {alt && <span className="inline-flex items-center gap-1.5"><Keys keys="⌘↵" /> {alt.label}</span>}
        </span>
      </div>
    </div>
  );
}

export function CommandPalette({ open, onClose, ...rest }: CommandPaletteProps) {
  const handle = useRef<Handle>({ clear: () => false, ran: false });
  const content = useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (o) handle.current.ran = false;
        else onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="cmdk-scrim fixed inset-0 z-[200] bg-black/45 backdrop-blur-[3px]" />
        <Dialog.Content
          ref={content}
          aria-describedby={undefined}
          // First Esc clears the query; the second closes.
          onEscapeKeyDown={(e) => {
            if (handle.current.clear()) e.preventDefault();
          }}
          // After a command ran, leave focus alone if the command moved it (Focus input, Find); otherwise return it.
          onCloseAutoFocus={(e) => {
            const a = document.activeElement;
            if (handle.current.ran && a && a !== document.body && !content.current?.contains(a)) e.preventDefault();
            handle.current.ran = false;
          }}
          className="cmdk-surface fixed inset-x-0 top-[6vh] z-[201] mx-auto w-[640px] max-w-[calc(100vw-32px)] origin-top overflow-hidden rounded-2xl bg-popover/[0.97] text-[var(--workspace-text)] shadow-[0_0_0_1px_var(--workspace-border),inset_0_1px_0_rgba(255,255,255,.05),0_2px_6px_rgba(0,0,0,.08),0_16px_40px_-8px_rgba(0,0,0,.22),0_40px_90px_-12px_rgba(0,0,0,.35)] outline-none backdrop-blur-xl sm:top-[18vh]"
        >
          <Dialog.Title className="sr-only">Search every tool</Dialog.Title>
          <Body onClose={onClose} handle={handle} {...rest} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
