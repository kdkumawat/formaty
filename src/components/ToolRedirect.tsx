"use client";

import { useEffect } from "react";
import Link from "next/link";
import { H1, LINK, SiteHeader, Stage, WRAP } from "@/components/landing";

/**
 * Rendered for tool routes that were removed during deduplication. The server
 * page also emits a <meta http-equiv="refresh"> (hoisted to <head> by React 19),
 * so this is a belt-and-braces instant client redirect for JS users.
 */
export function ToolRedirect({ to, label }: { to: string; label: string }) {
  useEffect(() => {
    const id = setTimeout(() => {
      // Accept either a root-relative path ("/foo") or a full URL.
      const target = to.startsWith("/") ? to : `/${to}`;
      window.location.replace(target);
    }, 50);
    return () => clearTimeout(id);
  }, [to]);

  const href = to.startsWith("/") ? to : `/${to}`;
  return (
    <div className="mk-ink flex min-h-screen flex-col bg-[var(--workspace-background)]">
      <SiteHeader />
      <Stage>
        <main id="main" className={`${WRAP} flex min-h-[calc(100vh-var(--mk-header))] flex-col justify-center gap-4 pb-24`}>
          <h1 className={H1}>This tool has moved.</h1>
          <p className="text-[16px] text-[var(--workspace-text-muted)] sm:text-[17px]">
            Redirecting to{" "}
            <Link href={href} className={`${LINK} !min-h-0`}>
              {label}
            </Link>
            ...
          </p>
        </main>
      </Stage>
    </div>
  );
}
