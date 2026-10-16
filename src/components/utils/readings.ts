import {
  cleanJson,
  convertNumberBase,
  decodeJwt,
  explainCron,
  fromBase64,
  fromHex,
  htmlDecode,
  htmlEncode,
  jsonEscape,
  jsonUnescape,
  parseColor,
  parseUrl,
  prettyJson,
  textStats,
  toBase64,
  toHex,
  transformCase,
  urlDecode,
  urlEncode,
  type TextCaseMode,
  type UtilTab,
} from "@/lib/utils/devtools";

/** One labelled result row. `open` offers "Open in <tool>"; `error` renders in the problem colour. */
export interface Reading {
  label: string;
  value: string;
  swatch?: string;
  open?: UtilTab;
  error?: boolean;
  /** Section heading in Detect anything; consecutive rows sharing it render under one header. */
  group?: string;
}

export type Dir = "encode" | "decode";

export const GROUPS: Array<{ name: string; tools: UtilTab[] }> = [
  { name: "", tools: ["auto"] },
  { name: "Generate", tools: ["uuid", "password", "lorem", "hash"] },
  { name: "Time", tools: ["instant", "cron"] },
  { name: "Text and JSON", tools: ["regex", "case", "stats", "clean"] },
  { name: "Encode and decode", tools: ["base64", "url", "hex", "html", "escape"] },
  { name: "Parse and convert", tools: ["jwt", "urlparse", "number", "color"] },
];

const TOKEN_EX =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

export const TOOL_META: Record<UtilTab, { desc: string; example: string; dirLabels?: [string, string] }> = {
  auto: { desc: "Paste anything. It tells you what it is and offers the conversions that fit.", example: TOKEN_EX },
  uuid: { desc: "Generate one or many unique IDs (v1, v4, v5 or v7).", example: "" },
  password: { desc: "Generate random passwords with the rules you pick. Nothing leaves this device.", example: "" },
  lorem: { desc: "Generate placeholder text for layouts and mockups.", example: "" },
  hash: { desc: "Get the SHA-1, SHA-256, SHA-384 and SHA-512 hash of your text.", example: "Hello, Formaty!" },
  instant: { desc: "Show one moment in several time zones, or convert a Unix timestamp.", example: "" },
  cron: { desc: "Paste a cron schedule to read it in plain words.", example: "0 9 * * 1-5" },
  regex: { desc: "Test a pattern against text and preview a replacement.", example: "" },
  case: { desc: "Convert a phrase or name to camelCase, snake_case, kebab-case and more.", example: "max retry count" },
  stats: { desc: "Count the characters, words, lines and bytes in your text.", example: "Formaty runs in your browser.\nNothing is uploaded." },
  clean: {
    desc: "Repair JSON that has single quotes, comments, trailing commas or unquoted keys.",
    example: "{\n  // trailing comma and single quotes\n  name: 'formaty',\n  tags: ['local', 'fast',],\n}",
  },
  base64: { desc: "Turn text into Base64, or Base64 back into text.", example: "SGVsbG8sIEZvcm1hdHkh", dirLabels: ["Encode", "Decode"] },
  url: { desc: "Percent-encode text for a URL, or decode it back.", example: "plan=pro & active=true", dirLabels: ["Encode", "Decode"] },
  hex: { desc: "Turn text into hex bytes, or hex bytes back into text.", example: "48 65 6c 6c 6f", dirLabels: ["Text to hex", "Hex to text"] },
  html: { desc: "Escape text into HTML entities, or turn entities back into text.", example: "&lt;b&gt;Tom &amp; Jerry&lt;/b&gt;", dirLabels: ["Escape", "Unescape"] },
  escape: { desc: "Escape text into a JSON string, or turn a JSON string back into text.", example: 'She said "hi"\nand left.' },
  jwt: { desc: "Paste a token to read its header and payload. The signature is not verified.", example: TOKEN_EX },
  urlparse: { desc: "Split a URL into host, path, query parameters and fragment.", example: "https://api.example.com/v1/users?plan=pro&active=true#top" },
  number: { desc: "Show a whole number in decimal, hex, binary and octal.", example: "255" },
  color: { desc: "Convert a color between HEX, RGB, HSL and CMYK.", example: "#F2B544" },
};

const CASE_MODES: TextCaseMode[] = [
  "snake",
  "kebab",
  "camel",
  "pascal",
  "constant",
  "slug",
  "upper",
  "lower",
  "title",
  "reverse",
  "trim",
];

const msg = (e: unknown) => (e instanceof Error ? e.message : "Failed");

/** Auto-pick Encode vs Decode from the input: encoded-looking input means Decode. */
export function looksEncoded(tool: UtilTab, input: string): boolean {
  const t = input.trim();
  if (!t) return false;
  switch (tool) {
    case "base64":
      return t.length >= 4 && /^[A-Za-z0-9+/_-]+={0,2}$/.test(t) && safe(() => fromBase64(t.replace(/-/g, "+").replace(/_/g, "/")));
    case "url":
      return /%[0-9a-f]{2}/i.test(t);
    case "hex":
      return /^(0x)?([0-9a-f]{2}\s*)+$/i.test(t) && t.replace(/\s|^0x/gi, "").length >= 4;
    case "html":
      return /&(#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);/i.test(t);
    default:
      return false;
  }
}

function safe(fn: () => unknown): boolean {
  try {
    fn();
    return true;
  } catch {
    return false;
  }
}

function isoFromUnix(n: number): string {
  return new Date(n < 1e12 ? n * 1000 : n).toISOString();
}

function jwtReadings(input: string): Reading[] {
  const r = decodeJwt(input);
  const rows: Reading[] = [
    { label: "Header", value: prettyJson(r.header) },
    { label: "Payload", value: prettyJson(r.payload) },
  ];
  const p = r.payload as Record<string, unknown> | null;
  for (const [k, label] of [["iat", "Issued at"], ["nbf", "Not before"], ["exp", "Expires"]] as const) {
    const v = p?.[k];
    if (typeof v === "number") rows.push({ label, value: isoFromUnix(v) });
  }
  rows.push({ label: "Signature", value: r.signature || "(none)" });
  return rows;
}

function numberReadings(input: string): Reading[] {
  const n = JSON.parse(convertNumberBase(input)) as Record<string, string | number>;
  return [
    { label: "Decimal", value: String(n.decimal) },
    { label: "Hexadecimal", value: String(n.hex) },
    { label: "Binary", value: String(n.binary) },
    { label: "Octal", value: String(n.octal) },
  ];
}

/** Colors in the input: one per line, and lines without a function like rgb() may list several. */
export function colorTokens(input: string): string[] {
  const tokens = input
    .split(/\r?\n/)
    .flatMap((line) => (line.includes("(") ? [line] : line.split(/[\s,;]+/)))
    .map((t) => t.trim())
    .filter(Boolean);
  return [...new Set(tokens)];
}

function colorRows(input: string): Reading[] {
  const c = parseColor(input);
  const swatch = /^#([0-9a-f]{6}|[0-9a-f]{8})$/i.test(c.hex) ? c.hex : undefined;
  return [
    { label: "HEX", value: c.hex, swatch },
    { label: "RGB", value: c.rgb },
    { label: "HSL", value: c.hsl },
    { label: "CMYK", value: c.cmyk },
  ];
}

/** One color reads as plain rows; several read as one group per color, headed by the color as typed. */
function colorReadings(input: string): Reading[] {
  const tokens = colorTokens(input);
  if (tokens.length <= 1) return colorRows(tokens[0] ?? input);
  return tokens.flatMap((t) => {
    try {
      return colorRows(t).map((r) => ({ ...r, group: t }));
    } catch (e) {
      return [{ label: "Problem", value: msg(e), error: true, group: t }];
    }
  });
}

function urlReadings(input: string): Reading[] {
  const p = parseUrl(input);
  const rows: Array<[string, string]> = [
    ["Href", p.href],
    ["Protocol", p.protocol],
    ["Username", p.username],
    ["Password", p.password],
    ["Hostname", p.hostname],
    ["Port", p.port],
    ["Path", p.pathname],
    ["Search", p.search],
    ["Hash", p.hash],
  ];
  return [
    ...rows.filter(([, v]) => v).map(([label, value]) => ({ label, value })),
    ...p.params.map((q) => ({ label: `Query: ${q.key}`, value: q.value })),
  ];
}

function statsReadings(input: string): Reading[] {
  const s = JSON.parse(textStats(input)) as Record<string, number>;
  return [
    { label: "Characters", value: String(s.characters) },
    { label: "Without spaces", value: String(s.charactersNoSpaces) },
    { label: "Words", value: String(s.words) },
    { label: "Lines", value: String(s.lines) },
    { label: "Bytes", value: String(s.bytes) },
  ];
}

/** Result rows for one value tool. Hash digests are async and handled by the caller. */
export function toolReadings(tool: UtilTab, input: string, dir: Dir): Reading[] {
  if (!input.trim() && tool !== "stats") return [];
  try {
    switch (tool) {
      case "base64":
        return [{ label: dir === "encode" ? "Base64" : "Decoded text", value: dir === "encode" ? toBase64(input) : fromBase64(input.trim().replace(/-/g, "+").replace(/_/g, "/")) }];
      case "url":
        return dir === "encode"
          ? [
              { label: "Encoded", value: urlEncode(input) },
              { label: "Encoded, keeping : / ? &", value: encodeURI(input) },
            ]
          : [{ label: "Decoded", value: urlDecode(input) }];
      case "hex":
        return [{ label: dir === "encode" ? "Hex" : "Text", value: dir === "encode" ? toHex(input) : fromHex(input) }];
      case "html":
        return [{ label: dir === "encode" ? "Escaped" : "Unescaped", value: dir === "encode" ? htmlEncode(input) : htmlDecode(input) }];
      case "escape": {
        const rows: Reading[] = [{ label: "As a JSON string", value: jsonEscape(input) }];
        if (safe(() => jsonUnescape(input))) rows.push({ label: "Unescaped", value: jsonUnescape(input) });
        return rows;
      }
      case "jwt":
        return jwtReadings(input);
      case "case":
        return CASE_MODES.map((m) => ({ label: m, value: transformCase(input, m) }));
      case "number":
        return numberReadings(input);
      case "color":
        return colorReadings(input);
      case "urlparse":
        return urlReadings(input);
      case "cron":
        return [{ label: "Meaning", value: explainCron(input) }];
      case "stats":
        return statsReadings(input);
      case "clean":
        return [{ label: "Cleaned JSON", value: cleanJson(input) }];
      default:
        return [];
    }
  } catch (e) {
    return [{ label: "Problem", value: msg(e), error: true }];
  }
}

const TOKEN = /^[\w-]+\.[\w-]+\.[\w-]*$/;
const CRON = /^[\d*/,\-?LW#A-Za-z]+(\s+[\d*/,\-?LW#A-Za-z]+){4,5}$/;
const COLOR = /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(rgb|hsl)a?\(.*\))$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-([1-8])[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CASE_MAX_CHARS = 40;
const CASE_MAX_WORDS = 6;
const wordCount = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").split(/[\s_.-]+/).filter(Boolean).length;

/** Cases offered for short identifiers and phrases, most commonly converted to first. */
const CASE_ROWS: Array<[string, TextCaseMode]> = [
  ["snake_case", "snake"],
  ["kebab-case", "kebab"],
  ["camelCase", "camel"],
  ["PascalCase", "pascal"],
  ["CONSTANT_CASE", "constant"],
  ["lowercase", "lower"],
  ["UPPERCASE", "upper"],
  ["Title Case", "title"],
];

/** Every reading that applies to arbitrary input, for the detect-anything tool. */
export function detectReadings(input: string): Reading[] {
  const t = input.trim();
  if (!t) return [];
  const out: Reading[] = [];

  let jwt: Reading[] | null = null;
  if (TOKEN.test(t)) {
    try {
      jwt = jwtReadings(t);
    } catch {
      jwt = null;
    }
  }
  if (jwt) return jwt.map((r) => ({ ...r, label: `JWT ${r.label.toLowerCase()}`, open: "jwt" as const }));

  if (/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(t) && !isNaN(Date.parse(t))) {
    out.push({ label: "Unix seconds", value: String(Math.floor(Date.parse(t) / 1000)), open: "instant" });
  }

  if (CRON.test(t) && safe(() => explainCron(t))) {
    return [{ label: "Cron schedule", value: explainCron(t), open: "cron" }];
  }

  if (/^[[{]/.test(t)) {
    try {
      JSON.parse(t);
      return [{ label: "Valid JSON", value: prettyJson(JSON.parse(t)), open: "clean" }];
    } catch {
      /* not strict JSON: fall through, Clean JSON may still fix it */
    }
    if (safe(() => cleanJson(t))) return [{ label: "Almost JSON, cleaned", value: cleanJson(t), open: "clean" }];
  }

  const colors = colorTokens(t);
  if (colors.every((c) => COLOR.test(c) && safe(() => parseColor(c)))) {
    return colorReadings(t).map((r) => ({ group: "Color", ...r, open: "color" as const }));
  }

  if (UUID.test(t)) {
    out.push({ label: "UUID", value: `Version ${UUID.exec(t)![1]}, ${t.toLowerCase()}` });
  }

  if (/^\d{10}(\d{3})?$/.test(t)) {
    out.push({ label: "Unix timestamp", value: isoFromUnix(Number(t)), open: "instant" });
  }

  if (/^(-?\d+|0x[0-9a-f]+|0b[01]+|0o[0-7]+)$/i.test(t) && !t.startsWith("-") && safe(() => convertNumberBase(t))) {
    for (const r of numberReadings(t)) out.push({ ...r, label: `Number, ${r.label.toLowerCase()}`, open: "number" });
  }

  if (/^[a-z][a-z0-9+.-]*:\/\/\S+$/i.test(t) && safe(() => parseUrl(t))) {
    const u = parseUrl(t);
    out.push({
      label: "URL",
      value: `${u.hostname}${u.pathname}${u.params.length ? `, ${u.params.length} query ${u.params.length === 1 ? "parameter" : "parameters"}` : ""}`,
      open: "urlparse",
    });
  }

  if (/%[0-9a-f]{2}/i.test(t) && safe(() => urlDecode(t))) {
    out.push({ label: "URL decoded", value: urlDecode(t), open: "url" });
  }
  if (looksEncoded("html", t)) out.push({ label: "HTML unescaped", value: htmlDecode(t), open: "html" });
  if (looksEncoded("hex", t)) out.push({ label: "Hex to text", value: fromHex(t), open: "hex" });
  if (looksEncoded("base64", t) && !/^\d+$/.test(t)) {
    const d = fromBase64(t.replace(/-/g, "+").replace(/_/g, "/"));
    if (!/[\x00-\x08\x0e-\x1f]/.test(d)) out.push({ label: "Base64 decoded", value: d, open: "base64" });
  }

  // Case rows are noise next to a specific detection (a decoded Base64 guess does not count,
  // plain words often happen to be valid Base64). Only identifier-like or phrase-like input
  // qualifies: one line, at most CASE_MAX_CHARS characters and CASE_MAX_WORDS words, made of
  // letters, digits, spaces, underscores, dots and hyphens, with at least one letter.
  const specific = out.some((r) => r.open !== "base64");
  if (
    !specific &&
    t.length <= CASE_MAX_CHARS &&
    /^[A-Za-z0-9 _.-]+$/.test(t) &&
    /[a-z]/i.test(t) &&
    wordCount(t) <= CASE_MAX_WORDS
  ) {
    const seen = new Set([t]);
    for (const [label, mode] of CASE_ROWS) {
      const value = transformCase(t, mode);
      if (seen.has(value)) continue; // equals the input or an earlier row
      seen.add(value);
      out.push({ label, value, open: "case", group: "Change case" });
    }
  }
  out.push({ label: "Base64", value: toBase64(t), open: "base64", group: "Encode" });
  out.push({ label: "URL", value: urlEncode(t), open: "url", group: "Encode" });
  const s = JSON.parse(textStats(input)) as Record<string, number>;
  out.push({ label: "Size", value: `${s.characters} characters, ${s.words} words, ${s.lines} lines, ${s.bytes} bytes`, open: "stats", group: "About the text" });
  return out;
}
