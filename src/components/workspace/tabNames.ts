import { FORMAT_LABELS, getInputFormatLabel, type FormatKind, type InputFormatKind } from "@/lib/formats";
import type { TypeTargetLanguage } from "@/lib/json/core";
import { UTIL_TABS } from "@/lib/utils/devtools";
import type { CompareKind } from "./constants";
import { OPERATION_ACTION_LABELS, TYPE_LANGUAGES } from "./constants";

export type TabKind = "transform" | "compare" | "utils";

/** What a tab needs to know to name itself. */
export interface TabFacts {
  operation: string | null;
  convertToFormat: FormatKind;
  typeLanguage: TypeTargetLanguage;
  diffKind: CompareKind;
  utilTab: string;
  inputFormat: InputFormatKind;
}

export function tabKindOf(operation: string | null | undefined): TabKind {
  return operation === "diff" ? "compare" : operation === "utils" ? "utils" : "transform";
}

/** Automatic tab name: "JSON to SQL", "Format JSON", "Compare lists", "UUID". */
export function autoTabName(f: TabFacts): string {
  const kind = tabKindOf(f.operation);
  if (kind === "utils") return UTIL_TABS.find((t) => t.id === f.utilTab)?.label ?? "Utils";
  if (kind === "compare") {
    return f.diffKind === "single" ? "One list" : f.diffKind === "list" ? "Compare lists" : "Compare documents";
  }
  const from = getInputFormatLabel(f.inputFormat);
  if (f.operation === "generateTypes") {
    return `${from} to ${TYPE_LANGUAGES.find((t) => t.id === f.typeLanguage)?.label ?? "types"}`;
  }
  if (f.operation === "schema") return `${from} to JSON Schema`;
  if (f.operation === "openapi") return `${from} to OpenAPI spec`;
  if (f.operation === "validate") return `Validate ${from}`;
  if (f.operation && ["flatten", "unflatten", "minify"].includes(f.operation)) {
    return `${OPERATION_ACTION_LABELS[f.operation]} ${from}`;
  }
  const to = FORMAT_LABELS[f.convertToFormat];
  return from === to ? `Format ${from}` : `${from} to ${to}`;
}

/** Add " 2", " 3" to repeated names, counting in `order` (creation sequence) so moving a tab never renames it. Defaults to tab order. */
export function numberDuplicates(names: string[], order: number[] = names.map((_, i) => i)): string[] {
  const seen = new Map<string, number>();
  const out = [...names];
  names
    .map((_, i) => i)
    .sort((a, b) => order[a] - order[b])
    .forEach((i) => {
      const count = (seen.get(names[i]) ?? 0) + 1;
      seen.set(names[i], count);
      if (count > 1) out[i] = `${names[i]} ${count}`;
    });
  return out;
}
