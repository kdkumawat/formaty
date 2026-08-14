"use client";

import Link from "next/link";
import {
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
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

const themeOptions: { mode: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { mode: "system", label: "System", Icon: ComputerDesktopIcon },
  { mode: "light", label: "Light", Icon: SunIcon },
  { mode: "dark", label: "Dark", Icon: MoonIcon },
];

const GitHubIcon = () => (
  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);

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
        <Link href="/" className="flex shrink-0 items-center gap-0.5 transition-opacity hover:opacity-80">
          <Logo size={18} />
          <span className="truncate text-sm font-bold tracking-tight text-primary">ormaty</span>
        </Link>
        <span className="hidden h-3.5 w-px bg-[var(--workspace-border)] sm:block" aria-hidden />
        <span className="hidden select-none truncate font-mono text-[10px] tracking-wide text-[var(--workspace-text-muted)] sm:inline">
          Format · Convert · Compare · Utils
        </span>
      </div>

      {/* Command palette trigger - centered absolutely (hidden on narrow screens so it never overlaps the brand/actions) */}
      {onOpenCommandPalette && (
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
          <Tooltip content="Command palette" shortcut="⌘K">
          <Button
            variant="ghost"
            onClick={onOpenCommandPalette}
            className="h-auto min-h-0 w-[220px] items-center gap-2 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1.5 text-left text-[12px] text-[var(--workspace-text-muted)] transition-all hover:border-primary/30 hover:text-[var(--workspace-text)] hover:shadow-sm sm:w-[280px] [&_svg]:!size-3.5"
          >
            <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Search commands…</span>
            <kbd className="hidden rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-1.5 py-0.5 font-mono text-[10px] sm:flex">⌘K</kbd>
          </Button>
          </Tooltip>
        </div>
      )}

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Link
          href="/docs"
          className="hidden rounded-md px-2 py-1 text-xs font-medium text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] sm:inline-flex"
          aria-label="Documentation"
        >
          Docs
        </Link>
        <a
          href="https://github.com/kdkumawat/formaty"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--workspace-border)] px-2 py-1 text-xs font-medium text-[var(--workspace-text-muted)] transition-all hover:border-primary/30 hover:text-[var(--workspace-text)]"
          aria-label="GitHub repository"
        >
          <GitHubIcon />
          <span className="hidden sm:inline">GitHub</span>
        </a>
        {/* Theme segment control */}
        <div className="ml-0.5 flex items-center gap-px rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-0.5">
          {themeOptions.map(({ mode, label, Icon }) => (
            <Tooltip content={label} key={mode}>
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
