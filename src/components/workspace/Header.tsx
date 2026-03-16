"use client";

import { SunIcon, MoonIcon, ComputerDesktopIcon } from "@heroicons/react/24/outline";

type ThemeMode = "system" | "dark" | "light";

interface HeaderProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
}

const themeOptions: { mode: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { mode: "system", label: "System", Icon: ComputerDesktopIcon },
  { mode: "light", label: "Light", Icon: SunIcon },
  { mode: "dark", label: "Dark", Icon: MoonIcon },
];

export function Header({ themeMode, onThemeChange }: HeaderProps) {
  return (
    <header
      className="flex h-10 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 sm:px-3"
      style={{ height: "40px", minHeight: "40px" }}
    >
      <div className="flex min-w-0 flex-1 items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" width={24} height={24} className="workspace-icon shrink-0" />
        <span className="shrink-0 text-base font-semibold text-primary">
          ormaty
        </span>
        <span className="hidden truncate text-xs text-[var(--workspace-text-muted)] sm:inline md:max-w-[20rem] lg:max-w-none ml-2">
          Format, convert and validate JSON, XML, YAML, TOML and CSV
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <a
          href="/docs"
          className="btn btn-ghost btn-xs rounded p-1 border-0 hover:bg-[var(--workspace-panel)] hover:underline hover:text-primary text-[var(--workspace-text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--workspace-border)]"
          aria-label="Documentation"
        >
          Docs
        </a>
        <a
          href="https://github.com/kdkumawat/formaty"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-xs rounded p-1 border-0 hover:bg-[var(--workspace-panel)] hover:underline hover:text-primary text-[var(--workspace-text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--workspace-border)]"
          aria-label="GitHub repository"
        >
          GitHub
        </a>
        <div className="flex rounded-lg border border-[var(--workspace-border)] p-0.5">
          {themeOptions.map(({ mode, label, Icon }) => (
            <button
              key={mode}
              type="button"
              aria-label={`${label} theme`}
              title={label}
              onClick={() => onThemeChange(mode)}
              className={`rounded p-1 shrink-0 transition-colors ${
                themeMode === mode
                  ? "bg-primary text-primary-content"
                  : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)]"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
