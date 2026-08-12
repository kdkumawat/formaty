/** Small pure helpers for the Utils tool panel. */

/* ── UUID ── */

export function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function uuidNil(): string {
  return "00000000-0000-0000-0000-000000000000";
}

/** UUID v1 - time-based (MAC node simulated from random). */
export function generateUuidV1(): string {
  const now = Date.now();
  const timeLow = (now & 0xffffffff) >>> 0;
  const timeMid = ((now / 0x100000000) & 0xffff) >>> 0;
  const timeHigh = ((((now / 0x100000000) / 0x10000) & 0x0fff) >>> 0) | 0x1000;
  const clockSeq = ((Math.random() * 0x3fff) | 0) | 0x8000;
  const node = Array.from({ length: 6 }, () => ((Math.random() * 0xff) | 0).toString(16).padStart(2, "0")).join("");
  return (
    timeLow.toString(16).padStart(8, "0") +
    "-" +
    timeMid.toString(16).padStart(4, "0") +
    "-" +
    timeHigh.toString(16).padStart(4, "0") +
    "-" +
    clockSeq.toString(16).padStart(4, "0") +
    "-" +
    node
  );
}

/** UUID v5 - SHA-1(name, namespace). Namespace must be a canonical UUID. */
export async function generateUuidV5(namespace: string, name: string): Promise<string> {
  const ns = namespace.trim();
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(ns)) {
    throw new Error("Namespace must be a valid UUID (e.g. 6ba7b810-9dad-11d1-80b4-00c04fd430c8)");
  }
  const nsBytes = ns.replace(/-/g, "").match(/.{2}/g)!.map((b) => parseInt(b, 16));
  const data = new Uint8Array([...nsBytes, ...new TextEncoder().encode(name)]);
  const digest = await crypto.subtle.digest("SHA-1", data);
  const bytes = new Uint8Array(digest).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytes
    .reduce((acc, b, i) => acc + (i === 4 || i === 6 || i === 8 || i === 10 ? "-" : "") + b.toString(16).padStart(2, "0"), "");
}

/** UUID v7 - timestamp + random. */
export function generateUuidV7(): string {
  const ms = BigInt(Date.now());
  const rand = crypto.getRandomValues(new Uint8Array(10));
  const time = ms.toString(16).padStart(12, "0");
  const variant = ((rand[0] & 0x3f) | 0x80).toString(16).padStart(2, "0");
  const rest = Array.from(rand.slice(1), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${time.slice(0, 8)}-${time.slice(8, 12)}-7${time.slice(12)}-${variant}-${rest.slice(0, 12)}`;
}

export type UuidVariant = "v4" | "v1" | "v7" | "v5";

export function generateUuid(variant: UuidVariant, v5ns: string, v5name: string): Promise<string> | string {
  switch (variant) {
    case "v1":
      return generateUuidV1();
    case "v7":
      return generateUuidV7();
    case "v5":
      return generateUuidV5(v5ns || "6ba7b810-9dad-11d1-80b4-00c04fd430c8", v5name);
    default:
      return generateUuidV4();
  }
}

/* ── Base64 / URL / Hex ── */

export function toBase64(text: string): string {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch {
    throw new Error("Base64 encode failed");
  }
}

export function fromBase64(text: string): string {
  try {
    return decodeURIComponent(escape(atob(text.trim())));
  } catch {
    throw new Error("Invalid Base64");
  }
}

export function urlEncode(text: string): string {
  return encodeURIComponent(text);
}

export function urlDecode(text: string): string {
  try {
    return decodeURIComponent(text.replace(/\+/g, " "));
  } catch {
    throw new Error("Invalid URL encoding");
  }
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function sha1Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ── Time ── */

export function nowIso(): string {
  return new Date().toISOString();
}

export function nowUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function nowUnixMs(): number {
  return Date.now();
}

export function unixToIso(unix: string | number): string {
  const n = typeof unix === "string" ? Number(unix.trim()) : unix;
  if (!Number.isFinite(n)) throw new Error("Invalid unix timestamp");
  // seconds vs ms heuristic
  const ms = n > 1e12 ? n : n * 1000;
  return new Date(ms).toISOString();
}

export function isoToUnix(iso: string): { seconds: number; ms: number } {
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) throw new Error("Invalid ISO date");
  return { seconds: Math.floor(d.getTime() / 1000), ms: d.getTime() };
}

/* ── JWT ── */

export interface JwtDecodeResult {
  header: unknown;
  payload: unknown;
  signature: string;
  raw: { header: string; payload: string; signature: string };
}

function b64UrlToJson(segment: string): unknown {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const json = decodeURIComponent(escape(atob(padded + pad)));
  return JSON.parse(json);
}

export function decodeJwt(token: string): JwtDecodeResult {
  const parts = token.trim().split(".");
  if (parts.length < 2) throw new Error("JWT must have at least header.payload");
  const [h, p, s = ""] = parts;
  return {
    header: b64UrlToJson(h),
    payload: b64UrlToJson(p),
    signature: s,
    raw: { header: h, payload: p, signature: s },
  };
}

export function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/* ── Text case / transforms ── */

export type TextCaseMode =
  | "upper"
  | "lower"
  | "title"
  | "camel"
  | "pascal"
  | "snake"
  | "kebab"
  | "constant"
  | "slug"
  | "reverse"
  | "trim";

function wordsFrom(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_\-\s.]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function transformCase(text: string, mode: TextCaseMode): string {
  switch (mode) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return wordsFrom(text)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
    case "camel": {
      const w = wordsFrom(text);
      return w
        .map((word, i) =>
          i === 0
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join("");
    }
    case "pascal":
      return wordsFrom(text)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");
    case "snake":
      return wordsFrom(text)
        .map((w) => w.toLowerCase())
        .join("_");
    case "kebab":
      return wordsFrom(text)
        .map((w) => w.toLowerCase())
        .join("-");
    case "constant":
      return wordsFrom(text)
        .map((w) => w.toUpperCase())
        .join("_");
    case "slug":
      return wordsFrom(text)
        .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
        .filter(Boolean)
        .join("-");
    case "reverse":
      return [...text].reverse().join("");
    case "trim":
      return text.trim();
    default:
      return text;
  }
}

/* ── Hex ── */

export function toHex(text: string): string {
  return Array.from(new TextEncoder().encode(text))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function fromHex(hex: string): string {
  const clean = hex.replace(/\s+/g, "").replace(/^0x/i, "");
  if (!/^[0-9a-fA-F]*$/.test(clean) || clean.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.slice(i, i + 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

/* ── Number bases ── */

export function convertNumberBase(input: string): string {
  const t = input.trim();
  if (!t) throw new Error("Enter a number (prefix 0x, 0b, 0o optional)");
  let n: number;
  if (/^0x[0-9a-f]+$/i.test(t)) n = parseInt(t.slice(2), 16);
  else if (/^0b[01]+$/i.test(t)) n = parseInt(t.slice(2), 2);
  else if (/^0o[0-7]+$/i.test(t)) n = parseInt(t.slice(2), 8);
  else if (/^[01]+$/.test(t) && t.length > 8) n = parseInt(t, 2);
  else n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n)) throw new Error("Invalid integer");
  if (n < 0) throw new Error("Negative numbers not supported");
  return prettyJson({
    decimal: n,
    hex: "0x" + n.toString(16),
    binary: "0b" + n.toString(2),
    octal: "0o" + n.toString(8),
  });
}

/* ── JSON escape ── */

export function jsonEscape(text: string): string {
  return JSON.stringify(text);
}

export function jsonUnescape(text: string): string {
  const t = text.trim();
  try {
    const v = JSON.parse(t.startsWith('"') ? t : `"${t}"`);
    if (typeof v !== "string") throw new Error("Expected a JSON string");
    return v;
  } catch {
    throw new Error("Invalid escaped JSON string");
  }
}

/* ── HTML entities ── */

export function htmlEncode(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function htmlDecode(text: string): string {
  if (typeof document !== "undefined") {
    const el = document.createElement("textarea");
    el.innerHTML = text;
    return el.value;
  }
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/* ── Password / random ── */

const PASS_CHARS = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?",
};

export function generatePassword(
  length = 16,
  opts: { lower?: boolean; upper?: boolean; digits?: boolean; symbols?: boolean } = {},
): string {
  const {
    lower = true,
    upper = true,
    digits = true,
    symbols = true,
  } = opts;
  let pool = "";
  if (lower) pool += PASS_CHARS.lower;
  if (upper) pool += PASS_CHARS.upper;
  if (digits) pool += PASS_CHARS.digits;
  if (symbols) pool += PASS_CHARS.symbols;
  if (!pool) throw new Error("Select at least one character set");
  const len = Math.max(4, Math.min(128, length));
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => pool[b % pool.length]).join("");
}

/* ── Text stats ── */

export function textStats(text: string): string {
  const lines = text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const bytes = new TextEncoder().encode(text).length;
  return prettyJson({ lines, words, characters: chars, charactersNoSpaces: charsNoSpace, bytes });
}

/* ── Regex tester ── */

export interface RegexMatch {
  index: number;
  match: string;
  groups: Array<{ name: string | null; value: string }>;
}

export function regexTest(pattern: string, flags: string, text: string): { matches: RegexMatch[]; count: number } {
  if (!pattern.trim()) throw new Error("Enter a regex pattern");
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Invalid regex");
  }
  const matches: RegexMatch[] = [];
  let m: RegExpExecArray | null;
  let guard = 0;
  while ((m = re.exec(text)) !== null && guard++ < 5000) {
    const groups: Array<{ name: string | null; value: string }> = [];
    for (let i = 1; i < m.length; i++) {
      const named =
        m!.groups && typeof m!.groups === "object"
          ? (Object.entries(m!.groups).find(([, v]) => v === m![i])?.[0] ?? null)
          : null;
      groups.push({ name: named, value: m[i] });
    }
    matches.push({ index: m.index, match: m[0], groups });
    if (m[0].length === 0) re.lastIndex++;
  }
  return { matches, count: matches.length };
}

/* ── Color converter ── */

export interface ColorParts {
  input: string;
  hex: string;
  rgb: string;
  hsl: string;
  cmyk: string;
  name: string;
}

function componentToHex(c: number): string {
  return Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0");
}

export function parseColor(input: string): ColorParts {
  const t = input.trim();
  if (!t) throw new Error("Enter a color (hex, rgb(), hsl(), or name)");

  let r = 0;
  let g = 0;
  let b = 0;
  let a = 1;

  const hexMatch = t.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16) / 255;
  } else if (t.startsWith("rgb")) {
    const m = t.match(/rgba?\(([^)]+)\)/i);
    if (!m) throw new Error("Invalid rgb() color");
    const parts = m[1].split(/[\s,/]+/).map(Number);
    if (parts.length < 3 || parts.some((n) => !Number.isFinite(n))) throw new Error("Invalid rgb() color");
    [r, g, b] = parts;
    if (parts.length > 3) a = parts[3];
  } else if (t.startsWith("hsl")) {
    const m = t.match(/hsla?\(([^)]+)\)/i);
    if (!m) throw new Error("Invalid hsl() color");
    const parts = m[1].split(/[\s,/]+/).map((s) => parseFloat(s));
    const h = ((parts[0] % 360) + 360) % 360;
    const s = Math.max(0, Math.min(100, parts[1] ?? 0)) / 100;
    const l = Math.max(0, Math.min(100, parts[2] ?? 0)) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m2 = l - c / 2;
    let rr = 0, gg = 0, bb = 0;
    if (h < 60) { rr = c; gg = x; }
    else if (h < 120) { rr = x; gg = c; }
    else if (h < 180) { gg = c; bb = x; }
    else if (h < 240) { gg = x; bb = c; }
    else if (h < 300) { rr = x; bb = c; }
    else { rr = c; bb = x; }
    r = (rr + m2) * 255;
    g = (gg + m2) * 255;
    b = (bb + m2) * 255;
    if (parts.length > 3) a = parts[3];
  } else {
    // CSS named color - render offscreen and read computed rgb
    if (typeof document !== "undefined") {
      const probe = document.createElement("div");
      probe.style.color = t;
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      document.body.appendChild(probe);
      const computed = getComputedStyle(probe).color;
      document.body.removeChild(probe);
      const m = computed.match(/rgba?\(([^)]+)\)/i);
      if (!m) throw new Error(`Unknown color "${t}"`);
      const parts = m[1].split(/[\s,/]+/).map(Number);
      [r, g, b] = parts;
      if (parts.length > 3) a = parts[3];
    } else {
      throw new Error("Invalid color");
    }
  }

  const hex = `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}${a < 1 ? componentToHex(a * 255) : ""}`;
  const rn = Math.round(r), gn = Math.round(g), bn = Math.round(b);
  const rgb = a < 1 ? `rgba(${rn}, ${gn}, ${bn}, ${Number(a.toFixed(3))})` : `rgb(${rn}, ${gn}, ${bn})`;
  const rp = rn / 255, gp = gn / 255, bp = bn / 255;
  const max = Math.max(rp, gp, bp), min = Math.min(rp, gp, bp);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rp) h = ((gp - bp) / d + (gp < bp ? 6 : 0)) * 60;
    else if (max === gp) h = ((bp - rp) / d + 2) * 60;
    else h = ((rp - gp) / d + 4) * 60;
  }
  const hsl = `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  const k = 1 - max;
  const cmyk = `cmyk(${Math.round(((1 - rp - k) / (1 - k || 1)) * 100)}%, ${Math.round(((1 - gp - k) / (1 - k || 1)) * 100)}%, ${Math.round(((1 - bp - k) / (1 - k || 1)) * 100)}%, ${Math.round(k * 100)}%)`;
  return { input: t, hex, rgb, hsl, cmyk, name: t.toLowerCase().replace(/\s+/g, " ") };
}

/* ── Lorem ipsum / random text ── */

const LOREM_WORDS =
  "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");

export type LoremUnit = "words" | "sentences" | "paragraphs";

export function generateLorem(count: number, unit: LoremUnit): string {
  const n = Math.max(1, Math.min(2000, Math.floor(count)));
  const pick = () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
  const sentence = () => {
    const len = 6 + Math.floor(Math.random() * 8);
    const words = Array.from({ length: len }, pick);
    const s = words[0]!.charAt(0).toUpperCase() + words.slice(1).join(" ");
    return s + ".";
  };
  if (unit === "words") return Array.from({ length: n }, pick).join(" ");
  if (unit === "sentences") return Array.from({ length: n }, sentence).join(" ");
  return Array.from({ length: n }, () => Array.from({ length: 3 + Math.floor(Math.random() * 3) }, sentence).join(" ")).join("\n\n");
}

export function generateRandomLines(count: number, length: number, charset: "alnum" | "hex" | "numeric"): string {
  const n = Math.max(1, Math.min(500, Math.floor(count)));
  const pools: Record<string, string> = {
    alnum: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    hex: "0123456789abcdef",
    numeric: "0123456789",
  };
  const pool = pools[charset];
  const len = Math.max(1, Math.min(256, Math.floor(length)));
  return Array.from({ length: n }, () =>
    Array.from({ length: len }, () => pool[Math.floor(Math.random() * pool.length)]).join(""),
  ).join("\n");
}

/* ── Cron explainer ── */

export function explainCron(expr: string): string {
  const fields = expr.trim().split(/\s+/);
  if (fields.length < 5 || fields.length > 6) {
    throw new Error("Cron needs 5 or 6 fields: min hour day month weekday [year]");
  }
  const [min, hour, dom, mon, dow, ...rest] = fields;
  const any = (f: string) => f === "*" || f === "?";
  const range = (f: string) => {
    const parts: string[] = [];
    for (const part of f.split(",")) {
      if (part === "*") { parts.push("every value"); continue; }
      const step = part.split("/");
      const base = step[0];
      const every = step[1] ? ` (every ${step[1]})` : "";
      if (base.includes("-")) {
        const [a, b] = base.split("-");
        parts.push(`${a}–${b}${every}`);
      } else {
        parts.push(`${base}${every}`);
      }
    }
    return parts.join(", ");
  };
  const describe = (field: string, name: string, plural: string) => {
    if (any(field)) return `every ${name}`;
    if (field.includes("/") && field.split("/")[0] === "*") return `every ${field.split("/")[1]} ${plural}`;
    return `${name} ${range(field)}`;
  };
  const out: string[] = [];
  out.push(describe(min, "minute", "minutes"));
  out.push(describe(hour, "hour", "hours"));
  if (!any(dom) || !any(mon) || !any(dow)) {
    if (!any(dom)) out.push(`on day ${range(dom)} of the month`);
    if (!any(mon)) out.push(`in ${range(mon)} month`);
    if (!any(dow)) out.push(`on ${range(dow).replace(/0/g, "Sun").replace(/1/g, "Mon").replace(/2/g, "Tue").replace(/3/g, "Wed").replace(/4/g, "Thu").replace(/5/g, "Fri").replace(/6/g, "Sat")} day of the week`);
  }
  if (rest.length) out.push(`in year ${range(rest[0])}`);
  return `Runs ${out.join(", ")}.`;
}

/* ── URL parser ── */

export interface UrlParts {
  href: string;
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  params: Array<{ key: string; value: string }>;
}

export function parseUrl(input: string): UrlParts {
  const t = input.trim();
  if (!t) throw new Error("Enter a URL");
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    throw new Error("Invalid URL");
  }
  const params: Array<{ key: string; value: string }> = [];
  u.searchParams.forEach((value, key) => params.push({ key, value }));
  return {
    href: u.href,
    protocol: u.protocol,
    username: u.username,
    password: u.password,
    hostname: u.hostname,
    port: u.port,
    pathname: u.pathname,
    search: u.search,
    hash: u.hash,
    params,
  };
}

/* ── Sample inputs per util ── */

export type UtilTab =
  | "uuid"
  | "base64"
  | "jwt"
  | "hash"
  | "time"
  | "url"
  | "case"
  | "hex"
  | "number"
  | "escape"
  | "html"
  | "password"
  | "stats"
  | "regex"
  | "color"
  | "lorem"
  | "cron"
  | "urlparse";

export const UTIL_TABS: { id: UtilTab; label: string; short?: string }[] = [
  // Ordered by typical usage - most-used tools at the top.
  { id: "uuid", label: "UUID" },
  { id: "base64", label: "Base64" },
  { id: "jwt", label: "JWT" },
  { id: "hash", label: "Hash" },
  { id: "password", label: "Password" },
  { id: "url", label: "URL Encode" },
  { id: "case", label: "Case" },
  { id: "regex", label: "Regex" },
  { id: "escape", label: "Escape" },
  { id: "html", label: "HTML" },
  { id: "time", label: "Time" },
  { id: "hex", label: "Hex" },
  { id: "number", label: "Number" },
  { id: "urlparse", label: "URL Parse" },
  { id: "color", label: "Color" },
  { id: "cron", label: "Cron" },
  { id: "lorem", label: "Lorem" },
  { id: "stats", label: "Stats" },
];

export const UTIL_SAMPLES: Record<UtilTab, string> = {
  uuid: "",
  base64: "Hello, Formaty!",
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZvcm1hdHkiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  hash: "formaty local-first toolkit",
  time: "1710000000",
  url: "https://formaty.dev/playground?q=hello world&x=1",
  urlparse: "https://user:pass@formaty.dev:443/playground?tool=json&tab=2#section",
  case: "hello_world formatyAPI",
  hex: "Formaty",
  number: "255",
  escape: 'Line 1\nLine 2\t"quoted"',
  html: '<div class="x">A & B</div>',
  regex: "The quick brown fox jumps over the lazy dog. The fox is quick.",
  color: "#6d6df4",
  cron: "*/15 * * * *",
  lorem: "",
  password: "",
  stats: "Formaty is a local-first data toolkit.\nFormat · Convert · Compare · Utils",
};

export function utilPlaceholder(tab: UtilTab): string {
  switch (tab) {
    case "jwt":
      return "Paste JWT (header.payload.signature)…";
    case "time":
      return "Unix seconds/ms or ISO date - empty for now";
    case "hash":
      return "Text to hash (SHA-256 / SHA-1)…";
    case "url":
      return "URL or percent-encoded string…";
    case "urlparse":
      return "URL to split into parts (protocol, host, query…)…";
    case "base64":
      return "Text to encode, or Base64 to decode…";
    case "case":
      return "Text to transform case…";
    case "hex":
      return "Text to encode, or hex to decode…";
    case "number":
      return "Integer (e.g. 255, 0xff, 0b1111)…";
    case "escape":
      return "Text to JSON-escape, or escaped string to unescape…";
    case "html":
      return "HTML or entity-encoded text…";
    case "regex":
      return "Test text - matches are listed on the right…";
    case "color":
      return "#6d6df4, rgb(109,109,244), hsl(240 90% 69%), or a CSS color name…";
    case "cron":
      return "5 or 6 field cron expression (e.g. */15 * * * *)…";
    case "lorem":
      return "Options only - set a count, then press New…";
    case "password":
      return "Options only - use New to generate";
    case "stats":
      return "Paste text for line / word / character counts…";
    default:
      return "Text…";
  }
}
