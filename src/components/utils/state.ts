import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  convertNumberBase,
  decodeJwt,
  explainCron,
  fromBase64,
  fromHex,
  htmlDecode,
  htmlEncode,
  isoToUnix,
  jsonEscape,
  jsonUnescape,
  nowIso,
  nowUnixMs,
  nowUnixSeconds,
  parseColor,
  parseUrl,
  prettyJson,
  regexTest,
  sha1Hex,
  sha256Hex,
  textStats,
  toBase64,
  toHex,
  transformCase,
  unixToIso,
  urlDecode,
  urlEncode,
  type LoremUnit,
  type TextCaseMode,
  type UtilTab,
  type UuidVariant,
  UTIL_SAMPLES,
} from "@/lib/utils/devtools";

/** Codec tools that support bidirectional plain ⇄ encoded editing. */
export const CODEC_TABS: ReadonlySet<UtilTab> = new Set(["base64", "url", "hex", "escape", "html"]);
/** Generator tools that have options instead of a text input (options + output only). */
export const GENERATOR_TABS: ReadonlySet<UtilTab> = new Set(["uuid", "password", "lorem"]);

export function encodeText(tab: UtilTab, text: string): string {
  switch (tab) {
    case "base64":
      return toBase64(text);
    case "url":
      return urlEncode(text);
    case "hex":
      return toHex(text);
    case "escape":
      return jsonEscape(text);
    case "html":
      return htmlEncode(text);
    default:
      return text;
  }
}

export function decodeText(tab: UtilTab, text: string): string {
  switch (tab) {
    case "base64":
      return fromBase64(text);
    case "url":
      return urlDecode(text);
    case "hex":
      return fromHex(text);
    case "escape":
      return jsonUnescape(text);
    case "html":
      return htmlDecode(text);
    default:
      return text;
  }
}

export interface UtilToolState {
  input: string;
  output: string;
  error: string | null;
  uuidCount: number;
  uuidList: string[];
  uuidVariant: UuidVariant;
  uuidName: string;
  caseMode: TextCaseMode;
  hashAlgo: "sha256" | "sha1";
  passwordLen: number;
  pwLower: boolean;
  pwUpper: boolean;
  pwDigits: boolean;
  pwSymbols: boolean;
  pwCount: number;
  pwList: string[];
  regexPattern: string;
  regexFlags: string;
  loremUnit: LoremUnit;
  loremCount: number;
  /** Which side is being edited for codec tools (left = plain, right = encoded). */
  editSide: "left" | "right";
  touched: boolean;
}

export type UtilsStateMap = Partial<Record<UtilTab, UtilToolState>>;

export function defaultUtilToolState(tab: UtilTab): UtilToolState {
  return {
    input: UTIL_SAMPLES[tab] ?? "",
    output: "",
    error: null,
    uuidCount: 5,
    uuidList: [],
    uuidVariant: "v4",
    uuidName: "formaty",
    caseMode: "snake",
    hashAlgo: "sha256",
    passwordLen: 16,
    pwLower: true,
    pwUpper: true,
    pwDigits: true,
    pwSymbols: true,
    pwCount: 5,
    pwList: [],
    regexPattern: "\\b(\\w+)@(\\w+)\\b",
    regexFlags: "g",
    loremUnit: "paragraphs",
    loremCount: 3,
    editSide: "left",
    touched: false,
  };
}

/** Load sample for a util tool (shared with toolbar Sample button). */
export function applyUtilSample(tab: UtilTab, cur?: UtilToolState): UtilToolState {
  const base = cur ?? defaultUtilToolState(tab);
  if (tab === "uuid") {
    return { ...base, uuidCount: 5, uuidList: [], output: "", error: null, touched: true };
  }
  if (tab === "password") {
    return { ...base, passwordLen: 16, pwCount: 5, pwList: [], output: "", error: null, touched: true };
  }
  if (tab === "time") {
    return { ...base, input: "", output: "", error: null, touched: true };
  }
  if (tab === "lorem") {
    return { ...base, loremUnit: "paragraphs", loremCount: 3, output: "", error: null, touched: true };
  }
  return {
    ...base,
    input: UTIL_SAMPLES[tab] ?? "",
    output: "",
    error: null,
    touched: true,
  };
}

export async function computeUtil(tab: UtilTab, s: UtilToolState): Promise<Partial<UtilToolState>> {
  // Bidirectional codec: editing the right (encoded) side decodes back to the left.
  if (CODEC_TABS.has(tab)) {
    if (s.editSide === "right") {
      try {
        return { input: decodeText(tab, s.output), error: null };
      } catch (e) {
        throw e;
      }
    }
    return { output: encodeText(tab, s.input), error: null };
  }
  if (tab === "jwt") {
    if (!s.input.trim()) return { output: "", error: null };
    const result = decodeJwt(s.input);
    return {
      output: prettyJson({
        header: result.header,
        payload: result.payload,
        signature: result.signature ? `${result.signature.slice(0, 24)}…` : "(none)",
      }),
      error: null,
    };
  }
  if (tab === "hash") {
    if (!s.input) return { output: "", error: null };
    const hex = s.hashAlgo === "sha1" ? await sha1Hex(s.input) : await sha256Hex(s.input);
    return { output: hex, error: null };
  }
  if (tab === "time") {
    const t = s.input.trim();
    if (!t) {
      return {
        output: prettyJson({
          iso: nowIso(),
          unixSeconds: nowUnixSeconds(),
          unixMs: nowUnixMs(),
        }),
        error: null,
      };
    }
    if (/^\d+(\.\d+)?$/.test(t)) return { output: unixToIso(t), error: null };
    return { output: prettyJson(isoToUnix(t)), error: null };
  }
  if (tab === "case") {
    if (!s.input) return { output: "", error: null };
    return { output: transformCase(s.input, s.caseMode), error: null };
  }
  if (tab === "number") {
    if (!s.input.trim()) return { output: "", error: null };
    return { output: convertNumberBase(s.input), error: null };
  }
  if (tab === "regex") {
    if (!s.input.trim() && !s.regexPattern.trim()) return { output: "", error: null };
    const { matches, count } = regexTest(s.regexPattern, s.regexFlags, s.input);
    return { output: prettyJson({ count, matches }), error: null };
  }
  if (tab === "color") {
    if (!s.input.trim()) return { output: "", error: null };
    return { output: prettyJson(parseColor(s.input)), error: null };
  }
  if (tab === "cron") {
    if (!s.input.trim()) return { output: "", error: null };
    return { output: explainCron(s.input), error: null };
  }
  if (tab === "urlparse") {
    if (!s.input.trim()) return { output: "", error: null };
    return { output: prettyJson(parseUrl(s.input)), error: null };
  }
  if (tab === "stats") {
    return { output: textStats(s.input), error: null };
  }
  return {};
}

/** Select all within field only (avoid selecting whole workspace). */
export function selectFieldAll(e: ReactKeyboardEvent<HTMLTextAreaElement | HTMLPreElement>) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget;
    if (el instanceof HTMLTextAreaElement) {
      el.select();
    } else if (window.getSelection && document.createRange) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }
}

export const UUID_VARIANT_LABELS: Array<{ id: UuidVariant; label: string; title: string }> = [
  { id: "v4", label: "v4", title: "Random (most common)" },
  { id: "v1", label: "v1", title: "Time-based" },
  { id: "v7", label: "v7", title: "Timestamp + random (RFC 9562)" },
  { id: "v5", label: "v5", title: "SHA-1 of namespace + name" },
];
