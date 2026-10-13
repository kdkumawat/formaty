"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowDownTrayIcon,
  ArrowUturnLeftIcon,
  Cog6ToothIcon,
  CommandLineIcon,
  PlusIcon,
  ShareIcon,
  TableCellsIcon,
} from "@heroicons/react/16/solid";
import {
  Button,
  Checkbox,
  Chip,
  CopyButton,
  EmptyState,
  IconButton,
  InputActions,
  Kbd,
  KitPortalProvider,
  KitTooltipProvider,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuCustom,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  NumberField,
  PanelGroup,
  PanelRow,
  PaneHeader,
  ResultActions,
  RowCopy,
  Segmented,
  Select,
  SidePanel,
  StatusText,
  Switch,
  TextField,
  TruncatedText,
  type ButtonVariant,
  type CopyFormat,
  type KitSize,
} from "@/components/kit";
import { CommandPalette, type Command } from "@/components/CommandPalette";
import { Toaster, toast } from "@/components/Toast";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "selected", "danger"];
const SIZES: KitSize[] = ["sm", "md", "lg"];

/** Static look of states that need a pointer or keyboard in real use. */
const FORCED: Record<string, Partial<Record<ButtonVariant, string>> & { all?: string }> = {
  hover: { primary: "brightness-105", secondary: "bg-control-hover", ghost: "bg-control", selected: "brightness-110", danger: "brightness-95" },
  active: { primary: "brightness-90", secondary: "bg-control-hover brightness-90", ghost: "bg-control-hover", selected: "brightness-90", danger: "brightness-90" },
  focus: { all: "ring-2 ring-[var(--focus)] ring-offset-1 ring-offset-[var(--workspace-panel)]" },
};

const FORMATS: CopyFormat[] = [
  { id: "json", label: "JSON", group: "Data" },
  { id: "yaml", label: "YAML", group: "Data" },
  { id: "csv", label: "CSV", group: "Data" },
  { id: "sql", label: "SQL IN list", group: "Lists" },
  { id: "go", label: "Go slice", group: "Lists" },
];

const OPTIONS = [
  { value: "2", label: "2 spaces" },
  { value: "4", label: "4 spaces" },
  { value: "tab", label: "Tab", hint: "\\t" },
];
const GROUPED = [
  { value: "json", label: "JSON", group: "Data" },
  { value: "yaml", label: "YAML", group: "Data" },
  { value: "ts", label: "TypeScript", group: "Types" },
  { value: "go", label: "Go struct", group: "Types" },
];

const COMMANDS: Command[] = [
  ...["JSON", "YAML", "XML", "TOML", "CSV"].map((f) => ({
    id: `fmt-${f}`,
    label: `Convert to ${f}`,
    category: "Transform",
    keywords: [f.toLowerCase(), "convert"],
    icon: <TableCellsIcon />,
    badge: f === "JSON" ? "active" : undefined,
    action: () => toast({ message: `Ran Convert to ${f}`, type: "success" }),
  })),
  { id: "cmp", label: "Compare two lists", category: "Compare", keywords: ["diff"], action: () => {} },
  { id: "tz", label: "Time zones", category: "Utils", keywords: ["instant", "clock"], action: () => {} },
  { id: "tour", label: "Take the tour", category: "Settings", icon: <CommandLineIcon />, shortcut: "⌘/", action: () => {} },
  { id: "off", label: "Disabled action", category: "Actions", disabled: true, action: () => {} },
];

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-[var(--workspace-border)] py-4">
      <h3 className="mb-2 text-[12px] font-medium text-[var(--workspace-text-muted)]">{title}</h3>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </section>
  );
}

function Column({ theme }: { theme: "light" | "dark" }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [indent, setIndent] = useState("2");
  const [fmt, setFmt] = useState("json");
  const [fmtSel, setFmtSel] = useState("yaml");
  const [seg, setSeg] = useState("tree");
  const [seg2, setSeg2] = useState("json");
  const [chip, setChip] = useState(true);
  const [num, setNum] = useState(2);
  const [text, setText] = useState("hello");
  const [on, setOn] = useState(true);
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState("a");
  const [palette, setPalette] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div
      ref={setHost}
      data-theme={theme}
      className="min-w-0 flex-1 bg-[var(--workspace-background)] p-4 text-[var(--workspace-text)]"
      style={{ colorScheme: theme }}
    >
      <KitPortalProvider container={host}>
        <div className="mx-auto max-w-xl rounded-[10px] bg-[var(--workspace-panel)] px-4 pb-2">
          <h2 className="pt-4 text-[14px] font-semibold capitalize">{theme}</h2>

          <Block title="Button variants x states (rest, hover, active, focus, disabled, loading)">
            <div className="w-full space-y-2">
              {VARIANTS.map((v) => (
                <div key={v} className="flex flex-wrap items-center gap-2">
                  <Button variant={v} icon={<PlusIcon />}>Rest</Button>
                  <Button variant={v} className={FORCED.hover[v]}>Hover</Button>
                  <Button variant={v} className={FORCED.active[v]}>Active</Button>
                  <Button variant={v} className={FORCED.focus.all}>Focus</Button>
                  <Button variant={v} disabled>Disabled</Button>
                  <Button variant={v} loading>Loading</Button>
                </div>
              ))}
            </div>
          </Block>
          <Block title="Sizes">
            {SIZES.map((s) => (
              <Button key={s} size={s} variant="secondary" icon={<PlusIcon />} iconRight={<ShareIcon />}>{s}</Button>
            ))}
            <Button asChild variant="ghost"><Link href="/kit">As link</Link></Button>
            <Button variant="primary" loading={loading} onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 1500); }}>Click to load</Button>
          </Block>
          <Block title="Icon buttons (hover for tooltip with shortcut)">
            <IconButton label="Undo" shortcut="⌘Z"><ArrowUturnLeftIcon /></IconButton>
            <IconButton label="Download"><ArrowDownTrayIcon /></IconButton>
            <IconButton label="Settings" variant="secondary"><Cog6ToothIcon /></IconButton>
            <IconButton label="Disabled" disabled><ShareIcon /></IconButton>
            <IconButton label="Medium" size="md"><ShareIcon /></IconButton>
            <IconButton label="Large" size="lg" variant="secondary"><ShareIcon /></IconButton>
          </Block>
          <Block title="Truncated text (tooltip only when cut off)">
            <div className="w-28 text-[13px]"><TruncatedText>a-very-long-file-name-here.json</TruncatedText></div>
            <div className="w-28 text-[13px]"><TruncatedText>short.json</TruncatedText></div>
          </Block>
          <Block title="Menu: items, hint, shortcut, selected, checkbox, radio, label, separator, submenu, custom row">
            <Menu>
              <MenuTrigger asChild><Button>Open menu</Button></MenuTrigger>
              <MenuContent>
                <MenuLabel>Actions</MenuLabel>
                <MenuItem icon={<ShareIcon />} shortcut="⌘S">Share</MenuItem>
                <MenuItem hint="12 KB">Download</MenuItem>
                <MenuItem disabled>Disabled item</MenuItem>
                <MenuItem selected>Selected item</MenuItem>
                <MenuItem selected={false}>Not selected</MenuItem>
                <MenuSeparator />
                <MenuCheckboxItem checked={checked} onCheckedChange={setChecked} onSelect={(e) => e.preventDefault()}>Wrap lines</MenuCheckboxItem>
                <MenuSeparator />
                <MenuRadioGroup value={radio} onValueChange={setRadio}>
                  <MenuRadioItem value="a">Alpha</MenuRadioItem>
                  <MenuRadioItem value="b">Beta</MenuRadioItem>
                </MenuRadioGroup>
                <MenuSeparator />
                <MenuSub>
                  <MenuSubTrigger>More</MenuSubTrigger>
                  <MenuSubContent>
                    <MenuItem>Nested one</MenuItem>
                    <MenuItem>Nested two</MenuItem>
                  </MenuSubContent>
                </MenuSub>
                <MenuSeparator />
                <MenuCustom>
                  <span className="text-[13px]">Indent</span>
                  <NumberField aria-label="Indent in menu" value={num} min={1} max={8} onChange={setNum} className="ml-auto" />
                </MenuCustom>
                <MenuCustom><TextField aria-label="Name" value={text} onChange={(e) => setText(e.target.value)} wrapperClassName="w-full" /></MenuCustom>
              </MenuContent>
            </Menu>
          </Block>
          <Block title="Select (fixed width by longest label; grouped; with label; disabled)">
            <Select aria-label="Indent" label="Indent" options={OPTIONS} value={indent} onChange={setIndent} />
            <Select aria-label="Format" options={GROUPED} value={fmtSel} onChange={setFmtSel} />
            <Select aria-label="Fixed" width={140} options={OPTIONS} value={indent} onChange={setIndent} />
            <Select aria-label="Disabled" disabled options={OPTIONS} value={indent} onChange={setIndent} />
          </Block>
          <Block title="Copy (primary split, primary plain, secondary, count, disabled)">
            <CopyButton getText={(f) => `copied as ${f}`} formats={FORMATS} format={fmt} onFormatChange={setFmt} />
            <CopyButton getText={() => "plain"} />
            <CopyButton getText={() => "x"} variant="secondary" formats={FORMATS} format={fmt} onFormatChange={setFmt} />
            <CopyButton getText={() => "x"} count={42} />
            <CopyButton onCopy={() => { throw new Error("nope"); }} label="Fails" />
            <CopyButton getText={() => "x"} disabled />
          </Block>
          <Block title="Row copy (hover or focus)">
            <div className="w-full">
              {["alice@example.com", "bob@example.com", "carol@example.com"].map((e) => (
                <RowCopy key={e} text={e}>{e}</RowCopy>
              ))}
            </div>
          </Block>
          <Block title="Segmented (brand, neutral, sizes) and Chips">
            <Segmented aria-label="View" options={[{ value: "tree", label: "Tree" }, { value: "table", label: "Table" }, { value: "graph", label: "Graph" }]} value={seg} onChange={setSeg} />
            <Segmented aria-label="Source" tone="neutral" options={[{ value: "json", label: "JSON" }, { value: "yaml", label: "YAML" }]} value={seg2} onChange={setSeg2} />
            <Segmented aria-label="Large" size="lg" options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]} value="a" onChange={() => {}} />
            <Chip on={chip} onClick={() => setChip(!chip)}>Types</Chip>
            <Chip on={false}>SQL</Chip>
            <Chip on={false} disabled>Disabled</Chip>
            <Chip on={false} iconRight={<PlusIcon />}>More</Chip>
          </Block>
          <Block title="Fields: TextField, NumberField, Switch, Checkbox">
            <TextField aria-label="Search" placeholder="Search" value={text} onChange={(e) => setText(e.target.value)} onClear={() => setText("")} icon={<CommandLineIcon />} />
            <TextField aria-label="Disabled" disabled placeholder="Disabled" />
            <NumberField label="Indent" value={num} min={1} max={8} onChange={setNum} />
            <Switch label="Wrap lines" checked={on} onCheckedChange={setOn} />
            <Switch label="Disabled" disabled />
            <Checkbox label="Sort keys" description="Applies on output" checked={checked} onCheckedChange={(c) => setChecked(c === true)} />
            <Checkbox label="Disabled" disabled />
          </Block>
          <Block title="PaneHeader with InputActions / ResultActions">
            <div className="w-full">
              <PaneHeader title="Input" left={<Select aria-label="Format" options={GROUPED} value={fmtSel} onChange={setFmtSel} />} right={<InputActions samples={[{ id: "a", label: "Users" }, { id: "b", label: "Orders" }]} onSample={() => {}} onTidy={() => {}} onClear={() => {}} canClear />} />
              <PaneHeader title="Output" right={<ResultActions options={<Button variant="ghost" iconRight={<PlusIcon />}>Options</Button>} onDownload={() => {}} copy={{ getText: () => "x", formats: FORMATS, format: fmt, onFormatChange: setFmt }}><Segmented aria-label="Tree" options={[{ value: "t", label: "Tree" }, { value: "r", label: "Raw" }]} value="t" onChange={() => {}} /></ResultActions>} />
              <PaneHeader title="Single sample, nothing to clear" right={<InputActions samples={[{ id: "a", label: "Sample" }]} onSample={() => {}} onTidy={() => {}} canTidy={false} onClear={() => {}} canClear={false} />} />
            </div>
          </Block>
          <Block title="SidePanel, PanelGroup, PanelRow">
            <SidePanel
              trigger={<Button icon={<Cog6ToothIcon />}>Settings</Button>}
              title="Settings"
              footer={<Button variant="primary">Done</Button>}
            >
              <PanelGroup title="Editor">
                <PanelRow label="Indent" description="Spaces per level"><NumberField aria-label="Indent" value={num} min={1} max={8} onChange={setNum} /></PanelRow>
                <PanelRow label="Wrap lines"><Switch aria-label="Wrap lines" checked={on} onCheckedChange={setOn} /></PanelRow>
              </PanelGroup>
              <PanelGroup title="Appearance">
                <PanelRow label="Theme"><Segmented aria-label="Theme" options={[{ value: "l", label: "Light" }, { value: "d", label: "Dark" }]} value="l" onChange={() => {}} /></PanelRow>
              </PanelGroup>
            </SidePanel>
          </Block>
          <Block title="Kbd, StatusText, EmptyState">
            <Kbd keys="⌘K" /> <Kbd keys="⌘⇧S" /> <Kbd keys="Esc" />
            <StatusText tone="ok">Valid JSON</StatusText>
            <StatusText tone="bad">Unexpected token at line 3</StatusText>
            <StatusText tone="muted">Idle</StatusText>
            <div className="w-full"><EmptyState title="Nothing here yet" description="Paste data or load a sample to start." action={<Button variant="secondary">Load sample</Button>} /></div>
          </Block>
          <Block title="Toast and Command palette (shared, shown on the page theme)">
            <Button onClick={() => toast({ message: "Copied to clipboard", type: "success" })}>Success</Button>
            <Button onClick={() => toast({ message: "Could not parse the input at line 3", type: "error" })}>Error</Button>
            <Button onClick={() => toast({ message: "Link ready", url: "formaty.dev/#j:abc", action: { label: "Undo", onClick: () => {} } })}>Info + action</Button>
            <Button onClick={() => toast({ message: "A long message that needs two lines because it carries a lot of detail about what just happened in the workspace and why", type: "info", duration: 6000 })}>Long</Button>
            <Button variant="primary" onClick={() => setPalette(true)}>Open palette</Button>
          </Block>
        </div>
      </KitPortalProvider>
      <CommandPalette open={palette} onClose={() => setPalette(false)} commands={COMMANDS} />
    </div>
  );
}

export function KitPreview() {
  return (
    <KitTooltipProvider>
      <main className="flex min-h-dvh flex-col lg:flex-row">
        <Column theme="light" />
        <Column theme="dark" />
      </main>
      <Toaster />
    </KitTooltipProvider>
  );
}
