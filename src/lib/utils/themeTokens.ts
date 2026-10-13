/**
 * First-paint theme tokens, injected as an inline <style> to prevent FOUC.
 *
 * Keep the values in sync with the `[data-theme]` blocks in `app/globals.css`.
 * `layout.tsx` embeds a hardcoded copy of these strings in its pre-hydration
 * inline script (it runs before any module loads, so it cannot import this).
 * If you change tokens here, update that inline script too.
 */
export const DARK_THEME_CSS =
  "html,body{--background:#0C0B0A;--foreground:#F2F0ED;--card:#141312;--card-foreground:#F2F0ED;--popover:#1A1917;--popover-foreground:#F2F0ED;--border:#2A2826;--input:#3D3A36;--muted:#0F0E0D;--muted-foreground:#A8A39C;--accent:#242220;--accent-foreground:#F2F0ED;--secondary:#1E1C1A;--secondary-foreground:#F2F0ED;--primary:#F2F0ED;--ring:#F2F0ED;--destructive:oklch(0.64 0.2 25);--workspace-background:#0C0B0A;--workspace-panel:#141312;--workspace-border:#2A2826;--workspace-text:#F2F0ED;--workspace-text-muted:#A8A39C}";

export const LIGHT_THEME_CSS =
  "html,body{--background:#F5F4F2;--foreground:#1A1816;--card:#ffffff;--card-foreground:#1A1816;--popover:#ffffff;--popover-foreground:#1A1816;--border:#E7E5E1;--input:#D2CFC9;--muted:#F8F7F5;--muted-foreground:#5E5A55;--accent:#EDEBE7;--accent-foreground:#1A1816;--secondary:#F8F7F5;--secondary-foreground:#1A1816;--primary:#1A1816;--ring:#1A1816;--destructive:oklch(0.58 0.23 25);--workspace-background:#F5F4F2;--workspace-panel:#ffffff;--workspace-border:#E7E5E1;--workspace-text:#1A1816;--workspace-text-muted:#5E5A55}";

export function themeInlineCss(theme: "dark" | "light"): string {
  return theme === "dark" ? DARK_THEME_CSS : LIGHT_THEME_CSS;
}
