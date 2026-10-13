"use client";

import { useState } from "react";
import { ArrowUturnLeftIcon, PlusIcon } from "@heroicons/react/16/solid";
import { UTIL_TABS } from "@/lib/utils/devtools";
import { GROUPS } from "@/components/utils/readings";
import {
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/kit";
import {
  COMPARE_KIND_LABELS,
  FORMAT_KINDS,
  MORE_OPERATIONS,
  TYPE_LANGUAGES,
  outputLabel,
  type CompareKind,
  type OutputId,
} from "./constants";
import type { TabKind } from "./tabNames";

export type NewTabSpec =
  | { kind: "transform"; output: OutputId }
  | { kind: "compare"; compare: CompareKind }
  | { kind: "utils"; tool: string };

type LastUsed = { transform: OutputId; compare: CompareKind; utils: string };
const LAST_KEY = "formaty-last-used";
const DEFAULT_LAST: LastUsed = { transform: "fmt:json", compare: "list", utils: "uuid" };

export function loadLastUsed(): LastUsed {
  try {
    return { ...DEFAULT_LAST, ...(JSON.parse(localStorage.getItem(LAST_KEY) ?? "{}") as Partial<LastUsed>) };
  } catch {
    return DEFAULT_LAST;
  }
}

export function saveLastUsed(patch: Partial<LastUsed>) {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ ...loadLastUsed(), ...patch }));
  } catch {
    /* storage unavailable */
  }
}

const specFor = (kind: TabKind, last: LastUsed): NewTabSpec =>
  kind === "transform"
    ? { kind, output: last.transform }
    : kind === "compare"
      ? { kind, compare: last.compare }
      : { kind, tool: last.utils };

const lastLabel = (kind: TabKind, last: LastUsed) =>
  kind === "transform"
    ? outputLabel(last.transform)
    : kind === "compare"
      ? COMPARE_KIND_LABELS[last.compare]
      : (UTIL_TABS.find((t) => t.id === last.utils)?.label ?? last.utils);

interface NewTabMenuProps {
  onOpen: (spec: NewTabSpec) => void;
  onReopen: () => void;
  /** Name of the most recently closed tab, or null when there is none. */
  closedName: string | null;
  reopenShortcut?: string;
}

export function NewTabMenu({ onOpen, onReopen, closedName, reopenShortcut }: NewTabMenuProps) {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<LastUsed>(DEFAULT_LAST);

  const pick = (spec: NewTabSpec) => {
    setOpen(false);
    onOpen(spec);
  };
  /** Row click opens the last-used choice at once; hover or ArrowRight lists the rest. */
  const row = (kind: TabKind, title: string, items: React.ReactNode) => (
    <MenuSub>
      <MenuSubTrigger
        hint={lastLabel(kind, last)}
        onClick={(e) => {
          e.preventDefault();
          pick(specFor(kind, last));
        }}
      >
        {title}
      </MenuSubTrigger>
      <MenuSubContent className="max-h-[min(var(--radix-dropdown-menu-content-available-height),420px)]">{items}</MenuSubContent>
    </MenuSub>
  );
  const item = (label: string, spec: NewTabSpec, on: boolean) => (
    <MenuItem key={label} selected={on} onSelect={() => pick(spec)}>
      {label}
    </MenuItem>
  );

  const transformItems = (
    <>
      <MenuLabel>Formats</MenuLabel>
      {FORMAT_KINDS.map((f) => item(outputLabel(`fmt:${f}`), { kind: "transform", output: `fmt:${f}` }, last.transform === `fmt:${f}`))}
      <MenuLabel>Types and SQL</MenuLabel>
      {TYPE_LANGUAGES.map((t) => item(t.label, { kind: "transform", output: `type:${t.id}` }, last.transform === `type:${t.id}`))}
      <MenuLabel>Schemas and more</MenuLabel>
      {MORE_OPERATIONS.map((o) => item(o.label, { kind: "transform", output: o.id }, last.transform === o.id))}
    </>
  );
  const compareItems = (["list", "single", "document"] as const).map((c) =>
    item(COMPARE_KIND_LABELS[c], { kind: "compare", compare: c }, last.compare === c),
  );
  const utilItems = GROUPS.map((g) => (
    <div key={g.name || "auto"} role="presentation">
      {g.name && <MenuLabel>{g.name}</MenuLabel>}
      {g.tools.map((id) => {
        const label = UTIL_TABS.find((t) => t.id === id)?.label ?? id;
        return item(label, { kind: "utils", tool: id }, last.utils === id);
      })}
    </div>
  ));

  return (
    <Menu
      open={open}
      onOpenChange={(o) => {
        if (o) setLast(loadLastUsed());
        setOpen(o);
      }}
    >
      <MenuTrigger asChild>
        <IconButton label="New tab" shortcut="⌥N" data-tour="new-tab">
          <PlusIcon />
        </IconButton>
      </MenuTrigger>
      <MenuContent className="min-w-[260px]">
        {row("transform", "New Transform tab", transformItems)}
        {row("compare", "New Compare tab", compareItems)}
        {row("utils", "New Utils tab", utilItems)}
        <MenuSeparator />
        <MenuItem icon={<ArrowUturnLeftIcon />} disabled={!closedName} hint={closedName ?? undefined} shortcut={reopenShortcut} onSelect={onReopen}>
          Reopen closed tab
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
