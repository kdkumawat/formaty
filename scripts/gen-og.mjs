// Regenerates public/og.png, PNG favicons, and per-tool OG images.
// Usage: bun scripts/gen-og.mjs
//
// Per-tool share cards are rendered from the route slug (e.g. "json-formatter"
// → "JSON Formatter"). The title map mirrors src/lib/seo.ts / src/lib/seoUtils.ts
// so share cards match the page. If a tool is added or retitled there, update
// this map and re-run.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const WIDTH = 1200;
const HEIGHT = 630;

// slug → display title (without the " | Formaty" suffix).
const TITLES = {
  // Tools (src/lib/seo.ts)
  "json-formatter": "JSON Formatter",
  "json-viewer": "JSON Viewer",
  "json-diff": "JSON Diff",
  "json-to-typescript": "JSON to TypeScript",
  "jsonpath-tester": "JSONPath Tester",
  "graph-viewer": "JSON Graph Viewer",
  "api-import": "API Import (cURL)",
  "schema-generator": "JSON Schema Generator",
  "json-to-xml": "JSON to XML Converter",
  "xml-to-json": "XML to JSON Converter",
  "json-to-yaml": "JSON to YAML Converter",
  "yaml-to-json": "YAML to JSON Converter",
  "json-to-toml": "JSON to TOML Converter",
  "toml-to-json": "TOML to JSON Converter",
  "json-to-csv": "JSON to CSV Converter",
  "csv-to-json": "CSV to JSON Converter",
  "xml-formatter": "XML Formatter",
  "yaml-formatter": "YAML Formatter",
  "toml-formatter": "TOML Formatter",
  "csv-formatter": "CSV Formatter",
  "compare-lists": "Compare Two Lists",
  "sql-in-clause-generator": "SQL IN Clause Generator",
  "json-to-sql": "JSON to SQL Converter",
  "json-to-go": "JSON to Go Struct",
  "json-to-python": "JSON to Python",
  "compare-ids": "Compare Two ID Lists",
  "find-duplicates-in-list": "Find Duplicates in a List",
  "sql-values-generator": "SQL VALUES Generator",
  "json-to-zod": "JSON to Zod Schema",
  "json-to-java": "JSON to Java Class",
  "json-to-csharp": "JSON to C# Class",
  "json-to-pydantic": "JSON to Pydantic Model",
  "json-to-protobuf": "JSON to Protobuf Message",
  "json-schema-validator": "JSON Schema Validator",
  "json-flattener": "JSON Flattener",
  "compare-csv": "Compare Two CSV Files",
  "csv-column-compare": "Compare Two CSV Columns",
  "curl-to-fetch": "cURL to Fetch Converter",
  "curl-to-axios": "cURL to Axios Converter",
  "curl-to-python": "cURL to Python Converter",
  "curl-to-go": "cURL to Go Converter",
  // Utils (src/lib/seoUtils.ts)
  "uuid-generator": "UUID Generator",
  "base64-encoder": "Base64 Encoder & Decoder",
  "jwt-decoder": "JWT Decoder",
  "sha-hash-generator": "SHA-256 & SHA-1 Hash Generator",
  "password-generator": "Password Generator",
  "url-encoder-decoder": "URL Encoder / Decoder",
  "text-case-converter": "Text Case Converter",
  "regex-tester": "Regex Tester",
  "json-string-escape": "JSON String Escape / Unescape",
  "html-encoder": "HTML Encoder / Decoder",
  "hex-converter": "Hex Encoder / Decoder",
  "number-base-converter": "Number Base Converter",
  "url-parser": "URL Parser",
  "color-converter": "Color Converter",
  "cron-expression-explainer": "Cron Expression Explainer",
  "lorem-ipsum-generator": "Lorem Ipsum Generator",
  "text-stats": "Text Stats",
  // Instant (src/app/utils/instant)
  instant: "Instant — Timezone Converter",
};

const ALL_ROUTES = Object.keys(TITLES);

function titleFor(slug) {
  if (TITLES[slug]) return TITLES[slug];
  return slug
    .split("-")
    .map((w) => (["json", "xml", "yaml", "toml", "csv", "jwt", "sha", "uuid", "api", "url", "html", "hex"].includes(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Escape XML special chars for safe embedding in SVG text nodes. */
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Split a title into at most 2 lines that fit the card width. */
function wrapTitle(title) {
  const maxChars = 16;
  if (title.length <= maxChars) return [title];
  const words = title.split(" ");
  let line1 = "";
  let i = 0;
  while (i < words.length && (line1 + " " + words[i]).trim().length <= maxChars) {
    line1 = (line1 + " " + words[i]).trim();
    i++;
  }
  return [line1, words.slice(i).join(" ")];
}

function toolCardSvg(title) {
  const lines = wrapTitle(title);
  const yStart = lines.length === 1 ? 350 : 315;
  const titleText = lines
    .map((l, i) => `<text x="88" y="${yStart + i * 76}" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="url(#title)" letter-spacing="-1.5">${esc(l)}</text>`)
    .join("\n  ");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a0a10"/>
      <stop offset="1" stop-color="#10101a"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.2" cy="0.1" r="0.8">
      <stop offset="0" stop-color="#6d6df4" stop-opacity="0.28"/>
      <stop offset="1" stop-color="#6d6df4" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="title" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ececf1"/>
      <stop offset="1" stop-color="#a5a5ff"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-opacity="0.035" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glowA)"/>

  <g transform="translate(88 88)">
    <path d="M0 32c-12 0-12 12-12 18v6c0 6-6 12-12 12 6 0 12 6 12 12v6c0 6 0 18 12 18" stroke="#9b8cff" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M48 32c12 0 12 12 12 18v6c0 6 6 12 12 12-6 0-12 6-12 12v6c0 6 0 18-12 18" stroke="#9b8cff" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M12 80l24-24" stroke="#6d6df4" stroke-width="9" stroke-linecap="round"/>
  </g>
  <text x="156" y="118" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="700" fill="url(#title)" letter-spacing="-1">Formaty</text>

  ${titleText}

  <text x="88" y="520" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="600" fill="#ececf1">Free · Local-first · No sign-up</text>
  <text x="88" y="556" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#9a9aa5">Everything runs in your browser. No data leaves your device.</text>
</svg>`;
}

async function main() {
  // Base site OG + favicons (from existing sources)
  await sharp("public/og.svg").resize(WIDTH, HEIGHT).png().toFile("public/og.png");
  console.log("generated og.png");
  await sharp("src/app/icon.svg").resize(192, 192).png().toFile("public/icon-192.png");
  console.log("generated icon-192.png");
  await sharp("src/app/icon.svg").resize(512, 512).png().toFile("public/icon-512.png");
  console.log("generated icon-512.png");
  await sharp("src/app/icon.svg").resize(180, 180).png().toFile("public/apple-touch-icon.png");
  console.log("generated apple-touch-icon.png");

  // Per-tool OG images
  mkdirSync("public/og", { recursive: true });
  for (const slug of ALL_ROUTES) {
    const svg = Buffer.from(toolCardSvg(titleFor(slug)));
    await sharp(svg).resize(WIDTH, HEIGHT).png().toFile(`public/og/${slug}.png`);
    console.log(`generated og/${slug}.png`);
  }
}

await main();
