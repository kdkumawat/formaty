"use client";

import { useEffect, useState } from "react";

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
        ? "html,body{--workspace-background:#0b0b0b;--workspace-panel:#111111;--workspace-border:#1f1f1f;--workspace-text:#e5e5e5;--workspace-text-muted:#9ca3af}"
        : "html,body{--workspace-background:#f5f5f5;--workspace-panel:#ffffff;--workspace-border:#e5e5e5;--workspace-text:#171717;--workspace-text-muted:#737373}";
  }
}

export function useTheme() {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
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
