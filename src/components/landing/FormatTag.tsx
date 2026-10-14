import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type TagId = "json" | "xml" | "yaml" | "toml" | "csv" | "curl";

/** Formats are named by a mono glyph and a name, never by colour. */
export const TAG_GLYPH: Record<TagId, string> = { json: "{}", xml: "<>", yaml: ":-", toml: "[]", csv: ",,", curl: "$_" };
export const TAG_NAME: Record<TagId, string> = { json: "JSON", xml: "XML", yaml: "YAML", toml: "TOML", csv: "CSV", curl: "cURL" };

/** Ink selection: the lifted surface in Carbon, the ink fill in Paper. */
export const SELECTED = "border-selected-border bg-selected text-selected-foreground";

/** 22px glyph tag; `lg` is the strip's large version. */
export function FormatTag({ id, selected = false, lg = false, className, ...rest }: { id: TagId; selected?: boolean; lg?: boolean; className?: string } & Omit<HTMLAttributes<HTMLSpanElement>, "className">) {
  return (
    <span
      {...rest}
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-[4px] border font-mono leading-none",
        lg ? "h-11 gap-2.5 px-4 text-[16px]" : "h-[22px] gap-1.5 px-[7px] text-[11.5px]",
        selected ? SELECTED : "border-[var(--input)] text-[var(--workspace-text)]",
        className,
      )}
    >
      <span aria-hidden className={selected ? "opacity-70" : "text-[var(--workspace-text-muted)]"}>{TAG_GLYPH[id]}</span>
      {TAG_NAME[id]}
    </span>
  );
}
