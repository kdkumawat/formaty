"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { defaultUtilToolState, type UtilsStateMap } from "@/components/utils/state";
import { TOOL_META } from "@/components/utils/readings";
import { UTIL_TABS, type UtilTab } from "@/lib/utils/devtools";
import { DemoFooter } from "./demo/Footer";
import Transform from "./demo/Transform";
import { DemoWindow } from "./demo/Window";

// Each of these loads on the first click of its tab, not with the page.
const Loading = () => <p className="p-4 text-[13px] text-[var(--workspace-text-muted)]">Loading the tool...</p>;
const Compare = dynamic(() => import("./demo/Compare"), { ssr: false, loading: Loading });
const Utils = dynamic(() => import("./demo/Utils"), { ssr: false, loading: Loading });

type Scene = "transform" | "compare" | "utils";

/** Starts Detect anything on a token so the first look at Utils already reads something. */
const UTILS_START: UtilsStateMap = { auto: { ...defaultUtilToolState("auto"), input: TOOL_META.auto.example } };

/** The playground, in a window: the same headers, controls and tools, running on this page. */
export function HeroDemo() {
  const [scene, setScene] = useState<Scene>("transform");
  const [seen, setSeen] = useState<Scene[]>(["transform"]);
  const [utilTool, setUtilTool] = useState<UtilTab>("auto");
  const [utilState, setUtilState] = useState<UtilsStateMap>(UTILS_START);

  const pick = (s: Scene) => {
    setScene(s);
    setSeen((x) => (x.includes(s) ? x : [...x, s]));
  };
  const tabs: { id: Scene; label: string }[] = [
    { id: "transform", label: "JSON to SQL" },
    { id: "compare", label: "Compare lists" },
    { id: "utils", label: UTIL_TABS.find((t) => t.id === utilTool)?.label ?? "Utils" },
  ];

  return (
    <DemoWindow tabs={tabs} active={scene} onPick={(id) => pick(id as Scene)} size="hero">
      {tabs.map((t) =>
        seen.includes(t.id) ? (
          <div
            key={t.id}
            role="tabpanel"
            id={`demo-panel-${t.id}`}
            aria-labelledby={`demo-tab-${t.id}`}
            hidden={scene !== t.id}
            className="min-h-0 flex-1 flex-col data-[on=true]:flex"
            data-on={scene === t.id}
          >
            {t.id === "transform" && <Transform hero />}
            {t.id === "compare" && <Compare hero />}
            {t.id === "utils" && (
              <>
                <Utils tool={utilTool} onTool={setUtilTool} state={utilState} onState={setUtilState} />
                <DemoFooter href={`/playground?util=${utilTool}`} />
              </>
            )}
          </div>
        ) : null,
      )}
    </DemoWindow>
  );
}
