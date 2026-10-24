"use client";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CONSENT_KEY = "formaty-ga-consent";

/** True when Google Analytics is configured for this build. */
export const GA_ENABLED = Boolean(GA_ID);

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** The visitor's explicit analytics choice from Settings (null = never touched, analytics on by default). */
export function getGaConsent(): "accepted" | "declined" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

/** Record the visitor's choice and switch analytics on or off for this page. */
export function setGaConsent(value: "accepted" | "declined") {
  const wasOff = getGaConsent() === "declined";
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
  if (!GA_ID || typeof window === "undefined") return;
  const disableKey = `ga-disable-${GA_ID}`;
  (window as unknown as Record<string, unknown>)[disableKey] = value === "declined";
  window.gtag?.("consent", "update", { analytics_storage: value === "accepted" ? "granted" : "denied" });
  // Analytics that was off at page load never ran config, so start it now.
  if (value === "accepted" && wasOff) window.gtag?.("config", GA_ID);
}

/**
 * Fire a GA4 custom event. Safe no-op when tracking is disabled
 * (no `NEXT_PUBLIC_GA_MEASUREMENT_ID`), the visitor turned analytics off,
 * or gtag hasn't loaded yet.
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!GA_ID || typeof window === "undefined") return;
  if (getGaConsent() === "declined") return;
  window.gtag?.("event", name, {
    ...params,
    send_to: GA_ID,
  });
}
