"use client";

import { useSyncExternalStore, type ReactElement, type ReactNode } from "react";
import * as P from "@radix-ui/react-popover";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { cn } from "@/lib/utils";
import { IconButton } from "./Button";
import { usePortalContainer } from "./portal";
import { mutedText, surface } from "./styles";

const query = "(max-width: 639px)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(query);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useNarrow = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );

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

/** Floating panel under a top-bar trigger: 340px, right-aligned, internal scroll. Below 640px it is a full-width sheet from the top with 12px margins. */
export function SidePanel({ trigger, title, children, footer, open, onOpenChange, className }: SidePanelProps) {
  const narrow = useNarrow();
  const container = usePortalContainer();
  return (
    <P.Root open={open} onOpenChange={onOpenChange}>
      {narrow && (
        <P.Anchor asChild>
          <div aria-hidden className="pointer-events-none fixed inset-x-3 top-3 h-0" />
        </P.Anchor>
      )}
      <P.Trigger asChild>{trigger}</P.Trigger>
      <P.Portal container={container}>
        <P.Content
          // Focus the panel itself on open: focusing the close button would pop its tooltip.
          tabIndex={-1}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
          align={narrow ? "center" : "end"}
          side="bottom"
          sideOffset={narrow ? 0 : 8}
          collisionPadding={12}
          aria-label={title}
          className={cn(
            surface,
            "flex max-h-[calc(100dvh-64px)] w-[340px] flex-col rounded-xl",
            "max-sm:w-[calc(100vw-24px)]",
            className,
          )}
        >
          <div className="flex h-10 shrink-0 items-center justify-between pl-3 pr-1.5">
            <h2 className="text-[14px] font-semibold text-[var(--workspace-text)]">{title}</h2>
            <P.Close asChild>
              <IconButton label="Close" shortcut="Esc">
                <XMarkIcon />
              </IconButton>
            </P.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">{children}</div>
          {footer && <div className="shrink-0 border-t border-[var(--workspace-border)] px-3 py-2">{footer}</div>}
        </P.Content>
      </P.Portal>
    </P.Root>
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
