import type { ButtonHTMLAttributes } from "react";
import {
  ArrowPathIcon,
  MinusIcon,
  PlusIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { Button as UiButton } from "@/components/ui/button";
import { Tooltip } from "@/components/workspace/Tooltip";

function SquareBtn({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <UiButton
      type="button"
      variant="ghost"
      className={`h-auto min-h-0 w-auto min-w-0 !p-0 [&_svg]:!size-3.5 ${className}`}
      {...props}
    />
  );
}

/** Section rule header: uppercase label + hairline rule. */
function SettingsRule({ title }: { title: string }) {
  return (
    <div className="mt-3 flex items-center gap-2.5">
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--workspace-text-muted)]">
        {title}
      </span>
      <span className="h-px flex-1 bg-[var(--workspace-border)]/60" aria-hidden />
    </div>
  );
}

/** Settings row - label left, control right, hover pill. */
function SettingsRow({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3 rounded-md px-1.5 py-1 transition-colors hover:bg-primary/5">
      <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-[var(--workspace-text)]">
        {label}
      </span>
      <div className="flex shrink-0 items-center">{children}</div>
    </div>
  );
}

/** Star pin toggle for settings rows. */
function PinButton({
  pinned,
  label,
  onClick,
}: {
  pinned: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip content={pinned ? `Unpin ${label} from toolbar` : `Pin ${label} to toolbar`}>
    <button
      type="button"
      onClick={onClick}
      aria-label={pinned ? `Unpin ${label}` : `Pin ${label}`}
      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-all ${
        pinned
          ? "text-amber-500 hover:bg-amber-500/10"
          : "text-[var(--workspace-text-muted)]/55 hover:bg-primary/10 hover:text-primary"
      }`}
    >
      {pinned ? <StarSolidIcon className="h-3 w-3" /> : <StarIcon className="h-3 w-3" />}
    </button>
    </Tooltip>
  );
}

/** Compact -/+ stepper pill used in settings rows. */
function SettingsStepper({
  value,
  onDec,
  onInc,
  onReset,
  decLabel,
  incLabel,
  resetLabel,
  minWidth = "min-w-[1.75rem]",
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  onReset: () => void;
  decLabel: string;
  incLabel: string;
  resetLabel: string;
  minWidth?: string;
}) {
  const stepBtn =
    "flex h-7 w-7 shrink-0 items-center justify-center p-1 text-[var(--workspace-text-muted)] transition-colors duration-100 hover:bg-primary/10 hover:text-primary active:bg-primary/15";
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-[var(--workspace-border)]/50 bg-muted/50">
      <button type="button" aria-label={decLabel} className={stepBtn} onClick={onDec}>
        <MinusIcon className="h-3.5 w-3.5" aria-hidden />
      </button>
      <span
        className={`flex h-7 ${minWidth} items-center justify-center border-x border-[var(--workspace-border)]/40 px-1.5 text-xs font-medium tabular-nums text-[var(--workspace-text)]`}
      >
        {value}
      </span>
      <button type="button" aria-label={incLabel} className={stepBtn} onClick={onInc}>
        <PlusIcon className="h-3.5 w-3.5" aria-hidden />
      </button>
      <button type="button" aria-label={resetLabel} className={stepBtn} onClick={onReset}>
        <ArrowPathIcon className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}

/** One labelled row of pin-to-toolbar chips. */
function PinChipRow({
  label,
  items,
  pinned,
  onToggle,
}: {
  label: string;
  items: Array<{ id: string; label: string }>;
  pinned: (id: string) => boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-1 w-12 shrink-0 text-[9px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => {
          const on = pinned(item.id);
          return (
            <Tooltip key={item.id} content={on ? `Unpin ${item.label}` : `Pin ${item.label}`}>
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              className={`inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-[10px] font-medium transition-colors ${
                on
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-[var(--workspace-border)]/70 text-[var(--workspace-text-muted)] hover:border-primary/25 hover:text-[var(--workspace-text)]"
              }`}
            >
              {on ? <StarSolidIcon className="h-3 w-3 text-amber-500" /> : <StarIcon className="h-3 w-3 opacity-50" />}
              {item.label}
            </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}

export { SquareBtn, SettingsRule, SettingsRow, PinButton, SettingsStepper, PinChipRow };
