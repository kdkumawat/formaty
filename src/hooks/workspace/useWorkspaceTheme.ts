"use client";

import { useEffect, useState } from "react";
import type { ThemeMode } from "@/components/workspace/constants";
import { themeInlineCss } from "@/lib/utils/themeTokens";

/**
 * Workspace theme: the chosen mode (restored from the saved session), the OS preference,
 * and the resolved light/dark value applied to <html>. `setThemeMode` is exposed so session
 * restore and shared links can set it; persistence stays with the session writer.
 */
export function useWorkspaceTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [systemDark, setSystemDark] = useState(false);
  const [themeSynced, setThemeSynced] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem("formaty-session");
      if (s) {
        const d = JSON.parse(s) as { themeMode?: ThemeMode };
        if (d.themeMode === "dark" || d.themeMode === "light" || d.themeMode === "system") setThemeMode(d.themeMode);
      }
    } catch {}
    setSystemDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    setThemeSynced(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: Exclude<ThemeMode, "system"> =
    themeMode === "system" ? (systemDark ? "dark" : "light") : themeMode;

  useEffect(() => {
    if (!themeSynced) return;
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    const style = document.getElementById("formaty-theme-inline");
    if (style) {
      style.textContent = themeInlineCss(resolvedTheme);
    }
  }, [resolvedTheme, themeSynced]);

  const isDark = resolvedTheme === "dark";
  return { themeMode, setThemeMode, resolvedTheme, isDark, monacoTheme: isDark ? "vs-dark" : "vs" } as const;
}
