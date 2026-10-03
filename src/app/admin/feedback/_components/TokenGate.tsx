"use client";

import { useState } from "react";
import { EyeIcon, EyeSlashIcon, InboxIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface TokenGateProps {
  /** Verify the token (page does a probe fetch). Resolves true when accepted. */
  onUnlock: (token: string) => Promise<{ ok: true } | { ok: false; message: string }>;
}

export function TokenGate({ onUnlock }: TokenGateProps) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = value.trim();
    if (!clean || verifying) return;
    setVerifying(true);
    setError(null);
    const res = await onUnlock(clean);
    setVerifying(false);
    if (!res.ok) setError(res.message);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--workspace-background)] p-6">
      <div className="w-full max-w-sm rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-8">
        <InboxIcon className="h-10 w-10 text-[var(--workspace-text-muted)]" />
        <h1 className="mt-4 text-lg font-semibold text-[var(--workspace-text)]">Feedback inbox</h1>
        <p className="mt-2 text-sm text-[var(--workspace-text-muted)]">
          Enter your admin token to unlock. It is kept in this browser session only.
        </p>
        <form className="mt-5 flex flex-col gap-3" onSubmit={submit}>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Admin token"
              autoComplete="off"
              autoFocus
              className="h-10 pr-10"
            />
            <button
              type="button"
              aria-label={show ? "Hide token" : "Show token"}
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors hover:text-[var(--workspace-text)]"
            >
              {show ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          {error && (
            <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={!value.trim() || verifying}>
            {verifying ? "Verifying…" : "Unlock inbox"}
          </Button>
        </form>
      </div>
    </main>
  );
}
