"use client";

import { UtilsPanel } from "@/components/UtilsPanel";
import type { UtilTab } from "@/lib/utils/devtools";
import type { UtilsStateMap } from "@/components/utils/state";

/** The playground's Utils area itself: the same panel, nav, readings and generators. Detect anything starts on a token. */
export default function Utils({
  tool,
  onTool,
  state,
  onState,
}: {
  tool: UtilTab;
  onTool: (t: UtilTab) => void;
  state: UtilsStateMap;
  onState: (s: UtilsStateMap) => void;
}) {
  return (
    <UtilsPanel
      linkBtnClass=""
      panelClass="bg-[var(--workspace-panel)]"
      activeTab={tool}
      onActiveTabChange={onTool}
      stateByTool={state}
      onStateByToolChange={onState}
      fontSize={13}
    />
  );
}
