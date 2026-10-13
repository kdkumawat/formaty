/**
 * Command palette ranking and recents. Pure, so the order is unit-tested.
 *
 * A query token matches a piece of text in one of three ways, strongest first:
 *   1. it is the prefix of a word ("dedup" in "Dedupe and sort");
 *   2. it is the initials of consecutive words ("ctj" in "Convert to JSON");
 *   3. it sits inside a word, only when 3+ characters long ("nco" in "encode").
 * There is no loose subsequence matching, so "dedupe" can no longer reach "URL encode/decode".
 * Every token must match; the label counts in full, keywords at half, the category at a quarter.
 */

export interface Searchable {
  id: string;
  label: string;
  category: string;
  keywords?: string[];
  disabled?: boolean;
}

export interface Ranked<T> {
  item: T;
  score: number;
  /** Matched character positions in the label, ascending. */
  indices: number[];
}

export interface RankOptions<T> {
  /** Recently run command ids, most recent first. */
  recent?: string[];
  /** True for commands that apply to the current tab. */
  inContext?: (item: T) => boolean;
}

export const CONTEXT_BOOST = 15;
export const RECENT_BOOST = 30;
const RECENT_STEP = 6;

interface TextMatch {
  score: number;
  indices: number[];
}

const range = (at: number, n: number) => Array.from({ length: n }, (_, i) => at + i);

function words(text: string) {
  return [...text.matchAll(/[a-z0-9]+/gi)].map((m) => ({ w: m[0].toLowerCase(), at: m.index }));
}

/** Best way `token` matches `text`, or null. `lead` rewards matches near the start (used for labels). */
export function matchToken(token: string, text: string, lead = false): TextMatch | null {
  const t = token.toLowerCase();
  if (!t) return null;
  const ws = words(text);
  const best: { m: TextMatch | null } = { m: null };
  const take = (score: number, indices: number[]) => {
    if (!best.m || score > best.m.score) best.m = { score, indices };
  };
  ws.forEach(({ w, at }, j) => {
    if (w.startsWith(t)) take(100 + (w.length === t.length ? 10 : 0) + (lead ? (j === 0 ? 20 : -2 * j) : 0), range(at, t.length));
    else if (t.length >= 3 && w.includes(t)) take(40, range(at + w.indexOf(t), t.length));
  });
  if (t.length >= 2) {
    for (let j = 0; j + t.length <= ws.length; j++) {
      if ([...t].every((ch, k) => ws[j + k].w[0] === ch)) take(55 + (lead && j === 0 ? 15 : 0), ws.slice(j, j + t.length).map((x) => x.at));
    }
  }
  return best.m;
}

const tokenize = (query: string) =>
  query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);

function scoreItem(item: Searchable, tokens: string[]): TextMatch | null {
  const kw = (item.keywords ?? []).join(" ");
  const indices = new Set<number>();
  let total = 0;
  for (const tok of tokens) {
    const l = matchToken(tok, item.label, true);
    const k = matchToken(tok, kw);
    const c = matchToken(tok, item.category);
    const best = Math.max(l ? l.score : -1, k ? k.score * 0.5 : -1, c ? c.score * 0.25 : -1);
    if (best < 0) return null;
    total += best;
    l?.indices.forEach((i) => indices.add(i));
  }
  return { score: total, indices: [...indices].sort((a, b) => a - b) };
}

/**
 * Matching items best first. Disabled items sort after enabled ones; ties keep the input order.
 * An empty query returns everything in input order (disabled last).
 */
export function rank<T extends Searchable>(items: T[], query: string, opts: RankOptions<T> = {}): Ranked<T>[] {
  const tokens = tokenize(query);
  const out: (Ranked<T> & { order: number })[] = [];
  items.forEach((item, order) => {
    if (!tokens.length) {
      out.push({ item, score: 0, indices: [], order });
      return;
    }
    const s = scoreItem(item, tokens);
    if (!s) return;
    let score = s.score;
    if (opts.inContext?.(item)) score += CONTEXT_BOOST;
    const r = opts.recent?.indexOf(item.id) ?? -1;
    if (r >= 0) score += Math.max(0, RECENT_BOOST - RECENT_STEP * r);
    out.push({ item, score, indices: s.indices, order });
  });
  out.sort((a, b) => Number(!!a.item.disabled) - Number(!!b.item.disabled) || b.score - a.score || a.order - b.order);
  return out;
}

export const RECENT_LIMIT = 5;
const RECENT_KEY = "formaty-recent-commands";

/** Puts `id` first, drops its earlier position, keeps at most `max` ids. */
export function pushRecent(list: string[], id: string, max = RECENT_LIMIT): string[] {
  return [id, ...list.filter((x) => x !== id)].slice(0, max);
}

export function loadRecents(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

export function saveRecents(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: recents just do not persist */
  }
}
