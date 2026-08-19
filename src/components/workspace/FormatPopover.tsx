"use client";

import { formatListCopyAsText, type CopyPref, type QuoteStyle, type LayoutStyle } from "@/lib/copyAs";
import type { CopyAsFormat } from "./OutputActionBar";
import { menuItemClass as sharedMenuItemClass, menuCheck as sharedMenuCheck, menuSectionLabel as sharedMenuSectionLabel } from "./menuStyles";

export type { QuoteStyle, LayoutStyle, CopyPref };

export type EncodeOption = { id: CopyAsFormat; label: string };

/** Modes that have encode options (text transform, not list items). */
export const ENCODE_MODES = new Set(["transform", "utils-base64", "utils-hash", "utils-case", "utils-escape", "utils-html", "utils-hex", "utils-number", "utils-url", "utils-time"]);

interface FormatPopoverContentProps {
  items: string[];
  rawOutput: string;
  mode: string;
  pref: CopyPref;
  onPrefChange: (pref: CopyPref) => void;
  onFormatCopy: (text: string, label: string) => void;
  encodeFormats?: EncodeOption[];
  onEncodeCopy?: (format: CopyAsFormat) => void;
  onClose?: () => void;
}

export type FormatOption = {
  quote: QuoteStyle;
  layout: LayoutStyle;
  label: string;
  short: string;
  suffix?: string;
};

export const FORMAT_GROUPS: Array<{ header: string; options: FormatOption[] }> = [
  {
    header: "Single line",
    options: [
      { quote: "none", layout: "same-line", label: "No quotes", short: "No quotes" },
      { quote: "single", layout: "same-line", label: "Single-quoted", short: "' quoted" },
      { quote: "double", layout: "same-line", label: "Double-quoted", short: '" quoted' },
    ],
  },
  {
    header: "Multi line",
    options: [
      { quote: "none", layout: "each-line", label: "No quotes (,)", short: "No quotes +,", suffix: "," },
      { quote: "single", layout: "each-line", label: "Single-quoted (,)", short: "' +,", suffix: "," },
      { quote: "double", layout: "each-line", label: "Double-quoted (,)", short: '" +,', suffix: "," },
    ],
  },
];

const ALL_FORMAT_OPTIONS: FormatOption[] = FORMAT_GROUPS.flatMap((g) => g.options);

export function getFormatShortLabel(pref: CopyPref): string {
  if (pref === "as-seen") return "As shown";
  const match = ALL_FORMAT_OPTIONS.find(
    (o) => o.quote === pref.quote && o.layout === pref.layout && (o.suffix ?? "") === (pref.suffix ?? ""),
  );
  return match?.short ?? `${pref.quote} · ${pref.layout}`;
}

export function FormatPopoverContent({
  items,
  rawOutput,
  mode,
  pref,
  onPrefChange,
  onFormatCopy,
  encodeFormats,
  onEncodeCopy,
  onClose,
}: FormatPopoverContentProps) {
  const isAsSeen = pref === "as-seen";
  const showEncode = ENCODE_MODES.has(mode) && encodeFormats && encodeFormats.length > 0 && onEncodeCopy;

  const handleSelect = (opt: FormatOption) => {
    const next: CopyPref = { quote: opt.quote, layout: opt.layout, suffix: opt.suffix };
    onPrefChange(next);
    if (items.length > 0) {
      const text = formatListCopyAsText(items, opt.quote, opt.layout, opt.suffix);
      onFormatCopy(text, opt.short);
    }
    onClose?.();
  };

  const handleAsSeen = () => {
    onPrefChange("as-seen");
    onFormatCopy(rawOutput, "As shown");
    onClose?.();
  };

  const isActive = (opt: FormatOption) => {
    if (isAsSeen) return false;
    return pref.quote === opt.quote && pref.layout === opt.layout && (opt.suffix ?? "") === (pref.suffix ?? "");
  };

  return (
    <div className="flex flex-col py-1" onClick={(e) => e.stopPropagation()}>
      {/* As shown in output — always first, checkable */}
      <button type="button" className={`${sharedMenuItemClass} ${isAsSeen ? "!bg-primary/12 !text-primary" : ""}`} onClick={handleAsSeen}>
        {sharedMenuCheck(isAsSeen)}
        <span className="min-w-0 flex-1 truncate text-left">As shown in output</span>
      </button>

      {/* Grouped format options */}
      {FORMAT_GROUPS.map((group) => (
        <div key={group.header}>
          {sharedMenuSectionLabel(group.header)}
          {group.options.map((opt) => {
            const key = `${opt.quote}-${opt.layout}-${opt.suffix ?? ""}`;
            return (
              <button
                key={key}
                type="button"
                className={`${sharedMenuItemClass} ${isActive(opt) ? "!bg-primary/12 !text-primary" : ""}`}
                onClick={() => handleSelect(opt)}
              >
                {sharedMenuCheck(isActive(opt))}
                <span className="min-w-0 flex-1 truncate text-left">{opt.label}</span>
              </button>
            );
          })}
        </div>
      ))}

      {/* Encode section — only for text transform modes, same padding as groups */}
      {showEncode && (
        <div>
          {sharedMenuSectionLabel("Encode")}
          {encodeFormats!.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={sharedMenuItemClass}
              onClick={() => {
                onEncodeCopy!(opt.id);
                onClose?.();
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
