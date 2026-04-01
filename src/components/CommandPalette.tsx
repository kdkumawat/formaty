"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CommandLineIcon,
  ArrowTurnDownLeftIcon,
} from "@heroicons/react/24/outline";

export interface Command {
  id: string;
  label: string;
  shortcut?: string;
  category: string;
  keywords?: string[];
  action: () => void;
  disabled?: boolean;
  badge?: string;
  icon?: React.ReactNode;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
  isDark: boolean;
  recentIds?: string[];
  onExecute?: (id: string) => void;
}

const CATEGORY_ORDER = [
  "Recent",
  "Actions",
  "Convert to",
  "View as",
  "Generate Types",
  "Samples",
  "Settings",
  "Workspace",
  "Theme",
];

function groupCommands(
  commands: Command[],
  query: string,
  recentIds: string[] = [],
): Array<{ category: string; items: Command[] }> {
  const q = query.trim().toLowerCase();

  const filtered = q
    ? commands.filter((cmd) => {
        if (cmd.disabled) return false;
        const text = [cmd.label, cmd.category, ...(cmd.keywords ?? [])]
          .join(" ")
          .toLowerCase();
        return text.includes(q);
      })
    : commands.filter((c) => !c.disabled || c.category === "Actions");

  const byCategory = new Map<string, Command[]>();

  // Add recent items at the top when there's no query
  if (!q && recentIds.length > 0) {
    const recentItems: Command[] = [];
    for (const id of recentIds) {
      const cmd = filtered.find((c) => c.id === id && !c.disabled);
      if (cmd) recentItems.push(cmd);
    }
    if (recentItems.length > 0) {
      byCategory.set("Recent", recentItems);
    }
  }

  for (const cmd of filtered) {
    const list = byCategory.get(cmd.category) ?? [];
    list.push(cmd);
    byCategory.set(cmd.category, list);
  }

  const sorted: Array<{ category: string; items: Command[] }> = [];
  for (const cat of CATEGORY_ORDER) {
    if (byCategory.has(cat)) {
      sorted.push({ category: cat, items: byCategory.get(cat)! });
    }
  }
  for (const [cat, items] of byCategory) {
    if (!CATEGORY_ORDER.includes(cat)) sorted.push({ category: cat, items });
  }
  return sorted;
}

export function CommandPalette({
  open,
  onClose,
  commands,
  isDark,
  recentIds = [],
  onExecute,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => groupCommands(commands, query, recentIds), [commands, query, recentIds]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector<HTMLButtonElement>(
      "[data-active='true']",
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  const execute = useCallback(
    (cmd: Command) => {
      if (cmd.disabled) return;
      onClose();
      onExecute?.(cmd.id);
      cmd.action();
    },
    [onClose, onExecute],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, flat.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = flat[activeIdx];
        if (cmd) execute(cmd);
      }
    },
    [flat, activeIdx, execute, onClose],
  );

  // Reset active index when query or groups change
  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  const borderColor = isDark ? "border-white/[0.08]" : "border-black/[0.06]";
  const bg = isDark ? "bg-[#141414]/95 backdrop-blur-xl" : "bg-white/95 backdrop-blur-xl";
  const inputBg = isDark ? "bg-white/[0.05]" : "bg-black/[0.02]";
  const textMuted = isDark ? "text-white/50" : "text-black/35";
  const categoryColor = isDark ? "text-primary/60" : "text-primary/40";
  const hoverBg = isDark ? "hover:bg-white/[0.07]" : "hover:bg-black/[0.03]";
  const activeBg = "bg-primary/10";
  const activeText = "text-primary";
  const dotActive = "bg-primary";
  const dotInactive = isDark ? "bg-white/15" : "bg-black/10";
  const textColor = isDark ? "text-[#e8e8e8]" : "text-[#1a1a1a]";
  const badgeBg = isDark ? "bg-white/[0.08] text-white/45 border-white/[0.08]" : "bg-black/[0.04] text-black/30 border-black/[0.06]";
  const activeBadgeBg = "bg-primary/15 text-primary/70 border-primary/20";

  let flatIdx = 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.97, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed left-1/2 top-[12%] z-[201] w-full max-w-[560px] -translate-x-1/2 overflow-hidden rounded-2xl border shadow-2xl shadow-black/20 ${bg} ${borderColor}`}
            style={{ maxHeight: "min(520px, 80dvh)" }}
            onKeyDown={onKeyDown}
          >
            {/* Search bar */}
            <div className={`flex items-center gap-2.5 border-b px-4 py-3 ${borderColor} ${inputBg}`}>
              <MagnifyingGlassIcon className={`h-4 w-4 shrink-0 ${textMuted}`} />
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands…"
                className={`min-w-0 flex-1 bg-transparent text-sm font-medium tracking-wide outline-none placeholder:${textMuted} ${textColor}`}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className={`shrink-0 rounded-md p-0.5 transition-colors ${textMuted} hover:text-primary`}
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className={`hidden shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] sm:flex ${badgeBg}`}>
                  ESC
                </kbd>
              )}
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="overflow-y-auto overscroll-contain"
              style={{ maxHeight: "min(400px, 65dvh)" }}
            >
              {groups.length === 0 ? (
                <div className={`flex flex-col items-center justify-center gap-2 py-12 ${textMuted}`}>
                  <CommandLineIcon className="h-8 w-8 opacity-30" />
                  <span className="text-sm">No commands found</span>
                </div>
              ) : (
                <div className="py-1.5">
                  {groups.map((group) => (
                    <div key={group.category}>
                      <div className={`px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${categoryColor}`}>
                        {group.category}
                      </div>
                      {group.items.map((cmd) => {
                        const isActive = flatIdx === activeIdx;
                        const myIdx = flatIdx++;
                        return (
                          <div key={cmd.id} className="px-2 py-0.5">
                          <button
                            type="button"
                            data-active={isActive}
                            disabled={cmd.disabled}
                            onMouseEnter={() => setActiveIdx(myIdx)}
                            onClick={() => execute(cmd)}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-all duration-100 disabled:opacity-40 ${
                              isActive ? `${activeBg} ${activeText}` : `${hoverBg} ${textColor}`
                            }`}
                          >
                            {/* Dot indicator */}
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${isActive ? dotActive : dotInactive}`} />
                            {cmd.icon && (
                              <span className={`h-4 w-4 shrink-0 ${isActive ? activeText : textMuted}`}>
                                {cmd.icon}
                              </span>
                            )}
                            <span className="min-w-0 flex-1 truncate text-left font-medium">
                              {cmd.label}
                            </span>
                            {cmd.badge && (
                              <span className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] ${isActive ? activeBadgeBg : badgeBg}`}>
                                {cmd.badge}
                              </span>
                            )}
                            {cmd.shortcut && (
                              <kbd className={`hidden shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] sm:flex ${isActive ? activeBadgeBg : badgeBg}`}>
                                {cmd.shortcut}
                              </kbd>
                            )}
                            {isActive && !cmd.shortcut && !cmd.badge && (
                              <kbd className={`hidden shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] sm:flex ${activeBadgeBg}`}>↵</kbd>
                            )}
                          </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className={`flex items-center gap-4 border-t px-4 py-2 text-[10px] tracking-wide ${borderColor} ${textMuted}`}>
              <span className="flex items-center gap-1">
                <kbd className={`rounded-md border px-1.5 py-0.5 font-mono text-[9px] ${badgeBg}`}>↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className={`rounded-md border px-1.5 py-0.5 font-mono text-[9px] ${badgeBg}`}>↵</kbd>
                run
              </span>
              <span className="flex items-center gap-1">
                <kbd className={`rounded-md border px-1.5 py-0.5 font-mono text-[9px] ${badgeBg}`}>ESC</kbd>
                close
              </span>
              <span className="ml-auto flex items-center gap-1">
                <kbd className={`rounded-md border px-1.5 py-0.5 font-mono text-[9px] ${badgeBg}`}>⌘K</kbd>
                open
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
