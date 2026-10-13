import { UTIL_PAGES } from "@/lib/seoUtils";
import { UTIL_TABS, type UtilTab } from "@/lib/utils/devtools";

const SLUG = new Map<UtilTab, string>(Object.entries(UTIL_PAGES).map(([slug, p]) => [p.util, slug]));

/** Name of a utility as the playground shows it. */
export const utilLabel = (id: UtilTab) => UTIL_TABS.find((t) => t.id === id)?.label ?? id;

/** Utils with a page of their own link there; the rest open in the playground's Utils area. */
export const utilHref = (id: UtilTab) =>
  id === "instant" ? "/utils/instant" : SLUG.has(id) ? `/utils/${SLUG.get(id)}` : `/playground?util=${id}`;
