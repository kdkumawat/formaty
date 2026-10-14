"use client";

import { ChevronDownIcon } from "@heroicons/react/16/solid";
import { Chip, Menu, MenuContent, MenuItem, MenuLabel, MenuSeparator, MenuTrigger } from "@/components/kit";
import { MORE_OPERATIONS, TYPE_LANGUAGES, outputLabel, type OutputId } from "./constants";

/** Chips that are always visible. XML and TOML live under "More" unless they were learned. */
const VISIBLE_FIXED: OutputId[] = ["fmt:json", "fmt:yaml", "fmt:csv", "type:sql"];
const MENU_FORMATS: OutputId[] = ["fmt:xml", "fmt:toml"];

interface OutputPickerProps {
  selected: OutputId;
  /** The two learned slots (most recent first). */
  learned: OutputId[];
  onSelect: (id: OutputId) => void;
  /** Code generation for a cURL input. */
  curl?: { targets: Array<{ id: string; label: string }>; selected: string | null; onPick: (id: string) => void };
  /** Narrow header: learned chips fold into the menu (they are listed there anyway). */
  compact?: boolean;
  /** Very narrow header: one dropdown that lists every output instead of chips. */
  collapsed?: boolean;
}

/** Output chips plus a "More" menu for everything else. */
export function OutputPicker({ selected, learned, onSelect, curl, compact = false, collapsed = false }: OutputPickerProps) {
  const chips = collapsed ? [] : [...VISIBLE_FIXED, ...(compact ? [] : learned.filter((id) => !VISIBLE_FIXED.includes(id)))];
  const inChips = chips.includes(selected);
  const MENU = collapsed ? [...VISIBLE_FIXED.slice(0, 3), ...MENU_FORMATS] : MENU_FORMATS;

  const item = (id: OutputId, label: string) => (
    <MenuItem key={id} selected={selected === id} onSelect={() => onSelect(id)}>
      {label}
    </MenuItem>
  );

  return (
    <div data-tour="toolbar-menus" className="flex min-w-0 flex-wrap items-center gap-1">
      {chips.map((id) => (
        <Chip key={id} on={selected === id} onClick={() => onSelect(id)}>
          {outputLabel(id)}
        </Chip>
      ))}
      <Menu>
        <MenuTrigger asChild>
          <Chip on={!inChips} iconRight={<ChevronDownIcon />}>
            {inChips && !collapsed ? "More" : outputLabel(selected)}
          </Chip>
        </MenuTrigger>
        <MenuContent>
          <MenuLabel>Formats</MenuLabel>
          {MENU.map((id) => item(id, outputLabel(id)))}
          <MenuSeparator />
          <MenuLabel>Types</MenuLabel>
          {TYPE_LANGUAGES.filter((t) => collapsed || t.id !== "sql").map((t) => item(`type:${t.id}`, t.label))}
          <MenuSeparator />
          <MenuLabel>Schemas and more</MenuLabel>
          {MORE_OPERATIONS.map((o) => item(o.id, o.label))}
          {curl && (
            <>
              <MenuSeparator />
              <MenuLabel>Code from this cURL</MenuLabel>
              {curl.targets.map((t) => (
                <MenuItem key={t.id} selected={curl.selected === t.id} onSelect={() => curl.onPick(t.id)}>
                  {t.label}
                </MenuItem>
              ))}
            </>
          )}
        </MenuContent>
      </Menu>
    </div>
  );
}
