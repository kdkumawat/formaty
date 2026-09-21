// Regenerates public/og.png, PNG favicons, and per-route OG share cards.
// Usage: bun run build && bun scripts/gen-og.mjs
//
// Per-route cards are REAL BROWSER SCREENSHOTS: the static export in out/ is
// served over localhost, every route is loaded in headless Chromium (Playwright)
// at exactly 1200x630 with dark theme, and the settled hero capture is saved as
// public/og/<route>.png. If a route or the browser is unavailable, a satori card
// (committed Geist font) is used as fallback so the script always succeeds.
//
// Titles/descriptions come from src/lib/seo.ts, src/lib/seoUtils.ts and
// src/lib/seoInstant.ts so fallback cards always match what the pages emit.
// Re-run whenever tool pages, themes, or SEO copy change.
import sharp from "sharp";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import ts from "typescript";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Load the app's SEO registries (TypeScript) from this .mjs script.
// The seo modules import "@/lib/utils/devtools" (type-only), so we strip types
// with the TypeScript compiler and shim that path.
// ---------------------------------------------------------------------------
function loadSeo() {
  mkdirSync(".og-gen", { recursive: true });
  writeFileSync(".og-gen/devtools.ts", "export type UtilTab = string;\n");
  const sources = ["src/lib/seo.ts", "src/lib/seoUtils.ts", "src/lib/seoInstant.ts"];
  for (const src of sources) {
    const code = readFileSync(src, "utf8");
    const js = ts.transpileModule(code, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    const out = src.replace(/^src\//, ".og-gen/").replace(/\.ts$/, ".cjs");
    mkdirSync(out.split("/").slice(0, -1).join("/"), { recursive: true });
    writeFileSync(out, js);
  }
  // Shim the type-only import for seoUtils.
  const utilsPath = ".og-gen/lib/seoUtils.cjs";
  const utilsJs = readFileSync(utilsPath, "utf8").replace(
    /require\("@\/lib\/utils\/devtools"\)/g,
    "{}",
  );
  writeFileSync(utilsPath, utilsJs);
  return {
    seo: require("../.og-gen/lib/seo.cjs"),
    seoUtils: require("../.og-gen/lib/seoUtils.cjs"),
    seoInstant: require("../.og-gen/lib/seoInstant.cjs"),
  };
}

const { seo, seoUtils, seoInstant } = loadSeo();

const WIDTH = 1200;
const HEIGHT = 630;
const FONT = readFileSync("assets/fonts/Geist-Regular.ttf");

// route → display title / meta description (single source: the SEO registries).
const TITLES = {
  ...Object.fromEntries(Object.values(seo.TOOL_PAGES).map((c) => [c.route, c.h1])),
  ...Object.fromEntries(Object.values(seoUtils.UTIL_PAGES).map((c) => [c.route, c.h1])),
  instant: seoInstant.INSTANT_PAGE.h1,
};
const DESCRIPTIONS = {
  ...Object.fromEntries(Object.values(seo.TOOL_PAGES).map((c) => [c.route, c.description])),
  ...Object.fromEntries(Object.values(seoUtils.UTIL_PAGES).map((c) => [c.route, c.description])),
  instant: seoInstant.INSTANT_PAGE.description,
};
const ALL_ROUTES = Object.keys(TITLES);
// slug → served path: tools live at /<route>, utils (and instant) at /utils/<route>.
const ROUTE_PATHS = {
  ...Object.fromEntries(Object.keys(seo.TOOL_PAGES).map((r) => [r, `/${r}`])),
  ...Object.fromEntries(Object.keys(seoUtils.UTIL_PAGES).map((r) => [r, `/utils/${r}`])),
  instant: "/utils/instant",
};
const BRAND = seo.SITE_NAME || "Formaty";
const BRAND_LINE = "Free · Local-first · No sign-up";

/** Strip the " | Formaty" suffix and split into at most 2 balanced lines. */
function titleLines(title) {
  const clean = title.replace(/\s*\|\s*Formaty\s*$/, "");
  if (clean.length <= 18) return [clean];
  const words = clean.split(" ");
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(" ");
    const l2 = words.slice(i).join(" ");
    const score = Math.abs(l1.length - l2.length);
    if (!best || score < best.score) best = { lines: [l1, l2], score };
  }
  if (best && Math.max(...best.lines.map((l) => l.length)) <= 20) {
    return best.lines;
  }
  return [clean];
}

/** Satori fallback card (element tree), used when a screenshot is impossible. */
function cardElement({ title, subtitle }) {
  const lines = titleLines(title);
  const fontSize = lines.length === 2 ? 76 : 88;
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        backgroundImage: "linear-gradient(135deg, #0a0a10 0%, #10101a 55%, #141422 100%)",
      },
      children: [
        {
          type: "div",
          props: {
            style: { display: "flex", alignItems: "center", gap: 20 },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #6d6df4, #4f8ff7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: 34,
                    fontWeight: 700,
                  },
                  children: "{ }",
                },
              },
              {
                type: "div",
                props: {
                  style: { fontSize: 40, fontWeight: 700, color: "#ececf1", letterSpacing: -1 },
                  children: BRAND,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 12 },
            children: lines.map((line, i) => ({
              type: "div",
              props: {
                style: {
                  fontSize,
                  fontWeight: 700,
                  color: i === 0 && lines.length > 1 ? "#ececf1" : "#a5a5ff",
                  letterSpacing: -2,
                  lineHeight: 1.05,
                  display: "flex",
                },
                children: line,
              },
            })),
          },
        },
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 10 },
            children: [
              {
                type: "div",
                props: {
                  style: { fontSize: 26, color: "#9a9aa5", lineHeight: 1.35, display: "flex" },
                  children: subtitle,
                },
              },
              {
                type: "div",
                props: {
                  style: { fontSize: 24, fontWeight: 600, color: "#ececf1", display: "flex" },
                  children: BRAND_LINE,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

async function renderSatoriPng(element) {
  const svg = await satori(element, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [{ name: "Geist", data: FONT, weight: 400, style: "normal" }],
  });
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    font: { fontFiles: ["assets/fonts/Geist-Regular.ttf"], loadSystemFonts: false },
  });
  const png = resvg.render().asPng();
  return sharp(png).png({ compressionLevel: 9 }).toBuffer();
}

/** Render the satori fallback card for a route. */
async function fallbackPng(slug) {
  const desc = DESCRIPTIONS[slug] || "";
  const subtitle = desc.length > 150 ? desc.slice(0, 147).replace(/\s+\S*$/, "") + "…" : desc;
  return renderSatoriPng(cardElement({ title: TITLES[slug], subtitle }));
}

// ---------------------------------------------------------------------------
// Screenshot pass: serve out/ and capture each route's hero at 1200x630.
// ---------------------------------------------------------------------------
async function screenshotRoutes(routes) {
  const { chromium } = await import("playwright");
  const { createServer } = await import("node:http");
  const { extname, join, normalize } = await import("node:path");

  const MIME = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ico": "image/x-icon",
    ".webmanifest": "application/manifest+json",
    ".txt": "text/plain",
    ".xml": "application/xml",
  };

  // Tiny static file server for the out/ directory.
  const server = createServer((req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (path.endsWith("/")) path += "index.html";
      const root = normalize("out");
      let file = normalize(join("out", path));
      if (!file.startsWith(root)) throw new Error("traversal");
      // Next's export layout: out/route.html for plain routes,
      // out/route/index.html when a directory exists, out/index.html for root.
      if (!existsSync(file) || !extname(file)) {
        const withHtml = `${file}.html`;
        const withIndex = join(file, "index.html");
        if (existsSync(withHtml)) file = withHtml;
        else if (existsSync(withIndex)) file = withIndex;
      }
      if (!existsSync(file)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
      res.end(readFileSync(file));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  // Fresh profile: never let persisted theme/consent leak into cards.
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.clear());
  page.setDefaultTimeout(20000);

  const shots = new Map();
  try {
    for (const slug of routes) {
      const url = `${base}${ROUTE_PATHS[slug] ?? `/${slug}`}`;
      try {
        await page.goto(url, { waitUntil: "networkidle" });
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => {
          const css = document.createElement("style");
          css.textContent =
            "*,*::before,*::after{animation:none !important;transition:none !important}";
          document.head.appendChild(css);
        });
        await page.waitForTimeout(450); // entrance animations settle
        const buf = await page.screenshot({ type: "png" });
        shots.set(slug, buf);
        console.log(`screenshot ${slug}`);
      } catch (e) {
        console.warn(`screenshot failed for ${slug}: ${e.message}`);
      }
    }
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
  return shots;
}

async function main() {
  mkdirSync("public/og", { recursive: true });

  if (!existsSync("out/index.html")) {
    console.error("out/ not found — run `bun run build` first for real screenshots.");
    console.log("falling back to satori cards");
  }

  const shots = existsSync("out/index.html") ? await screenshotRoutes(ALL_ROUTES) : new Map();

  let used = 0;
  for (const slug of ALL_ROUTES) {
    const raw = shots.get(slug);
    const png = raw
      ? await sharp(raw).png({ compressionLevel: 9 }).toBuffer()
      : await fallbackPng(slug);
    if (raw) used++;
    await sharp(png).toFile(`public/og/${slug}.png`);
  }
  console.log(`generated ${ALL_ROUTES.length} route cards (${used} real screenshots, ${ALL_ROUTES.length - used} satori fallbacks)`);

  // Base site card: satori brand card is intentional (no single "hero" to shoot).
  const base = await renderSatoriPng(
    cardElement({
      title: "The Developer Data Workspace",
      subtitle:
        "Format, convert, compare, and query JSON, XML, YAML, TOML, and CSV. Generate SQL, types, and schemas from data.",
    }),
  );
  await sharp(base).toFile("public/og.png");
  console.log("generated og.png (base)");

  // Favicons from src/app/icon.svg (no text, sharp is fine).
  await sharp("src/app/icon.svg").resize(192, 192).png().toFile("public/icon-192.png");
  await sharp("src/app/icon.svg").resize(512, 512).png().toFile("public/icon-512.png");
  await sharp("src/app/icon.svg").resize(180, 180).png().toFile("public/apple-touch-icon.png");
  console.log("generated favicons");
}

await main();
