// Writes out/launch.srt from the same cues the video burns in.
// Usage (from video/): bun scripts/srt.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { CUTS, FPS } from "../src/timeline";

const CUES = CUTS.hero.cues;

const stamp = (frame: number) => {
  const ms = Math.round((frame / FPS) * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

const srt = CUES.map((c, i) => `${i + 1}\n${stamp(c.from)} --> ${stamp(c.to)}\n${c.text}\n`).join("\n");
mkdirSync("out", { recursive: true });
writeFileSync("out/launch.srt", srt);
console.log(`${CUES.length} cues → out/launch.srt`);
