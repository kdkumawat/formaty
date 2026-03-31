"use client";

import Link from "next/link";
import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/components/Logo";
import { useTheme, type ThemeMode } from "@/hooks/useTheme";

const themeOptions: { mode: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { mode: "system", label: "System", Icon: ComputerDesktopIcon },
  { mode: "light", label: "Light", Icon: SunIcon },
  { mode: "dark", label: "Dark", Icon: MoonIcon },
];

export function LandingHeader() {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]/90 backdrop-blur-xl">
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
          <Link
            href="/playground"
            className="hidden items-center gap-2 rounded-xl bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-content shadow-md shadow-primary/20 transition-all hover:scale-[1.03] hover:shadow-primary/30 sm:inline-flex"
          >
            Playground
          </Link>
          <a
            href="https://github.com/kdkumawat/formaty"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1.5 text-sm text-[var(--workspace-text-muted)] transition-all hover:border-primary/40 hover:text-[var(--workspace-text)]"
            aria-label="GitHub repository"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>

          {/* Theme switcher */}
          <div className="flex rounded-lg border border-[var(--workspace-border)] p-0.5">
            {themeOptions.map(({ mode, label, Icon }) => (
              <button
                key={mode}
                type="button"
                aria-label={`${label} theme`}
                title={label}
                onClick={() => setThemeMode(mode)}
                className={`rounded p-1.5 transition-colors ${
                  themeMode === mode
                    ? "bg-primary text-primary-content"
                    : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </button>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
