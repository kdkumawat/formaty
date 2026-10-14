/**
 * First-paint theme tokens, injected as an inline <style> to prevent FOUC.
 *
 * Keep the values in sync with the `[data-theme]` blocks in `app/globals.css`.
 * `layout.tsx` serializes these strings into its pre-hydration inline script.
 */
export const DARK_THEME_CSS =
  "html,body{--background:#0A0B0C;--foreground:#ECEDEF;--card:#111214;--card-foreground:#ECEDEF;--popover:#17181B;--popover-foreground:#ECEDEF;--border:#232529;--input:#30333A;--muted:#0D0E10;--muted-foreground:#9B9EA4;--accent:#24262A;--accent-foreground:#ECEDEF;--secondary:#1C1D21;--secondary-foreground:#ECEDEF;--primary:#ECEDEF;--ring:#F2B544;--destructive:#FF8A7A;--workspace-background:#0A0B0C;--workspace-panel:#111214;--workspace-border:#232529;--workspace-text:#ECEDEF;--workspace-text-muted:#9B9EA4}";

export const LIGHT_THEME_CSS =
  "html,body{--background:#F6F6F4;--foreground:#111214;--card:#FFFFFF;--card-foreground:#111214;--popover:#FFFFFF;--popover-foreground:#111214;--border:#E4E4E0;--input:#CFCFC9;--muted:#FBFBFA;--muted-foreground:#5B5E63;--accent:#E6E6E2;--accent-foreground:#111214;--secondary:#F0F0EE;--secondary-foreground:#111214;--primary:#111214;--ring:#9A5B00;--destructive:#B3331A;--workspace-background:#F6F6F4;--workspace-panel:#FFFFFF;--workspace-border:#E4E4E0;--workspace-text:#111214;--workspace-text-muted:#5B5E63}";

export function themeInlineCss(theme: "dark" | "light"): string {
  return theme === "dark" ? DARK_THEME_CSS : LIGHT_THEME_CSS;
}
