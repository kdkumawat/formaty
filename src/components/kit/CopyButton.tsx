"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon, ChevronDownIcon, ExclamationTriangleIcon } from "@heroicons/react/16/solid";
import { toast } from "@/components/Toast";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import {
  Menu,
  MenuContent,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "./Menu";
import { focusRing, mutedText, type KitSize } from "./styles";
import { Tooltip } from "./Tooltip";

export interface CopyFormat {
  id: string;
  label: string;
  group?: string;
  /** Muted example of the shape this format produces, shown at the right of the row. */
  hint?: string;
  /** Lists the format under a "More" submenu instead of the main menu. */
  overflow?: boolean;
}

type CopyState = "idle" | "ok" | "fail";

/** Runs `run`, shows ok/fail for 1.5s, toasts on failure. */
function useCopy(run: (format?: string) => Promise<void>) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback(
    async (format?: string) => {
      let next: CopyState = "ok";
      try {
        await run(format);
      } catch {
        next = "fail";
        toast({ message: "Copy failed", type: "error" });
      }
      setState(next);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setState("idle"), 1500);
    },
    [run],
  );
  return [state, copy] as const;
}

/** Layers stacked in one grid cell: the slot is as wide as the widest, so state changes never resize it. */
function Layer({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <span aria-hidden={!on} className={cn("col-start-1 row-start-1 inline-flex items-center gap-1.5", !on && "invisible")}>
      {children}
    </span>
  );
}

export interface CopyButtonProps {
  /** Returns the text to copy for the given format id (undefined when there are no formats). */
  getText?: (format?: string) => string | Promise<string>;
  /** Alternative to getText: you do the copying; resolve on success, throw on failure. */
  onCopy?: (format?: string) => void | Promise<void>;
  /** When set, renders a split button whose chevron opens the "Copy as" menu. */
  formats?: CopyFormat[];
  /** Current format id. The caller owns and remembers it. */
  format?: string;
  onFormatChange?: (id: string) => void;
  /** Renders "Copy 42". */
  count?: number;
  /** Digits to reserve for the count, so the button keeps one width as the count changes. Default: the current count's digits. */
  countDigits?: number;
  /** Main label, default "Copy". */
  label?: string;
  variant?: "primary" | "secondary";
  size?: KitSize;
  disabled?: boolean;
  className?: string;
}

/** THE copy control. Same look, size and position everywhere; never resizes when it flips to "Copied". */
export function CopyButton({
  getText,
  onCopy,
  formats,
  format,
  onFormatChange,
  count,
  countDigits,
  label = "Copy",
  variant = "primary",
  size = "sm",
  disabled,
  className,
}: CopyButtonProps) {
  const run = useCallback(
    async (f?: string) => {
      if (onCopy) return onCopy(f);
      if (!getText) throw new Error("CopyButton needs getText or onCopy");
      await navigator.clipboard.writeText(await getText(f));
    },
    [getText, onCopy],
  );
  const [state, copy] = useCopy(run);
  const split = !!formats?.length;

  const main = (
    <Button
      variant={variant}
      size={size}
      disabled={disabled}
      onClick={() => copy(format)}
      className={cn("justify-start", split && "rounded-[6px_0_0_6px]", className)}
    >
      <span className="grid">
        <Layer on={state === "idle"}>
          <span>
            {label}
            {count !== undefined && <span className="ml-1.5 font-medium tabular-nums opacity-70">{count.toLocaleString()}</span>}
          </span>
        </Layer>
        {count !== undefined && countDigits !== undefined && (
          <Layer on={false}>
            <span>
              {label}
              <span className="ml-1.5 font-medium tabular-nums">{"8".repeat(countDigits).replace(/\B(?=(\d{3})+$)/g, ",")}</span>
            </span>
          </Layer>
        )}
        <Layer on={state === "ok"}>
          <CheckIcon className={cn("size-4", state === "ok" && "animate-[kit-pop_220ms_ease-out]")} />
          Copied
        </Layer>
        <Layer on={state === "fail"}>
          <ExclamationTriangleIcon className="size-4" />
          Failed
        </Layer>
      </span>
      <span className="sr-only" role="status">
        {state === "ok" ? "Copied" : state === "fail" ? "Copy failed" : ""}
      </span>
    </Button>
  );
  if (!split) return main;

  const shown = formats.filter((f) => !f.overflow);
  const more = formats.filter((f) => f.overflow);
  const item = (f: CopyFormat) => (
    <MenuRadioItem key={f.id} value={f.id} hint={f.hint && <span className="font-mono">{f.hint}</span>}>
      {f.label}
    </MenuRadioItem>
  );
  const groups = [...new Set(shown.map((f) => f.group ?? ""))].sort((a, b) => (a === "" ? -1 : b === "" ? 1 : 0));
  return (
    <div className="inline-flex shrink-0">
      {main}
      <Menu>
        <Tooltip content="Copy as" side="top">
          <MenuTrigger asChild>
            <Button
              variant={variant}
              size={size}
              disabled={disabled}
              aria-label="Copy as"
              className="w-6 rounded-[0_6px_6px_0] px-0 before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-current before:opacity-20 after:absolute after:inset-y-0 after:left-px after:w-px after:bg-[rgb(255_255_255/0.35)] data-[state=open]:shadow-[inset_0_1px_2px_rgb(26_24_22/0.35)] max-[900px]:w-8"
            >
              <ChevronDownIcon className="size-4 opacity-80" />
            </Button>
          </MenuTrigger>
        </Tooltip>
        <MenuContent align="end" className={formats?.some((f) => f.hint) ? "min-w-[288px]" : undefined}>
          <MenuRadioGroup
            value={format}
            onValueChange={(id) => {
              onFormatChange?.(id);
              void copy(id);
            }}
          >
            <MenuLabel>Copy as</MenuLabel>
            {groups.map((g) => (
              <div key={g} role="presentation">
                {g && <MenuLabel>{g}</MenuLabel>}
                {shown.filter((f) => (f.group ?? "") === g).map(item)}
              </div>
            ))}
            {more.length > 0 && (
              <>
                <MenuSeparator />
                <MenuSub>
                  <MenuSubTrigger>More</MenuSubTrigger>
                  <MenuSubContent>{more.map(item)}</MenuSubContent>
                </MenuSub>
              </>
            )}
          </MenuRadioGroup>
        </MenuContent>
      </Menu>
    </div>
  );
}

export interface RowCopyProps {
  /** Text to copy, or a function returning it. */
  text: string | (() => string);
  /** Override the clipboard write. */
  onCopy?: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/** Per-row copy for lists: the whole row is the button; a "Copy" tag fades in on hover or focus in reserved space. */
export function RowCopy({ text, onCopy, disabled, className, children }: RowCopyProps) {
  const run = useCallback(async () => {
    if (onCopy) return onCopy();
    await navigator.clipboard.writeText(typeof text === "function" ? text() : text);
  }, [text, onCopy]);
  const [state, copy] = useCopy(run);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void copy()}
      className={cn(
        "group/row flex h-7 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] text-[var(--workspace-text)] transition-colors hover:bg-control focus-visible:bg-control active:bg-control-hover active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-45 max-[900px]:h-9",
        focusRing,
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <span className={cn("grid shrink-0 text-[12px] font-medium", mutedText)}>
        <span
          className={cn(
            "col-start-1 row-start-1 text-right transition-opacity",
            state === "idle" ? "opacity-0 group-hover/row:opacity-100 group-focus-visible/row:opacity-100" : "opacity-0",
          )}
        >
          Copy
        </span>
        <span className={cn("col-start-1 row-start-1 inline-flex items-center justify-end gap-1 text-ok", state !== "ok" && "opacity-0")}>
          <CheckIcon className="size-4" />
          Copied
        </span>
        <span className={cn("col-start-1 row-start-1 inline-flex items-center justify-end gap-1 text-bad", state !== "fail" && "opacity-0")}>
          Failed
        </span>
      </span>
    </button>
  );
}
