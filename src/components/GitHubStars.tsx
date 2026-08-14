"use client";

import { useEffect, useState } from "react";

const REPO = "kdkumawat/formaty";
const CACHE_KEY = "formaty-gh-stars";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

/**
 * Live GitHub star count. Cached in localStorage for an hour and hidden on
 * any failure (offline, rate limit) so it never breaks the layout.
 */
export function GitHubStars({ className = "" }: { className?: string }) {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { count, ts } = JSON.parse(cached) as { count: number; ts: number };
        if (typeof count === "number" && Date.now() - ts < CACHE_TTL) {
          setStars(count);
          return;
        }
      }
    } catch {
      /* ignore corrupt cache */
    }
    fetch(`https://api.github.com/repos/${REPO}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const count = data?.stargazers_count;
        if (typeof count === "number") {
          setStars(count);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ count, ts: Date.now() }));
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* offline or rate limited - hide badge */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (stars === null) return null;

  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${stars} stars on GitHub`}
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2.5 py-1 text-xs font-medium text-[var(--workspace-text-muted)] transition-colors hover:border-primary/40 hover:text-[var(--workspace-text)] ${className}`}
    >
      <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
      <span className="font-semibold tabular-nums text-[var(--workspace-text)]">{formatCount(stars)}</span>
    </a>
  );
}
