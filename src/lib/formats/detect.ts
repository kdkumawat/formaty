import type { FormatKind } from "./types";

export function detectFormat(input: string): FormatKind {
  const trimmed = input.trim();
  if (!trimmed) return "json";

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
