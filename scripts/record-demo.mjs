// Records the raw screen footage for the product demo film (.demo/film is the HyperFrames edit).
// Usage: node scripts/record-demo.mjs [baseUrl] [outDir]
//   baseUrl defaults to https://formaty.dev (http://localhost:3000 works too)
//   outDir  defaults to .demo/film/footage
// Writes one MP4 per scene plus clicks.json (scene-relative click times and points as fractions of
// the frame), which the film uses to aim its zoom. Needs ffmpeg on PATH. Run with node, not bun
// (Bun 1.3.14 times out launching Chromium on Windows).
//
// Frames come from the Chrome screencast at 2560x1440 (1280x720 viewport, DPR 2) so the film can
// zoom in and stay sharp. Every action is scheduled at a scene time (see SCENES) that lines up with
// the voiceover; if you change the narration, move those times with it.
import { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = (process.argv[2] ?? "https://formaty.dev").replace(/\/$/, "");
const OUT = path.resolve(process.argv[3] ?? ".demo/film/footage");
const FRAMES = path.join(OUT, ".frames");
const FPS = 30;
// Scenes are played at 1/SLOW speed and the footage is timed back up: twice the frames per film
// second and half the timing drift from a busy machine. UI animations come out SLOW times faster.
const SLOW = 3;
// A full desktop window: at 1280 px some toolbars wrap their buttons onto a second line.
const VW = 1600;
const VH = 900;
const DSF = 1.6; // 2560x1440 frames
rmSync(FRAMES, { recursive: true, force: true });
mkdirSync(FRAMES, { recursive: true });

// An API list response: nested enough for the graph, flat enough for the table.
const USERS = JSON.stringify([
  { id: 4821, name: "Alice Chen", email: "alice@acme.dev", plan: "pro", seats: 12, active: true, company: { name: "Acme", country: "DE" } },
  { id: 4822, name: "Bo Larsen", email: "bo@northwind.io", plan: "team", seats: 3, active: false, company: { name: "Northwind", country: "DK" } },
  { id: 4823, name: "Chidi Okafor", email: "chidi@lumen.app", plan: "pro", seats: 24, active: true, company: { name: "Lumen", country: "NG" } },
  { id: 4824, name: "Dana Ruiz", email: "dana@parkside.co", plan: "starter", seats: 1, active: true, company: { name: "Parkside", country: "ES" } },
  { id: 4825, name: "Eli Novak", email: "eli@quanta.dev", plan: "pro", seats: 8, active: true, company: { name: "Quanta", country: "CZ" } },
]);
const CURL = 'curl -s "https://api.github.com/repos/vercel/next.js" -H "Accept: application/vnd.github+json"';

// The screencast ignores the context's deviceScaleFactor; this flag is what sets the frame size.
const browser = await chromium.launch({ args: [`--force-device-scale-factor=${DSF}`] });
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: DSF, colorScheme: "dark" });
await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
await ctx.addInitScript(() => {
  localStorage.setItem("formaty-ga-consent", "declined");
  localStorage.setItem("formaty-onboarded", "1"); // no tour, no quick-tip toast
  localStorage.setItem("formaty-instant-onboarded", "1");
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);

// --- capture: a frame is kept with its time on the scene clock; page loads are not recorded ---
const scenes = []; // { name, frames: [{file, t}], end }
let scene = null;
let sceneStartWall = 0;
let n = 0;
const now = () => performance.now() / 1000;
const sceneT = () => (now() - sceneStartWall) / SLOW;
cdp.on("Page.screencastFrame", ({ data, sessionId }) => {
  cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  if (!scene) return;
  const file = path.join(FRAMES, `f${String(n++).padStart(5, "0")}.jpg`);
  writeFileSync(file, Buffer.from(data, "base64"));
  scene.frames.push({ file, t: Math.max(0, sceneT()) });
});
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: Math.round(VW * DSF), maxHeight: Math.round(VH * DSF) });

const wait = (ms) => page.waitForTimeout(ms);
const until = async (t) => {
  const d = t - sceneT();
  if (d > 0) await wait(d * SLOW * 1000);
};
const clicks = [];
const paths = {}; // scene -> [[t, x, y]] cursor path, drawn by the film
const logPos = (x, y) => scene && (paths[scene.name] ??= []).push([+sceneT().toFixed(3), +(x / VW).toFixed(4), +(y / VH).toFixed(4)]);
let mouse = { x: VW / 2, y: VH + 40 };

/** Starts a scene; with a url it loads that page first, without one it carries on in the same page (tabs pile up). */
async function startScene(name, url, prepare) {
  if (scene) scene.end = sceneT();
  scene = null;
  if (url) {
    await page.goto(BASE + url, { waitUntil: "load" });
    await wait(2500);
    mouse = { x: VW * 0.62, y: VH + 40 };
    await page.mouse.move(mouse.x, mouse.y);
  }
  if (prepare) await prepare();
  scenes.push((scene = { name, frames: [] }));
  sceneStartWall = now();
  logPos(mouse.x, mouse.y);
  // Force a paint so the scene starts on a frame.
  await page.evaluate(() => document.body.style.setProperty("outline", "0 solid transparent"));
}
/** Eased move that takes `sec` of wall time however slow each step is (it takes fewer steps). */
async function moveTo(x, y, sec = 0.6) {
  const from = { ...mouse };
  const t0 = now();
  for (;;) {
    const u = Math.min(1, (now() - t0) / (sec * SLOW));
    const e = u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
    const px = from.x + (x - from.x) * e;
    const py = from.y + (y - from.y) * e;
    await page.mouse.move(px, py);
    logPos(px, py);
    if (u >= 1) break;
  }
  mouse = { x, y };
}
/** Moves so the click lands at scene time `at`, logs it for the camera. */
async function clickAt(at, locator, { travel = 0.6 } = {}) {
  const el = locator.filter({ visible: true }).first();
  try {
    await el.waitFor({ state: "visible", timeout: 2500 });
    await el.scrollIntoViewIfNeeded(); // menus can open past the fold (or scroll inside themselves)
    const b = await el.boundingBox();
    const x = b.x + b.width / 2;
    const y = b.y + b.height / 2;
    await until(at - travel);
    await moveTo(x, y, travel);
    // Toolbars can reflow while the cursor travels: aim at where the target is now.
    const nb = (await el.boundingBox()) ?? b;
    const [cx, cy] = [nb.x + nb.width / 2, nb.y + nb.height / 2];
    if (Math.abs(cx - x) > 2 || Math.abs(cy - y) > 2) await moveTo(cx, cy, 0.12);
    await until(at);
    await page.mouse.click(cx, cy);
    clicks.push({ scene: scene.name, t: +sceneT().toFixed(3), x: +(cx / VW).toFixed(4), y: +(cy / VH).toFixed(4) });
    return true;
  } catch (e) {
    console.warn(`skip click in ${scene.name}:`, String(locator), e.message.split("\n")[0]);
    return false;
  }
}

/** Clicks into the editor and pastes `text` at scene time `at` (typed text would trip Monaco's auto-closing quotes). */
async function pasteAt(at, text) {
  const b = await page.locator(".monaco-editor").filter({ visible: true }).first().boundingBox();
  const x = b.x + b.width * 0.45;
  const y = b.y + 90;
  await until(at - 0.6);
  await moveTo(x, y, 0.6);
  await page.mouse.click(x, y);
  clicks.push({ scene: scene.name, t: +sceneT().toFixed(3), x: +(x / VW).toFixed(4), y: +(y / VH).toFixed(4) });
  await page.keyboard.press("Control+A");
  await page.evaluate((t) => navigator.clipboard.writeText(t), text);
  await until(at + 0.15);
  await page.keyboard.press("Control+V");
}
/** Types `text` evenly between scene times `from` and `to`, like a person at a keyboard. */
async function typeBetween(from, to, text) {
  for (let i = 0; i < text.length; i++) {
    await until(from + ((to - from) * i) / text.length);
    await page.keyboard.type(text[i]);
  }
}
/** Opens the output menu (named More, or after a pick the picked output's name) and picks `item`. */
const clickMore = async (at, item, menuName = "More") => {
  const menu = page.getByRole("button", { name: menuName, exact: true });
  if (await clickAt(at, menu, { travel: 0.45 }))
    await clickAt(at + 0.55, page.getByRole("menuitem", { name: item }).or(page.getByRole("menuitemradio", { name: item })), { travel: 0.35 });
};

// --- scenes (times are seconds into each scene; .demo/film/tools/build.mjs places them on the film) ---
// Warm-ups run before a scene starts recording: views and engines load on first use, and a
// spinner on camera reads as slow.
const warmViews = async () => {
  for (const name of ["Graph", "Table", "Query", "Text"]) {
    await page.getByRole("radio", { name, exact: true }).click();
    await wait(name === "Graph" ? 3000 : 700);
  }
};

// Playground: paste, table, graph, query, convert (v3-v5).
await startScene("play", "/playground?tool=json-formatter", warmViews);
await pasteAt(0.9, USERS);
await clickAt(3.3, page.getByRole("button", { name: "Tidy", exact: true }), { travel: 0.8 });
await clickAt(5.6, page.getByRole("radio", { name: "Table", exact: true }), { travel: 0.8 });
await clickAt(6.9, page.getByRole("radio", { name: "Graph", exact: true }), { travel: 0.5 });
await clickAt(9.0, page.getByRole("radio", { name: "Query", exact: true }), { travel: 0.6 });
if (await clickAt(9.7, page.getByRole("textbox", { name: "Query" }), { travel: 0.5 })) {
  await page.keyboard.press("Control+A");
  await until(10.2);
  // Inserted whole: typed a character at a time, the live query flashes a parse error on camera.
  await page.keyboard.insertText("$[?(@.plan=='pro')].email");
  await until(10.6);
  await page.keyboard.press("Enter");
}
await clickAt(13.5, page.getByRole("radio", { name: "Text", exact: true }), { travel: 0.6 });
await clickAt(14.6, page.getByRole("button", { name: "YAML", exact: true }), { travel: 0.5 });
await clickAt(15.4, page.getByRole("button", { name: "SQL", exact: true }), { travel: 0.4 });
await clickAt(16.85, page.getByRole("button", { name: "TypeScript", exact: true }), { travel: 0.5 });
await clickMore(17.9, /^Go$/);
await until(20.4);

const newTab = async (at, kind, sub) => {
  await clickAt(at, page.getByRole("button", { name: "New tab" }), { travel: 0.5 });
  const item = page.getByRole("menuitem", { name: new RegExp("^New " + kind + " tab") });
  if (sub) {
    await clickAt(at + 0.45, item, { travel: 0.3 });
    await clickAt(at + 0.95, page.getByRole("menuitem", { name: sub, exact: true }), { travel: 0.35 });
  } else await clickAt(at + 0.5, item, { travel: 0.35 });
};

// cURL in a new tab: the request runs here, then leaves as code (v6).
await startScene("curl");
await newTab(0.4, "Transform");
await pasteAt(1.9, CURL);
// A new tab inherits the last tab's output; show the response as JSON.
await clickAt(2.55, page.getByRole("button", { name: "JSON", exact: true }), { travel: 0.5 });
await clickAt(3.3, page.getByRole("button", { name: "Send request" }), { travel: 0.6 });
await clickMore(5.4, /^JavaScript fetch/);
await clickMore(6.9, /^Python requests/);
await until(8.8);

// Compare in another tab: two ID lists, the gap leaves as SQL (v7).
await startScene("compare");
await newTab(0.4, "Compare");
await clickAt(2.3, page.getByRole("button", { name: "IDs with overlap" }), { travel: 0.6 });
await clickAt(3.3, page.getByRole("button", { name: /Only in A/ }), { travel: 0.6 });
// The export format remembers the last pick, so match whichever one is showing.
if (await clickAt(3.9, page.getByText(/^(One per line|Comma separated)$/), { travel: 0.45 })) {
  await clickAt(4.5, page.getByRole("menuitemradio", { name: /^NOT IN list/ }), { travel: 0.45 });
  // Several buttons are named Copy (row icons too); the export one is the widest.
  const copies = page.getByRole("button", { name: "Copy", exact: true }).filter({ visible: true });
  let widest = 0;
  let widestW = 0;
  for (let i = 0; i < (await copies.count()); i++) {
    const w = (await copies.nth(i).boundingBox())?.width ?? 0;
    if (w > widestW) [widest, widestW] = [i, w];
  }
  if (await clickAt(5.2, copies.nth(widest), { travel: 0.45 })) {
    // The format only shapes what is copied, so show the real clipboard text.
    await page.evaluate(async () => {
      const text = await navigator.clipboard.readText();
      const card = document.createElement("div");
      card.style.cssText = "position:fixed;right:80px;top:470px;z-index:2147483646;max-width:560px;padding:14px 18px;border-radius:12px;background:#121315;border:1px solid rgba(242,181,68,.55);box-shadow:0 18px 50px rgba(0,0,0,.55);opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s";
      card.innerHTML = `<div style="font:600 13px var(--font-geist,system-ui);color:#F2B544;margin-bottom:6px">Copied to clipboard</div>
        <pre style="margin:0;font:500 20px/1.4 var(--font-jetbrains-mono,ui-monospace),monospace;color:#f5f5f4;white-space:pre-wrap"></pre>`;
      card.querySelector("pre").textContent = text;
      document.body.append(card);
      requestAnimationFrame(() => Object.assign(card.style, { opacity: "1", transform: "none" }));
      setTimeout(() => card.remove(), 6000);
    });
  }
}
await until(7.0);

// Command palette to Detect anything, which reads whatever is pasted (v8).
await startScene("utils");
await clickAt(0.6, page.getByRole("button", { name: "Search or run" }), { travel: 0.6 });
await typeBetween(1.2, 1.8, "detect");
await until(2.4);
await page.keyboard.press("Enter");
const detectInput = page.getByRole("textbox", { name: "Input" });
for (const [at, value] of [
  [5.2, "1792063800"],
  [6.3, "#F2B544"],
  [7.1, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ODIxIiwibmFtZSI6IkFsaWNlIENoZW4iLCJpYXQiOjE3OTIwNjM4MDB9.c2ln"],
  [8.4, "*/15 9-17 * * 1-5"],
]) {
  if (at === 5.2) await clickAt(4.6, detectInput, { travel: 0.7 });
  await until(at);
  await detectInput.click();
  await page.keyboard.press("Control+A");
  await page.keyboard.insertText(value);
}
await until(10.2);
scene.end = sceneT();
scene = null;
await cdp.send("Page.stopScreencast");
await browser.close();

// --- one MP4 per scene: each frame held until the next, snapped to the 30 fps grid ---
for (const s of scenes) {
  const lines = ["ffconcat version 1.0"];
  const frames = s.frames;
  for (let i = 0; i < frames.length; i++) {
    const a = i === 0 ? 0 : Math.round(frames[i].t * FPS); // a still page sends no frame: hold the first from 0
    const b = Math.round((i + 1 < frames.length ? frames[i + 1].t : s.end) * FPS);
    if (b <= a) continue;
    lines.push(`file '${frames[i].file.replace(/\\/g, "/")}'`, `duration ${((b - a) / FPS).toFixed(6)}`);
  }
  lines.push(lines.at(-2)); // the concat demuxer drops the last duration unless the file repeats
  const list = path.join(FRAMES, `${s.name}.txt`);
  writeFileSync(list, lines.join("\n"));
  const out = path.join(OUT, `${s.name}.mp4`);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list,
    "-vf", `fps=${FPS},format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "16",
    "-t", s.end.toFixed(3), "-movflags", "+faststart", out], { stdio: "inherit" });
  console.log(`${s.name}: ${s.end.toFixed(2)}s, ${frames.length} frames -> ${out}`);
}
writeFileSync(path.join(OUT, "clicks.json"), JSON.stringify({ viewport: [VW, VH], scenes: Object.fromEntries(scenes.map((s) => [s.name, +s.end.toFixed(3)])), clicks, paths }, null, 2));
rmSync(FRAMES, { recursive: true, force: true });
