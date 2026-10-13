# Formaty UI kit

Import everything from `@/components/kit`. Icons: `@heroicons/react/16/solid`, passed as elements (`icon={<ArrowDownTrayIcon />}`). Preview every component and state at `/kit`. Mount `<KitTooltipProvider>` once at the app root (and `<Toaster />` from `@/components/Toast`).

Sizes everywhere: `sm` (default) is 28px on desktop and 36px below 900px, `md` 36px, `lg` 44px.

## Buttons
- `Button` `variant: primary | secondary | ghost | selected | danger`, `size`, `icon`, `iconRight`, `loading`, `asChild`. `<Button variant="primary" icon={<PlusIcon />}>New</Button>`. Links: `<Button asChild><a href="/x">Docs</a></Button>`.
- `IconButton` `label` (required: aria-label and tooltip), `shortcut?` (Mac notation), `variant` (default ghost), `size`, `loading`. `<IconButton label="Undo" shortcut="⌘Z"><ArrowUturnLeftIcon /></IconButton>`.
- `Chip` `on`, plus Button props (`icon`, `iconRight`). Toggle chip. `<Chip on={sel} onClick={toggle}>TypeScript</Chip>`.
- `Segmented<T>` `options: {value,label,icon?,disabled?,aria-label?}[]`, `value`, `onChange`, `tone: brand | neutral`, `size`, `aria-label`. `<Segmented options={o} value={v} onChange={setV} aria-label="View" />`.

## Tooltip
- `KitTooltipProvider` mount once. 400ms delay, instant between neighbours.
- `Tooltip` `content`, `shortcut?`, `side?`, `align?`, `disabled?`, one element child. `<Tooltip content="Share"><Button>..</Button></Tooltip>`.
- `TruncatedText` single-line text, tooltip only when actually cut off. `<TruncatedText>{filename}</TruncatedText>` (give the parent a width).

## Menus (Radix DropdownMenu)
- `Menu` (`open`, `onOpenChange`), `MenuTrigger asChild`, `MenuContent` (`align`, `side`; min 180px, scrolls).
- `MenuItem` `icon`, `hint`, `shortcut`, `selected` (check right, semibold; pass `false` on siblings), `onSelect`, `disabled`, `asChild`. `<MenuItem icon={<ClipboardIcon />} shortcut="⌘C" onSelect={copy}>Copy</MenuItem>`.
- `MenuCheckboxItem` `checked`, `onCheckedChange`. Add `onSelect={(e) => e.preventDefault()}` to keep the menu open.
- `MenuRadioGroup` `value`, `onValueChange` with `MenuRadioItem` `value`. Current one is checked.
- `MenuLabel` 12px muted group name. `MenuSeparator` hairline.
- `MenuSub`, `MenuSubTrigger`, `MenuSubContent`: submenu opening right on hover or ArrowRight.
- `MenuCustom` embeds a form row (field, stepper, segmented) without the menu stealing keys or closing. `<MenuCustom><NumberField .../></MenuCustom>`.

## Select
- `Select<T>` `options: {value,label,hint?,group?}[]`, `value`, `onChange`, `label?` (muted prefix), `width?` (fixed; otherwise sized to the longest label, up to 40 options), `variant`, `size`, `disabled`, `aria-label`. `<Select label="Indent" options={o} value={v} onChange={setV} />`. For long lists (time zones) pass `width`.

## Copy
- `CopyButton` `getText(format?)` or `onCopy(format?)`, `formats?: {id,label,group?,hint?,overflow?}[]` (`hint` is a muted example at the row end, `overflow` moves a format under a "More" submenu), `format`, `onFormatChange`, `count?`, `countDigits?` (reserve width so the count never resizes the button), `label?`, `variant: primary | secondary`, `size`, `disabled`. Split button with a "Copy as" menu when `formats` is set; shows "Copied" for 1.5s without resizing; "Copy failed" plus an error toast on failure. `<CopyButton getText={(f) => render(f)} formats={fmts} format={fmt} onFormatChange={setFmt} />`.
- `RowCopy` `text` (string or fn), `onCopy?`, children. Whole list row is the button. `<RowCopy text={item}>{item}</RowCopy>`.

## Fields
- `TextField` input props plus `size`, `icon`, `onClear`. `<TextField aria-label="Filter" icon={<MagnifyingGlassIcon />} value={q} onChange={..} onClear={() => setQ("")} />`.
- `NumberField` `value`, `onChange`, `min`, `max`, `step`, `label?`, `aria-label?`. `<NumberField label="Indent" value={2} min={1} max={8} onChange={set} />`.
- `Switch` and `Checkbox` Radix props plus `label`, `description`. With `label` the whole row is clickable. `<Switch label="Wrap lines" checked={on} onCheckedChange={set} />`.

## Layout
- `PaneHeader` `title?`, `left?`, `right?`: the 36px pane header; right slot wraps to its own row when tight. `<PaneHeader title="Input" right={<InputActions .../>} />`.
- `InputActions` `samples?`, `onSample(id)`, `onTidy?`, `canTidy?`, `onClear?`, `canClear?`: renders Sample, Tidy, Clear in that order as icon-only buttons, tooltip as label (Sample opens a menu when there are several). Drop it into `PaneHeader right`.
- `ResultActions` `children` (tool switches), `options` (node, e.g. an Options Menu), `onDownload?`, `canDownload?`, `copy?: CopyButtonProps`: renders switches, Options, Download, Copy in that order.
- `SidePanel` `trigger` (an IconButton or Button element), `title`, `footer?`, `open?`, `onOpenChange?`: 340px popover under the trigger, full-width sheet below 640px. Inside use `PanelGroup` (`title`) and `PanelRow` (`label`, `description?`, control as children).
- `EmptyState` `title`, `description?`, `icon?`, `action?`. `StatusText` `tone: ok | bad | muted`.
- `Kbd` `keys` in Mac notation (`⌘K`); shows `Ctrl+K` on Windows and Linux, hydration-safe.

## Other
- `KitPortalProvider` `container`: renders kit popups inside an element (the /kit page uses it per theme column). Normally unused.
- `fuzzyMatch(query, text)` returns `{score, indices} | null`; powers the command palette.
- `Toast` (`toast({message,type,url,duration,action})`, `<Toaster />`) and `CommandPalette` live in `src/components/` with unchanged APIs.

Rules: never use the native `title` attribute (use `IconButton`/`Tooltip`); never style a raw `<button>` as a control; no native `<select>`.
