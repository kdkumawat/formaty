"use client";

import { useEffect } from "react";

function resolveTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  try {
    const raw = localStorage.getItem("jsonix-session");
    const mode = raw ? JSON.parse(raw)?.themeMode : null;
    if (mode === "dark") return "dark";
    if (mode === "light") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
}

export function DocsThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const apply = () => {
      document.documentElement.setAttribute("data-theme", resolveTheme());
    };
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => {
      document.documentElement.removeAttribute("data-theme");
      media.removeEventListener("change", apply);
    };
  }, []);

  return <>{children}</>;
}
