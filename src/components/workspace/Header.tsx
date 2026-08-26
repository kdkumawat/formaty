"use client";

import Link from "next/link";
import {
  Cog6ToothIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import { AnimatedMagnifierIcon, useIconAnimation } from "@/components/icons";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { GitHubStars } from "@/components/GitHubStars";
import { Dropdown } from "./Dropdown";
import { Tooltip } from "./Tooltip";

type ThemeMode = "system" | "dark" | "light";

interface HeaderProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onOpenCommandPalette?: () => void;
  /** Full workspace settings panel (opens from gear in the top-right). */
  settingsContent?: ReactNode;
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
}

/** Command palette search - the magnifier gives a subtle searching nudge on hover/focus. */
function CommandPaletteTrigger({ onOpen }: { onOpen: () => void }) {
  const icon = useIconAnimation();
  return (
    <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
      <Tooltip content="Command palette" shortcut="⌘K">
        <Button
          variant="ghost"
          data-tour="command-palette"
          onClick={onOpen}
          className="h-auto min-h-0 w-[220px] items-center gap-2 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1.5 text-left text-[12px] text-[var(--workspace-text-muted)] transition-all hover:border-primary/30 hover:text-[var(--workspace-text)] hover:shadow-sm sm:w-[280px] [&_svg]:!size-3.5"
          {...icon.bind}
        >
          <AnimatedMagnifierIcon ref={icon.ref} className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search commands…</span>
          <kbd className="hidden rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-[10px] sm:flex">⌘K</kbd>
        </Button>
      </Tooltip>
    </div>
  );
}

const themeOptions: { mode: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { mode: "system", label: "System", Icon: ComputerDesktopIcon },
  { mode: "light", label: "Light", Icon: SunIcon },
  { mode: "dark", label: "Dark", Icon: MoonIcon },
];

export function Header({
  themeMode,
  onThemeChange,
  onOpenCommandPalette,
  settingsContent,
  settingsOpen = false,
  onSettingsOpenChange,
}: HeaderProps) {
  return (
    <header
      className="relative flex shrink-0 flex-nowrap items-center justify-between gap-3 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3"
      style={{ height: "42px", minHeight: "42px" }}
    >
      {/* Brand */}
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
        <Link href="/" aria-label="Formaty home" className="flex shrink-0 items-center gap-0.5 transition-opacity hover:opacity-80">
          <Logo size={18} />
        </Link>
        <span className="hidden h-3.5 w-px bg-[var(--workspace-border)] sm:block" aria-hidden />
        <span className="hidden select-none truncate text-[10px] tracking-wide text-[var(--workspace-text-muted)] sm:inline">
          The Developer Data Workspace
        </span>
      </div>

      {/* Command palette trigger - centered absolutely (hidden on narrow screens so it never overlaps the brand/actions) */}
      {onOpenCommandPalette && <CommandPaletteTrigger onOpen={onOpenCommandPalette} />}

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href="/docs"
          className="hidden rounded-md px-2 py-1 text-xs font-medium text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] sm:inline-flex"
          aria-label="Documentation"
        >
          Docs
        </Link>
        <GitHubStars variant="plain" />
        {/* Theme segment control */}
        <div className="ml-0.5 flex items-center gap-px rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-0.5">
          {themeOptions.map(({ mode, label, Icon }) => (
            <Tooltip content={label} shortcut={mode === "dark" ? "⌥T" : undefined} key={mode}>
              <Button
                type="button"
                variant="ghost"
                aria-label={`${label} theme`}
                onClick={() => onThemeChange(mode)}
                className={`h-auto min-h-0 !p-1 rounded transition-all duration-150 [&_svg]:!size-3.5 ${
                  themeMode === mode
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-background)] hover:text-[var(--workspace-text)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </Button>
            </Tooltip>
          ))}
        </div>

        {/* Settings gear - opens the full workspace settings panel */}
        {settingsContent && (
          <Dropdown
            open={settingsOpen}
            onOpenChange={(open) => onSettingsOpenChange?.(open)}
            side="bottom"
            align="end"
            preferScreenRight
            edgePadding={10}
            contentClassName="w-[min(21.5rem,calc(100vw-1.25rem))] max-h-[min(78vh,42rem)] overflow-y-auto"
            trigger={
              <Tooltip content="Settings">
                <button
                  type="button"
                  aria-label="Settings"
                  data-tour="settings-gear"
                  className={`inline-flex h-auto min-h-0 items-center justify-center rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-1.5 transition-all duration-150 [&_svg]:!size-3.5 ${
                    settingsOpen
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "text-[var(--workspace-text-muted)] hover:border-primary/30 hover:text-[var(--workspace-text)]"
                  }`}
                >
                  <Cog6ToothIcon className="h-3.5 w-3.5" aria-hidden />
                </button>
              </Tooltip>
            }
          >
            <div className="p-2.5 text-xs" onClick={(e) => e.stopPropagation()}>
              {settingsContent}
            </div>
          </Dropdown>
        )}
      </div>
    </header>
  );
}
