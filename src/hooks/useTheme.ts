"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/components/Analytics";

export type ThemeMode = "system" | "dark" | "light";

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getResolvedTheme(mode: ThemeMode): "dark" | "light" {
  return mode === "system" ? getSystemTheme() : mode;
}

function applyTheme(mode: ThemeMode) {
  const resolved = getResolvedTheme(mode);
  document.documentElement.setAttribute("data-theme", resolved);
  const style = document.getElementById("formaty-theme-inline");
  if (style) {
    style.textContent =
      resolved === "dark"
        ? "html,body{--workspace-background:#0a0a10;--workspace-panel:#12121a;--workspace-border:#23232e;--workspace-text:#ececf1;--workspace-text-muted:#9a9aa5}"
        : "html,body{--workspace-background:#f7f7fa;--workspace-panel:#ffffff;--workspace-border:#e7e7ef;--workspace-text:#181820;--workspace-text-muted:#5f5f6b}";
  }
}

export function useTheme() {
  // Default to the OS preference so a fresh visitor sees whatever their
  // machine is set to. Falls back to "light" if `matchMedia` is unavailable
  // (very old runtimes / non-browser). Once the user picks a mode explicitly
  // the choice persists in localStorage and wins on every reload.
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("formaty-session");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.themeMode === "dark" || data.themeMode === "light" || data.themeMode === "system") {
          setThemeModeState(data.themeMode);
        }
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyTheme(themeMode);
  }, [themeMode, mounted]);

  useEffect(() => {
    if (themeMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const fn = () => applyTheme("system");
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    trackEvent("theme", { mode, surface: "landing" });
    setThemeModeState(mode);
    try {
      const raw = localStorage.getItem("formaty-session");
      const data = raw ? JSON.parse(raw) : {};
      data.themeMode = mode;
      localStorage.setItem("formaty-session", JSON.stringify(data));
    } catch {
      // ignore
    }
  };

  return { themeMode, setThemeMode };
}
