"use client";

import { useSplitResize } from "@/hooks/workspace/useSplitResize";
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
  const { split, startResize, nudgeSplit } = useSplitResize();
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--workspace-background)] p-2">
    <UtilsPanel
      linkBtnClass=""
      split={split}
      onResizeStart={startResize}
      onNudgeSplit={nudgeSplit}
      activeTab={tool}
      onActiveTabChange={onTool}
      stateByTool={state}
      onStateByToolChange={onState}
      fontSize={13}
    />
    </div>
  );
}
