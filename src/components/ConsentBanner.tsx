"use client";

import { useEffect, useState } from "react";
import { getGaConsent, setGaConsent } from "@/components/Analytics";

const GA_ENABLED = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

/**
 * GDPR / CCPA consent banner. Renders only when Google Analytics is enabled
 * via `NEXT_PUBLIC_GA_MEASUREMENT_ID` and the visitor hasn't decided yet.
 * Accepting activates analytics; declining keeps everything off.
 */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!GA_ENABLED) return;
    // Wait a beat so the layout theme script settles before showing.
    const t = window.setTimeout(() => {
      if (getGaConsent() === null) setVisible(true);
    }, 800);
    return () => window.clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Privacy consent"
      className="fixed bottom-4 left-1/2 z-[300] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-2xl"
    >
      <p className="text-[12px] leading-relaxed text-[var(--card-foreground)]">
        We use a privacy-friendly analytics cookie (Google Analytics, anonymized IP) to understand which
        tools are used. Your data never leaves your device - processing is local.
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          className="h-8 rounded-md px-3 text-xs font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
          onClick={() => {
            setGaConsent("declined");
            setVisible(false);
          }}
        >
          Decline
        </button>
        <button
          type="button"
          className="h-8 rounded-md bg-[var(--primary)] px-3 text-xs font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
          onClick={() => {
            setGaConsent("accepted");
            setVisible(false);
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
