// Route-wide smoke check. Usage: bun run build && node scripts/smoke.mjs
// Serves out/ locally and loads every sitemap route (+ /playground, + one unknown
// route that must 404) in headless Chromium at desktop-light and mobile-dark.
// Fails on non-200, pageerror, console.error, same-origin requests >= 400,
// horizontal overflow, and serious/critical axe violations. No screenshots.
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join, extname, normalize } from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const OUT = "out";
const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const UNKNOWN = "/__no-such-route__";
const CONCURRENCY = 6;
const VIEWPORTS = [
  // axe runs once per route (desktop): it is the slow part, and the markup is the same at both widths.
  { name: "desktop", viewport: { width: 1280, height: 800 }, colorScheme: "light", axe: true },
  { name: "mobile", viewport: { width: 390, height: 844 }, colorScheme: "dark", isMobile: true, hasTouch: true },
];
// console.error text we tolerate (none needed today; add a comment per entry).
const CONSOLE_ALLOW = [];

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".txt": "text/plain", ".svg": "image/svg+xml",
  ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".xml": "application/xml",
};

const isFile = (p) => existsSync(p) && statSync(p).isFile();

function resolveFile(pathname) {
  const url = decodeURIComponent(pathname);
  const p = join(OUT, normalize(url));
  // Segment prefetch: /tools/__next.tools.__PAGE__.txt is on disk as tools/__next.tools/__PAGE__.txt
  const seg = url.match(/^(.*\/)__next\.(.+)\.(__PAGE__\.txt)$/);
  const candidates = [p, p + ".html", join(p, "index.html")];
  if (seg) candidates.push(join(OUT, seg[1], "__next." + seg[2].replaceAll(".", "/"), seg[3]));
  return candidates.find(isFile);
}

function serve() {
  const server = createServer((req, res) => {
    const file = resolveFile(new URL(req.url, "http://x").pathname);
    const [status, path] = file ? [200, file] : [404, join(OUT, "404.html")];
    res.writeHead(status, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(readFileSync(path));
  });
  return new Promise((ok) => server.listen(0, () => ok(server)));
}

async function check(browser, base, route, vp) {
  const { name, axe: runAxe, ...opts } = vp;
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript(() => localStorage.setItem("formaty-onboarded", "1"));
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(`pageerror: ${e.message.split("\n")[0]}`));
  page.on("console", (m) => {
    const t = m.text();
    // Chromium logs "Failed to load resource" for the deliberate 404 document.
    if (route === UNKNOWN && t.startsWith("Failed to load resource")) return;
    if (m.type() === "error" && !CONSOLE_ALLOW.some((a) => t.includes(a))) errs.push(`console.error: ${t.slice(0, 200)}`);
  });
  page.on("response", (r) => {
    // The 404 document itself is expected for the unknown route.
    if (r.url().startsWith(base) && r.status() >= 400 && !(route === UNKNOWN && r.request().isNavigationRequest()))
      errs.push(`request ${r.status()}: ${r.url().replace(base, "")}`);
  });
  try {
    const res = await page.goto(base + route, { waitUntil: "load" });
    // /playground never goes idle (worker + editor), so cap the wait.
    await page.waitForLoadState("networkidle", { timeout: 2000 }).catch(() => {});
    const want = route === UNKNOWN ? 404 : 200;
    if (res.status() !== want) errs.push(`status ${res.status()} (want ${want})`);
    if (route === UNKNOWN && !/does not exist/i.test(await page.locator("body").innerText()))
      errs.push("404 page does not render not-found content");
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (over > 1) errs.push(`horizontal overflow: ${over}px`);
    if (runAxe) {
      await page.addScriptTag({ path: AXE });
      const { violations } = await page.evaluate(() => axe.run(document, { resultTypes: ["violations"] }));
      for (const v of violations)
        if (v.impact === "serious" || v.impact === "critical")
          errs.push(`axe ${v.impact} ${v.id}: ${v.nodes.length} node(s), e.g. ${v.nodes[0].target.join(" ")}`);
    }
  } catch (e) {
    errs.push(`error: ${e.message.split("\n")[0]}`);
  }
  await ctx.close();
  return errs.map((e) => `FAIL ${name} ${route} ${e}`);
}

const t0 = Date.now();
const xml = readFileSync(join(OUT, "sitemap.xml"), "utf8");
const routes = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname).concat("/playground"))];
routes.push(UNKNOWN);
const jobs = routes.flatMap((r) => VIEWPORTS.map((vp) => [r, vp]));

const server = await serve();
const base = `http://localhost:${server.address().port}`;
const browser = await chromium.launch();
const failures = [];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let job; (job = jobs.shift()); ) failures.push(...(await check(browser, base, ...job)));
  }),
);
await browser.close();
server.close();

failures.sort().forEach((f) => console.log(f));
const secs = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`${routes.length} routes x ${VIEWPORTS.length} viewports, ${failures.length} failure(s), ${secs}s`);
process.exit(failures.length ? 1 : 0);
