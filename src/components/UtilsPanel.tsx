"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLongRightIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

/** Quick regex presets — common patterns users reach for often. */
const REGEX_PRESETS: Array<{ label: string; pattern: string; flags?: string; hint: string }> = [
  { label: "Between…", pattern: "(?<=START)(.*?)(?=END)", flags: "gs", hint: "Anything between two strings — replace START/END" },
  { label: "Email", pattern: "\\b[\\w.-]+@[\\w.-]+\\.\\w+\\b", hint: "Email addresses" },
  { label: "URL", pattern: "https?:\\/\\/[^\\s]+", hint: "HTTP / HTTPS URLs" },
  { label: "IPv4", pattern: "\\b\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\b", hint: "IP v4 addresses" },
  { label: "Phone (US)", pattern: "\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}", hint: "US phone numbers" },
  { label: "Date", pattern: "\\d{4}-\\d{2}-\\d{2}", hint: "YYYY-MM-DD dates" },
  { label: "Quoted", pattern: '"([^"]*)"', hint: "Double-quoted strings (capture group)" },
  { label: "HTML tag", pattern: "<[^>]+>", flags: "g", hint: "HTML tags" },
  { label: "Numbers", pattern: "\\b\\d+\\.\\d*\\b", flags: "g", hint: "Decimal numbers" },
  { label: "Words", pattern: "\\b\\w+\\b", flags: "g", hint: "Whole words" },
  { label: "Lines", pattern: "^.+$", flags: "gm", hint: "Non-empty lines" },
  { label: "Whitespace", pattern: "\\s+", flags: "g", hint: "Whitespace runs" },
];

import { NumberStepper } from "@/components/workspace/NumberStepper";
import { Dropdown } from "@/components/workspace/Dropdown";
import { Tooltip } from "@/components/workspace/Tooltip";
import {
  menuItemClass as sharedMenuItemClass,
  menuCheck as sharedMenuCheck,
} from "@/components/workspace/menuStyles";
import { toast } from "@/components/Toast";
import { TreeView } from "@/components/TreeView";
import type { JsonValue } from "@/lib/json/core";
import {
  generateLorem,
  generatePassword,
  generateUuid,
  nowIso,
  utilPlaceholder,
  uuidNil,
  type ColorParts,
  type LoremUnit,
  type RegexMatch,
  type TextCaseMode,
  type UrlParts,
  type UtilTab,
  UTIL_TABS,
} from "@/lib/utils/devtools";

import {
  CODEC_TABS,
  GENERATOR_TABS,
  UUID_VARIANT_LABELS,
  applyUtilSample,
  computeUtil,
  decodeText,
  defaultUtilToolState,
  selectFieldAll,
  type UtilToolState,
  type UtilsStateMap,
} from "@/components/utils/state";
export type { UtilTab };
export { applyUtilSample, defaultUtilToolState, type UtilToolState, type UtilsStateMap };

interface UtilsPanelProps {
  linkBtnClass: string;
  panelClass: string;
  isDark?: boolean;
  activeTab: UtilTab;
  onActiveTabChange: (tab: UtilTab) => void;
  stateByTool: UtilsStateMap;
  onStateByToolChange: (next: UtilsStateMap) => void;
  /** Bumped when a new workspace tab is created so generators seed fresh values. */
  regenKey?: number;
  /** Match Monaco / playground editor font size */
  fontSize?: number;
}

export function UtilsPanel({
  linkBtnClass,
  panelClass,
  isDark,
  activeTab,
  onActiveTabChange,
  stateByTool,
  onStateByToolChange,
  regenKey = 0,
  fontSize = 13,
}: UtilsPanelProps) {
  // Merge restored state over defaults so partial snapshots (older sessions /
  // shared links) always expose every field - fixes crashes on missing lists.
  const state = useMemo(
    () => ({ ...defaultUtilToolState(activeTab), ...(stateByTool[activeTab] ?? {}) }),
    [stateByTool, activeTab],
  );

  const mapRef = useRef(stateByTool);
  mapRef.current = stateByTool;

  useEffect(() => {
    if (mapRef.current[activeTab]) return;
    onStateByToolChange({
      ...mapRef.current,
      [activeTab]: defaultUtilToolState(activeTab),
    });
  }, [activeTab, onStateByToolChange]);

  const patch = useCallback(
    (partial: Partial<UtilToolState>) => {
      const cur = mapRef.current[activeTab] ?? defaultUtilToolState(activeTab);
      onStateByToolChange({
        ...mapRef.current,
        [activeTab]: { ...cur, ...partial, touched: true },
      });
    },
    [activeTab, onStateByToolChange],
  );

  const flash = useCallback(
    (msg: string) => toast({ message: msg, type: /failed/i.test(msg) ? "error" : "success" }),
    [],
  );

  const copy = async (text: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      flash(label);
    } catch {
      flash("Copy failed");
    }
  };

  /** Which UUID card was just copied — shows a checkmark flash. */
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const copiedTimerRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLUListElement | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  const copyCard = (i: number, value: string, label: string) => {
    setCopiedIndex(i);
    if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => setCopiedIndex(null), 900);
    void copy(value, label);
  };

  /** Keyboard grid navigation: arrows move focus, Enter copies the focused card. */
  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const list = state.uuidList.length > 0 ? state.uuidList : state.pwList;
    const n = list.length;
    if (n === 0) return;
    const target = e.target as HTMLElement;
    const current = Math.min(
      n - 1,
      Math.max(0, Number(target.closest("li")?.getAttribute("data-index") ?? focusIndex ?? 0)),
    );
    const move = (idx: number) => {
      const els = gridRef.current?.querySelectorAll<HTMLElement>("li[data-index]");
      const next = Math.min(n - 1, Math.max(0, idx));
      els?.[next]?.focus();
    };
    if (e.key === "Enter") {
      const value = list[current];
      if (value) {
        e.preventDefault();
        if (activeTab === "password") copyCard(current, value, "Password copied");
        else copyCard(current, value, "UUID copied");
      }
      return;
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      move(current + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      move(current - 1);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const grid = gridRef.current;
      const cols = grid ? Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(" ").length) : 1;
      move(e.key === "ArrowDown" ? current + cols : current - cols);
    }
  };

  /** Bump to force full regeneration of the active generator tool. */
  const [batchSeed, setBatchSeed] = useState(0);
  const bumpBatch = useCallback(() => setBatchSeed((n) => n + 1), []);

  const isV5 = state.uuidVariant === "v5";
  const v5Namespace = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
  /** v5 is deterministic: give each slot a unique name so a batch isn't all-identical. */
  const v5NameFor = (i: number) => (isV5 ? `${state.uuidName || "formaty"}-${i + 1}` : state.uuidName);

  /** Full regeneration for UUID (New / One / NIL / variant / name / count changes handled separately). */
  useEffect(() => {
    if (activeTab !== "uuid") return;
    let cancelled = false;
    void (async () => {
      try {
        const n = Math.max(1, Math.min(50, state.uuidCount));
        const list = await Promise.all(
          Array.from({ length: n }, (_, i) =>
            Promise.resolve(generateUuid(state.uuidVariant, v5Namespace, v5NameFor(i))),
          ),
        );
        if (cancelled) return;
        patch({ uuidList: list, output: list.join("\n"), error: null });
      } catch (e) {
        if (cancelled) return;
        patch({ error: e instanceof Error ? e.message : "Failed", output: "", uuidList: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, state.uuidVariant, state.uuidName, batchSeed, regenKey]);

  /** Count changes: append or trim only - never regenerate existing IDs. */
  const prevUuidCount = useRef(state.uuidCount);
  useEffect(() => {
    if (activeTab !== "uuid") return;
    if (prevUuidCount.current === state.uuidCount) return;
    prevUuidCount.current = state.uuidCount;
    const cur = mapRef.current[activeTab] ?? defaultUtilToolState(activeTab);
    const list = cur.uuidList ?? [];
    const n = Math.max(1, Math.min(50, state.uuidCount));
    if (list.length === n) return;
    if (list.length > n) {
      const trimmed = list.slice(0, n);
      patch({ uuidList: trimmed, output: trimmed.join("\n"), error: null });
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const extra = await Promise.all(
          Array.from({ length: n - list.length }, (_, i) =>
            Promise.resolve(generateUuid(state.uuidVariant, v5Namespace, v5NameFor(list.length + i))),
          ),
        );
        if (cancelled) return;
        const next = [...list, ...extra];
        patch({ uuidList: next, output: next.join("\n"), error: null });
      } catch (e) {
        if (cancelled) return;
        patch({ error: e instanceof Error ? e.message : "Failed" });
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, state.uuidCount, state.uuidVariant, state.uuidName, batchSeed]);

  /** Full regeneration for passwords. */
  useEffect(() => {
    if (activeTab !== "password") return;
    const n = Math.max(1, Math.min(50, state.pwCount));
    const list = Array.from({ length: n }, () =>
      generatePassword(state.passwordLen, {
        lower: state.pwLower,
        upper: state.pwUpper,
        digits: state.pwDigits,
        symbols: state.pwSymbols,
      }),
    );
    patch({ pwList: list, output: list.join("\n"), error: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    state.passwordLen,
    state.pwLower,
    state.pwUpper,
    state.pwDigits,
    state.pwSymbols,
    batchSeed,
    regenKey,
  ]);

  /** Password count: append or trim only. */
  const prevPwCount = useRef(state.pwCount);

  // Reset count-tracking refs when switching tools so a tab switch never trims
  // a persisted batch (each tool keeps its own count in state).
  useEffect(() => {
    prevUuidCount.current = state.uuidCount;
    prevPwCount.current = state.pwCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);
  useEffect(() => {
    if (activeTab !== "password") return;
    if (prevPwCount.current === state.pwCount) return;
    prevPwCount.current = state.pwCount;
    const cur = mapRef.current[activeTab] ?? defaultUtilToolState(activeTab);
    const list = cur.pwList ?? [];
    const n = Math.max(1, Math.min(50, state.pwCount));
    if (list.length === n) return;
    if (list.length > n) {
      const trimmed = list.slice(0, n);
      patch({ pwList: trimmed, output: trimmed.join("\n"), error: null });
      return;
    }
    const extra = Array.from({ length: n - list.length }, () =>
      generatePassword(state.passwordLen, {
        lower: state.pwLower,
        upper: state.pwUpper,
        digits: state.pwDigits,
        symbols: state.pwSymbols,
      }),
    );
    const next = [...list, ...extra];
    patch({ pwList: next, output: next.join("\n"), error: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, state.pwCount, state.passwordLen, state.pwLower, state.pwUpper, state.pwDigits, state.pwSymbols, batchSeed]);

  /** Lorem regeneration. */
  useEffect(() => {
    if (activeTab !== "lorem") return;
    const text = generateLorem(state.loremCount, state.loremUnit);
    patch({ output: text, error: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, state.loremCount, state.loremUnit, batchSeed, regenKey]);

  const runGen = useRef(0);
  useEffect(() => {
    const s = mapRef.current[activeTab] ?? defaultUtilToolState(activeTab);
    if (GENERATOR_TABS.has(activeTab)) return; // handled by dedicated effects above
    // Codec right-side (encoded) editing is handled by a dedicated effect below.
    if (CODEC_TABS.has(activeTab) && s.editSide === "right") return;
    const gen = ++runGen.current;
    const delay = activeTab === "time" ? 0 : 160;
    const id = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await computeUtil(activeTab, s);
          if (runGen.current !== gen) return;
          const cur = mapRef.current[activeTab] ?? s;
          const next = { ...cur, ...result };
          if (
            next.output === cur.output &&
            next.error === cur.error &&
            (next.uuidList?.join("\n") ?? "") === (cur.uuidList?.join("\n") ?? "") &&
            (next.pwList?.join("\n") ?? "") === (cur.pwList?.join("\n") ?? "")
          ) {
            return;
          }
          onStateByToolChange({ ...mapRef.current, [activeTab]: next });
        } catch (e) {
          if (runGen.current !== gen) return;
          const cur = mapRef.current[activeTab] ?? s;
          const msg = e instanceof Error ? e.message : "Failed";
          if (cur.error === msg) return;
          onStateByToolChange({
            ...mapRef.current,
            [activeTab]: {
              ...cur,
              error: msg,
              output: "",
            },
          });
        }
      })();
    }, delay);
    return () => window.clearTimeout(id);
  }, [
    activeTab,
    state.input,
    state.caseMode,
    state.hashAlgo,
    state.regexPattern,
    state.regexFlags,
    onStateByToolChange,
    regenKey,
  ]);

  // Bidirectional codec: editing the encoded (right) side auto-decodes back to the left.
  const codecRun = useRef(0);
  useEffect(() => {
    if (!CODEC_TABS.has(activeTab) || state.editSide !== "right") return;
    const gen = ++codecRun.current;
    const id = window.setTimeout(() => {
      void (async () => {
        try {
          const dec = decodeText(activeTab, state.output);
          if (codecRun.current !== gen) return;
          patch({ input: dec, error: null });
        } catch (e) {
          if (codecRun.current !== gen) return;
          patch({ error: e instanceof Error ? e.message : "Failed" });
        }
      })();
    }, 160);
    return () => window.clearTimeout(id);
  }, [activeTab, state.output, state.editSide, patch]);

  const charSetChip = (active: boolean) =>
    `h-6 shrink-0 cursor-pointer rounded-md border px-2 text-[11px] font-medium transition-colors ${active
      ? "border-primary/40 bg-primary/10 text-primary"
      : "border-[var(--workspace-border)] text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"}`;
  const pwStrength = useMemo(() => {
    const sets = [state.pwLower, state.pwUpper, state.pwDigits, state.pwSymbols].filter(Boolean).length;
    const entropy = state.passwordLen * Math.log2(Math.max(2, sets * 8));
    if (entropy >= 90) return { score: 4, label: "Strong", color: "bg-emerald-500" };
    if (entropy >= 60) return { score: 3, label: "Good", color: "bg-lime-500" };
    if (entropy >= 35) return { score: 2, label: "Fair", color: "bg-amber-500" };
    return { score: 1, label: "Weak", color: "bg-red-500" };
  }, [state.passwordLen, state.pwLower, state.pwUpper, state.pwDigits, state.pwSymbols]);

  // Same visual language as Monaco panes: panel surface, not muted "disabled" gray
  const fieldClass =
    "min-h-0 w-full flex-1 resize-none border-0 bg-[var(--workspace-panel)] px-3 py-2 font-mono leading-relaxed text-[var(--workspace-text)] outline-none focus:ring-0";
  const toolBtn = (active: boolean) =>
    `${linkBtnClass} h-7 min-h-7 px-2 text-[11px] font-medium ${active ? "!bg-primary/12 !text-primary" : ""}`;

  /** Same select-trigger look as the workspace Format / View / Actions dropdowns. */
  const selectTrigger =
    "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-muted px-2 text-[11px] font-medium text-[var(--workspace-text)] transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40";
  const modeChip = (active: boolean) =>
    `h-7 shrink-0 cursor-pointer px-2.5 text-[11px] font-semibold transition-colors ${
      active
        ? "bg-primary/15 text-primary"
        : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"
    }`;
  const modeGroup = "flex h-7 shrink-0 overflow-hidden rounded-lg border border-[var(--workspace-border)]";
  const paneHeader =
    "flex h-10 shrink-0 items-center gap-1 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2";
  const smallInput =
    "h-7 shrink-0 rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)]/50 px-2 font-mono text-[11px] text-[var(--workspace-text)] outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30";

  const activeLabel = UTIL_TABS.find((t) => t.id === activeTab)?.label ?? activeTab;

  const CASE_MODES: TextCaseMode[] = [
    "snake",
    "kebab",
    "camel",
    "pascal",
    "constant",
    "slug",
    "upper",
    "lower",
    "title",
    "reverse",
    "trim",
  ];
  const [caseMenuOpen, setCaseMenuOpen] = useState(false);
  const [variantMenuOpen, setVariantMenuOpen] = useState(false);
  const [loremMenuOpen, setLoremMenuOpen] = useState(false);

  /** UUID toolbar - shared buttons for One / NIL. */
  const uuidOne = () => {
    void (async () => {
      try {
        const id = await Promise.resolve(generateUuid(state.uuidVariant, v5Namespace, state.uuidName));
        patch({ uuidList: [id], output: id, error: null });
      } catch (e) {
        patch({ error: e instanceof Error ? e.message : "Failed" });
      }
    })();
  };
  const uuidNilNow = () => {
    const id = uuidNil();
    patch({ uuidList: [id], output: id, error: null });
  };

  /** Structured-view helpers: parse the JSON stored in state.output. */
  const parsedOutput = useMemo<unknown>(() => {
    if (!state.output) return null;
    try {
      return JSON.parse(state.output) as unknown;
    } catch {
      return null;
    }
  }, [state.output]);

  const [jwtView, setJwtView] = useState<"raw" | "tree">("raw");

  const structuredCopy = (label: string, value: string) => void copy(value, `${label} copied`);

  const partKeyClass =
    "shrink-0 truncate text-[11px] font-semibold text-[var(--workspace-text-muted)]";

  return (
    <div className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden md:flex-row ${panelClass}`}>
      {/* Util menu */}
      <nav
        className="flex min-h-0 flex-col overflow-hidden border-[var(--workspace-border)] bg-[var(--workspace-panel)] md:w-[9.5rem] md:shrink-0 md:border-r"
        aria-label="Utils tools"
      >
        <div
          className="flex shrink-0 gap-0.5 overflow-x-auto border-b border-[var(--workspace-border)] p-1.5 md:hidden"
          role="tablist"
        >
          {UTIL_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === activeTab}
              className={`h-7 shrink-0 rounded-md px-2.5 text-[11px] font-semibold transition-colors ${
                t.id === activeTab
                  ? "bg-primary/15 text-primary"
                  : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)]"
              }`}
              onClick={() => onActiveTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div
          className="hidden min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-1.5 md:flex"
          role="tablist"
          aria-orientation="vertical"
        >
          <p className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">
            Tools
          </p>
          {UTIL_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === activeTab}
              className={`flex h-8 w-full shrink-0 items-center rounded-md px-2.5 text-left text-[12px] font-medium transition-colors ${
                t.id === activeTab
                  ? "bg-primary/15 text-primary"
                  : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"
              }`}
              onClick={() => onActiveTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {GENERATOR_TABS.has(activeTab) ? (
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">
              {activeLabel}
            </span>
            <span className="flex-1" />
            {activeTab === "uuid" ? (
              <>
                <Dropdown
                  open={variantMenuOpen}
                  onOpenChange={setVariantMenuOpen}
                  side="bottom"
                  align="end"
                  maxWidth="max-w-[16rem]"
                  trigger={
                    <Tooltip content="UUID variant">
                      <button
                        type="button"
                        className={`${selectTrigger} uppercase ${variantMenuOpen ? "!bg-primary/12 !text-primary" : ""}`}
                        aria-label="UUID variant"
                      >
                        {state.uuidVariant}
                        <ChevronDownIcon className="h-3 w-3 shrink-0 opacity-60" />
                      </button>
                    </Tooltip>
                  }
                >
                  <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                    {UUID_VARIANT_LABELS.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={`${sharedMenuItemClass} ${state.uuidVariant === v.id ? "!bg-primary/12 !text-primary" : ""}`}
                        onClick={() => {
                          patch({ uuidVariant: v.id });
                          setVariantMenuOpen(false);
                        }}
                      >
                        {sharedMenuCheck(state.uuidVariant === v.id)}
                        <span className="w-6 shrink-0 uppercase">{v.label}</span>
                        <span className="min-w-0 flex-1 truncate text-right text-[9px] font-normal text-[var(--workspace-text-muted)]">{v.title}</span>
                      </button>
                    ))}
                  </div>
                </Dropdown>
                {isV5 && (
                  <input
                    type="text"
                    value={state.uuidName}
                    onChange={(e) => patch({ uuidName: e.target.value })}
                    placeholder="Name for v5"
                    aria-label="v5 name"
                    className={`${smallInput} w-28`}
                  />
                )}
                <NumberStepper label="Count" value={state.uuidCount} min={1} max={50} onChange={(n) => patch({ uuidCount: n })} aria-label="UUID count" />
                <Tooltip content="Generate a new batch">
                <button type="button" className={toolBtn(false)} onClick={bumpBatch}>New</button>
                </Tooltip>
                <Tooltip content="Replace with one UUID">
                <button type="button" className={toolBtn(false)} onClick={uuidOne}>One</button>
                </Tooltip>
                <Tooltip content="Replace with nil UUID">
                <button type="button" className={toolBtn(false)} onClick={uuidNilNow}>NIL</button>
                </Tooltip>
              </>
            ) : activeTab === "password" ? (
              <>
                <NumberStepper label="Count" value={state.pwCount} min={1} max={50} onChange={(n) => patch({ pwCount: n })} aria-label="Password count" />
                <NumberStepper label="Len" value={state.passwordLen} min={4} max={128} onChange={(n) => patch({ passwordLen: n })} aria-label="Password length" />
                <button type="button" className={toolBtn(false)} onClick={bumpBatch}>New</button>
              </>
            ) : (
              <>
                <Dropdown
                  open={loremMenuOpen}
                  onOpenChange={setLoremMenuOpen}
                  side="bottom"
                  align="end"
                  maxWidth="max-w-[12rem]"
                  trigger={
                    <Tooltip content="Lorem unit">
                      <button
                        type="button"
                        className={`${selectTrigger} capitalize ${loremMenuOpen ? "!bg-primary/12 !text-primary" : ""}`}
                        aria-label="Lorem unit"
                      >
                        {state.loremUnit}
                        <ChevronDownIcon className="h-3 w-3 shrink-0 opacity-60" />
                      </button>
                    </Tooltip>
                  }
                >
                  <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                    {(["words", "sentences", "paragraphs"] as LoremUnit[]).map((u) => (
                      <button
                        key={u}
                        type="button"
                        className={`${sharedMenuItemClass} capitalize ${state.loremUnit === u ? "!bg-primary/12 !text-primary" : ""}`}
                        onClick={() => {
                          patch({ loremUnit: u });
                          setLoremMenuOpen(false);
                        }}
                      >
                        {sharedMenuCheck(state.loremUnit === u)}
                        {u}
                      </button>
                    ))}
                  </div>
                </Dropdown>
                <NumberStepper label="Count" value={state.loremCount} min={1} max={100} onChange={(n) => patch({ loremCount: n })} aria-label="Lorem count" />
                <button type="button" className={toolBtn(false)} onClick={bumpBatch}>New</button>
              </>
            )}
          </div>
          {activeTab === "password" && (
            <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]/50 px-2 py-1.5">
              {(
                [
                  ["a-z", "pwLower", "Lowercase letters"],
                  ["A-Z", "pwUpper", "Uppercase letters"],
                  ["0-9", "pwDigits", "Digits"],
                  ["!@#", "pwSymbols", "Symbols"],
                ] as const
              ).map(([label, key, title]) => (
                <Tooltip key={key} content={title} className="shrink-0">
                <button
                  type="button"
                  aria-pressed={state[key]}
                  className={charSetChip(state[key])}
                  onClick={() => patch({ [key]: !state[key] })}
                >
                  {label}
                </button>
                </Tooltip>
              ))}
              <Tooltip content={`Estimated strength: ${pwStrength.label}`} className="ml-auto flex items-center gap-1.5">
              <span className="flex items-center gap-1.5">
                <span className="flex items-end gap-0.5" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={`h-1.5 w-3 rounded-sm ${i < pwStrength.score ? pwStrength.color : "bg-[var(--workspace-border)]/60"}`} />
                  ))}
                </span>
                <span className="text-[10px] font-semibold text-[var(--workspace-text-muted)]">{pwStrength.label}</span>
              </span>
              </Tooltip>
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col bg-[var(--workspace-panel)]">
            {activeTab === "lorem" ? (
              <pre
                className={`${fieldClass} overflow-auto whitespace-pre-wrap break-words`}
                style={{ fontSize }}
                tabIndex={0}
                onKeyDown={selectFieldAll}
              >
                {state.output || <span className="text-[var(--workspace-text-muted)]">Set a count, then press New.</span>}
              </pre>
            ) : (activeTab === "uuid" && state.uuidList.length > 0) || (activeTab === "password" && state.pwList.length > 0) ? (
              <ul
                ref={gridRef}
                className="grid min-h-0 flex-1 auto-rows-min grid-cols-[repeat(auto-fill,minmax(min(19rem,100%),1fr))] content-start gap-1.5 overflow-auto p-2"
                role="grid"
                aria-label={`Generated ${activeLabel}s, click a card or press Enter to copy`}
                onKeyDown={handleGridKeyDown}
              >
                {(activeTab === "uuid" ? state.uuidList : state.pwList).map((value, i) => {
                  const isCopied = copiedIndex === i;
                  const cardClass = `group flex min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-1.5 font-mono text-[12px] text-[var(--workspace-text)] transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60 ${
                    isCopied
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
                      : "border-[var(--workspace-border)]/70 bg-[var(--workspace-background)]/50 hover:-translate-y-px hover:border-primary/40 hover:bg-[var(--workspace-background)] hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.35)]"
                  }`;
                  const cardInner = (
                    <>
                      <span
                        className={`w-5 shrink-0 select-none text-center text-[10px] tabular-nums ${
                          isCopied ? "text-emerald-500/80" : "rounded bg-[var(--workspace-border)]/40 py-0.5 text-[var(--workspace-text-muted)]"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <Tooltip content={value} className="min-w-0 flex-1">
                      <span className="block truncate select-all">
                        {value}
                      </span>
                      </Tooltip>
                      {isCopied ? (
                        <span className="shrink-0">
                          <CheckIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                        </span>
                      ) : (
                        <DocumentDuplicateIcon className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-text-muted)]/50 transition-colors duration-150 group-hover:text-[var(--workspace-text)]" />
                      )}
                    </>
                  );
                  return (
                    <li
                      key={`${value}-${i}`}
                      data-index={i}
                      role="gridcell"
                      tabIndex={0}
                      aria-label={`Copy ${activeTab === "uuid" ? `UUID ${i + 1}` : `password ${i + 1}`}`}
                      onClick={() => copyCard(i, value, activeTab === "uuid" ? "UUID copied" : "Password copied")}
                      onFocus={() => setFocusIndex(i)}
                      className={cardClass}
                      style={{ fontSize }}
                    >
                      {cardInner}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-1 items-center justify-center px-4 text-center text-[13px] text-[var(--workspace-text-muted)]">
                {activeTab === "uuid"
                  ? "Set a count, then press New to generate UUIDs."
                  : "Set a length, then press New to generate passwords."}
              </div>
            )}
          </div>
        </div>
      ) : CODEC_TABS.has(activeTab) ? (
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 md:grid-cols-2">
          <div className="flex min-h-0 flex-col border-b border-[var(--workspace-border)] md:border-b-0 md:border-r">
            <div className={paneHeader}>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">Plain text</span>
              {state.editSide === "left" && (
                <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-primary">
                  <ArrowLongRightIcon className="h-2.5 w-2.5" aria-hidden /> encodes
                </span>
              )}
            </div>
            <div className="flex min-h-0 flex-1 flex-col bg-[var(--workspace-panel)]">
              <textarea
                className={fieldClass}
                style={{ fontSize }}
                value={state.input}
                onChange={(e) => patch({ input: e.target.value, editSide: "left" })}
                onKeyDown={selectFieldAll}
                placeholder={utilPlaceholder(activeTab)}
                spellCheck={false}
              />
            </div>
          </div>
          <div className="flex min-h-0 flex-col">
            <div className={paneHeader}>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">Encoded</span>
              {state.editSide === "right" && (
                <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-primary">
                  <ArrowLongRightIcon className="h-2.5 w-2.5 rotate-180" aria-hidden /> decodes
                </span>
              )}
              <span className="flex-1" />
              {state.error && <span className="text-[10px] text-red-500">{state.error}</span>}
            </div>
            <div className="flex min-h-0 flex-1 flex-col bg-[var(--workspace-panel)]">
              <textarea
                className={fieldClass}
                style={{ fontSize }}
                value={state.output}
                onChange={(e) => patch({ output: e.target.value, editSide: "right" })}
                placeholder="Encoded result - edit here to decode back to plain text"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      ) : activeTab === "jwt" ? (
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 md:grid-cols-2">
          <div className="flex min-h-0 flex-col border-b border-[var(--workspace-border)] md:border-b-0 md:border-r">
            <div className={paneHeader}>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">
                Input
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col bg-[var(--workspace-panel)]">
              <textarea
                className={fieldClass}
                style={{ fontSize }}
                value={state.input}
                onChange={(e) => patch({ input: e.target.value })}
                onKeyDown={selectFieldAll}
                placeholder={utilPlaceholder(activeTab)}
                spellCheck={false}
              />
            </div>
          </div>
          <div className="flex min-h-0 flex-col">
            <div className={paneHeader}>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">
                Output
              </span>
              <span className="ml-1.5 flex h-6 shrink-0 overflow-hidden rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)]/50">
                {(["raw", "tree"] as const).map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    className={`h-6 px-2 text-[10px] font-semibold capitalize transition-colors ${
                      i > 0 ? "border-l border-[var(--workspace-border)]" : ""
                    } ${jwtView === v ? "bg-primary/15 text-primary" : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"}`}
                    onClick={() => setJwtView(v)}
                  >
                    {v}
                  </button>
                ))}
              </span>
              <span className="flex-1" />
              {state.error && <span className="text-[10px] text-red-500">{state.error}</span>}
            </div>
            <div className="flex min-h-0 flex-1 flex-col bg-[var(--workspace-panel)]">
              {jwtView === "tree" ? (
                state.output ? (
                  <div className="min-h-0 flex-1 overflow-auto p-2">
                    <TreeView
                      data={(parsedOutput ?? {}) as JsonValue}
                      isDark={isDark}
                      showTypeBadges={false}
                      defaultExpanded
                      fontSize={fontSize}
                      onNotify={(msg) => toast({ message: msg })}
                    />
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center px-4 text-center text-[13px] text-[var(--workspace-text-muted)]">
                    Paste a JWT to decode it.
                  </div>
                )
              ) : state.error ? (
                <div className="m-2 flex flex-col gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                  <span>{state.error}</span>
                </div>
              ) : (
                <pre
                  className={`${fieldClass} overflow-auto whitespace-pre-wrap break-all`}
                  style={{ fontSize }}
                  tabIndex={0}
                  onKeyDown={selectFieldAll}
                >
                  {state.output || (
                    <span className="text-[var(--workspace-text-muted)]">Decoded JWT appears here</span>
                  )}
                </pre>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "regex" ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className={paneHeader}>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">Pattern</span>
            <input
              type="text"
              value={state.regexPattern}
              onChange={(e) => patch({ regexPattern: e.target.value })}
              placeholder="\b(\w+)@(\w+)\b"
              spellCheck={false}
              aria-label="Regex pattern"
              className={`${smallInput} min-w-0 flex-1`}
            />
            <input
              type="text"
              value={state.regexFlags}
              onChange={(e) => patch({ regexFlags: e.target.value })}
              placeholder="g"
              spellCheck={false}
              aria-label="Regex flags"
              className={`${smallInput} w-16`}
            />
            {state.error && <span className="shrink-0 text-[10px] text-red-500">{state.error}</span>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]/50 px-2 py-1.5">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">
              Quick
            </span>
            {REGEX_PRESETS.map((p) => (
              <Tooltip key={p.label} content={p.hint}>
              <button
                type="button"
                onClick={() => patch({ regexPattern: p.pattern, regexFlags: p.flags ?? "g" })}
                className="h-6 shrink-0 cursor-pointer rounded-md border border-[var(--workspace-border)] px-2 text-[10px] font-medium text-[var(--workspace-text-muted)] transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
              >
                {p.label}
              </button>
              </Tooltip>
            ))}
          </div>
          <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 md:grid-cols-2">
            <div className="flex min-h-0 flex-col border-b border-[var(--workspace-border)] md:border-b-0 md:border-r">
              <div className={paneHeader}>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">Test text</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col bg-[var(--workspace-panel)]">
                <textarea
                  className={fieldClass}
                  style={{ fontSize }}
                  value={state.input}
                  onChange={(e) => patch({ input: e.target.value })}
                  onKeyDown={selectFieldAll}
                  placeholder={utilPlaceholder(activeTab)}
                  spellCheck={false}
                />
              </div>
            </div>
            <div className="flex min-h-0 flex-col">
              <div className={paneHeader}>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">
                  Matches
                </span>
                {(() => {
                  const p = parsedOutput as { count?: number } | null;
                  return typeof p?.count === "number" ? (
                    <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-px text-[10px] font-semibold tabular-nums text-primary">
                      {p.count}
                    </span>
                  ) : null;
                })()}
              </div>
              <div className="min-h-0 flex-1 overflow-auto bg-[var(--workspace-panel)] p-1.5">
                {(() => {
                  const p = parsedOutput as { matches?: RegexMatch[] } | null;
                  const matches = p?.matches ?? [];
                  if (matches.length === 0) {
                    return (
                      <p className="px-2 py-3 text-[11px] text-[var(--workspace-text-muted)]">
                        No matches yet. Enter a pattern and some test text.
                      </p>
                    );
                  }
                  return (
                    <ul className="flex flex-col gap-1">
                      {matches.map((m, i) => (
                        <li
                          key={i}
                          className="group flex min-w-0 items-center gap-2 rounded-lg border border-[var(--workspace-border)]/50 bg-[var(--workspace-background)]/50 px-2 py-1.5"
                        >
                          <span className="shrink-0 rounded bg-[var(--workspace-border)]/40 px-1 py-px text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
                            {m.index}
                          </span>
                          <Tooltip content={m.match} className="min-w-0 flex-1">
                          <code className="block truncate font-mono text-[11px] text-[var(--workspace-text)]">
                            {m.match}
                          </code>
                          </Tooltip>
                          {m.groups.length > 0 && (
                            <span className="hidden shrink-0 text-[9px] text-[var(--workspace-text-muted)] sm:inline">
                              {m.groups.length} group{m.groups.length === 1 ? "" : "s"}
                            </span>
                          )}
                          <Tooltip content="Copy match">
                          <button
                            type="button"
                            className={`${linkBtnClass} h-6 min-h-6 w-6 !p-0 opacity-0 transition-opacity group-hover:opacity-100`}
                            aria-label="Copy match"
                            onClick={() => void copy(m.match, "Match copied")}
                          >
                            <ClipboardDocumentIcon className="h-3 w-3" />
                          </button>
                          </Tooltip>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "color" ? (
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 md:grid-cols-2">
          <div className="flex min-h-0 flex-col border-b border-[var(--workspace-border)] md:border-b-0 md:border-r">
            <div className={paneHeader}>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">Input</span>
              <span className="flex-1" />
              {state.error && <span className="text-[10px] text-red-500">{state.error}</span>}
            </div>
            <div className="flex min-h-0 flex-1 flex-col bg-[var(--workspace-panel)]">
              <textarea
                className={fieldClass}
                style={{ fontSize }}
                value={state.input}
                onChange={(e) => patch({ input: e.target.value })}
                onKeyDown={selectFieldAll}
                placeholder={utilPlaceholder(activeTab)}
                spellCheck={false}
              />
            </div>
          </div>
          <div className="flex min-h-0 flex-col">
            <div className={paneHeader}>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">Converted</span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[var(--workspace-panel)] p-2">
              {(() => {
                const p = parsedOutput as ColorParts | null;
                if (!p) {
                  return (
                    <p className="px-2 py-3 text-[11px] text-[var(--workspace-text-muted)]">
                      Enter a hex, rgb(), hsl(), or CSS color name.
                    </p>
                  );
                }
                const hexMatch = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(p.hex);
                const swatchStyle = hexMatch
                  ? { backgroundColor: p.hex }
                  : { background: "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)" };
                return (
                  <div className="flex flex-col gap-1">
                    <div
                      className="mb-1 h-14 shrink-0 rounded-lg border border-[var(--workspace-border)]"
                      style={swatchStyle}
                      aria-label="Color preview"
                    />
                    {(
                      [
                        ["HEX", p.hex],
                        ["RGB", p.rgb],
                        ["HSL", p.hsl],
                        ["CMYK", p.cmyk],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="group flex min-h-8 items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-primary/5">
                        <span className={`${partKeyClass} !w-12`}>{label}</span>
                        <Tooltip content={value} className="min-w-0 flex-1">
                        <code className="block truncate font-mono text-[11px] text-[var(--workspace-text)]">
                          {value}
                        </code>
                        </Tooltip>
                        <Tooltip content={`Copy ${label}`}>
                        <button
                          type="button"
                          className={`${linkBtnClass} h-6 min-h-6 w-6 !p-0 opacity-0 transition-opacity group-hover:opacity-100`}
                          aria-label={`Copy ${label}`}
                          onClick={() => structuredCopy(label, value)}
                        >
                          <ClipboardDocumentIcon className="h-3 w-3" />
                        </button>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : activeTab === "urlparse" ? (
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 md:grid-cols-2">
          <div className="flex min-h-0 flex-col border-b border-[var(--workspace-border)] md:border-b-0 md:border-r">
            <div className={paneHeader}>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">Input</span>
              <span className="flex-1" />
              {state.error && <span className="text-[10px] text-red-500">{state.error}</span>}
            </div>
            <div className="flex min-h-0 flex-1 flex-col bg-[var(--workspace-panel)]">
              <textarea
                className={fieldClass}
                style={{ fontSize }}
                value={state.input}
                onChange={(e) => patch({ input: e.target.value })}
                onKeyDown={selectFieldAll}
                placeholder={utilPlaceholder(activeTab)}
                spellCheck={false}
              />
            </div>
          </div>
          <div className="flex min-h-0 flex-col">
            <div className={paneHeader}>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">Parts</span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[var(--workspace-panel)] p-2">
              {(() => {
                const p = parsedOutput as UrlParts | null;
                if (!p) {
                  return (
                    <p className="px-2 py-3 text-[11px] text-[var(--workspace-text-muted)]">
                      Enter a URL to split it into parts.
                    </p>
                  );
                }
                const rows: Array<[string, string]> = [
                  ["Href", p.href],
                  ["Protocol", p.protocol],
                  ["Username", p.username],
                  ["Password", p.password],
                  ["Hostname", p.hostname],
                  ["Port", p.port],
                  ["Path", p.pathname],
                  ["Search", p.search],
                  ["Hash", p.hash],
                ];
                return (
                  <div className="flex flex-col gap-1">
                    {rows.map(([label, value]) =>
                      value ? (
                        <div key={label} className="group flex min-h-8 items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-primary/5">
                          <span className={`${partKeyClass} !w-16`}>{label}</span>
                          <Tooltip content={value} className="min-w-0 flex-1">
                          <code className="block truncate font-mono text-[11px] text-[var(--workspace-text)]">
                            {value}
                          </code>
                          </Tooltip>
                          <Tooltip content={`Copy ${label}`}>
                          <button
                            type="button"
                            className={`${linkBtnClass} h-6 min-h-6 w-6 !p-0 opacity-0 transition-opacity group-hover:opacity-100`}
                            aria-label={`Copy ${label}`}
                            onClick={() => structuredCopy(label, value)}
                          >
                            <ClipboardDocumentIcon className="h-3 w-3" />
                          </button>
                          </Tooltip>
                        </div>
                      ) : null,
                    )}
                    {p.params.length > 0 && (
                      <div className="mt-2">
                        <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">
                          Query params
                        </p>
                        {p.params.map((param, i) => (
                          <div key={i} className="group flex min-h-8 items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-primary/5">
                            <span className={`${partKeyClass} !w-16`}>{param.key}</span>
                            <Tooltip content={param.value} className="min-w-0 flex-1">
                            <code className="block truncate font-mono text-[11px] text-[var(--workspace-text)]">
                              {param.value}
                            </code>
                            </Tooltip>
                            <Tooltip content={`Copy ${param.key}`}>
                            <button
                              type="button"
                              className={`${linkBtnClass} h-6 min-h-6 w-6 !p-0 opacity-0 transition-opacity group-hover:opacity-100`}
                              aria-label={`Copy ${param.key}`}
                              onClick={() => structuredCopy(param.key, param.value)}
                            >
                              <ClipboardDocumentIcon className="h-3 w-3" />
                            </button>
                            </Tooltip>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 md:grid-cols-2">
        {/* Input */}
        <div className="flex min-h-0 flex-col border-b border-[var(--workspace-border)] md:border-b-0 md:border-r">
          <div className={paneHeader}>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">
              Input
            </span>
            <span className="hidden text-[10px] text-[var(--workspace-text-muted)] sm:inline">
              · {activeLabel}
            </span>
            <span className="flex-1" />
            {activeTab === "hash" && (
              <div className={modeGroup} role="group" aria-label="Hash algorithm">
                {(["sha256", "sha1"] as const).map((a, i) => (
                  <button
                    key={a}
                    type="button"
                    className={`${modeChip(state.hashAlgo === a)}${i > 0 ? " border-l border-[var(--workspace-border)]" : ""}`}
                    onClick={() => patch({ hashAlgo: a })}
                  >
                    {a.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
            {activeTab === "case" && (
              <Dropdown
                open={caseMenuOpen}
                onOpenChange={setCaseMenuOpen}
                side="bottom"
                align="end"
                maxWidth="max-w-[12rem]"
                trigger={
                  <Tooltip content="Case mode">
                    <button type="button" className={`${selectTrigger} ${caseMenuOpen ? "!bg-primary/12 !text-primary" : ""}`} aria-label="Case mode">
                      {state.caseMode}
                      <ChevronDownIcon className="h-3 w-3 shrink-0 opacity-60" />
                    </button>
                  </Tooltip>
                }
              >
                <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
                  {CASE_MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`${sharedMenuItemClass} capitalize ${state.caseMode === m ? "!bg-primary/12 !text-primary" : ""}`}
                      onClick={() => {
                        patch({ caseMode: m });
                        setCaseMenuOpen(false);
                      }}
                    >
                      {sharedMenuCheck(state.caseMode === m)}
                      {m}
                    </button>
                  ))}
                </div>
              </Dropdown>
            )}
            {activeTab === "time" && (
              <Tooltip content="Insert current time (ISO)">
              <button
                type="button"
                className={toolBtn(false)}
                onClick={() => patch({ input: nowIso(), error: null })}
              >
                Now
              </button>
              </Tooltip>
            )}
          </div>
          <div className="flex min-h-0 flex-1 flex-col bg-[var(--workspace-panel)]">
            <textarea
              className={fieldClass}
              style={{ fontSize }}
              value={state.input}
              onChange={(e) => patch({ input: e.target.value })}
              onKeyDown={selectFieldAll}
              placeholder={utilPlaceholder(activeTab)}
              spellCheck={false}
            />
          </div>
        </div>

        {/* Output */}
        <div className="flex min-h-0 flex-col">
          <div className={paneHeader}>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">
              Output
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col bg-[var(--workspace-panel)]">
            {state.error ? (
              <div className="m-2 flex flex-col gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                <span>{state.error}</span>
              </div>
            ) : (
              <pre
                className={`${fieldClass} overflow-auto whitespace-pre-wrap break-all`}
                style={{ fontSize }}
                tabIndex={0}
                onKeyDown={selectFieldAll}
              >
                {state.output || (
                  <span className="text-[var(--workspace-text-muted)]">Result appears here</span>
                )}
              </pre>
            )}
          </div>
        </div>
        </div>
        )}
      </div>
    </div>
  );
}
