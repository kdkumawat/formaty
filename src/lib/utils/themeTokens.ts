/**
 * First-paint theme tokens, injected as an inline <style> to prevent FOUC.
 *
 * Keep the values in sync with the `[data-theme]` blocks in `app/globals.css`.
 * `layout.tsx` embeds a hardcoded copy of these strings in its pre-hydration
 * inline script (it runs before any module loads, so it cannot import this).
 * If you change tokens here, update that inline script too.
 */
export const DARK_THEME_CSS =
  "html,body{--background:#0a0a10;--foreground:#ececf1;--card:#12121a;--card-foreground:#ececf1;--popover:#171721;--popover-foreground:#ececf1;--border:#23232e;--input:#2f2f3c;--muted:#191924;--muted-foreground:#9a9aa5;--accent:#1e1e2b;--accent-foreground:#ececf1;--secondary:#1c1c27;--secondary-foreground:#ececf1;--primary:oklch(0.72 0.19 280);--ring:oklch(0.72 0.19 280);--destructive:oklch(0.64 0.2 25);--workspace-background:#0a0a10;--workspace-panel:#12121a;--workspace-border:#23232e;--workspace-text:#ececf1;--workspace-text-muted:#9a9aa5}";

export const LIGHT_THEME_CSS =
  "html,body{--background:#f7f7fa;--foreground:#181820;--card:#ffffff;--card-foreground:#181820;--popover:#ffffff;--popover-foreground:#181820;--border:#e7e7ef;--input:#d8d8e2;--muted:#eceef3;--muted-foreground:#5f5f6b;--accent:#eef0f5;--accent-foreground:#181820;--secondary:#eef0f5;--secondary-foreground:#181820;--primary:oklch(0.56 0.22 278);--ring:oklch(0.56 0.22 278);--destructive:oklch(0.58 0.23 25);--workspace-background:#f7f7fa;--workspace-panel:#ffffff;--workspace-border:#e7e7ef;--workspace-text:#181820;--workspace-text-muted:#5f5f6b}";

export function themeInlineCss(theme: "dark" | "light"): string {
  return theme === "dark" ? DARK_THEME_CSS : LIGHT_THEME_CSS;
}
