"use client";

import { SunIcon, MoonIcon, ComputerDesktopIcon, MinusIcon, PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

type ThemeMode = "system" | "dark" | "light";

interface HeaderProps {
  themeMode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  editorFontSize?: number;
  onEditorFontSizeChange?: (size: number | ((prev: number) => number)) => void;
}

const themeOptions: { mode: ThemeMode; label: string; Icon: typeof SunIcon }[] = [
  { mode: "system", label: "System", Icon: ComputerDesktopIcon },
  { mode: "light", label: "Light", Icon: SunIcon },
  { mode: "dark", label: "Dark", Icon: MoonIcon },
];

export function Header({ themeMode, onThemeChange, editorFontSize = 13, onEditorFontSizeChange }: HeaderProps) {
  return (
    <header
      className="flex h-10 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 sm:px-3"
      style={{ height: "40px", minHeight: "40px" }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <span className="shrink-0 text-base font-semibold text-[var(--workspace-text)]">
          JSONix
        </span>
        <span className="hidden truncate text-xs text-[var(--workspace-text-muted)] sm:inline md:max-w-[20rem] lg:max-w-none">
          Your Swiss Army knife for data — format, convert & validate JSON, XML, YAML, TOML & CSV
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <a
          href="/docs"
          className="btn btn-ghost btn-xs rounded p-1 border-0 hover:bg-[var(--workspace-panel)] hover:underline hover:text-primary text-[var(--workspace-text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--workspace-border)]"
          aria-label="Documentation"
        >
          Docs
        </a>
        <a
          href="https://github.com/kdkumawat/jsonix"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost btn-xs rounded p-1 border-0 hover:bg-[var(--workspace-panel)] hover:underline hover:text-primary text-[var(--workspace-text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--workspace-border)]"
          aria-label="GitHub repository"
        >
          GitHub
        </a>
        {onEditorFontSizeChange && (
          <div className="hidden items-center rounded-lg border border-[var(--workspace-border)] overflow-hidden sm:flex [&>*:not(:last-child)]:border-r [&>*:not(:last-child)]:border-[var(--workspace-border)]">
            <button
              type="button"
              aria-label="Decrease font size"
              title="Decrease font size"
              className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors"
              onClick={() => onEditorFontSizeChange((s) => Math.max(10, s - 1))}
            >
              <MinusIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span className="min-w-[2rem] py-0.5 text-center text-xs tabular-nums text-[var(--workspace-text)] border-r border-[var(--workspace-border)]">
              {editorFontSize}
            </span>
            <button
              type="button"
              aria-label="Increase font size"
              title="Increase font size"
              className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors"
              onClick={() => onEditorFontSizeChange((s) => Math.min(24, s + 1))}
            >
              <PlusIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Reset font size"
              title="Reset font size"
              className="flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] transition-colors"
              onClick={() => onEditorFontSizeChange(13)}
            >
              <ArrowPathIcon className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )}
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
