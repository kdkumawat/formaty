"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { decodeState } from "@/lib/shareState";

function PlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const data = searchParams.get("data");

  useEffect(() => {
    if (!data) {
      router.replace("/");
      return;
    }
    const state = decodeState(data);
    if (state) {
      router.replace(`/#${data}`);
      return;
    }
    router.replace("/");
  }, [data, router]);

  return (
    <div className="flex h-screen items-center justify-center bg-[var(--workspace-background)]">
      <p className="text-sm text-base-content/70">Loading shared playground…</p>
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[var(--workspace-background)]">
        <p className="text-sm text-base-content/70">Loading…</p>
      </div>
    }>
      <PlayContent />
    </Suspense>
  );
}
