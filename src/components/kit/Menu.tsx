"use client";

import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import * as DM from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { cn } from "@/lib/utils";
import { Kbd } from "./Kbd";
import { usePortalContainer } from "./portal";
import { mutedText, surface } from "./styles";

/** Root. Props: `open`, `onOpenChange` (controlled), `modal`. Compose with MenuTrigger + MenuContent. */
export const Menu = DM.Root;
/** Use with `asChild` around a Button / IconButton. */
export const MenuTrigger = DM.Trigger;
export const MenuRadioGroup = DM.RadioGroup;
export const MenuSub = DM.Sub;

const contentClass = cn(
  surface,
  "min-w-[200px] max-h-[min(var(--radix-dropdown-menu-content-available-height),440px)] overflow-y-auto overflow-x-hidden rounded-[10px] p-1",
);

export type MenuContentProps = ComponentPropsWithoutRef<typeof DM.Content>;

/** Floating menu: min width 180px, scrolls past the available height. */
export const MenuContent = forwardRef<HTMLDivElement, MenuContentProps>(function MenuContent(
  { className, align = "start", side = "bottom", sideOffset = 6, collisionPadding = 8, ...props },
  ref,
) {
  const container = usePortalContainer();
  return (
    <DM.Portal container={container}>
      <DM.Content
        ref={ref}
        align={align}
        side={side}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(contentClass, className)}
        {...props}
      />
    </DM.Portal>
  );
});

export type MenuSubContentProps = ComponentPropsWithoutRef<typeof DM.SubContent>;

export const MenuSubContent = forwardRef<HTMLDivElement, MenuSubContentProps>(function MenuSubContent(
  { className, sideOffset = 4, collisionPadding = 8, ...props },
  ref,
) {
  const container = usePortalContainer();
  return (
    <DM.Portal container={container}>
      <DM.SubContent
        ref={ref}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={cn(contentClass, className)}
        {...props}
      />
    </DM.Portal>
  );
});

const rowClass =
  "relative flex h-7 w-full cursor-pointer select-none items-center gap-2 whitespace-nowrap rounded-md px-2 text-[13px] font-normal text-[var(--workspace-text)] outline-none! max-[900px]:h-9 data-[highlighted]:bg-control-hover data-[highlighted]:[&_.menu-icon]:opacity-100 data-[state=open]:bg-control-hover data-[disabled]:pointer-events-none data-[disabled]:opacity-45";

interface RowExtras {
  icon?: ReactNode;
  /** Muted text at the right edge. */
  hint?: ReactNode;
  /** Shortcut in Mac notation, shown as a keycap at the right edge. */
  shortcut?: string;
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="menu-icon inline-flex size-4 shrink-0 items-center justify-center opacity-70 [&>svg]:size-4">
      {children}
    </span>
  );
}

function Tail({ hint, shortcut }: Pick<RowExtras, "hint" | "shortcut">) {
  return (
    <>
      {hint != null && <span className={cn("shrink-0 pl-3 text-right font-mono text-[11.5px] font-normal", mutedText)}>{hint}</span>}
      {shortcut && <Kbd keys={shortcut} className="!bg-transparent !font-mono !shadow-none !text-[11.5px] !text-[var(--workspace-text-muted)]" />}
    </>
  );
}

const CheckSlot = ({ on }: { on: boolean }) => (
  <span aria-hidden className="inline-flex size-4 shrink-0 items-center justify-center text-primary">
    {on && <CheckIcon className="size-4" />}
  </span>
);

export interface MenuItemProps extends Omit<ComponentPropsWithoutRef<typeof DM.Item>, "children">, RowExtras {
  children: ReactNode;
  /** Marks the current choice: check in a fixed right slot and a semibold label. Pass false (not undefined) on the other items to keep the check column aligned. */
  selected?: boolean;
}

export const MenuItem = forwardRef<HTMLDivElement, MenuItemProps>(function MenuItem(
  { icon, hint, shortcut, selected, className, children, ...props },
  ref,
) {
  return (
    <DM.Item ref={ref} className={cn(rowClass, selected && "font-[520]", className)} {...props}>
      {icon && <Icon>{icon}</Icon>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <Tail hint={hint} shortcut={shortcut} />
      {selected !== undefined && <CheckSlot on={selected} />}
    </DM.Item>
  );
});

export interface MenuCheckboxItemProps extends Omit<ComponentPropsWithoutRef<typeof DM.CheckboxItem>, "children">, RowExtras {
  children: ReactNode;
}

/** Toggle row. Closes the menu on select unless you call `event.preventDefault()` in `onSelect`. */
export const MenuCheckboxItem = forwardRef<HTMLDivElement, MenuCheckboxItemProps>(function MenuCheckboxItem(
  { icon, hint, shortcut, className, children, ...props },
  ref,
) {
  return (
    <DM.CheckboxItem ref={ref} className={cn(rowClass, "data-[state=checked]:font-[520]", className)} {...props}>
      {icon && <Icon>{icon}</Icon>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <Tail hint={hint} shortcut={shortcut} />
      <span aria-hidden className="inline-flex size-4 shrink-0 items-center justify-center text-primary">
        <DM.ItemIndicator>
          <CheckIcon className="size-4" />
        </DM.ItemIndicator>
      </span>
    </DM.CheckboxItem>
  );
});

export interface MenuRadioItemProps extends Omit<ComponentPropsWithoutRef<typeof DM.RadioItem>, "children">, RowExtras {
  children: ReactNode;
}

/** Use inside MenuRadioGroup. */
export const MenuRadioItem = forwardRef<HTMLDivElement, MenuRadioItemProps>(function MenuRadioItem(
  { icon, hint, shortcut, className, children, ...props },
  ref,
) {
  return (
    <DM.RadioItem ref={ref} className={cn(rowClass, "data-[state=checked]:font-[520]", className)} {...props}>
      {icon && <Icon>{icon}</Icon>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <Tail hint={hint} shortcut={shortcut} />
      <span aria-hidden className="inline-flex size-4 shrink-0 items-center justify-center text-primary">
        <DM.ItemIndicator>
          <CheckIcon className="size-4" />
        </DM.ItemIndicator>
      </span>
    </DM.RadioItem>
  );
});

export const MenuLabel = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof DM.Label>>(function MenuLabel(
  { className, ...props },
  ref,
) {
  return <DM.Label ref={ref} className={cn("px-2 pb-1 pt-2 text-[12px] font-medium", mutedText, className)} {...props} />;
});

export const MenuSeparator = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof DM.Separator>>(
  function MenuSeparator({ className, ...props }, ref) {
    return <DM.Separator ref={ref} className={cn("-mx-1 my-1 h-px bg-[var(--workspace-border)] first:hidden", className)} {...props} />;
  },
);

export interface MenuSubTriggerProps extends Omit<ComponentPropsWithoutRef<typeof DM.SubTrigger>, "children">, RowExtras {
  children: ReactNode;
}

/** Row that opens a MenuSubContent to the right on hover or ArrowRight. */
export const MenuSubTrigger = forwardRef<HTMLDivElement, MenuSubTriggerProps>(function MenuSubTrigger(
  { icon, hint, className, children, ...props },
  ref,
) {
  return (
    <DM.SubTrigger ref={ref} className={cn(rowClass, "", className)} {...props}>
      {icon && <Icon>{icon}</Icon>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <Tail hint={hint} />
      <span aria-hidden className="inline-flex size-4 shrink-0 items-center justify-center opacity-70"><ChevronRightIcon className="size-4" /></span>
    </DM.SubTrigger>
  );
});

/**
 * A non-item row for forms inside a menu (text field, stepper, segmented). It keeps
 * keystrokes (no typeahead, no arrow navigation) and clicks away from the menu, so the
 * menu stays open. Escape still closes it.
 */
export const MenuCustom = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(function MenuCustom(
  { className, onKeyDown, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      role="group"
      className={cn("flex min-h-7 items-center gap-2 px-2 py-0.5", className)}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        e.stopPropagation();
      }}
      {...props}
    />
  );
});
