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
          className="btn btn-ghost btn-xs rounded p-1 border-0 hover:bg-[var(--workspace-panel)] hover:underline hover:text-primary text-[var(--workspace-text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--workspace-border)] inline-flex items-center gap-1"
          aria-label="GitHub repository"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          GitHub
          <span className="inline-flex items-center gap-0.5 text-[10px] opacity-80">
            <svg className="h-3.5 w-3.5" fill="#e3b341" viewBox="0 0 24 24"><path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279L12 18.896l-7.416 3.518 1.48-8.279-6.064-5.828 8.332-1.151z"/></svg>
          </span>
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
