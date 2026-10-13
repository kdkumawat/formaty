"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Tooltip } from "@/components/kit";
import { useTheme } from "@/hooks/useTheme";

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}
const snapshot = () => document.documentElement.getAttribute("data-theme");

/**
 * Theme switch for the site header. Reads the applied theme from <html data-theme>,
 * so several instances (desktop nav and mobile menu) always agree. Until the client
 * has read it, a same-size placeholder renders, so there is no hydration mismatch.
 */
export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const current = useSyncExternalStore(subscribe, snapshot, () => null);
  const { setThemeMode } = useTheme();
  const size = withLabel ? "min-h-12 w-full justify-start gap-3 px-3" : "size-11 justify-center";

  if (!current) return <span aria-hidden className={`inline-flex ${size}`} />;

  const dark = current === "dark";
  const label = dark ? "Switch to light theme" : "Switch to dark theme";
  const Icon = dark ? Sun : Moon;
  const button = (
    <button
      type="button"
      aria-label={label}
      onClick={() => setThemeMode(dark ? "light" : "dark")}
      className={`inline-flex cursor-pointer items-center rounded-md hover:bg-control hover:text-[var(--workspace-text)] ${size} ${
        withLabel ? "text-[var(--workspace-text)]" : "text-[var(--workspace-text-muted)]"
      }`}
    >
      <Icon size={20} aria-hidden />
      {withLabel && <span className="text-base font-medium">{dark ? "Light theme" : "Dark theme"}</span>}
    </button>
  );
  return withLabel ? button : <Tooltip content={label} side="bottom">{button}</Tooltip>;
}
