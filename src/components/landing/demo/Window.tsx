"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { Logo } from "@/components/Logo";
import { Button, Kbd, KitTooltipProvider } from "@/components/kit";
import { cn } from "@/lib/utils";

export interface DemoTab {
  id: string;
  label: string;
}

/** The playground's tab strip: same box model as workspace/Header (30px tabs in a 36px row). */
function Tab({ id, label, active, onClick }: DemoTab & { active: boolean; onClick: () => void }) {
  return (
    <button
      role="tab"
      id={`demo-tab-${id}`}
      aria-selected={active}
      aria-controls={`demo-panel-${id}`}
      type="button"
      onClick={onClick}
      className={cn(
        "h-[30px] max-w-[180px] min-w-0 shrink-0 truncate rounded-t-md px-2.5 text-[13px] font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] max-[900px]:h-9",
        active
          ? "bg-[var(--workspace-panel)] text-[var(--workspace-text)]"
          : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)]/60 hover:text-[var(--workspace-text)]",
      )}
    >
      {label}
    </button>
  );
}

const HEIGHT = {
  tall: "h-[560px] min-[901px]:h-[440px]",
  grow: "min-h-[560px] min-[901px]:h-[440px]",
  short: "h-[520px] min-[901px]:h-[380px]",
};

/**
 * The playground in a window: tab strip on the page backdrop colour, the working area on the panel.
 * It floats (level 2): hairline ring, 1px top highlight and a layered shadow, all in `.mk-window`.
 * Panels are the children; give each `id="demo-panel-<tab id>"`.
 */
export function DemoWindow({
  tabs,
  active,
  onPick,
  size = "tall",
  children,
}: {
  tabs: DemoTab[];
  active: string;
  onPick: (id: string) => void;
  /** Working height on desktop; "short" fits a static example. */
  size?: "tall" | "short" | "grow";
  children: ReactNode;
}) {
  // Until the visitor clicks into the demo, the wheel scrolls the page, not the panes under the pointer.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || el.contains(document.activeElement)) return;
      e.preventDefault();
      window.scrollBy(e.deltaX, e.deltaY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <KitTooltipProvider>
      <div ref={ref} className="mk-window overflow-hidden rounded-xl text-[var(--workspace-text)]">
        <div className="flex h-9 items-end gap-1 px-3 max-[900px]:h-11">
          <Link href="/playground" aria-label="Open the playground" className="mb-1 mr-1 flex h-7 shrink-0 items-center transition-opacity hover:opacity-80">
            <Logo size={20} />
          </Link>
          <div role="tablist" aria-label="Open tabs" className="flex min-w-0 items-end gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((t) => (
              <Tab key={t.id} {...t} active={active === t.id} onClick={() => onPick(t.id)} />
            ))}
          </div>
          <span className="flex-1" />
          <Button
            asChild
            variant="secondary"
            icon={<MagnifyingGlassIcon />}
            className="mb-px w-[200px] justify-start max-[1000px]:w-9 max-[1000px]:px-0 max-sm:hidden"
          >
            <Link href="/tools">
              <span className="min-w-0 flex-1 truncate text-left font-normal text-[var(--workspace-text-muted)] max-[1000px]:sr-only">Search every tool</span>
              <Kbd keys="⌘K" className="max-[1000px]:hidden" />
            </Link>
          </Button>
        </div>
        <div className={cn("flex flex-col rounded-t-lg bg-[var(--workspace-panel)]", HEIGHT[size])}>{children}</div>
      </div>
    </KitTooltipProvider>
  );
}
