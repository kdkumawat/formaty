"use client";

import type { ReactNode } from "react";
import { ArrowUturnLeftIcon, ArrowUturnRightIcon, Cog6ToothIcon } from "@heroicons/react/16/solid";
import { DEFAULT_LIST_PARSE_OPTIONS, type ListParseOptions } from "@/lib/json/listCompare";
import {
  Button,
  CopyButton,
  IconButton,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  PaneHeader,
  Select,
} from "@/components/kit";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import { CheckChip } from "@/components/compare/shared";
import { COMPARE_KIND_LABELS, type CompareKind } from "./constants";

const MAIN_TOGGLES = [
  ["trim", "Trim spaces"],
  ["ignoreEmpty", "Skip blank items"],
  ["caseInsensitive", "Ignore case"],
] as const;
const MORE_TOGGLES = [
  ["stripQuotes", "Ignore quotes around items"],
  ["numericNormalize", "Treat 01 and 1 as the same"],
  ["autoClean", "Tidy on paste"],
] as const;

const keepOpen = (e: Event) => e.preventDefault();

interface CompareBarProps {
  kind: CompareKind;
  onKind: (k: CompareKind) => void;
  options: ListParseOptions;
  onOptions: (fn: (prev: ListParseOptions) => ListParseOptions) => void;
  /** Each tool portals its controls into this host: the result tabs (list kinds) or the document controls. */
  setToolbarHost: (el: HTMLElement | null) => void;
  /** Input pane width in percent, so the tiles start where the result pane starts. */
  split?: number;
  actions: ReactNode;
}

export function CompareBar({ kind, onKind, options, onOptions, setToolbarHost, actions }: CompareBarProps) {
  const isList = kind !== "document";
  // A dot on the icon says a rule outside the three chips is not the default.
  const changed = MORE_TOGGLES.some(([key]) => Boolean(options[key]) !== Boolean(DEFAULT_LIST_PARSE_OPTIONS[key]));
  return (
    <div className="shrink-0">
      <PaneHeader
        left={
          <>
            <Select<CompareKind>
              aria-label="What to compare"
              value={kind}
              onChange={onKind}
              options={(["list", "single", "document"] as CompareKind[]).map((k) => ({ value: k, label: COMPARE_KIND_LABELS[k] }))}
            />
            {isList && (
              <>
                {MAIN_TOGGLES.map(([key, label]) => (
                  <CheckChip key={key} on={Boolean(options[key])} onToggle={() => onOptions((p) => ({ ...p, [key]: !p[key] }))}>
                    {label}
                  </CheckChip>
                ))}
                <Menu>
                  <MenuTrigger asChild>
                    <IconButton label="More matching options" className="relative">
                      <Cog6ToothIcon />
                      {changed && <span aria-hidden className="absolute right-1 top-1 size-1.5 rounded-full bg-[var(--selected-fg)]" />}
                    </IconButton>
                  </MenuTrigger>
                  <MenuContent>
                    {MORE_TOGGLES.map(([key, label]) => (
                      <MenuCheckboxItem
                        key={key}
                        checked={Boolean(options[key])}
                        onCheckedChange={() => onOptions((p) => ({ ...p, [key]: !p[key] }))}
                        onSelect={keepOpen}
                      >
                        {label}
                      </MenuCheckboxItem>
                    ))}
                    <MenuSeparator />
                    <MenuItem onSelect={() => onOptions(() => ({ ...DEFAULT_LIST_PARSE_OPTIONS }))}>Reset</MenuItem>
                  </MenuContent>
                </Menu>
              </>
            )}
            <div ref={setToolbarHost} className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1 empty:hidden max-[900px]:order-1 max-[900px]:basis-full" />
          </>
        }
        right={actions}
      />
    </div>
  );
}

/** Undo and redo, plus Reset (Utils) and Download and Copy (Instant) when the panel below has none. */
export function ActionRow({
  canCopy,
  onCopy,
  canDownload,
  onDownload,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onReset,
  resetLabel = "Reset",
  outputActions = true,
}: {
  canCopy: boolean;
  onCopy: () => void;
  canDownload: boolean;
  onDownload: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onReset?: () => void;
  resetLabel?: string;
  /** False when the panel below has its own Copy and Download, so there is one primary action on screen. */
  outputActions?: boolean;
}) {
  return (
    <>
      <IconButton label="Undo" shortcut="⌘Z" disabled={canUndo === false} onClick={onUndo}>
        <ArrowUturnLeftIcon />
      </IconButton>
      <IconButton label="Redo" shortcut="⌘⇧Z" disabled={canRedo === false} onClick={onRedo}>
        <ArrowUturnRightIcon />
      </IconButton>
      {onReset && (
        <Button variant="ghost" onClick={onReset}>
          {resetLabel}
        </Button>
      )}
      {outputActions && (
        <>
          <CopyButton onCopy={onCopy} disabled={!canCopy} />
          <IconButton label="Download" disabled={!canDownload} onClick={onDownload}>
            <ArrowDownTrayIcon />
          </IconButton>
        </>
      )}
    </>
  );
}
