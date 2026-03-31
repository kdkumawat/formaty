"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";

const linkBtnClass = "btn btn-m btn-ghost rounded p-1 border-0 hover:bg-[var(--workspace-panel)] hover:underline";

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    const s = localStorage.getItem("formaty-session");
    if (s) {
      const d = JSON.parse(s);
      if (d.themeMode === "dark" || d.themeMode === "light") return d.themeMode;
    }
  } catch {}
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function NotFound() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--workspace-background)] px-4 py-12">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo size={48} className="shrink-0 text-primary" />
        <h1 className="text-xl font-bold text-[var(--workspace-text)]">Page not found</h1>
        <p className="max-w-sm text-sm text-[var(--workspace-text-muted)]">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <div className="flex w-full max-w-md flex-col gap-5 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6">
        <div>
          <p className="mb-3 text-sm font-medium text-[var(--workspace-text)]">
            Your data stays in your browser only - formaty runs locally
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-[var(--workspace-text-muted)]">
            <span>• Format & convert JSON, XML, YAML, TOML, CSV</span>
            <span>• Tree, graph & table views</span>
            <span>• JSONPath & JMESPath query</span>
            <span>• cURL → fetch API</span>
            <span>• Schema validation & type generation</span>
            <span>• Diff, beautify, minify</span>
          </div>
        </div>
        <Link href="/" className={`${linkBtnClass} w-full justify-center py-2 text-primary`}>
          Go to formaty
        </Link>
      </div>
    </div>
  );
}
