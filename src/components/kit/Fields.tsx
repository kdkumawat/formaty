"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useState,
  type ComponentPropsWithoutRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon, MinusIcon, PlusIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { cn } from "@/lib/utils";
import { focusRing, HEIGHT, mutedText, type KitSize } from "./styles";

/** Fields share the buttons' hairline; focus turns it amber and thickens it to 2px, the same weight as the button focus ring. */
const fieldFocus = "focus-within:border-[var(--focus)] focus-within:ring-1 focus-within:ring-[var(--focus)]";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: KitSize;
  /** 16px icon element at the start. */
  icon?: ReactNode;
  /** When set and the field has text, shows a clear button that calls this. */
  onClear?: () => void;
  wrapperClassName?: string;
}

/** Single-line input on bg-control. Spread props go to the <input>; give it an aria-label or an external <label>. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { size = "sm", icon, onClear, wrapperClassName, className, value, disabled, ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-md border border-[var(--input)] bg-control transition-colors duration-[120ms] hover:bg-control-hover has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45 has-[:disabled]:hover:bg-control",
        fieldFocus,
        HEIGHT[size],
        wrapperClassName,
      )}
    >
      {icon && (
        <span aria-hidden className={cn("pointer-events-none pl-2 [&>svg]:size-4", mutedText)}>
          {icon}
        </span>
      )}
      <input
        ref={ref}
        value={value}
        disabled={disabled}
        className={cn(
          "h-full min-w-0 flex-1 bg-transparent px-2 text-[13px] text-[var(--workspace-text)] outline-none placeholder:text-[var(--workspace-text-muted)] disabled:cursor-not-allowed",
          size === "lg" && "text-[15px]",
          className,
        )}
        {...props}
      />
      {onClear && value !== undefined && String(value) !== "" && !disabled && (
        <button
          type="button"
          aria-label="Clear"
          onClick={onClear}
          className={cn("mr-1 inline-flex size-5 shrink-0 items-center justify-center rounded text-[var(--workspace-text-muted)] hover:bg-control-hover hover:text-[var(--workspace-text)]", focusRing)}
        >
          <XMarkIcon className="size-4" />
        </button>
      )}
    </div>
  );
});

export interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Visible muted prefix, e.g. "Indent". Also the accessible name unless `aria-label` is set. */
  label?: string;
  "aria-label"?: string;
  size?: KitSize;
  disabled?: boolean;
  className?: string;
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

/** Stepper: minus, typeable value, plus. Enter or blur commits; ArrowUp/ArrowDown step. Replaces workspace/NumberStepper. */
export function NumberField({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  label,
  "aria-label": ariaLabel,
  size = "sm",
  disabled,
  className,
}: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);
  const commit = () => {
    setEditing(false);
    const n = Number(draft);
    if (draft.trim() !== "" && Number.isFinite(n)) onChange(clamp(n, min, max));
    else setDraft(String(value));
  };
  const bump = (d: number) => onChange(clamp(value + d, min, max));
  const btn = cn(
    "key-flat inline-flex h-full w-6 shrink-0 items-center justify-center rounded-[5px] text-[var(--workspace-text)] opacity-80 transition-[background-color,opacity,translate] duration-[120ms] hover:opacity-100 active:translate-y-[0.5px] disabled:cursor-not-allowed disabled:opacity-30 max-[900px]:w-8",
    focusRing,
  );
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-md border border-[var(--input)] bg-sunk p-0.5 text-[13px]",
        disabled && "opacity-45",
        HEIGHT[size],
        className,
      )}
    >
      {label && <span className={cn("pl-2 pr-0.5", mutedText)}>{label}</span>}
      <button type="button" aria-label="Decrease" disabled={disabled || value <= min} onClick={() => bump(-step)} className={btn}>
        <MinusIcon className="size-4" />
      </button>
      <input
        inputMode="numeric"
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        value={draft}
        onFocus={(e) => {
          setEditing(true);
          e.currentTarget.select();
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "ArrowUp") {
            e.preventDefault();
            bump(step);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            bump(-step);
          }
        }}
        className={cn(
          "h-full w-9 min-w-0 bg-transparent text-center font-[500] tabular-nums text-[var(--workspace-text)] outline-none focus-visible:rounded-md focus-visible:ring-1 focus-visible:ring-[var(--focus)]",
        )}
      />
      <button type="button" aria-label="Increase" disabled={disabled || value >= max} onClick={() => bump(step)} className={btn}>
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}

function RowLabel({ id, label, description }: { id: string; label: ReactNode; description?: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span id={id} className="text-[13px] text-[var(--workspace-text)]">
        {label}
      </span>
      {description && <span className={cn("text-[12px]", mutedText)}>{description}</span>}
    </span>
  );
}

export interface SwitchProps extends Omit<ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>, "children"> {
  /** When set, the whole row (switch plus label) is one click target. */
  label?: ReactNode;
  description?: ReactNode;
}

/** On/off switch: off outlined, on bg-brand. With `label` the whole row toggles. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { label, description, className, id, ...props },
  ref,
) {
  const auto = useId();
  const labelId = `${auto}-l`;
  const root = (
    <SwitchPrimitive.Root
      ref={ref}
      id={id ?? auto}
      aria-labelledby={label ? labelId : undefined}
      className={cn(
        "peer inline-flex h-[18px] w-8 shrink-0 items-center rounded-full bg-transparent p-0.5 ring-1 ring-inset ring-edge transition-colors data-[state=checked]:bg-brand data-[state=checked]:ring-brand data-[state=checked]:shadow-[inset_0_1px_1px_rgb(0_0_0/0.25)] disabled:cursor-not-allowed disabled:opacity-45",
        focusRing,
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-3 translate-x-px rounded-full bg-edge transition-[translate,background-color] duration-[120ms] data-[state=checked]:translate-x-[15px] data-[state=checked]:bg-[var(--brand-foreground)]" />
    </SwitchPrimitive.Root>
  );
  if (!label) return root;
  return (
    <label htmlFor={id ?? auto} className={cn("inline-flex min-h-7 cursor-pointer items-center gap-2", props.disabled && "cursor-not-allowed opacity-45")}>
      {root}
      <RowLabel id={labelId} label={label} description={description} />
    </label>
  );
});

export interface CheckboxProps extends Omit<ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, "children"> {
  label?: ReactNode;
  description?: ReactNode;
}

/** Checkbox: unchecked outlined, checked bg-brand. With `label` the whole row toggles. Supports checked="indeterminate". */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(function Checkbox(
  { label, description, className, id, ...props },
  ref,
) {
  const auto = useId();
  const labelId = `${auto}-l`;
  const root = (
    <CheckboxPrimitive.Root
      ref={ref}
      id={id ?? auto}
      aria-labelledby={label ? labelId : undefined}
      className={cn(
        "inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] bg-transparent text-brand-foreground ring-1 ring-inset ring-edge transition-colors duration-[120ms] hover:bg-control-hover data-[state=checked]:hover:bg-brand data-[state=checked]:bg-brand data-[state=checked]:ring-brand data-[state=indeterminate]:bg-brand data-[state=indeterminate]:ring-brand disabled:cursor-not-allowed disabled:opacity-45",
        focusRing,
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator>
        {props.checked === "indeterminate" ? <MinusIcon className="size-3.5" /> : <CheckIcon className="size-3.5" />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
  if (!label) return root;
  return (
    <label htmlFor={id ?? auto} className={cn("inline-flex min-h-7 cursor-pointer items-start gap-2 py-1", props.disabled && "cursor-not-allowed opacity-45")}>
      <span className="mt-px">{root}</span>
      <RowLabel id={labelId} label={label} description={description} />
    </label>
  );
});
