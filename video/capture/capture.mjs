// Step-driven capture of the real Formaty workspace.
// Usage (from video/): bun run build in the repo root first, then `node capture/capture.mjs`.
//
// Playwright drives the static export in ../out. After every action the settled
// UI is screenshotted, and public/shots/manifest.json records what happened and
// where the pointer was, so the Remotion composition can replay it on a beat grid.
//
// SCALE=1 gives fast 1280x720 drafts; the default 3 gives 3840x2160 masters.
import { chromium } from "playwright";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { serveOut } from "./serve.mjs";
import {
  ORDERS_JSON, QUERY, IDS_API, IDS_DB, EXPECTED, CURL_COMMAND, CURL_RESPONSE, DEMO_JWT, BASE64_TEXT,
} from "./fixtures.mjs";

const VIEWPORT = { width: 1280, height: 720 };
const SCALE = Number(process.env.SCALE ?? 3);
const SHOTS = fileURLToPath(new URL("../public/shots/", import.meta.url));

rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

const { base, close } = await serveOut();
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: SCALE,
  colorScheme: "dark",
  timezoneId: "Asia/Kolkata",
  locale: "en-US",
});
await context.grantPermissions(["clipboard-read", "clipboard-write"]);

// Deterministic network: the cURL finale hits a fictional host, Monaco loads
// from its CDN, and nothing else (GitHub star count, analytics, feedback API)
// is allowed out.
await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => {
  const url = route.request().url();
  if (url.startsWith("https://api.acme.dev/")) {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "*",
        "x-request-id": "req_demo_7f3a",
      },
      body: route.request().method() === "OPTIONS" ? "" : CURL_RESPONSE,
    });
  }
  if (url.startsWith("https://cdn.jsdelivr.net/")) return route.continue(); // Monaco loader
  return route.abort();
});

const page = await context.newPage();
page.setDefaultTimeout(8000);
page.on("pageerror", (e) => console.log("  pageerror:", e.message.split("\n")[0]));
await page.addInitScript(() => {
  if (sessionStorage.getItem("capture-init")) return;
  sessionStorage.setItem("capture-init", "1");
  localStorage.clear();
  localStorage.setItem("formaty-onboarded", "1");
  // Wider input pane than the default so pasted payloads read well on video.
  localStorage.setItem("formaty-session", JSON.stringify({ split: 40 }));
  // Instant: a four-city board instead of the two-row default.
  const loc = (city, country, countryCode, iana, isPrimary = false) =>
    ({ id: `demo-${countryCode}`, city, country, countryCode, iana, isPrimary });
  localStorage.setItem("formaty-instant-onboarded", "1");
  localStorage.setItem("formaty-instant-prefs", JSON.stringify({
    locations: [
      loc("Bengaluru", "India", "IN", "Asia/Kolkata", true),
      loc("San Francisco", "United States", "US", "America/Los_Angeles"),
      loc("London", "United Kingdom", "GB", "Europe/London"),
      loc("Tokyo", "Japan", "JP", "Asia/Tokyo"),
    ],
    primaryTimezone: "Asia/Kolkata",
    timeFormat: "12h",
    showSeconds: false,
    spanHours: 24,
  }));
});
// Freeze "now" so Instant and any timestamps are identical on every run.
await page.clock.setFixedTime(new Date("2026-10-06T10:30:00+05:30"));

const manifest = [];
let beat = "";
let n = 0;
let pointer = null;
let keys = null;

/** Screenshot the settled UI and record it (with the shortcut that produced it, if any). */
async function shot(label, settle = 350) {
  await page.waitForTimeout(settle);
  const file = String(++n).padStart(3, "0") + "-" + beat + "-" + label + ".png";
  await page.screenshot({ path: SHOTS + file, type: "png" });
  manifest.push({ file, beat, label, pointer, keys });
  keys = null;
  console.log("  " + file);
}

/** Real mouse click at the element's centre; remembers the pointer position. */
async function click(locator) {
  const el = locator.filter({ visible: true }).first(); // skip hidden mobile twins
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  pointer = { x: Math.round(box.x + box.width / 2), y: Math.round(box.y + box.height / 2) };
  await page.mouse.move(pointer.x, pointer.y);
  await page.mouse.click(pointer.x, pointer.y);
}

/** Press a real app shortcut; the next shot carries its keycaps and hint. */
async function key(combo, hint) {
  await page.keyboard.press(combo);
  keys = { caps: combo.replace("Control", "Ctrl").split("+").map((k) => (k.length === 1 ? k.toUpperCase() : k)), hint };
}

/** Put text on the real clipboard and paste it with Ctrl+V. */
async function pasteKey(text, hint) {
  await page.evaluate((t) => navigator.clipboard.writeText(t), text);
  await key("Control+v", hint);
}

/** Paste-like insertion into the focused editor/field. */
const paste = (text) => page.keyboard.insertText(text);

/** Open the command palette with Ctrl+K, type a query one real keystroke at a time, run it. */
async function palette(query, label) {
  await key("Control+k", "Command palette");
  await page.waitForTimeout(250);
  const open = await page.evaluate(() => document.activeElement?.tagName === "INPUT");
  if (!open) {
    // A focused Monaco editor can swallow Ctrl+K as a chord prefix; click instead.
    keys = null;
    await page.keyboard.press("Escape");
    await click(page.locator('[data-tour="command-palette"]'));
  }
  await shot(label + "-palette-open");
  for (const [i, ch] of [...query].entries()) {
    await page.keyboard.type(ch);
    await shot(label + "-palette-" + String(i + 1).padStart(2, "0"), 90);
  }
  await page.keyboard.press("Enter");
}

/** Open a toolbar dropdown by its trigger label, screenshot it, pick an item. */
async function menu(trigger, item, label) {
  await click(page.locator("span.font-medium", { hasText: new RegExp("^" + trigger + "$") }));
  await shot(`${label}-menu`, 400);
  await click(page.locator("button", { hasText: item }));
}

const button = (name) => page.locator("button", { hasText: new RegExp("^" + name + "$") });
const inputEditor = () => page.locator('[data-tour="input-editor"] .monaco-editor');
const utilInput = () => page.locator("textarea");

async function open() {
  await page.goto(`${base}/playground`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    // Settled states only: the composition supplies motion between them.
    content: "*,*::before,*::after{animation:none !important;transition:none !important;caret-color:transparent !important}",
  });
  await page.waitForTimeout(800);
}

/** Click whatever currently shows this exact text (dropdown triggers show their value). */
const text = (t) => page.getByText(t, { exact: true });
const digits = async (locator) => Number((await locator.filter({ visible: true }).first().innerText()).replace(/\D/g, ""));

const beats = {
  async paste() {
    await shot("empty");
    await pasteKey(ORDERS_JSON, "Paste");
    await shot("pasted", 1500);
    await key("Alt+m", "Maximize output");
    await shot("maximized", 800);
  },

  async views() {
    await key("Control+2", "Tree view");
    await shot("tree", 900);
    await key("Control+3", "Graph view");
    await shot("graph", 3000);
    await key("Control+5", "Table view");
    await shot("table", 1000);
    // Drill into the nested orders array: one row per order.
    await click(page.getByText(/^array · 4$/));
    await shot("table-orders", 900);
    await click(page.locator('[aria-label="Copy options"]'));
    await shot("copy-menu", 500);
    await click(page.locator("button", { hasText: /^Markdown table$/ }));
    await shot("copied-markdown", 400);
  },

  async query() {
    await key("Control+4", "Query view");
    await shot("query", 900);
    await click(page.locator('textarea[placeholder^="$."]'));
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    for (const [i, ch] of [...QUERY].entries()) {
      await page.keyboard.type(ch);
      await shot("type-" + String(i + 1).padStart(2, "0"), 200);
    }
    await shot("result", 900);
  },

  async diff() {
    await key("Control+Shift+D", "Compare");
    await click(button("Lists"));
    // Compare carries the Transform input over as the left list; replace it.
    await click(page.getByPlaceholder(/Paste list/));
    await page.keyboard.press("Control+a");
    await page.keyboard.press("Delete");
    await shot("lists", 500);
    await paste(IDS_API);
    await page.keyboard.press("Control+Home");
    await shot("left", 1200);
    await click(page.getByPlaceholder(/Second list/));
    await paste(IDS_DB);
    await page.keyboard.press("Control+Home");
    await shot("both", 2000);
    const bucket = () => page.getByText(/^(Common|Left|Right|Union|Symmetric diff) · [\d,]+$/);
    await click(bucket());
    await shot("bucket-menu", 500);
    await click(page.locator("button", { hasText: /^Summary/ }));
    await shot("summary", 900);
    // Fold the long sections so all three counts sit on one screen.
    await click(page.locator('[aria-label="Collapse Common"]'));
    await shot("summary-fold-1", 500);
    await click(page.locator('[aria-label="Collapse Left"]'));
    await shot("summary-fold-2", 500);
    await click(page.locator('[aria-label="Collapse Right"]'));
    await shot("summary-counts", 500);
    await click(page.locator('button[title="Show Left items"]'));
    await page.mouse.wheel(0, -1e6);
    await shot("left-bucket", 900);
    const left = await digits(bucket());
    if (left !== EXPECTED.left) throw new Error("left-only count " + left + ", expected " + EXPECTED.left);
  },

  async exports() {
    let current = "None · plain list";
    for (const [label, name] of [
      ["SQL IN ('…')", "sql-in"],
      ["Comma separated", "comma"],
      ["JSON array (numbers if possible)", "json-array"],
    ]) {
      await click(text(current));
      await shot(name + "-menu", 500);
      await click(page.locator("button", { hasText: label }));
      await shot(name, 800);
      current = label;
    }
    await click(page.locator('[aria-label="Copy options"]'));
    await shot("copy-menu", 500);
    await click(page.locator("button", { hasText: /^Single-quoted$/ }));
    await shot("copied", 400);
  },

  async tabs() {
    await key("Alt+n", "New tab");
    await shot("new-tab", 900);
    await click(button("Transform"));
    await shot("transform", 800);
    await pasteKey(CURL_COMMAND, "Paste cURL");
    await shot("curl-pasted", 1000);
    await key("Control+Enter", "Run");
    await shot("response", 1500);
    await menu("Code", /^JavaScript fetch$/, "fetch");
    await shot("code-fetch", 700);
    await menu("Code", /^Python requests$/, "python");
    await shot("code-python", 700);
    await menu("Code", /^Go net\/http$/, "go");
    await shot("code-go", 700);
  },

  async types() {
    // Back to the first tab: it still holds the orders payload.
    await click(page.locator('[data-tour="tab-bar"] [role="tab"]'));
    await shot("tab-1", 900);
    await key("Control+1", "Raw view");
    await shot("raw", 700);
    await palette("typescript", "ts");
    await shot("typescript", 900);
    await menu("Types", /^Go$/, "go");
    await shot("go", 900);
    await menu("Types", /^SQL$/, "sql");
    await shot("sql", 900);
    await click(page.locator('[data-tour="settings-gear"]'));
    await shot("settings", 700);
    await click(page.locator("button", { hasText: /^PostgreSQL$/ }));
    await shot("settings-postgres", 700);
    await page.keyboard.press("Escape");
    // The dialect applies on the next generation.
    await menu("Types", /^SQL$/, "sql-again");
    await shot("sql-postgres", 900);
    await click(page.locator('[data-tour="settings-gear"]'));
    await click(page.getByText("Compact menus", { exact: true }));
    await shot("settings-pinned", 700);
    await page.keyboard.press("Escape");
    await shot("pinned-toolbar", 700);
  },

  async utils() {
    await key("Control+Shift+U", "Utils");
    await shot("utils-tab", 900);
    await click(button("JWT"));
    await click(utilInput());
    await page.keyboard.press("Control+a"); // replace the built-in sample token
    await paste(DEMO_JWT);
    await shot("jwt-decoded", 800);
    await click(button("Base64"));
    await click(utilInput());
    await page.keyboard.press("Control+a");
    await paste(BASE64_TEXT);
    await shot("base64", 700);
    await click(button("Instant"));
    await shot("instant", 1500);
  },
};

await open();
let failed = 0;
for (const [name, run] of Object.entries(beats)) {
  beat = name;
  console.log(name);
  try {
    await run();
  } catch (e) {
    failed++;
    console.log(`  FAILED: ${e.message.split("\n")[0]}`);
    await shot("FAILED");
  }
}

writeFileSync(SHOTS + "manifest.json", JSON.stringify({ viewport: VIEWPORT, scale: SCALE, shots: manifest }, null, 2));
await browser.close();
await close();
console.log(`${manifest.length} shots → public/shots (scale ${SCALE}), ${failed} beats failed`);
process.exit(failed ? 1 : 0);
