"use client";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const CONSENT_KEY = "formaty-ga-consent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Current analytics consent decision (null = undecided). */
export function getGaConsent(): "accepted" | "declined" | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "accepted" || v === "declined" ? v : null;
  } catch {
    return null;
  }
}

/** Record the visitor's decision and push a consent-mode update to gtag. */
export function setGaConsent(value: "accepted" | "declined") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
  if (!GA_ID || typeof window === "undefined") return;
  window.gtag?.("consent", "update", {
    ad_storage: "denied",
    analytics_storage: value === "accepted" ? "granted" : "denied",
    personalization_storage: "denied",
    functionality_storage: value === "accepted" ? "granted" : "denied",
    security_storage: "granted",
  });
  if (value === "accepted") {
    // Start collecting the current page as a page_view once consent is given.
    // SPA route changes are covered by GA4 Enhanced Measurement (history events).
    window.gtag?.("config", GA_ID, {
      page_path: `${window.location.pathname}${window.location.search}`,
    });
  }
}

/**
 * Fire a GA4 custom event. Safe no-op when tracking is disabled
 * (no `NEXT_PUBLIC_GA_MEASUREMENT_ID`), consent hasn't been granted, or
 * gtag hasn't loaded yet.
 */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (!GA_ID || typeof window === "undefined") return;
  if (getGaConsent() !== "accepted") return;
  window.gtag?.("event", name, {
    ...params,
    send_to: GA_ID,
  });
}
