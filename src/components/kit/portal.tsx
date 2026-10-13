"use client";

import { createContext, useContext, type ReactNode } from "react";

const PortalContext = createContext<HTMLElement | null>(null);

/** Renders kit popups (menus, tooltips, panels) inside `container` instead of document.body. Used by the /kit preview to keep each theme column's popups themed. */
export function KitPortalProvider({ container, children }: { container: HTMLElement | null; children: ReactNode }) {
  return <PortalContext.Provider value={container}>{children}</PortalContext.Provider>;
}

export function usePortalContainer(): HTMLElement | undefined {
  return useContext(PortalContext) ?? undefined;
}
