"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loadPlayground, type LoadPlaygroundResult } from "@/lib/playgroundApi";
import { WorkspaceContent } from "@/components/WorkspaceContent";
import { KeyboardShortcutsOverlay } from "@/components/KeyboardShortcutsOverlay";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/kit";

/** Same geometry as the workspace shell (36px chrome row, sheet with two panes, 24px status bar) so nothing jumps on load. */
function ShellSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-dvh flex-col bg-[var(--workspace-background)]" role="status" aria-label={label}>
      <div className="flex h-9 shrink-0 items-end gap-2 px-3">
        <div className="mb-1.5 size-5 rounded bg-[var(--workspace-border)]" />
        <div className="h-[30px] w-32 rounded-t-md bg-[var(--workspace-panel)]" />
      </div>
      <div className="flex min-h-0 flex-1 px-3">
        <div className="flex min-w-0 flex-1 rounded-t-lg bg-[var(--workspace-panel)]">
          <div className="flex w-[38%] flex-col border-r border-[var(--workspace-border)]">
            <div className="h-9 border-b border-[var(--workspace-border)]" />
          </div>
          <div className="flex flex-1 flex-col">
            <div className="h-9 border-b border-[var(--workspace-border)]" />
            <p className="p-3 text-[13px] text-[var(--workspace-text-muted)]">{label}</p>
          </div>
        </div>
      </div>
      <div className="h-6 shrink-0 border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)]" />
    </div>
  );
}

type LoadStatus = "loading" | LoadPlaygroundResult;

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
  const embed = searchParams?.get("embed") === "1";
  const [status, setStatus] = useState<LoadStatus | "no_id">(id ? "loading" : "no_id");

  useEffect(() => {
    if (!id) {
      setStatus("no_id");
      return;
    }
    let cancelled = false;
    loadPlayground(id).then((result) => {
      if (cancelled) return;
      setStatus(result);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "no_id") {
    return <WorkspaceContent embed={embed} />;
  }

  if (status === "loading") return <ShellSkeleton label="Loading shared playground..." />;

  if (status.status === "not_found" || status.status === "error" || status.status === "rate_limit") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--workspace-background)] px-4 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo size={48} className="shrink-0" />
          <h1 className="text-[20px] font-semibold text-[var(--workspace-text)]">
            {status.status === "not_found" ? "Playground not found" : status.status === "rate_limit" ? "Too many requests" : "Something went wrong"}
          </h1>
          <p className="max-w-sm text-[13px] text-[var(--workspace-text-muted)]">
            {status.status === "not_found"
              ? "This link may have expired or been disabled by the owner."
              : status.status === "rate_limit"
                ? "Please try again in a few moments."
                : "We couldn't load this playground. Please try again."}
          </p>
        </div>
        <div className="flex w-full max-w-md flex-col gap-5 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6">
          <div>
            <p className="mb-3 text-[13px] font-medium text-[var(--workspace-text)]">Your data stays in your browser only - formaty runs locally</p>
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 gap-y-2 text-[12px] text-[var(--workspace-text-muted)]">
              <span>• Format & convert JSON, XML, YAML, TOML, CSV</span>
              <span>• Tree, graph & table views</span>
              <span>• JSONPath & JMESPath query</span>
              <span>• cURL → fetch API</span>
              <span>• Schema validation & type generation</span>
              <span>• Diff, beautify, minify</span>
            </div>
          </div>
          <Button asChild variant="primary" size="md" className="w-full">
            <Link href="/playground">Go to playground</Link>
          </Button>
        </div>
      </div>
    );
  }

  const sharedLinkUrl = typeof window !== "undefined" && id ? `${window.location.origin}/playground?id=${id}` : undefined;
  return <WorkspaceContent initialState={status.data} sharedLinkId={id ?? undefined} sharedLinkUrl={sharedLinkUrl} embed={embed} />;
}

export default function PlaygroundPage() {
  return (
    <Suspense
      fallback={<ShellSkeleton label="Loading..." />}
    >
      <PlaygroundContent />
      <KeyboardShortcutsOverlay />
    </Suspense>
  );
}
