"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  Cog6ToothIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { Dropdown } from "./Dropdown";
import { Tooltip } from "./Tooltip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  menuItemClass as sharedMenuItemClass,
  menuSectionLabel as sharedMenuSectionLabel,
  menuCheck as sharedMenuCheck,
} from "./menuStyles";

export type OutputActionId =
  | "reset"
  | "share"
  | "copy"
  | "copyAs"
  | "download"
  | "useAsInput"
  | "maximize";

export type CopyAsFormat =
  | "base64"
  | "escaped"
  | "uri"
  | "datauri"
  | "single-quotes"
  | "double-quotes"
  | "comma"
  | "comma-single"
  | "comma-double"
  | "json-array"
  | "newline"
  | "sql-in-single"
  | "sql-in-double";

export type CopyAsOption = { id: CopyAsFormat; label: string; group?: string };

export type OutputActionVisibility = Record<OutputActionId, boolean>;

const DEFAULT_VISIBILITY: OutputActionVisibility = {
  reset: true,
  share: true,
  copy: true,
  copyAs: true,
  download: true,
  useAsInput: false,
  maximize: true,
};

const VIS_STORAGE_KEY = "formaty-output-action-visibility";

function loadVisibility(): OutputActionVisibility {
  try {
    const raw = localStorage.getItem(VIS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VISIBILITY };
    const p = JSON.parse(raw) as Partial<OutputActionVisibility>;
    return { ...DEFAULT_VISIBILITY, ...p };
  } catch {
    return { ...DEFAULT_VISIBILITY };
  }
}

function saveVisibility(v: OutputActionVisibility) {
  try {
    localStorage.setItem(VIS_STORAGE_KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export type OutputActionBarProps = {
  canCopy: boolean;
  canShare?: boolean;
  isGraphView?: boolean;
  isMaximized?: boolean;
  copyLabel?: string;
  shareLabel?: string;
  actionBounce?: "share" | "copy" | null;
  downloadMenuOpen: boolean;
  onDownloadMenuOpenChange: (open: boolean) => void;
  onShare: () => void;
  onShareAll?: () => void;
  canShareAll?: boolean;
  onCopy: () => void;
  onDownload: (format?: "png" | "jpg") => void;
  onToggleMaximize?: () => void;
  onCopyAs?: (format: CopyAsFormat) => void;
  copyAsOptions?: CopyAsOption[];
  onReset?: () => void;
  resetLabel?: string;
  className?: string;
  extra?: ReactNode;
  forceHide?: Partial<Record<OutputActionId, boolean>>;
  showVisibilityToggle?: boolean;
  /** Full workspace settings panel (opens from gear) */
  settingsContent?: ReactNode;
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
};

const iconBtn =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-all duration-150 hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40";

/** shadcn Button wrapper for OutputActionBar icon actions (keeps existing look). */
function IconButton({
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`${iconBtn} [&_svg]:!size-4 ${className}`}
      {...props}
    />
  );
}

const ACTION_LABELS: Record<OutputActionId, string> = {
  reset: "Reset",
  share: "Share",
  copy: "Copy",
  copyAs: "Copy as…",
  download: "Download",
  useAsInput: "Use as input",
  maximize: "Maximize",
};

export const DEFAULT_COPY_AS_OPTIONS: CopyAsOption[] = [
  { id: "base64", label: "Base64", group: "Encode" },
  { id: "escaped", label: "Escaped string", group: "Encode" },
  { id: "uri", label: "URL-encoded", group: "Encode" },
  { id: "datauri", label: "Data URI", group: "Encode" },
];

export const LIST_COPY_AS_OPTIONS: CopyAsOption[] = [
  { id: "newline", label: "Newline list", group: "List" },
  { id: "comma", label: "Comma-separated", group: "List" },
  { id: "single-quotes", label: "Single-quoted lines", group: "Quotes" },
  { id: "double-quotes", label: "Double-quoted lines", group: "Quotes" },
  { id: "comma-single", label: "Comma + single quotes", group: "Quotes" },
  { id: "comma-double", label: "Comma + double quotes", group: "Quotes" },
  { id: "json-array", label: "JSON array", group: "Data" },
  { id: "sql-in-single", label: "SQL IN ('…')", group: "SQL" },
  { id: "sql-in-double", label: "SQL IN (\"…\")", group: "SQL" },
];

export const UUID_COPY_AS_OPTIONS: CopyAsOption[] = [
  { id: "newline", label: "One per line", group: "List" },
  { id: "comma", label: "Comma-separated", group: "List" },
  { id: "single-quotes", label: "Single-quoted lines", group: "Quotes" },
  { id: "double-quotes", label: "Double-quoted lines", group: "Quotes" },
  { id: "comma-single", label: "Comma + single quotes", group: "Quotes" },
  { id: "comma-double", label: "Comma + double quotes", group: "Quotes" },
  { id: "json-array", label: "JSON array", group: "Data" },
];

export function formatCopyAsText(raw: string, format: CopyAsFormat): string {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const items = lines.length > 0 ? lines : raw.trim() ? [raw.trim()] : [];

  switch (format) {
    case "base64":
      return btoa(unescape(encodeURIComponent(raw)));
    case "escaped":
      return JSON.stringify(raw);
    case "uri":
      return encodeURIComponent(raw);
    case "datauri":
      return `data:text/plain;base64,${btoa(unescape(encodeURIComponent(raw)))}`;
    case "newline":
      return items.join("\n");
    case "comma":
      return items.join(", ");
    case "single-quotes":
      return items.map((i) => `'${i.replace(/'/g, "\\'")}'`).join("\n");
    case "double-quotes":
      return items.map((i) => `"${i.replace(/"/g, '\\"')}"`).join("\n");
    case "comma-single":
      return items.map((i) => `'${i.replace(/'/g, "\\'")}'`).join(", ");
    case "comma-double":
      return items.map((i) => `"${i.replace(/"/g, '\\"')}"`).join(", ");
    case "json-array":
      return JSON.stringify(items, null, 2);
    case "sql-in-single":
      return `IN (${items.map((i) => `'${i.replace(/'/g, "''")}'`).join(", ")})`;
    case "sql-in-double":
      return `IN (${items.map((i) => `"${i.replace(/"/g, '""')}"`).join(", ")})`;
    default:
      return raw;
  }
}

/** Unified output actions - always inline on the tool row. */
export function OutputActionBar({
  canCopy,
  canShare = true,
  isGraphView = false,
  isMaximized = false,
  copyLabel = "Copy",
  shareLabel = "Share",
  actionBounce = null,
  downloadMenuOpen,
  onDownloadMenuOpenChange,
  onShare,
  onShareAll,
  canShareAll = false,
  onCopy,
  onDownload,
  onToggleMaximize,
  onCopyAs,
  copyAsOptions = DEFAULT_COPY_AS_OPTIONS,
  onReset,
  resetLabel = "Reset",
  className = "",
  extra,
  forceHide,
  showVisibilityToggle = true,
  settingsContent,
  settingsOpen,
  onSettingsOpenChange,
}: OutputActionBarProps) {
  const [copyAsOpen, setCopyAsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [localSettingsOpen, setLocalSettingsOpen] = useState(false);
  const [visibility, setVisibility] = useState<OutputActionVisibility>(DEFAULT_VISIBILITY);
  const [lastCopyAsId, setLastCopyAsId] = useState<CopyAsFormat>(copyAsOptions[0]?.id ?? "base64");

  const settingsIsOpen = settingsOpen ?? localSettingsOpen;
  const setSettingsOpen = onSettingsOpenChange ?? setLocalSettingsOpen;

  useEffect(() => {
    setVisibility(loadVisibility());
  }, []);

  // Keep the remembered copy format valid when options change (tool/mode switch).
  useEffect(() => {
    if (copyAsOptions.length > 0 && !copyAsOptions.some((o) => o.id === lastCopyAsId)) {
      setLastCopyAsId(copyAsOptions[0].id);
    }
  }, [copyAsOptions, lastCopyAsId]);

  const lastCopyAs = copyAsOptions.find((o) => o.id === lastCopyAsId) ?? copyAsOptions[0];

  /** Compact fixed width - sized to the longest label so the menu never balloons. */
  const copyMenuWidth =
    copyAsOptions.length > 0 &&
    Math.max(...copyAsOptions.map((o) => o.label.length)) > 16
      ? "w-44"
      : "w-36";

  const show = (id: OutputActionId) =>
    visibility[id] !== false && forceHide?.[id] !== true;

  const toggleVis = (id: OutputActionId) => {
    setVisibility((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const anyOn = (Object.keys(next) as OutputActionId[]).some(
        (k) => next[k] && forceHide?.[k] !== true,
      );
      if (!anyOn) return prev;
      saveVisibility(next);
      return next;
    });
  };

  const downloadControl = isGraphView ? (
    <Dropdown
      open={downloadMenuOpen}
      onOpenChange={onDownloadMenuOpenChange}
      side="bottom"
      align="end"
      trigger={
        <Tooltip content="Download image">
          <button type="button" className={iconBtn} disabled={!canCopy} aria-label="Download">
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      }
    >
      <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
        <button type="button" className={sharedMenuItemClass} onClick={() => onDownload("png")}>
          PNG
        </button>
        <button type="button" className={sharedMenuItemClass} onClick={() => onDownload("jpg")}>
          JPG
        </button>
      </div>
    </Dropdown>
  ) : (
    <Tooltip content="Download result">
      <button
        type="button"
        className={iconBtn}
        disabled={!canCopy}
        onClick={() => onDownload()}
        aria-label="Download"
      >
        <ArrowDownTrayIcon className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );

  /**
   * Copy with dropdown - clicking the main button copies the LAST selected format,
   * the chevron opens the menu to pick (and copy) another format. Hover shows the
   * current format in the tooltip.
   */
  const copyControl =
    show("copy") && onCopyAs && !isGraphView && copyAsOptions.length > 0 ? (
      <Dropdown
        open={copyAsOpen}
        onOpenChange={setCopyAsOpen}
        side="bottom"
        align="end"
        contentClassName={`min-w-0 ${copyMenuWidth}`}
        trigger={
          <Tooltip content={lastCopyAs ? `Copy as ${lastCopyAs.label}` : "Copy options"}>
            <div className="flex items-center">
              <button
                type="button"
                className={`${iconBtn} !w-6 ${actionBounce === "copy" ? "scale-90" : ""}`}
                disabled={!canCopy}
                aria-label={lastCopyAs ? `Copy as ${lastCopyAs.label}` : "Copy"}
                // Radix opens the trigger on pointerdown - stop it so a plain
                // copy click never pops the menu open.
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (lastCopyAs) onCopyAs(lastCopyAs.id);
                }}
              >
                <ClipboardDocumentIcon className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className={`${iconBtn} !w-4 rounded-l-none`}
                disabled={!canCopy}
                aria-label="Copy options"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setCopyAsOpen((v) => !v);
                }}
              >
                <ChevronDownIcon className="h-2 w-2 opacity-70" />
              </button>
            </div>
          </Tooltip>
        }
      >
        <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
          {(() => {
            const groups = new Map<string, CopyAsOption[]>();
            for (const opt of copyAsOptions) {
              const g = opt.group ?? "Copy as";
              if (!groups.has(g)) groups.set(g, []);
              groups.get(g)!.push(opt);
            }
            return Array.from(groups.entries()).map(([group, opts]) => (
              <div key={group}>
                {groups.size > 1 && sharedMenuSectionLabel(group)}
                {opts.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`${sharedMenuItemClass} !w-auto !px-1.5 !gap-1.5 ${lastCopyAsId === opt.id ? "!bg-primary/12 !text-primary" : ""}`}
                    onClick={() => {
                      setLastCopyAsId(opt.id);
                      onCopyAs(opt.id);
                      setCopyAsOpen(false);
                    }}
                  >
                    {sharedMenuCheck(lastCopyAsId === opt.id)}
                    {opt.label}
                  </button>
                ))}
              </div>
            ));
          })()}
        </div>
      </Dropdown>
    ) : (
      <Tooltip content={copyLabel}>
        <IconButton
          className={actionBounce === "copy" ? "scale-90" : ""}
          disabled={!canCopy}
          onClick={onCopy}
          aria-label={copyLabel}
        >
          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
        </IconButton>
      </Tooltip>
    );

  const shareControl =
    show("share") && canShare ? (
      canShareAll && onShareAll ? (
        <Dropdown
          open={shareOpen}
          onOpenChange={setShareOpen}
          side="bottom"
          align="end"
          contentClassName={`w-max min-w-[8rem]`}
          trigger={
            <Tooltip content="Share link">
              <button
                type="button"
                className={`${iconBtn} gap-0.5 !w-auto px-1.5 ${actionBounce === "share" ? "scale-90" : ""}`}
                aria-label="Share"
              >
                <ShareIcon className="h-3.5 w-3.5" />
                <ChevronDownIcon className="h-2.5 w-2.5 opacity-60" />
              </button>
            </Tooltip>
          }
        >
          <div className="flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={sharedMenuItemClass}
              onClick={() => {
                onShare();
                setShareOpen(false);
              }}
            >
              Share this tab
            </button>
            <button
              type="button"
              className={sharedMenuItemClass}
              onClick={() => {
                onShareAll();
                setShareOpen(false);
              }}
            >
              Share all tabs
            </button>
          </div>
        </Dropdown>
      ) : (
        <Tooltip content={`${shareLabel} - creates a link`}>
          <button
            type="button"
            className={`${iconBtn} ${actionBounce === "share" ? "scale-90" : ""}`}
            onClick={onShare}
            aria-label="Share"
          >
            <ShareIcon className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      )
    ) : null;

  /** Toolbar-button visibility toggles, shown inside the Settings popup (inline). */
  const visibilitySection = showVisibilityToggle ? (
    <div className="mt-2.5 border-t border-[var(--workspace-border)]/60 pt-2">
      <div className="flex items-center gap-2.5 pb-1">
        <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--workspace-text-muted)]">
          Toolbar buttons
        </p>
        <span className="h-px flex-1 bg-[var(--workspace-border)]/60" aria-hidden />
      </div>
      <div className="grid grid-cols-2 gap-x-2">
        {(Object.keys(ACTION_LABELS) as OutputActionId[]).map((id) => {
          if (id === "copyAs") return null; // merged into Copy
          if (id === "useAsInput") return null; // removed
          if (forceHide?.[id]) return null;
          if (id === "share" && !canShare) return null;
          if (id === "reset" && !onReset) return null;
          if (id === "maximize" && !onToggleMaximize) return null;
          return (
            <label
              key={id}
              className="flex min-h-7 cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs text-[var(--workspace-text)] transition-colors hover:bg-primary/5"
            >
              <Checkbox
                checked={visibility[id] !== false}
                onCheckedChange={() => toggleVis(id)}
              />
              {ACTION_LABELS[id]}
            </label>
          );
        })}
      </div>
    </div>
  ) : null;

  const settingsControl = settingsContent ? (
    <Dropdown
      open={settingsIsOpen}
      onOpenChange={setSettingsOpen}
      side="bottom"
      align="end"
      preferScreenRight
      edgePadding={10}
      contentClassName={`w-[min(21.5rem,calc(100vw-1.25rem))] max-h-[min(78vh,42rem)] overflow-y-auto`}
      trigger={
        <Tooltip content="Settings">
          <button
            type="button"
            className={`${iconBtn} ${settingsIsOpen ? "text-primary bg-primary/10" : ""}`}
            aria-label="Settings"
          >
            <Cog6ToothIcon className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      }
    >
      <div className="p-2.5 text-xs" onClick={(e) => e.stopPropagation()}>
        {settingsContent}
        {visibilitySection}
      </div>
    </Dropdown>
  ) : null;

  return (
    <div
      className={`flex shrink-0 flex-row items-center gap-0.5 rounded-md bg-muted/60 p-0.5 ${className}`}
      role="toolbar"
      aria-label="Output actions"
    >
      {settingsControl}
      {show("reset") && onReset && (
        <Tooltip content={resetLabel}>
          <IconButton onClick={onReset} aria-label={resetLabel}>
            <ArrowPathIcon className="h-3.5 w-3.5" />
          </IconButton>
        </Tooltip>
      )}
      {shareControl}
      {copyControl}
      {show("download") && downloadControl}
      {show("maximize") && onToggleMaximize && (
        <Tooltip content={isMaximized ? "Restore layout" : "Maximize output"}>
          <IconButton
            onClick={onToggleMaximize}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <ArrowsPointingInIcon className="h-3.5 w-3.5" />
            ) : (
              <ArrowsPointingOutIcon className="h-3.5 w-3.5" />
            )}
          </IconButton>
        </Tooltip>
      )}
      {extra}
    </div>
  );
}
