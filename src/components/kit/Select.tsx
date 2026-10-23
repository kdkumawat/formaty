"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { cn } from "@/lib/utils";
import { Button, type ButtonVariant } from "./Button";
import { Menu, MenuContent, MenuLabel, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "./Menu";
import { mutedText, type KitSize } from "./styles";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  /** Trigger text when this option is current, if it should differ from the menu label (e.g. Auto shows what it detected). */
  display?: string;
  hint?: ReactNode;
  /** Options sharing a group name render under one muted label; ungrouped options come first. */
  group?: string;
}

export interface SelectProps<T extends string = string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Optional muted prefix inside the trigger, e.g. "Indent". Part of the accessible name (label + value). */
  label?: string;
  /** Fixed trigger width (px number or CSS length). Omit to size to the longest label (up to 40 options). */
  width?: number | string;
  size?: KitSize;
  variant?: ButtonVariant;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "bottom";
}

/** Menu-backed select: Button trigger (label, value, chevron) opening a radio menu with a check on the current value. */
export function Select<T extends string = string>({
  options,
  value,
  onChange,
  label,
  width,
  size = "sm",
  variant = "secondary",
  disabled,
  placeholder = "Select",
  "aria-label": ariaLabel,
  className,
  align = "start",
  side = "bottom",
}: SelectProps<T>) {
  const contentRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);
  const sections = useMemo(() => {
    const map = new Map<string, SelectOption<T>[]>();
    for (const o of options) {
      const k = o.group ?? "";
      map.set(k, [...(map.get(k) ?? []), o]);
    }
    return [...map.entries()].sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : 0));
  }, [options]);
  // Stack every label in one grid cell so the trigger is as wide as the longest and never jumps.
  const stack = width === undefined && options.length <= 40;

  return (
    <Menu
      onOpenChange={(o) => {
        // Land on the current value so long lists open scrolled to it.
        if (o) requestAnimationFrame(() => contentRef.current?.querySelector<HTMLElement>('[role="menuitemradio"][data-state="checked"]')?.focus());
      }}
    >
      <MenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled}
          // WCAG 2.5.3: the name must contain the visible text. With a visible label, let the name compute from label + value;
          // with only the value visible, lead with it and append the field name.
          aria-label={label || !ariaLabel ? undefined : `${current ? current.display ?? current.label : placeholder}, ${ariaLabel}`}
          iconRight={<ChevronDownIcon />}
          style={width !== undefined ? { width } : undefined}
          className={cn(width !== undefined && "justify-between", className)}
        >
          {label && <span className={cn("font-normal", mutedText)}>{label}</span>}
          <span className="grid min-w-0 text-left">
            {stack ? (
              [...options.map((o) => ({ k: o.value, t: o.display ?? o.label })), ...(current ? [] : [{ k: "", t: placeholder }])].map(
                ({ k, t }) => (
                  <span key={k} className={cn("col-start-1 row-start-1 truncate", k !== (current ? value : "") && "invisible")}>
                    {t}
                  </span>
                ),
              )
            ) : (
              <span className="truncate">{current ? current.display ?? current.label : placeholder}</span>
            )}
          </span>
        </Button>
      </MenuTrigger>
      <MenuContent
        ref={contentRef}
        align={align}
        side={side}
        className="min-w-[var(--radix-dropdown-menu-trigger-width)]"
      >
        <MenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {sections.map(([group, items]) => (
            <div key={group} role="presentation">
              {group && <MenuLabel>{group}</MenuLabel>}
              {items.map((o) => (
                <MenuRadioItem key={o.value} value={o.value} hint={o.hint}>
                  {o.label}
                </MenuRadioItem>
              ))}
            </div>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}
