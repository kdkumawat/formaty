"use client";

import type { ReactNode } from "react";
import { ArrowDownTrayIcon, Bars3BottomLeftIcon, DocumentPlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import { cn } from "@/lib/utils";
import { IconButton } from "./Button";
import { CopyButton, type CopyButtonProps } from "./CopyButton";
import { Menu, MenuContent, MenuItem, MenuLabel, MenuTrigger } from "./Menu";

export interface PaneHeaderProps {
  /** 14px semibold pane title. */
  title?: ReactNode;
  /** Controls after the title. */
  left?: ReactNode;
  /** Controls at the right edge. Drops to its own right-aligned row when the header runs out of width. */
  right?: ReactNode;
  className?: string;
}

/** The 36px header row of every input and result area. */
export function PaneHeader({ title, left, right, className }: PaneHeaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-9 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-[var(--workspace-border)] px-3 py-1",
        className,
      )}
    >
      {title && <h2 className="truncate text-[14px] font-semibold text-[var(--workspace-text)]">{title}</h2>}
      {left}
      {right && <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-1">{right}</div>}
    </div>
  );
}

export interface SampleOption {
  id: string;
  label: string;
  group?: string;
}

export interface InputActionsProps {
  /** One sample renders a plain button, several render a menu. */
  samples?: SampleOption[];
  onSample?: (id: string) => void;
  onTidy?: () => void;
  canTidy?: boolean;
  onClear?: () => void;
  /** Clear is disabled unless this is true; it keeps its place so the row never shifts. */
  canClear?: boolean;
}

/** Input header actions in the fixed order Sample, Tidy, Clear. Icon-only; the tooltip is the label. */
export function InputActions({ samples, onSample, onTidy, canTidy = true, onClear, canClear }: InputActionsProps) {
  const sample = samples?.length && onSample ? samples : undefined;
  const groups = sample ? [...new Set(sample.map((s) => s.group ?? ""))].sort((a, b) => (a === "" ? -1 : b === "" ? 1 : 0)) : [];
  return (
    <>
      {sample &&
        (sample.length === 1 ? (
          <IconButton label="Sample" onClick={() => onSample?.(sample[0].id)}>
            <DocumentPlusIcon />
          </IconButton>
        ) : (
          <Menu>
            <MenuTrigger asChild>
              <IconButton label="Sample">
                <DocumentPlusIcon />
              </IconButton>
            </MenuTrigger>
            <MenuContent align="end">
              {groups.map((g) => (
                <div key={g} role="presentation">
                  {g && <MenuLabel>{g}</MenuLabel>}
                  {sample.filter((s) => (s.group ?? "") === g).map((s) => (
                    <MenuItem key={s.id} onSelect={() => onSample?.(s.id)}>
                      {s.label}
                    </MenuItem>
                  ))}
                </div>
              ))}
            </MenuContent>
          </Menu>
        ))}
      {onTidy && (
        <IconButton label="Tidy" disabled={!canTidy} onClick={onTidy}>
          <Bars3BottomLeftIcon />
        </IconButton>
      )}
      {onClear && (
        <IconButton label="Clear" disabled={!canClear} onClick={onClear}>
          <TrashIcon />
        </IconButton>
      )}
    </>
  );
}

export interface ResultActionsProps {
  /** Tool-specific switches, first. */
  children?: ReactNode;
  /** Usually a Menu trigger Button labelled "Options". */
  options?: ReactNode;
  onDownload?: () => void;
  canDownload?: boolean;
  /** Props for the CopyButton, always last. */
  copy?: CopyButtonProps;
}

/** Result header actions in the fixed order: children, Options, Copy, Download. */
export function ResultActions({ children, options, onDownload, canDownload = true, copy }: ResultActionsProps) {
  return (
    <>
      {children}
      {options}
      {copy && <CopyButton {...copy} />}
      {onDownload && (
        <IconButton label="Download" disabled={!canDownload} onClick={onDownload}>
          <ArrowDownTrayIcon />
        </IconButton>
      )}
    </>
  );
}
