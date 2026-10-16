/** Larger, realistic sample lists for the list tools. Seeded, so every load shows the same data. */

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uuids(n: number, seed: number): string[] {
  const r = rng(seed);
  const hex = (len: number) => Array.from({ length: len }, () => Math.floor(r() * 16).toString(16)).join("");
  return Array.from({ length: n }, () => `${hex(8)}-${hex(4)}-4${hex(3)}-${"89ab"[Math.floor(r() * 4)]}${hex(3)}-${hex(12)}`);
}

let cache: { a: string[]; b: string[] } | null = null;

/** 240 user UUIDs in A, 220 in B: 180 shared, a few repeats in each. */
export function uuidLists() {
  if (!cache) {
    const pool = uuids(280, 7);
    const a = pool.slice(0, 240);
    const b = [...pool.slice(60, 240), ...pool.slice(240, 280)];
    a.splice(40, 0, a[3], a[17]);
    b.splice(90, 0, b[12]);
    cache = { a, b };
  }
  return cache;
}

/** 1,000 order numbers with about one in six repeated. */
export function orderIds(): string[] {
  const r = rng(21);
  const out: string[] = [];
  for (let i = 0; i < 1000; i++) out.push(i > 20 && r() < 0.16 ? out[Math.floor(r() * i)] : `ORD-${String(48210 + i * 3 + Math.floor(r() * 3)).padStart(6, "0")}`);
  return out;
}
