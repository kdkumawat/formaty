import { XMLParser, XMLBuilder } from "fast-xml-parser";
import type { FormatAdapter } from "./types";
import { inferCell } from "./csvParser";
import { xmlDocument, type JsonValue } from "@/lib/json/core";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // Numbers and booleans only when they print back identically, so "49.00" and "007" stay strings.
  parseTagValue: false,
  tagValueProcessor: (_name: string, value: string) => inferCell(value),
  trimValues: true,
  ignoreDeclaration: true,
  ignorePiTags: true,
});

function createXmlBuilder(indent = 2, minify = false) {
  return new XMLBuilder({
    format: !minify,
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    indentBy: minify ? "" : " ".repeat(Math.max(1, Math.min(10, indent))),
  });
}

/** The leading `<?xml …?>` declaration of `text` (after optional BOM/whitespace), or undefined. */
export function xmlDeclarationOf(text: string): string | undefined {
  return /^[﻿\s]*(<\?xml\s[^>]*?\?>)/.exec(text)?.[1];
}

export const xmlAdapter: FormatAdapter = {
  kind: "xml",
  parse(input: string): JsonValue {
    if (!input.includes("<")) throw new Error("No XML elements found");
    const parsed = parser.parse(input);
    return parsed as JsonValue;
  },
  stringify(data: JsonValue, options?: Parameters<FormatAdapter["stringify"]>[1]): string {
    const indent = options?.indentation ?? 2;
    const minify = options?.minify ?? false;
    const b = createXmlBuilder(indent, minify);
    const body = b.build(xmlDocument(data));
    return options?.xmlDeclaration ? options.xmlDeclaration + (minify ? "" : "\n") + body : body;
  },
};
