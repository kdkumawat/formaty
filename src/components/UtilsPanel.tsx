"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { UTIL_TABS, type UtilTab } from "@/lib/utils/devtools";
import {
  applyUtilSample,
  computeUtil,
  defaultUtilToolState,
  GENERATOR_TABS,
  type UtilToolState,
  type UtilsStateMap,
} from "@/components/utils/state";
import { GROUPS, TOOL_META } from "@/components/utils/readings";
import { Generator } from "@/components/utils/Generator";
import { RegexTool } from "@/components/utils/RegexTool";
import { ValueTool } from "@/components/utils/ValueTool";
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { SplitHandle, paneCardClass } from "@/components/compare/shared";
import { Button, IconButton, PaneHeader, Select, TextField, TruncatedText } from "@/components/kit";

// Pulls in temporal-polyfill (~180 KB); only needed on the Instant tab.
const InstantApp = dynamic(() => import("@/components/instant/InstantApp").then((m) => m.InstantApp), {
  ssr: false,
});
export type { UtilTab };
export { applyUtilSample, defaultUtilToolState, type UtilToolState, type UtilsStateMap };

interface UtilsPanelProps {
  linkBtnClass: string;
  /** Input/Result split (percent), shared with the Transform panes. */
  split?: number;
  onResizeStart?: () => void;
  onNudgeSplit?: (delta: number) => void;
  isDark?: boolean;
  activeTab: UtilTab;
  onActiveTabChange: (tab: UtilTab) => void;
  stateByTool: UtilsStateMap;
  onStateByToolChange: (next: UtilsStateMap) => void;
  /** Bumped when a new workspace tab is created so generators seed fresh values. */
  /** Workspace actions (undo, redo, reset) shown at the right of the tool title row. */
  headerActions?: ReactNode;
  regenKey?: number;
  /** Match Monaco / playground editor font size */
  fontSize?: number;
  /** Workspace tab id: when set, InstantApp persists its state per workspace tab. */
  tabId?: string;
}

const NAV_KEY = "formaty-utils-nav";
const NAV_DEFAULT = 184;
const NAV_MIN = 160;
const NAV_MAX = 320;
const clampNav = (w: number) => Math.max(NAV_MIN, Math.min(NAV_MAX, Math.round(w)));

/** Tool-list width and collapsed flag, remembered across reloads (desktop only; stacked layouts ignore both). */
function useUtilsNav() {
  const [width, setWidth] = useState(NAV_DEFAULT);
  const [collapsed, setCollapsedRaw] = useState(false);
  const [dragging, setDragging] = useState(false);
  const rowRef = useRef<HTMLDivElement | null>(null);
  const live = useRef({ width, collapsed });
  live.current = { width, collapsed };

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(NAV_KEY) ?? "null") as { w?: number; c?: boolean } | null;
      if (v) {
        if (typeof v.w === "number") setWidth(clampNav(v.w));
        setCollapsedRaw(v.c === true);
      }
    } catch {
      /* storage unavailable: defaults */
    }
  }, []);
  const save = useCallback((w: number, c: boolean) => {
    try {
      localStorage.setItem(NAV_KEY, JSON.stringify({ w, c }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const left = rowRef.current?.getBoundingClientRect().left ?? 0;
      setWidth(clampNav(e.clientX - left));
    };
    const up = () => setDragging(false);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      save(live.current.width, live.current.collapsed);
    };
  }, [dragging, save]);

  const resize = (w: number) => {
    const n = clampNav(w);
    setWidth(n);
    save(n, live.current.collapsed);
  };
  return {
    width,
    collapsed,
    rowRef,
    startDrag: () => setDragging(true),
    nudge: (d: number) => resize(live.current.width + d * 4),
    reset: () => resize(NAV_DEFAULT),
    setCollapsed: (c: boolean) => {
      setCollapsedRaw(c);
      save(live.current.width, c);
    },
  };
}

const labelOf = (id: UtilTab) => UTIL_TABS.find((t) => t.id === id)?.label ?? id;

export function UtilsPanel({
  split = 41,
  onResizeStart,
  onNudgeSplit,
  isDark,
  activeTab,
  onActiveTabChange,
  stateByTool,
  onStateByToolChange,
  headerActions,
  regenKey = 0,
  fontSize = 14,
  tabId,
}: UtilsPanelProps) {
  // Merge restored state over defaults so partial snapshots (older sessions /
  // shared links) always expose every field.
  const state = useMemo(
    () => ({ ...defaultUtilToolState(activeTab), ...(stateByTool[activeTab] ?? {}) }),
    [stateByTool, activeTab],
  );

  const mapRef = useRef(stateByTool);
  mapRef.current = stateByTool;

  useEffect(() => {
    if (mapRef.current[activeTab]) return;
    onStateByToolChange({ ...mapRef.current, [activeTab]: defaultUtilToolState(activeTab) });
  }, [activeTab, onStateByToolChange]);

  const patch = useCallback(
    (partial: Partial<UtilToolState>) => {
      const cur = mapRef.current[activeTab] ?? defaultUtilToolState(activeTab);
      onStateByToolChange({ ...mapRef.current, [activeTab]: { ...cur, ...partial, touched: true } });
    },
    [activeTab, onStateByToolChange],
  );

  /** Switch tool and carry the input over (used by Auto-detect's "Open in ..."). */
  const openIn = useCallback(
    (tool: UtilTab, input: string) => {
      const cur = { ...defaultUtilToolState(tool), ...(mapRef.current[tool] ?? {}) };
      onStateByToolChange({ ...mapRef.current, [tool]: { ...cur, input, dir: undefined, touched: true } });
      onActiveTabChange(tool);
    },
    [onStateByToolChange, onActiveTabChange],
  );

  // Regex and JWT keep a JSON `output` for the parent's copy-as and the JWT tree view.
  const runGen = useRef(0);
  useEffect(() => {
    if (activeTab !== "regex" && activeTab !== "jwt") return;
    const s = mapRef.current[activeTab] ?? defaultUtilToolState(activeTab);
    const gen = ++runGen.current;
    const id = window.setTimeout(() => {
      void computeUtil(activeTab, s)
        .then((result) => ({ ...result, error: null }))
        .catch((e) => ({ output: "", error: e instanceof Error ? e.message : "Failed" }))
        .then((result) => {
          if (runGen.current !== gen) return;
          const cur = mapRef.current[activeTab] ?? s;
          if (result.output === cur.output && result.error === cur.error) return;
          onStateByToolChange({ ...mapRef.current, [activeTab]: { ...cur, ...result } });
        });
    }, 160);
    return () => window.clearTimeout(id);
  }, [activeTab, state.input, state.regexPattern, state.regexFlags, onStateByToolChange, regenKey]);

  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const groups = GROUPS.map((g) => ({
    ...g,
    tools: g.tools.filter((id) => !query || `${labelOf(id)} ${TOOL_META[id].desc} ${g.name}`.toLowerCase().includes(query)),
  })).filter((g) => g.tools.length > 0);

  const meta = TOOL_META[activeTab];
  const nav = useUtilsNav();
  const toolOptions = GROUPS.flatMap((g) => g.tools.map((id) => ({ value: id, label: labelOf(id), group: g.name || undefined })));

  return (
    <div ref={nav.rowRef} className="flex h-full min-h-0 flex-1 flex-col gap-2 overflow-hidden min-[901px]:flex-row min-[901px]:gap-0">
      {/* A plain rail like the tab rail: navigation is chrome, not an editor, so it is not a card. */}
      <nav
        className={`flex shrink-0 flex-col ${nav.collapsed ? "min-[901px]:hidden" : "min-[901px]:min-h-0 min-[901px]:w-[var(--nav-w)]"}`}
        style={{ "--nav-w": `${nav.width}px` } as React.CSSProperties}
        aria-label="Utils tools"
      >
        <div className="min-[901px]:hidden">
          <Select<UtilTab>
            label="Tool"
            width="100%"
            options={toolOptions}
            value={activeTab}
            onChange={onActiveTabChange}
          />
        </div>
        <div className="hidden min-h-0 flex-1 flex-col min-[901px]:flex">
          <div className="flex items-center gap-1 pb-2">
            <TextField
              aria-label="Find a tool"
              placeholder="Find a tool"
              icon={<MagnifyingGlassIcon />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onClear={() => setQ("")}
              wrapperClassName="min-w-0 flex-1"
            />
            <IconButton label="Hide tools" className="shrink-0" onClick={() => nav.setCollapsed(true)}>
              <ChevronLeftIcon />
            </IconButton>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto pb-2">
            {groups.map((g) => (
              <div key={g.name || "auto"} className="flex flex-col gap-px">
                {g.name && <span className="px-2 pb-0.5 pt-2.5 text-[12px] text-[var(--workspace-text-muted)]">{g.name}</span>}
                {g.tools.map((id) => (
                  <Button
                    key={id}
                    variant={id === activeTab ? "selected" : "ghost"}
                    aria-current={id === activeTab ? "true" : undefined}
                    onClick={() => onActiveTabChange(id)}
                    className="w-full justify-start"
                  >
                    {labelOf(id)}
                  </Button>
                ))}
              </div>
            ))}
            {groups.length === 0 && <p className="px-2 py-2 text-[12px] text-[var(--workspace-text-muted)]">No tool by that name.</p>}
          </div>
        </div>
      </nav>
      {!nav.collapsed && (
        <SplitHandle
          onResizeStart={nav.startDrag}
          onNudge={nav.nudge}
          onReset={nav.reset}
          value={nav.width}
          min={NAV_MIN}
          max={NAV_MAX}
          label="Resize tool list"
        />
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <PaneHeader
          className="border-b-0 pl-1"
          title={labelOf(activeTab)}
          left={
            <>
            {nav.collapsed && (
              <span className="hidden items-center gap-1 min-[901px]:flex">
                <IconButton label="Show tools" onClick={() => nav.setCollapsed(false)}>
                  <ChevronRightIcon />
                </IconButton>
                <Select<UtilTab> label="Tool" width={170} options={toolOptions} value={activeTab} onChange={onActiveTabChange} />
              </span>
            )}
            <div className="min-w-0 flex-1 basis-40 text-[12px] text-[var(--workspace-text-muted)]">
              <TruncatedText>{meta.desc}</TruncatedText>
            </div>
            </>
          }
          right={headerActions}
        />
        {activeTab === "instant" ? (
          // One wide timeline: a single card on purpose, there is no input/output to divide.
          <div className={`${paneCardClass} min-h-0 flex-1 overflow-auto`}>
            <Suspense fallback={<div className="flex h-40 items-center justify-center text-[13px] text-[var(--workspace-text-muted)]">Loading time zones...</div>}>
              <InstantApp embedded settingsKey={tabId} />
            </Suspense>
          </div>
        ) : GENERATOR_TABS.has(activeTab) ? (
          <Generator
            key={activeTab}
            tool={activeTab as "uuid" | "password" | "lorem"}
            state={state}
            patch={patch}
            regenKey={regenKey}
            fontSize={fontSize}
            split={split}
            onResizeStart={onResizeStart}
            onNudgeSplit={onNudgeSplit}
          />
        ) : activeTab === "regex" ? (
          <RegexTool state={state} patch={patch} fontSize={fontSize} split={split} onResizeStart={onResizeStart} onNudgeSplit={onNudgeSplit} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-auto min-[901px]:overflow-hidden">
            <ValueTool key={activeTab} tool={activeTab} state={state} patch={patch} onOpen={openIn} isDark={isDark} fontSize={fontSize} split={split} onResizeStart={onResizeStart} onNudgeSplit={onNudgeSplit} />
          </div>
        )}
      </div>
    </div>
  );
}
