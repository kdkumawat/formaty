/** Small pure helpers for the Utils tool panel. */

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
  | "stats";

export const UTIL_TABS: { id: UtilTab; label: string; short?: string }[] = [
  { id: "uuid", label: "UUID" },
  { id: "base64", label: "Base64" },
  { id: "jwt", label: "JWT" },
  { id: "hash", label: "Hash" },
  { id: "time", label: "Time" },
  { id: "url", label: "URL" },
  { id: "case", label: "Case" },
  { id: "hex", label: "Hex" },
  { id: "number", label: "Number" },
  { id: "escape", label: "Escape" },
  { id: "html", label: "HTML" },
  { id: "password", label: "Password" },
  { id: "stats", label: "Stats" },
];

export const UTIL_SAMPLES: Record<UtilTab, string> = {
  uuid: "",
  base64: "Hello, Formaty!",
  jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZvcm1hdHkiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  hash: "formaty local-first toolkit",
  time: "1710000000",
  url: "https://formaty.dev/playground?q=hello world&x=1",
  case: "hello_world formatyAPI",
  hex: "Formaty",
  number: "255",
  escape: 'Line 1\nLine 2\t"quoted"',
  html: '<div class="x">A & B</div>',
  password: "",
  stats: "Formaty is a local-first data toolkit.\nFormat · Convert · Compare · Utils",
};

export function utilPlaceholder(tab: UtilTab): string {
  switch (tab) {
    case "jwt":
      return "Paste JWT (header.payload.signature)…";
    case "time":
      return "Unix seconds/ms or ISO date — empty for now";
    case "hash":
      return "Text to hash (SHA-256 / SHA-1)…";
    case "url":
      return "URL or percent-encoded string…";
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
    case "password":
      return "Options only — use Run to generate";
    case "stats":
      return "Paste text for line / word / character counts…";
    default:
      return "Text…";
  }
}
