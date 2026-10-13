"use client";

import type { CSSProperties, ReactNode } from "react";
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
  Segmented,
} from "@/components/kit";
import { ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import { COMPARE_KIND_LABELS, type CompareKind } from "./constants";

const TOGGLES = [
  ["trim", "Trim spaces"],
  ["ignoreEmpty", "Skip blank items"],
  ["caseInsensitive", "Ignore case"],
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
  split: number;
  actions: ReactNode;
}

export function CompareBar({ kind, onKind, options, onOptions, setToolbarHost, split, actions }: CompareBarProps) {
  const isList = kind !== "document";
  // A dot on the icon says the matching rules are not the defaults.
  const changed = TOGGLES.some(([key]) => Boolean(options[key]) !== Boolean(DEFAULT_LIST_PARSE_OPTIONS[key]));
  return (
    <div className="shrink-0">
      <PaneHeader
        left={
          <>
            {/* Lists: as wide as the input pane (less the row gap), so the tiles line up with the result below. */}
            <div
              className={isList ? "flex shrink-0 items-center gap-2 min-[901px]:min-w-[calc(var(--split)-8px)]" : "flex shrink-0 items-center gap-2"}
              style={{ "--split": `${split}%` } as CSSProperties}
            >
            <Segmented
              aria-label="What to compare"
              value={kind}
              onChange={onKind}
              options={(["single", "list", "document"] as CompareKind[]).map((k) => ({ value: k, label: COMPARE_KIND_LABELS[k] }))}
            />
            {isList && (
              <Menu>
                <MenuTrigger asChild>
                  <IconButton label="Matching options" className="relative">
                    <Cog6ToothIcon />
                    {changed && <span aria-hidden className="absolute right-1 top-1 size-1.5 rounded-full bg-action" />}
                  </IconButton>
                </MenuTrigger>
                <MenuContent>
                  {TOGGLES.map(([key, label]) => (
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
            )}
            </div>
            <div ref={setToolbarHost} className="flex min-w-0 flex-1 items-center empty:hidden max-[900px]:order-1 max-[900px]:basis-full" />
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
