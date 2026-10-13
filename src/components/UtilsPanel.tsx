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
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { Button, PaneHeader, Select, TextField, TruncatedText } from "@/components/kit";

// Pulls in temporal-polyfill (~180 KB); only needed on the Instant tab.
const InstantApp = dynamic(() => import("@/components/instant/InstantApp").then((m) => m.InstantApp), {
  ssr: false,
});
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
  /** Workspace actions (undo, redo, reset) shown at the right of the tool title row. */
  headerActions?: ReactNode;
  regenKey?: number;
  /** Match Monaco / playground editor font size */
  fontSize?: number;
  /** Workspace tab id: when set, InstantApp persists its state per workspace tab. */
  tabId?: string;
}

const labelOf = (id: UtilTab) => UTIL_TABS.find((t) => t.id === id)?.label ?? id;

export function UtilsPanel({
  panelClass,
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

  return (
    <div className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden min-[901px]:flex-row ${panelClass}`}>
      <nav className="flex shrink-0 flex-col border-[var(--workspace-border)] bg-[var(--workspace-panel)] min-[901px]:min-h-0 min-[901px]:w-[176px] min-[901px]:border-r" aria-label="Utils tools">
        <div className="p-2 min-[901px]:hidden">
          <Select<UtilTab>
            label="Tool"
            width="100%"
            options={GROUPS.flatMap((g) => g.tools.map((id) => ({ value: id, label: labelOf(id), group: g.name || undefined })))}
            value={activeTab}
            onChange={onActiveTabChange}
          />
        </div>
        <div className="hidden min-h-0 flex-1 flex-col min-[901px]:flex">
          <div className="p-2">
            <TextField
              aria-label="Find a tool"
              placeholder="Find a tool"
              icon={<MagnifyingGlassIcon />}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onClear={() => setQ("")}
              wrapperClassName="w-full"
            />
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-1.5 pb-2">
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <PaneHeader
          title={labelOf(activeTab)}
          left={
            <div className="min-w-0 flex-1 basis-40 text-[12px] text-[var(--workspace-text-muted)]">
              <TruncatedText>{meta.desc}</TruncatedText>
            </div>
          }
          right={headerActions}
        />
        {activeTab === "instant" ? (
          <div className="min-h-0 flex-1 overflow-auto">
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
          />
        ) : activeTab === "regex" ? (
          <RegexTool state={state} patch={patch} fontSize={fontSize} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-auto min-[901px]:overflow-hidden">
            <ValueTool key={activeTab} tool={activeTab} state={state} patch={patch} onOpen={openIn} isDark={isDark} fontSize={fontSize} />
          </div>
        )}
      </div>
    </div>
  );
}
