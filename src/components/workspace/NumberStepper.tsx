"use client";

import { useEffect, useState } from "react";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Tooltip } from "./Tooltip";

export type NumberStepperProps = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  /** Optional label shown before the control */
  label?: string;
  disabled?: boolean;
  className?: string;
  /** Accessible name when label is omitted */
  "aria-label"?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Compact − | value | + control (same language as font-size / indent steppers).
 * Click the middle value to type a number; blur or Enter commits.
 */
export function NumberStepper({
  value,
  min,
  max,
  onChange,
  label,
  disabled = false,
  className = "",
  "aria-label": ariaLabel,
}: NumberStepperProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const step = (delta: number) => {
    if (disabled) return;
    onChange(clamp(value + delta, min, max));
  };

  const commit = () => {
    const n = Number(draft.trim());
    if (Number.isFinite(n)) onChange(clamp(Math.round(n), min, max));
    else setDraft(String(value));
    setEditing(false);
  };

  const tinyBtn =
    "h-7 w-7 !p-0 text-[var(--workspace-text-muted)] hover:!bg-primary/10 hover:!text-primary";

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {label ? <span className="text-[11px] text-[var(--workspace-text-muted)]">{label}</span> : null}
      <div
        className="flex items-center overflow-hidden rounded-lg border border-[var(--workspace-border)]/60 divide-x divide-[var(--workspace-border)]/40 bg-[var(--workspace-background)]/50"
        role="group"
        aria-label={ariaLabel ?? label ?? "Number"}
      >
        <Tooltip content="Decrease">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={tinyBtn}
            disabled={disabled || value <= min}
            onClick={() => step(-1)}
            aria-label="Decrease"
          >
            <MinusIcon className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </Tooltip>
        {editing ? (
          <input
            type="text"
            inputMode="numeric"
            disabled={disabled}
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
              if (e.key === "Escape") {
                setDraft(String(value));
                setEditing(false);
              }
            }}
            className="h-7 w-10 shrink-0 border-0 bg-transparent px-1 text-center text-xs font-medium tabular-nums text-[var(--workspace-text)] outline-none focus:bg-primary/5"
            aria-label={ariaLabel ?? label ?? "Value"}
          />
        ) : (
          <Tooltip content="Click to type">
            <Button
              type="button"
              variant="ghost"
              disabled={disabled}
              onClick={() => {
                if (disabled) return;
                setDraft(String(value));
                setEditing(true);
              }}
              className="h-7 min-w-[2.25rem] shrink-0 !px-1.5 text-xs font-medium tabular-nums !text-[var(--workspace-text)] hover:!bg-primary/5"
            >
              {value}
            </Button>
          </Tooltip>
        )}
        <Tooltip content="Increase">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={tinyBtn}
            disabled={disabled || value >= max}
            onClick={() => step(1)}
            aria-label="Increase"
          >
            <PlusIcon className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}
