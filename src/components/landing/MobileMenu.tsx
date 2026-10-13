"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Bars2Icon, XMarkIcon } from "@heroicons/react/16/solid";
import { IconButton } from "@/components/kit";
import { WRAP } from "./ui";

/**
 * The header menu on small screens: an ink sheet that drops from the top over a scrim. It is a modal dialog,
 * so focus stays inside it, Escape and the scrim close it, the page behind does not scroll, and focus returns
 * to the menu button. Its top row repeats the header bar (`brand` and `action`), so opening it reads as the
 * bar growing, with the close button where the menu button was.
 */
export function MobileMenu({ brand, action, children }: { brand: React.ReactNode; action: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const closeOnLink = (e: React.MouseEvent) => (e.target as HTMLElement).closest("a") && setOpen(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <IconButton label="Open menu" size="lg" className="md:hidden">
          <Bars2Icon />
        </IconButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="mk-ink fixed inset-0 z-50 bg-[var(--workspace-background)]/60 backdrop-blur-[2px] transition-opacity duration-[140ms] ease-out starting:opacity-0 md:hidden" />
        <Dialog.Content
          aria-describedby={undefined}
          // Focus the sheet itself on open, so no control shows a focus ring until the visitor tabs.
          tabIndex={-1}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            (e.currentTarget as HTMLElement).focus();
          }}
          onClick={closeOnLink}
          // One press closes the sheet even while a tooltip inside it is open (the tooltip would take the first).
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          className="mk-ink fixed inset-x-0 top-0 z-50 max-h-dvh overflow-y-auto border-b border-[var(--workspace-border)] bg-[var(--workspace-background)] pb-5 shadow-menu outline-none transition-[opacity,translate] duration-[140ms] ease-out starting:-translate-y-2 starting:opacity-0 md:hidden"
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <div className={`${WRAP} flex h-[var(--mk-header)] items-center justify-between gap-x-4`}>
            {brand}
            <div className="flex items-center gap-x-1">
              {action}
              <Dialog.Close asChild>
                <IconButton label="Close menu" size="lg">
                  <XMarkIcon />
                </IconButton>
              </Dialog.Close>
            </div>
          </div>
          <nav aria-label="Menu" className={`${WRAP} flex flex-col`}>
            {children}
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
