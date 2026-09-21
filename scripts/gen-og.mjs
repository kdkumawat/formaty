// Regenerates public/og.png, PNG favicons, and per-route OG share cards.
// Usage: bun scripts/gen-og.mjs
//
// All cards are rendered with satori (style objects -> SVG) and rasterized
// with @resvg/resvg-js using the committed Geist font (assets/fonts/), so the
// output is deterministic everywhere — including fontless environments where
// librsvg silently drops every <text> node and produces textless PNGs.
//
// Titles/descriptions are imported from src/lib/seo.ts, src/lib/seoUtils.ts
// and src/lib/seoInstant.ts so share cards always match what the pages emit.
// If a tool is added or retitled there, re-run this script.
import sharp from "sharp";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, readFileSync } from "node:fs";
import ts from "typescript";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// ---------------------------------------------------------------------------
// Load the app's SEO registries (TypeScript) from this .mjs script.
// The seo modules import "@/lib/utils/devtools" (a type-only import), so we
// strip types with the TypeScript compiler and shim that path.
// ---------------------------------------------------------------------------
function loadSeo() {
  mkdirSync(".og-gen", { recursive: true });
  const shim = `export type UtilTab = string;\n`;
  require("fs").writeFileSync(".og-gen/devtools.ts", shim);
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
    require("fs").mkdirSync(out.split("/").slice(0, -1).join("/"), { recursive: true });
    require("fs").writeFileSync(out, js);
  }
  // Shim "@/lib/utils/devtools" for seoUtils' type-only import.
  const utilsJs = readFileSync(".og-gen/lib/seoUtils.cjs", "utf8").replace(
    /require\("\@\/lib\/utils\/devtools"\)/g,
    "{}",
  );
  require("fs").writeFileSync(".og-gen/lib/seoUtils.cjs", utilsJs);
  const seo = require("../.og-gen/lib/seo.cjs");
  const seoUtils = require("../.og-gen/lib/seoUtils.cjs");
  const seoInstant = require("../.og-gen/lib/seoInstant.cjs");
  return { seo, seoUtils, seoInstant };
}

const { seo, seoUtils, seoInstant } = loadSeo();

const WIDTH = 1200;
const HEIGHT = 630;
const FONT = readFileSync("assets/fonts/Geist-Regular.ttf");

// slug → display title (without " | Formaty"). Imported from the SEO config.
const TITLES = {
  ...Object.fromEntries(
    Object.values(seo.TOOL_PAGES).map((c) => [c.route, c.h1]),
  ),
  ...Object.fromEntries(
    Object.values(seoUtils.UTIL_PAGES).map((c) => [c.route, c.h1]),
  ),
  instant: seoInstant.INSTANT_PAGE.h1,
};

// route → meta description, shown as the card's tagline.
const DESCRIPTIONS = {
  ...Object.fromEntries(
    Object.values(seo.TOOL_PAGES).map((c) => [c.route, c.description]),
  ),
  ...Object.fromEntries(
    Object.values(seoUtils.UTIL_PAGES).map((c) => [c.route, c.description]),
  ),
  instant: seoInstant.INSTANT_PAGE.description,
};

const ALL_ROUTES = Object.keys(TITLES);
const BRAND = seo.SITE_NAME || "Formaty";
const BRAND_LINE = "Free · Local-first · No sign-up";

/** Strip the " | Formaty" suffix and split into at most 2 balanced lines. */
function titleLines(title) {
  const clean = title.replace(/\s*\|\s*Formaty\s*$/, "");
  if (clean.length <= 18) return [clean];
  const words = clean.split(" ");
  // Greedy balance: fill line 1 close to half the total length.
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
  // Fall back to letting satori wrap naturally.
  return [clean];
}

/** Build one satori element tree for a card. */
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
        // Header: logo mark + brand
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
        // Title block
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: 12,
            },
            children: lines.map((line, i) => ({
              type: "div",
              props: {
                style: {
                  fontSize,
                  fontWeight: 700,
                  color: i === 0 && lines.length > 1 ? "#ececf1" : "#a5a5ff",
                  letterSpacing: -2,
                  lineHeight: 1.05,
                },
                children: line,
              },
            })),
          },
        },
        // Footer: description + tagline
        {
          type: "div",
          props: {
            style: { display: "flex", flexDirection: "column", gap: 10 },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 26,
                    color: "#9a9aa5",
                    lineHeight: 1.35,
                    display: "flex",
                  },
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

/** Satori element tree for the base site card (replaces public/og.svg). */
function baseCardElement() {
  const el = cardElement({
    title: "The Developer Data Workspace",
    subtitle:
      "Format, convert, compare, and query JSON, XML, YAML, TOML, and CSV. Generate SQL, types, and schemas from data.",
  });
  return el;
}

async function renderPng(element) {
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

async function main() {
  // Per-route OG share cards.
  mkdirSync("public/og", { recursive: true });
  for (const slug of ALL_ROUTES) {
    const title = TITLES[slug];
    const desc = DESCRIPTIONS[slug] || "";
    const subtitle = desc.length > 150 ? desc.slice(0, 147).replace(/\s+\S*$/, "") + "…" : desc;
    const buf = await renderPng(cardElement({ title, subtitle }));
    await sharp(buf).toFile(`public/og/${slug}.png`);
    console.log(`generated og/${slug}.png — ${title}`);
  }

  // Base site OG card.
  const base = await renderPng(baseCardElement());
  await sharp(base).toFile("public/og.png");
  console.log("generated og.png (base)");

  // Favicons from src/app/icon.svg (no text, sharp is fine).
  await sharp("src/app/icon.svg").resize(192, 192).png().toFile("public/icon-192.png");
  console.log("generated icon-192.png");
  await sharp("src/app/icon.svg").resize(512, 512).png().toFile("public/icon-512.png");
  console.log("generated icon-512.png");
  await sharp("src/app/icon.svg").resize(180, 180).png().toFile("public/apple-touch-icon.png");
  console.log("generated apple-touch-icon.png");
}

await main();
