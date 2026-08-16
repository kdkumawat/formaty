"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * Rendered for tool routes that were removed during deduplication. The server
 * page also emits a <meta http-equiv="refresh"> (hoisted to <head> by React 19),
 * so this is a belt-and-braces instant client redirect for JS users.
 */
export function ToolRedirect({ to, label }: { to: string; label: string }) {
  useEffect(() => {
    const id = setTimeout(() => {
      window.location.replace(`/${to}`);
    }, 50);
    return () => clearTimeout(id);
  }, [to]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[var(--workspace-background)] px-4 text-center">
      <Logo size={40} className="text-primary" />
      <div>
        <p className="text-sm font-medium text-[var(--workspace-text)]">
          This tool has moved.
        </p>
        <p className="mt-1 text-sm text-[var(--workspace-text-muted)]">
          Redirecting to{" "}
          <Link
            href={`/${to}`}
            className="font-semibold text-primary hover:underline"
          >
            {label}
          </Link>
          …
        </p>
      </div>
    </div>
  );
}
