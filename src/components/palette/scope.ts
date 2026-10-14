export const SCOPES = ["All", "Commands", "Tabs", "Utilities"] as const;
export type Scope = (typeof SCOPES)[number];

/** Scopes derive from the existing command categories: Tabs = "Tabs", Utilities = "Utils", Commands = everything else. */
export function inScope(category: string, scope: Scope): boolean {
  if (scope === "All") return true;
  if (scope === "Tabs") return category === "Tabs";
  if (scope === "Utilities") return category === "Utils";
  return category !== "Tabs" && category !== "Utils";
}
