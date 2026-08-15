"use client";

import { useEffect, useState } from "react";
import { StarIcon } from "@heroicons/react/20/solid";

const REPO = "kdkumawat/formaty";
const CACHE_KEY = "formaty-gh-stars";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

const GitHubMark = () => (
  <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      fillRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * GitHub link with live star count. Cached in localStorage for an hour; hides the
 * star count (but keeps the link) on any failure so it never breaks the layout.
 * `variant` controls the chrome: "pill" for the landing header, "plain" for the
 * workspace header.
 */
export function GitHubStars({
  className = "",
  variant = "pill",
}: {
  className?: string;
  variant?: "pill" | "plain";
}) {
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

  if (variant === "plain") {
    return (
      <a
        href={`https://github.com/${REPO}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${stars ? `${stars} stars on GitHub` : "GitHub repository"}`}
        className={`inline-flex items-center gap-1.5 rounded-md border border-[var(--workspace-border)] px-2 py-1 text-xs font-medium text-[var(--workspace-text-muted)] transition-all hover:border-primary/30 hover:text-[var(--workspace-text)] ${className}`}
      >
        <GitHubMark />
        {stars !== null ? (
          <span className="inline-flex items-center gap-1">
            <StarIcon className="h-3 w-3 text-amber-400" aria-hidden />
            <span className="font-semibold tabular-nums text-[var(--workspace-text)]">
              {formatCount(stars)}
            </span>
          </span>
        ) : (
          <span className="hidden sm:inline">GitHub</span>
        )}
      </a>
    );
  }

  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${stars ? `${stars} stars on GitHub` : "GitHub repository"}`}
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-2.5 py-1 text-xs font-medium text-[var(--workspace-text-muted)] transition-colors hover:border-primary/40 hover:text-[var(--workspace-text)] ${className}`}
    >
      <GitHubMark />
      {stars !== null && (
        <span className="inline-flex items-center gap-1">
          <StarIcon className="h-3 w-3 text-amber-400" aria-hidden />
          <span className="font-semibold tabular-nums text-[var(--workspace-text)]">
            {formatCount(stars)}
          </span>
        </span>
      )}
    </a>
  );
}
