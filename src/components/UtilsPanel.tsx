"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { NumberStepper } from "@/components/workspace/NumberStepper";
import { Tooltip } from "@/components/workspace/Tooltip";
import {
  convertNumberBase,
  decodeJwt,
  fromBase64,
  fromHex,
  generatePassword,
  generateUuidV4,
  htmlDecode,
  htmlEncode,
  isoToUnix,
  jsonEscape,
  jsonUnescape,
  nowIso,
  nowUnixMs,
  nowUnixSeconds,
  prettyJson,
  sha1Hex,
  sha256Hex,
  textStats,
  toBase64,
  toHex,
  transformCase,
  unixToIso,
  urlDecode,
  urlEncode,
  utilPlaceholder,
  uuidNil,
  type TextCaseMode,
  type UtilTab,
  UTIL_SAMPLES,
  UTIL_TABS,
} from "@/lib/utils/devtools";

export type { UtilTab };

export interface UtilToolState {
  input: string;
  output: string;
  error: string | null;
  uuidCount: number;
  uuidList: string[];
  caseMode: TextCaseMode;
  hashAlgo: "sha256" | "sha1";
  passwordLen: number;
  base64Mode: "auto" | "encode" | "decode";
  urlMode: "auto" | "encode" | "decode";
  hexMode: "auto" | "encode" | "decode";
  escapeMode: "escape" | "unescape";
  htmlMode: "encode" | "decode";
  touched: boolean;
}

export type UtilsStateMap = Partial<Record<UtilTab, UtilToolState>>;

export function defaultUtilToolState(tab: UtilTab): UtilToolState {
  return {
    input: UTIL_SAMPLES[tab] ?? "",
    output: "",
    error: null,
    uuidCount: 5,
    uuidList: [],
    caseMode: "snake",
    hashAlgo: "sha256",
    passwordLen: 16,
    base64Mode: "auto",
    urlMode: "auto",
    hexMode: "auto",
    escapeMode: "escape",
    htmlMode: "encode",
    touched: false,
  };
}

/** Load sample for a util tool (shared with toolbar Sample button). */
export function applyUtilSample(tab: UtilTab, cur?: UtilToolState): UtilToolState {
  const base = cur ?? defaultUtilToolState(tab);
  if (tab === "uuid") {
    return { ...base, uuidCount: 5, uuidList: [], output: "", error: null, touched: true };
  }
  if (tab === "password") {
    return { ...base, passwordLen: 16, output: "", error: null, touched: true };
  }
  if (tab === "time") {
    return { ...base, input: "", output: "", error: null, touched: true };
  }
  return {
    ...base,
    input: UTIL_SAMPLES[tab] ?? "",
    output: "",
    error: null,
    touched: true,
  };
}

function looksLikeBase64(t: string): boolean {
  const s = t.trim();
  if (s.length < 4) return false;
  if (!/^[A-Za-z0-9+/=\s]+$/.test(s)) return false;
  return s.includes("=") || s.replace(/\s/g, "").length % 4 === 0;
}

async function computeUtil(tab: UtilTab, s: UtilToolState): Promise<Partial<UtilToolState>> {
  if (tab === "uuid") {
    const n = Math.max(1, Math.min(50, s.uuidCount));
    const list = Array.from({ length: n }, () => generateUuidV4());
    return { uuidList: list, output: list.join("\n"), error: null };
  }
  if (tab === "base64") {
    const t = s.input;
    const mode = s.base64Mode;
    if (mode === "decode" || (mode === "auto" && looksLikeBase64(t))) {
      try {
        return { output: fromBase64(t), error: null };
      } catch (e) {
        if (mode === "decode") throw e;
      }
    }
    return { output: toBase64(t), error: null };
  }
  if (tab === "jwt") {
    if (!s.input.trim()) return { output: "", error: null };
    const result = decodeJwt(s.input);
    return {
      output: prettyJson({
        header: result.header,
        payload: result.payload,
        signature: result.signature ? `${result.signature.slice(0, 24)}…` : "(none)",
      }),
      error: null,
    };
  }
  if (tab === "hash") {
    if (!s.input) return { output: "", error: null };
    const hex = s.hashAlgo === "sha1" ? await sha1Hex(s.input) : await sha256Hex(s.input);
    return { output: hex, error: null };
  }
  if (tab === "time") {
    const t = s.input.trim();
    if (!t) {
      return {
        output: prettyJson({
          iso: nowIso(),
          unixSeconds: nowUnixSeconds(),
          unixMs: nowUnixMs(),
        }),
        error: null,
      };
    }
    if (/^\d+(\.\d+)?$/.test(t)) return { output: unixToIso(t), error: null };
    return { output: prettyJson(isoToUnix(t)), error: null };
  }
  if (tab === "url") {
    if (!s.input) return { output: "", error: null };
    const t = s.input;
    const mode = s.urlMode;
    if (mode === "decode" || (mode === "auto" && /%[0-9A-Fa-f]{2}/.test(t))) {
      try {
        return { output: urlDecode(t), error: null };
      } catch (e) {
        if (mode === "decode") throw e;
      }
    }
    return { output: urlEncode(t), error: null };
  }
  if (tab === "case") {
    if (!s.input) return { output: "", error: null };
    return { output: transformCase(s.input, s.caseMode), error: null };
  }
  if (tab === "hex") {
    if (!s.input) return { output: "", error: null };
    const t = s.input;
    const mode = s.hexMode;
    if (
      mode === "decode" ||
      (mode === "auto" &&
        /^[0-9a-fA-F\s]+$/.test(t.trim()) &&
        t.replace(/\s/g, "").length % 2 === 0 &&
        t.trim().length > 2)
    ) {
      try {
        return { output: fromHex(t), error: null };
      } catch (e) {
        if (mode === "decode") throw e;
      }
    }
    return { output: toHex(t), error: null };
  }
  if (tab === "number") {
    if (!s.input.trim()) return { output: "", error: null };
    return { output: convertNumberBase(s.input), error: null };
  }
  if (tab === "escape") {
    if (!s.input) return { output: "", error: null };
    if (s.escapeMode === "unescape") return { output: jsonUnescape(s.input), error: null };
    return { output: jsonEscape(s.input), error: null };
  }
  if (tab === "html") {
    if (!s.input) return { output: "", error: null };
    if (s.htmlMode === "decode") return { output: htmlDecode(s.input), error: null };
    return { output: htmlEncode(s.input), error: null };
  }
  if (tab === "password") {
    return { output: generatePassword(s.passwordLen), error: null };
  }
  if (tab === "stats") {
    return { output: textStats(s.input), error: null };
  }
  return {};
}

/** Select all within field only (avoid selecting whole workspace). */
function selectFieldAll(e: React.KeyboardEvent<HTMLTextAreaElement | HTMLPreElement>) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    if (el instanceof HTMLTextAreaElement) {
      el.select();
    } else if (window.getSelection && document.createRange) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }
}

function utilInputKeyDown(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  undo: () => void,
  redo: () => void,
) {
  selectFieldAll(e);
  if (!(e.ctrlKey || e.metaKey)) return;
  const k = e.key.toLowerCase();
  if (k === "z" && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    undo();
    return;
  }
  if (k === "y" || (k === "z" && e.shiftKey)) {
    e.preventDefault();
    e.stopPropagation();
    redo();
  }
}

interface UtilsPanelProps {
  linkBtnClass: string;
  panelClass: string;
  isDark?: boolean;
  onNotify?: (msg: string) => void;
  activeTab: UtilTab;
  onActiveTabChange: (tab: UtilTab) => void;
  stateByTool: UtilsStateMap;
  onStateByToolChange: (next: UtilsStateMap) => void;
  /** Match Monaco / playground editor font size */
  fontSize?: number;
}

export function UtilsPanel({
  linkBtnClass,
  panelClass,
  onNotify,
  activeTab,
  onActiveTabChange,
  stateByTool,
  onStateByToolChange,
  fontSize = 14,
}: UtilsPanelProps) {
  const state = useMemo(
    () => stateByTool[activeTab] ?? defaultUtilToolState(activeTab),
    [stateByTool, activeTab],
  );

  const mapRef = useRef(stateByTool);
  mapRef.current = stateByTool;

  /** Per-tool input undo stacks (textarea history — independent of transform undo) */
  const inputHistory = useRef<Partial<Record<UtilTab, { stack: string[]; idx: number }>>>({});
  const [, bumpHist] = useState(0);
  const histBusy = useRef(false);

  const ensureHist = useCallback((tab: UtilTab, seed: string) => {
    if (!inputHistory.current[tab]) {
      inputHistory.current[tab] = { stack: [seed], idx: 0 };
    }
    return inputHistory.current[tab]!;
  }, []);

  useEffect(() => {
    if (mapRef.current[activeTab]) return;
    onStateByToolChange({
      ...mapRef.current,
      [activeTab]: defaultUtilToolState(activeTab),
    });
  }, [activeTab, onStateByToolChange]);

  // Seed history when tab opens
  useEffect(() => {
    const s = mapRef.current[activeTab] ?? defaultUtilToolState(activeTab);
    ensureHist(activeTab, s.input);
    bumpHist((n) => n + 1);
  }, [activeTab, ensureHist]);

  // External input changes (Sample / Reset from toolbar) → append history
  useEffect(() => {
    if (histBusy.current) return;
    const h = ensureHist(activeTab, state.input);
    if (h.stack[h.idx] !== state.input) {
      const stack = h.stack.slice(0, h.idx + 1);
      stack.push(state.input);
      if (stack.length > 80) stack.shift();
      inputHistory.current[activeTab] = { stack, idx: stack.length - 1 };
      bumpHist((n) => n + 1);
    }
  }, [state.input, activeTab, ensureHist]);

  const pushInputHistory = useCallback(
    (tab: UtilTab, next: string) => {
      if (histBusy.current) return;
      const h = ensureHist(tab, next);
      if (h.stack[h.idx] === next) return;
      const stack = h.stack.slice(0, h.idx + 1);
      stack.push(next);
      if (stack.length > 80) stack.shift();
      inputHistory.current[tab] = { stack, idx: stack.length - 1 };
      bumpHist((n) => n + 1);
    },
    [ensureHist],
  );

  const utilCanUndo = (() => {
    const h = inputHistory.current[activeTab];
    return Boolean(h && h.idx > 0);
  })();
  const utilCanRedo = (() => {
    const h = inputHistory.current[activeTab];
    return Boolean(h && h.idx < h.stack.length - 1);
  })();

  const utilUndo = useCallback(() => {
    const h = inputHistory.current[activeTab];
    if (!h || h.idx <= 0) return;
    histBusy.current = true;
    h.idx -= 1;
    const text = h.stack[h.idx] ?? "";
    const cur = mapRef.current[activeTab] ?? defaultUtilToolState(activeTab);
    onStateByToolChange({
      ...mapRef.current,
      [activeTab]: { ...cur, input: text, touched: true },
    });
    bumpHist((n) => n + 1);
    queueMicrotask(() => {
      histBusy.current = false;
    });
  }, [activeTab, onStateByToolChange]);

  const utilRedo = useCallback(() => {
    const h = inputHistory.current[activeTab];
    if (!h || h.idx >= h.stack.length - 1) return;
    histBusy.current = true;
    h.idx += 1;
    const text = h.stack[h.idx] ?? "";
    const cur = mapRef.current[activeTab] ?? defaultUtilToolState(activeTab);
    onStateByToolChange({
      ...mapRef.current,
      [activeTab]: { ...cur, input: text, touched: true },
    });
    bumpHist((n) => n + 1);
    queueMicrotask(() => {
      histBusy.current = false;
    });
  }, [activeTab, onStateByToolChange]);

  const patch = useCallback(
    (partial: Partial<UtilToolState>) => {
      const cur = mapRef.current[activeTab] ?? defaultUtilToolState(activeTab);
      if (typeof partial.input === "string" && partial.input !== cur.input) {
        pushInputHistory(activeTab, partial.input);
      }
      onStateByToolChange({
        ...mapRef.current,
        [activeTab]: { ...cur, ...partial, touched: true },
      });
    },
    [activeTab, onStateByToolChange, pushInputHistory],
  );

  const flash = useCallback((msg: string) => onNotify?.(msg), [onNotify]);

  const copy = async (text: string, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(text);
      flash(label);
    } catch {
      flash("Copy failed");
    }
  };

  const runGen = useRef(0);
  useEffect(() => {
    const s = mapRef.current[activeTab] ?? defaultUtilToolState(activeTab);
    const gen = ++runGen.current;
    const delay =
      activeTab === "uuid" || activeTab === "password" || activeTab === "time" ? 0 : 160;
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
            (next.uuidList?.join("\n") ?? "") === (cur.uuidList?.join("\n") ?? "")
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
              output: activeTab === "uuid" ? cur.output : "",
              uuidList: activeTab === "uuid" ? cur.uuidList : [],
            },
          });
        }
      })();
    }, delay);
    return () => window.clearTimeout(id);
  }, [
    activeTab,
    state.input,
    state.uuidCount,
    state.caseMode,
    state.hashAlgo,
    state.passwordLen,
    state.base64Mode,
    state.urlMode,
    state.hexMode,
    state.escapeMode,
    state.htmlMode,
    onStateByToolChange,
  ]);

  const regeneratePassword = () => {
    try {
      const pw = generatePassword(state.passwordLen);
      patch({ output: pw, error: null });
    } catch (e) {
      patch({ error: e instanceof Error ? e.message : "Failed" });
    }
  };

  const regenerateUuids = () => {
    const n = Math.max(1, Math.min(50, state.uuidCount));
    const list = Array.from({ length: n }, () => generateUuidV4());
    patch({ uuidList: list, output: list.join("\n"), error: null });
  };

  const insertNow = () => {
    patch({ input: nowIso(), error: null });
  };

  const showOptionsOnly = activeTab === "uuid" || activeTab === "password";

  // Same visual language as Monaco panes: panel surface, not muted “disabled” gray
  const fieldClass =
    "min-h-0 w-full flex-1 resize-none border-0 bg-[var(--workspace-panel)] px-3 py-2 font-mono leading-relaxed text-[var(--workspace-text)] outline-none focus:ring-0";
  const toolBtn = (active: boolean) =>
    `${linkBtnClass} h-7 min-h-7 px-2 text-[11px] font-medium ${active ? "!bg-primary/12 !text-primary" : ""}`;
  const modeChip = (active: boolean) =>
    `h-7 shrink-0 cursor-pointer px-2.5 text-[11px] font-semibold transition-colors ${
      active
        ? "bg-primary/15 text-primary"
        : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"
    }`;
  const modeGroup = "flex h-7 shrink-0 overflow-hidden rounded-lg border border-[var(--workspace-border)]";
  const paneHeader =
    "flex h-10 shrink-0 items-center gap-1 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2";

  const activeLabel = UTIL_TABS.find((t) => t.id === activeTab)?.label ?? activeTab;

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

      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 md:grid-cols-2">
        {/* Input */}
        <div className="flex min-h-0 flex-col border-b border-[var(--workspace-border)] md:border-b-0 md:border-r">
          <div className={paneHeader}>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--workspace-text-muted)]">
              {showOptionsOnly ? "Options" : "Input"}
            </span>
            <span className="hidden text-[10px] text-[var(--workspace-text-muted)] sm:inline">
              · {activeLabel}
            </span>
            {!showOptionsOnly && (
              <span className="ml-1 flex items-center gap-0.5">
                <Tooltip content="Undo (Ctrl+Z)">
                  <button
                    type="button"
                    className={`${linkBtnClass} btn-square h-7 min-h-7 w-7`}
                    disabled={!utilCanUndo}
                    onClick={utilUndo}
                    aria-label="Undo"
                  >
                    <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>
                <Tooltip content="Redo (Ctrl+Y)">
                  <button
                    type="button"
                    className={`${linkBtnClass} btn-square h-7 min-h-7 w-7`}
                    disabled={!utilCanRedo}
                    onClick={utilRedo}
                    aria-label="Redo"
                  >
                    <ArrowUturnRightIcon className="h-3.5 w-3.5" />
                  </button>
                </Tooltip>
              </span>
            )}
            <span className="flex-1" />
            {activeTab === "uuid" && (
              <>
                <NumberStepper
                  label="Count"
                  value={state.uuidCount}
                  min={1}
                  max={50}
                  onChange={(n) => patch({ uuidCount: n })}
                  aria-label="UUID count"
                />
                <button type="button" className={toolBtn(false)} onClick={regenerateUuids} title="Regenerate">
                  New
                </button>
                <button
                  type="button"
                  className={toolBtn(false)}
                  onClick={() => {
                    const id = generateUuidV4();
                    patch({ uuidList: [id], output: id, error: null });
                  }}
                >
                  One
                </button>
                <button
                  type="button"
                  className={toolBtn(false)}
                  onClick={() => {
                    const id = uuidNil();
                    patch({ uuidList: [id], output: id, error: null });
                  }}
                >
                  NIL
                </button>
              </>
            )}
            {activeTab === "password" && (
              <>
                <NumberStepper
                  label="Len"
                  value={state.passwordLen}
                  min={4}
                  max={128}
                  onChange={(n) => patch({ passwordLen: n })}
                  aria-label="Password length"
                />
                <button type="button" className={toolBtn(false)} onClick={regeneratePassword}>
                  New
                </button>
              </>
            )}
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
            {activeTab === "base64" && (
              <div className={modeGroup} role="group" aria-label="Base64 mode">
                {(["auto", "encode", "decode"] as const).map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    className={`${modeChip(state.base64Mode === m)}${i > 0 ? " border-l border-[var(--workspace-border)]" : ""}`}
                    onClick={() => patch({ base64Mode: m })}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            {activeTab === "url" && (
              <div className={modeGroup} role="group" aria-label="URL mode">
                {(["auto", "encode", "decode"] as const).map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    className={`${modeChip(state.urlMode === m)}${i > 0 ? " border-l border-[var(--workspace-border)]" : ""}`}
                    onClick={() => patch({ urlMode: m })}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            {activeTab === "hex" && (
              <div className={modeGroup} role="group" aria-label="Hex mode">
                {(["auto", "encode", "decode"] as const).map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    className={`${modeChip(state.hexMode === m)}${i > 0 ? " border-l border-[var(--workspace-border)]" : ""}`}
                    onClick={() => patch({ hexMode: m })}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            {activeTab === "escape" && (
              <div className={modeGroup} role="group" aria-label="Escape mode">
                {(["escape", "unescape"] as const).map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    className={`${modeChip(state.escapeMode === m)}${i > 0 ? " border-l border-[var(--workspace-border)]" : ""}`}
                    onClick={() => patch({ escapeMode: m })}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            {activeTab === "html" && (
              <div className={modeGroup} role="group" aria-label="HTML mode">
                {(["encode", "decode"] as const).map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    className={`${modeChip(state.htmlMode === m)}${i > 0 ? " border-l border-[var(--workspace-border)]" : ""}`}
                    onClick={() => patch({ htmlMode: m })}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            {activeTab === "case" && (
              <select
                value={state.caseMode}
                onChange={(e) => patch({ caseMode: e.target.value as TextCaseMode })}
                className="h-7 max-w-[7.5rem] rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-1.5 text-[11px] text-[var(--workspace-text)]"
              >
                {(
                  [
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
                  ] as TextCaseMode[]
                ).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            )}
            {activeTab === "time" && (
              <button
                type="button"
                className={toolBtn(false)}
                title="Insert current time (ISO)"
                onClick={insertNow}
              >
                Now
              </button>
            )}
          </div>
          <div className="flex min-h-0 flex-1 flex-col bg-[var(--workspace-panel)]">
            {activeTab === "uuid" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center text-[13px] text-[var(--workspace-text-muted)]">
                <p>UUIDs update live when you change count or press New.</p>
                <p className="text-[11px]">Copy / copy-as from the output actions bar.</p>
              </div>
            ) : activeTab === "password" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 text-center text-[13px] text-[var(--workspace-text-muted)]">
                <p>Cryptographically random password — changes with length or New.</p>
              </div>
            ) : (
              <textarea
                className={fieldClass}
                style={{ fontSize }}
                value={state.input}
                onChange={(e) => patch({ input: e.target.value })}
                onKeyDown={(e) => utilInputKeyDown(e, utilUndo, utilRedo)}
                placeholder={utilPlaceholder(activeTab)}
                spellCheck={false}
              />
            )}
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
            ) : activeTab === "uuid" && state.uuidList.length > 0 ? (
              <ul className="min-h-0 flex-1 space-y-1 overflow-auto p-2">
                {state.uuidList.map((id, i) => (
                  <li
                    key={`${id}-${i}`}
                    className="flex items-center gap-1.5 rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 py-1.5 font-mono text-[12px] text-[var(--workspace-text)]"
                    style={{ fontSize }}
                  >
                    <span className="min-w-0 flex-1 break-all select-all">{id}</span>
                    <button
                      type="button"
                      className={`${linkBtnClass} btn-square h-7 min-h-7 w-7 shrink-0`}
                      title="Copy UUID"
                      onClick={() => void copy(id, "UUID copied")}
                    >
                      <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
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
    </div>
  );
}
