import type { InputFormatKind } from "./types";
import { isCurlCommand } from "@/lib/curl/parseCurl";

export function detectFormat(input: string): InputFormatKind {
  const trimmed = input.trim();
  if (!trimmed) return "json";

  if (isCurlCommand(trimmed)) return "curl";

  const first = trimmed[0];
  const firstLine = trimmed.split("\n")[0].trim();

  if (first === "{" || first === "[" || (first === '"' && trimmed.includes(":"))) {
    return "json";
  }

  if (firstLine.startsWith("<?xml") || firstLine.startsWith("<")) {
    return "xml";
  }

  if (firstLine === "---" || /^\w+\s*:\s*/.test(firstLine) || /^\s+-\s+/.test(trimmed)) {
    return "yaml";
  }

  if (/^\[[\w.]+\]\s*$/.test(firstLine) || /^\w+\s*=\s*/.test(firstLine)) {
    return "toml";
  }

  if (/,/.test(firstLine) && !firstLine.includes('"') && !firstLine.includes("'")) {
    return "csv";
  }

  return "json";
}
