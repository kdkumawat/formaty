export interface FuzzyMatch {
  score: number;
  /** Indices in `text` of the matched characters, ascending. */
  indices: number[];
}

const isWordStart = (text: string, i: number) => {
  if (i === 0) return true;
  const prev = text[i - 1];
  const cur = text[i];
  return !/[a-z0-9]/i.test(prev) || (prev === prev.toLowerCase() && cur !== cur.toLowerCase());
};

/** Greedy match of `query` as a subsequence of `text` starting from `start`. */
function matchFrom(q: string, t: string, text: string, start: number): FuzzyMatch | null {
  const indices: number[] = [];
  let score = 0;
  let pos = start;
  for (let qi = 0; qi < q.length; qi++) {
    // Prefer a word-start hit shortly ahead over a closer mid-word hit, except for the very first char.
    let hit = t.indexOf(q[qi], pos);
    if (hit < 0) return null;
    if (qi > 0 && !isWordStart(text, hit)) {
      for (let j = hit + 1; j < Math.min(t.length, hit + 6); j++) {
        if (t[j] === q[qi] && isWordStart(text, j)) {
          hit = j;
          break;
        }
      }
    }
    const prev = indices[indices.length - 1];
    score += 1;
    if (hit === 0) score += 8;
    if (isWordStart(text, hit)) score += 4;
    if (prev !== undefined) score += hit === prev + 1 ? 3 : -0.5 * Math.min(hit - prev - 1, 6);
    indices.push(hit);
    pos = hit + 1;
  }
  score -= 0.1 * indices[0];
  return { score, indices };
}

/**
 * Case-insensitive subsequence match. Higher score for prefix, word-start and
 * consecutive matches; returns null when `query` is not a subsequence of `text`.
 * An empty query matches with score 0.
 */
export function fuzzyMatch(query: string, text: string): FuzzyMatch | null {
  const q = query.toLowerCase();
  if (!q) return { score: 0, indices: [] };
  const t = text.toLowerCase();
  let best: FuzzyMatch | null = null;
  for (let s = t.indexOf(q[0]); s >= 0; s = t.indexOf(q[0], s + 1)) {
    const m = matchFrom(q, t, text, s);
    if (m && (!best || m.score > best.score)) best = m;
  }
  return best;
}
