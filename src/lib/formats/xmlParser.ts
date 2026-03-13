import { XMLParser, XMLBuilder } from "fast-xml-parser";
import type { FormatAdapter } from "./types";
import type { JsonValue } from "@/lib/json/core";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseTagValue: true,
  trimValues: true,
});

function createXmlBuilder(indent = 2) {
  return new XMLBuilder({
    format: true,
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    indentBy: " ".repeat(Math.max(1, Math.min(10, indent))),
  });
}

function unwrapRoot(obj: Record<string, unknown>): JsonValue {
  const keys = Object.keys(obj);
  if (keys.length === 1) {
    const value = obj[keys[0]];
    return value as JsonValue;
  }
  return obj as JsonValue;
}

export const xmlAdapter: FormatAdapter = {
  kind: "xml",
  parse(input: string): JsonValue {
    const parsed = parser.parse(input);
    if (!parsed || typeof parsed !== "object") return parsed as JsonValue;
    return unwrapRoot(parsed) as JsonValue;
  },
  stringify(data: JsonValue, options?: Parameters<FormatAdapter["stringify"]>[1]): string {
    const indent = options?.indentation ?? 2;
    const b = createXmlBuilder(indent);
    const wrapped = typeof data === "object" && data !== null && !Array.isArray(data)
      ? { root: data }
      : { root: data };
    return b.build(wrapped as object);
  },
};
