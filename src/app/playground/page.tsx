"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loadPlayground, type LoadPlaygroundResult } from "@/lib/playgroundApi";
import { WorkspaceContent } from "@/components/WorkspaceContent";
import { Logo } from "@/components/Logo";

const linkBtnClass = "btn btn-m btn-ghost rounded p-1 border-0 hover:bg-[var(--workspace-panel)] hover:underline text-primary";

type LoadStatus = "loading" | LoadPlaygroundResult;

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");
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
    return <WorkspaceContent />;
  }

  if (status === "loading") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[var(--workspace-background)]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-[var(--workspace-text-muted)]">Loading shared playground…</p>
      </div>
    );
  }

  if (status.status === "not_found" || status.status === "error" || status.status === "rate_limit") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--workspace-background)] px-4 py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo size={48} className="shrink-0" />
          <h1 className="text-xl font-bold text-[var(--workspace-text)]">
            {status.status === "not_found" ? "Playground not found" : status.status === "rate_limit" ? "Too many requests" : "Something went wrong"}
          </h1>
          <p className="max-w-sm text-sm text-[var(--workspace-text-muted)]">
            {status.status === "not_found"
              ? "This link may have expired or been disabled by the owner."
              : status.status === "rate_limit"
                ? "Please try again in a few moments."
                : "We couldn't load this playground. Please try again."}
          </p>
        </div>
        <div className="flex w-full max-w-md flex-col gap-5 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6">
          <div>
            <p className="mb-3 text-sm font-medium text-[var(--workspace-text)]">Your data stays in your browser only - formaty runs locally</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[var(--workspace-text-muted)]">
              <span>• Format & convert JSON, XML, YAML, TOML, CSV</span>
              <span>• Tree, graph & table views</span>
              <span>• JSONPath & JMESPath query</span>
              <span>• cURL → fetch API</span>
              <span>• Schema validation & type generation</span>
              <span>• Diff, beautify, minify</span>
            </div>
          </div>
          <Link href="/playground" className={`${linkBtnClass} w-full justify-center py-2`}>
            Go to playground
          </Link>
        </div>
      </div>
    );
  }

  return <WorkspaceContent initialState={status.data} />;
}

export default function PlaygroundPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[var(--workspace-background)]">
          <p className="text-sm text-base-content/70">Loading…</p>
        </div>
      }
    >
      <PlaygroundContent />
    </Suspense>
  );
}
