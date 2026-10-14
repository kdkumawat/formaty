"use client";

import { type ReactElement, type ReactNode } from "react";
import * as D from "@radix-ui/react-dialog";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { cn } from "@/lib/utils";
import { IconButton } from "./Button";
import { usePortalContainer } from "./portal";
import { mutedText, surface } from "./styles";

export interface SidePanelProps {
  /** The trigger element (e.g. an IconButton); it must forward its ref and spread props. */
  trigger: ReactElement;
  title: string;
  children: ReactNode;
  /** Pinned bottom row, e.g. a primary action. */
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/** Right sheet under the 40px app header: 360px, hairline left edge, internal scroll, no scrim. Below 640px it fills the width. Closes on Esc or a click outside. */
export function SidePanel({ trigger, title, children, footer, open, onOpenChange, className }: SidePanelProps) {
  const container = usePortalContainer();
  return (
    <D.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <D.Trigger asChild>{trigger}</D.Trigger>
      <D.Portal container={container}>
        <D.Content
          // Focus the sheet itself on open: focusing the close button would pop its tooltip.
          tabIndex={-1}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
          // The trigger toggles the sheet itself; do not let "outside" close then reopen it.
          onInteractOutside={(e) => {
            if ((e.target as HTMLElement | null)?.closest?.("[data-radix-popper-content-wrapper], [role='menu'], [role='dialog']")) e.preventDefault();
          }}
          aria-describedby={undefined}
          className={cn(
            surface,
            "fixed bottom-0 right-0 top-10 flex w-[360px] max-w-full flex-col border-l border-[var(--workspace-border)] shadow-[var(--raised-inset),-1px_0_0_var(--workspace-border),var(--menu-shadow)] max-sm:w-full",
            className,
          )}
        >
          <div className="flex h-12 shrink-0 items-center justify-between pl-4 pr-2.5">
            <D.Title className="text-[14px] font-semibold text-[var(--workspace-text)]">{title}</D.Title>
            <D.Close asChild>
              <IconButton label="Close" shortcut="Esc">
                <XMarkIcon />
              </IconButton>
            </D.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
          {footer && <div className="shrink-0 border-t border-[var(--workspace-border)] px-4 py-2">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}

/** Titled group inside a SidePanel: 12px muted name over a hairline. */
export function PanelGroup({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("pt-3 first:pt-0", className)}>
      <h3 className={cn("border-b border-[var(--workspace-border)] pb-1 text-[12px] font-medium", mutedText)}>{title}</h3>
      <div className="pt-1">{children}</div>
    </section>
  );
}

export interface PanelRowProps {
  label: ReactNode;
  /** 12px muted line under the label. */
  description?: ReactNode;
  /** The control, right-aligned. */
  children: ReactNode;
  className?: string;
}

/** Label left, control right, 32px minimum. */
export function PanelRow({ label, description, children, className }: PanelRowProps) {
  return (
    <div className={cn("flex min-h-8 items-center justify-between gap-3 py-0.5", className)}>
      <div className="flex min-w-0 flex-col">
        <span className="text-[13px] text-[var(--workspace-text)]">{label}</span>
        {description && <span className={cn("text-[12px]", mutedText)}>{description}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-1">{children}</div>
    </div>
  );
}
