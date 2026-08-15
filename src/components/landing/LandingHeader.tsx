"use client";

import Link from "next/link";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/components/Logo";
import { Tooltip } from "@/components/workspace/Tooltip";
import { GitHubStars } from "@/components/GitHubStars";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";

const themeOptions: { mode: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { mode: "system", label: "System", Icon: ComputerDesktopIcon },
  { mode: "light", label: "Light", Icon: SunIcon },
  { mode: "dark", label: "Dark", Icon: MoonIcon },
];

export function LandingHeader() {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--workspace-border)]/70 bg-[var(--workspace-background)]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-0.5 text-[var(--workspace-text)] transition-opacity hover:opacity-85"
        >
          <Logo size={22} />
          <span className="text-lg font-bold tracking-tight text-primary">ormaty</span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/docs"
            className="hidden rounded-lg px-3 py-1.5 text-sm text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] sm:inline-flex"
          >
            Docs
          </Link>
          <GitHubStars />

          {/* Theme switcher */}
          <div className="flex rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)]/60 p-0.5">
            {themeOptions.map(({ mode, label, Icon }) => (
              <Tooltip content={label} key={mode}>
              <button
                type="button"
                aria-label={`${label} theme`}
                onClick={() => setThemeMode(mode)}
                className={`rounded p-1.5 transition-colors ${
                  themeMode === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </button>
              </Tooltip>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
