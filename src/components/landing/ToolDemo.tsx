"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { FormatKind } from "@/lib/formats";
import type { TypeTargetLanguage } from "@/lib/json/core";
import type { UtilsStateMap } from "@/components/utils/state";
import { autoTabName } from "@/components/workspace/tabNames";
import { UTIL_TABS, type UtilTab } from "@/lib/utils/devtools";
import type { WorkspaceState } from "@/lib/shareState";
import { ExamplePanel } from "./ExamplePanel";
import { DemoFooter } from "./demo/Footer";
import { DemoWindow } from "./demo/Window";
import type { LiveSpec } from "./live/kinds";

// Each scene is its own chunk: a page downloads only the one it shows.
const Loading = () => <p className="p-4 text-[13px] text-[var(--workspace-text-muted)]">Loading the tool...</p>;
const Transform = dynamic(() => import("./demo/Transform"), { loading: Loading });
const Compare = dynamic(() => import("./demo/Compare"), { loading: Loading });
const Custom = dynamic(() => import("./demo/Custom"), { loading: Loading });
// Utils generate random values on mount, so they render on the client only.
const Utils = dynamic(() => import("./demo/Utils"), { ssr: false, loading: Loading });

const CUSTOM_TABS = { query: "Query JSON", curl: "cURL to code", diff: "Compare documents", validate: "Validate JSON" } as const;

export interface ToolDemoProps {
  spec: LiveSpec;
  /** First and second starting text (input, or left and right). */
  a: string;
  b: string;
  /** The static example from seo.ts: shown until a custom scene has run, and on static pages. */
  inputExample: string;
  outputExample: string;
  playBase: Partial<WorkspaceState>;
  /** Fallback link when the state is too large for a URL. */
  playFallback: string;
}

function UtilsScene({ start }: { start: UtilTab }) {
  const [tool, setTool] = useState<UtilTab>(start);
  const [state, setState] = useState<UtilsStateMap>({});
  return (
    <>
      <Utils tool={tool} onTool={setTool} state={state} onState={setState} />
      <DemoFooter href={`/playground?util=${tool}`} />
    </>
  );
}

/** The demo under a tool page's heading: a playground window already set to what the page is about. */
export function ToolDemo(p: ToolDemoProps) {
  const { spec } = p;
  let label = "Example";
  let scene: React.ReactNode;

  if (spec.kind === "transform") {
    const [group, key] = spec.sel.split(":");
    label = autoTabName({
      operation: group === "fmt" ? "format" : group === "type" ? "generateTypes" : key,
      convertToFormat: group === "fmt" ? (key as FormatKind) : "json",
      typeLanguage: group === "type" ? (key as TypeTargetLanguage) : "typescript",
      diffKind: "list",
      utilTab: "",
      inputFormat: spec.override ?? "json",
    });
    scene = <Transform preset={{ text: p.a, override: spec.override, sel: spec.sel }} />;
  } else if (spec.kind === "compare") {
    label = spec.mode === "single" ? "One list" : "Compare lists";
    scene = <Compare preset={{ kind: spec.mode, left: p.a, right: p.b, bucket: spec.bucket, format: spec.format }} />;
  } else if (spec.kind === "util") {
    label = UTIL_TABS.find((t) => t.id === spec.util)?.label ?? "Utils";
    scene = <UtilsScene start={spec.util} />;
  } else if (spec.kind === "custom") {
    label = CUSTOM_TABS[spec.tool];
    scene = <Custom spec={spec} a0={p.a} b0={p.b} initialOutput={p.outputExample} playBase={p.playBase} />;
  } else {
    scene = (
      <>
        <ExamplePanel input={p.inputExample} output={p.outputExample} />
        <DemoFooter href={p.playFallback} note="This tool runs in the playground. The example shows what it does." />
      </>
    );
  }

  return (
    <div>
      <DemoWindow tabs={[{ id: "tool", label }]} active="tool" onPick={() => {}} size={spec.kind === "static" ? "short" : spec.kind === "compare" ? "grow" : "tall"}>
        <div role="tabpanel" id="demo-panel-tool" aria-labelledby="demo-tab-tool" className="flex min-h-0 flex-1 flex-col">
          {scene}
        </div>
      </DemoWindow>
    </div>
  );
}
