"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeftEndOnRectangleIcon,
  BarsArrowDownIcon,
  CubeTransparentIcon,
  ChevronLeftIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  FunnelIcon,
  ListBulletIcon,
  PaperAirplaneIcon,
  TableCellsIcon,
} from "@heroicons/react/16/solid";
import type { InputFormatKind } from "@/lib/formats";
import {
  Button,
  EmptyState,
  IconButton,
  InputActions,
  Kbd,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuCustom,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
  PaneHeader,
  ResultActions,
  Segmented,
  Select,
  StatusText,
  TextField,
  Tooltip,
  type CopyButtonProps,
  type SampleOption,
} from "@/components/kit";
import { cn } from "@/lib/utils";
import type { OutputId } from "./constants";
import { OutputPicker } from "./OutputPicker";

/** Formats are named by a mono glyph, never a colour. */
export const FORMAT_GLYPH: Record<InputFormatKind, string> = { json: "{}", xml: "<>", yaml: ":-", toml: "[]", csv: ",,", curl: "$_" };

const READ_AS: Array<[InputFormatKind, string]> = [
  ["json", "JSON"],
  ["xml", "XML"],
  ["yaml", "YAML"],
  ["toml", "TOML"],
  ["csv", "CSV"],
  ["curl", "cURL"],
];

/** Sample ids: `fmt:<format>`, `fmt:curl` or `ex:<example id>`. */
export const INPUT_SAMPLES: Array<SampleOption & { description: string }> = [
  { id: "fmt:json", label: "JSON", group: "Formats", description: "Nested object with arrays and null" },
  { id: "fmt:xml", label: "XML", group: "Formats", description: "Attributes and repeated elements" },
  { id: "fmt:yaml", label: "YAML", group: "Formats", description: "Mapping with lists" },
  { id: "fmt:toml", label: "TOML", group: "Formats", description: "Table with typed values" },
  { id: "fmt:csv", label: "CSV", group: "Formats", description: "Rows with a quoted field" },
  { id: "fmt:curl", label: "cURL", group: "Formats", description: "A request you can run and turn into code" },
  { id: "ex:github", label: "GitHub API response", group: "Real examples", description: "Repository with owner and license" },
  { id: "ex:stripe", label: "Stripe webhook", group: "Real examples", description: "Event with a nested payment intent" },
  { id: "ex:k8s", label: "Kubernetes manifest", group: "Real examples", description: "Deployment with containers and ports" },
  { id: "ex:openapi", label: "OpenAPI schema", group: "Real examples", description: "Two endpoints with responses" },
];

interface InputHeaderProps {
  /** Format the input is read as right now, e.g. "JSON". */
  formatLabel: string;
  /** The same format as an id, for its glyph. */
  detected?: InputFormatKind;
  hasInput: boolean;
  onClear: () => void;
  override: InputFormatKind | null;
  onOverride: (v: InputFormatKind | null) => void;
  wrap: boolean;
  onWrap: (v: boolean) => void;
  onSample: (id: string) => void;
  onTidy: () => void;
  canTidy: boolean;
  /** Unused here: sending a cURL request lives in CurlSendStrip under the editor, so the header never changes. */
  isCurl?: boolean;
  onRunCurl?: () => void;
  /** Collapse the input pane so the output gets the full width. */
  onCollapse?: () => void;
}

/**
 * One 36px row at every pane width. Controls drop out by container width, least important first:
 * the "Read as" prefix, the wrap toggle (Settings and ⌥Z still reach it), the title, then Hide input (⌥M still reaches it).
 * Nothing wraps: the actions sit in their own non-wrapping block instead of the kit's wrapping right slot.
 */
export function InputHeader(p: InputHeaderProps) {
  const options = [
    { value: "auto", label: `${FORMAT_GLYPH[p.detected ?? READ_AS.find(([, l]) => l === p.formatLabel)?.[0] ?? "json"]} ${p.formatLabel}` },
    ...READ_AS.map(([value, label]) => ({ value, label: `${FORMAT_GLYPH[value]} ${label}` })),
  ];
  const forced = p.override !== null;
  return (
    <PaneHeader
      className="@container flex-nowrap"
      left={
        <>
          <h2 className="shrink-0 text-[14px] font-semibold text-[var(--workspace-text)] @max-[290px]:hidden">Input</h2>
          <Select
            label={forced ? "Read as" : "auto-detected"}
            aria-label="Read input as"
            options={options}
            value={p.override ?? "auto"}
            onChange={(v) => p.onOverride(v === "auto" ? null : (v as InputFormatKind))}
            // A forced format is filled ink (selected), so it never passes for Auto.
            variant={forced ? "selected" : "secondary"}
            className={cn("font-mono text-[11.5px] @max-[380px]:[&>span:first-child]:hidden [&>span:first-child]:font-sans", forced && "[&>span:first-child]:!text-current [&>span:first-child]:opacity-70")}
          />
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <IconButton
              label="Wrap long lines"
              shortcut="⌥Z"
              variant={p.wrap ? "selected" : "ghost"}
              aria-pressed={p.wrap}
              className="@max-[330px]:hidden"
              onClick={() => p.onWrap(!p.wrap)}
            >
              <BarsArrowDownIcon />
            </IconButton>
            <InputActions samples={INPUT_SAMPLES} onSample={p.onSample} onTidy={p.onTidy} canTidy={p.canTidy} onClear={p.onClear} canClear={p.hasInput} />
            {p.onCollapse && (
              <IconButton label="Hide input" shortcut="⌥M" className="@max-[250px]:hidden" onClick={p.onCollapse}>
                <ChevronLeftIcon />
              </IconButton>
            )}
          </div>
        </>
      }
    />
  );
}

/**
 * Where a cURL input is sent from. It sits under the editor, next to where the command is, so it is always
 * visible and cannot make the header wrap. The result status stays above the response.
 */
export function CurlSendStrip({ onSend, sending, disabled, sent }: { onSend: () => void; sending: boolean; disabled: boolean; sent: boolean }) {
  return (
    <div className="@container flex h-9 shrink-0 items-center gap-2 border-t border-[var(--workspace-border)] px-3">
      <Button variant="secondary" icon={<PaperAirplaneIcon />} loading={sending} disabled={disabled} onClick={onSend}>
        Send request
      </Button>
      <Kbd keys="⌘↵" className="@max-[260px]:hidden" />
      <span className="min-w-0 truncate text-[12px] text-[var(--workspace-text-muted)] @max-[300px]:hidden">
        {sending ? "Sending" : sent ? "Response shown on the right" : "Not sent yet"}
      </span>
    </div>
  );
}

/** Shown over an empty input editor: the drop prompt, then the sample list. */
export function EmptyInput({ onChooseFile, onSample }: { onChooseFile: () => void; onSample: (id: string) => void }) {
  const groups = ["Formats", "Real examples"];
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-y-auto bg-[var(--workspace-panel)] px-3 pb-3">
      <div className="mx-auto max-w-md">
        <EmptyState
          title="Paste here, or drop a file."
          description="JSON, XML, YAML, TOML, CSV and cURL are recognised for you."
          action={
            <Button variant="secondary" className="pointer-events-auto" onClick={onChooseFile}>
              Choose a file
            </Button>
          }
        />
        <div className="pointer-events-auto flex flex-col gap-2">
          {groups.map((g) => (
            <section key={g}>
              <h3 className="px-2 pb-1 text-[12px] font-medium text-[var(--workspace-text-muted)]">{g}</h3>
              {INPUT_SAMPLES.filter((s) => s.group === g).map((s) => (
                <Button key={s.id} variant="ghost" className="w-full justify-start" onClick={() => onSample(s.id)}>
                  <span className="shrink-0">{s.label}</span>
                  <span className="min-w-0 truncate text-[12px] font-normal text-[var(--workspace-text-muted)]">{s.description}</span>
                </Button>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Message strip under the input editor: what happened, then the ways out as buttons. */
export function InputErrorStrip({
  message,
  line,
  onGoToLine,
  actions,
}: {
  message: string;
  line: number | null;
  onGoToLine: (l: number) => void;
  /** Extra ways out, e.g. "Read as JSON" and "Back to Auto". */
  actions?: Array<{ label: string; onClick: () => void }>;
}) {
  return (
    <div role="alert" className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--workspace-border)] bg-bad-bg px-3 py-1.5 text-[13px] text-bad">
      <span className="min-w-0 flex-1 basis-48 break-words">
        {message}
        {line && !/\bline \d+/i.test(message) ? ` (line ${line})` : ""}
      </span>
      <span className="flex flex-wrap items-center gap-1">
        {actions?.map((a, i) => (
          <Button key={a.label} variant={i === 0 ? "secondary" : "ghost"} onClick={a.onClick}>
            {a.label}
          </Button>
        ))}
        {line ? (
          <Button variant="ghost" onClick={() => onGoToLine(line)}>
            Go to line {line}
          </Button>
        ) : null}
      </span>
    </div>
  );
}

type View = "raw" | "tree" | "graph" | "query" | "table";

interface OutputHeaderProps {
  selected: OutputId;
  learned: OutputId[];
  onSelect: (id: OutputId) => void;
  curl?: React.ComponentProps<typeof OutputPicker>["curl"];
  busy: boolean;
  /** Last valid result is shown because the input is currently invalid. */
  stale: boolean;
  view: View;
  onView: (v: View) => void;
  canVisualize: boolean;
  isData: boolean;
  isJson: boolean;
  sortKeys: boolean;
  onSortKeys: (v: boolean) => void;
  indent: number;
  onIndent: (n: number) => void;
  quoteStyle: "double" | "single";
  onQuoteStyle: (q: "double" | "single") => void;
  removeEmpty: boolean;
  onRemoveEmpty: (v: boolean) => void;
  isSql: boolean;
  sqlTable: string;
  onSqlTable: (v: string) => void;
  sqlDialect: string;
  onSqlDialect: (d: "sqlite" | "postgres" | "mysql") => void;
  isType: boolean;
  typeName: string;
  onTypeName: (v: string) => void;
  /** Puts these options back to their defaults. */
  onResetOptions: () => void;
  canMoveToInput: boolean;
  onMoveToInput: () => void;
  canDownload: boolean;
  onDownload: () => void;
  copy: CopyButtonProps;
}

/** Icon-only until chosen: the selected segment shows its label, the others keep it for screen readers and the tooltip. */
const VIEWS: Array<{ value: View; text: string; icon: ReactNode }> = [
  { value: "raw", text: "Text", icon: <DocumentTextIcon /> },
  { value: "tree", text: "Tree", icon: <ListBulletIcon /> },
  { value: "graph", text: "Graph", icon: <CubeTransparentIcon /> },
  { value: "query", text: "Query", icon: <FunnelIcon /> },
  { value: "table", text: "Table", icon: <TableCellsIcon /> },
];

const keepOpen = (e: Event) => e.preventDefault();

export function OutputHeader(p: OutputHeaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);
  // The status sentence only fits beside the chips and actions in a wide pane; otherwise it is a dot with a tooltip.
  const [roomy, setRoomy] = useState(false);
  // Under ~640px the chips and the view control each fold into one dropdown, so the header stays on one row.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setCompact(entry.contentRect.width < 860);
      setRoomy(entry.contentRect.width >= 1180);
      setNarrow(entry.contentRect.width < 640);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hasOptions = p.isData || p.isSql || p.isType;
  const statusText = p.busy ? "Working" : p.stale ? "Showing the last valid result" : null;
  // Narrow pane: a dot with a tooltip, so the status never pushes the header onto a second row.
  const status: ReactNode = !statusText ? null : !roomy ? (
    <Tooltip content={statusText}>
      <span role="status" aria-label={statusText} className="inline-flex">
        <StatusText tone="muted">{null}</StatusText>
      </span>
    </Tooltip>
  ) : (
    <StatusText tone="muted">{statusText}</StatusText>
  );

  const optionsMenu = hasOptions || (narrow && p.canMoveToInput) ? (
    <Menu>
      <MenuTrigger asChild>
        <IconButton label="Options">
          <Cog6ToothIcon />
        </IconButton>
      </MenuTrigger>
      <MenuContent align="end" className="w-60">
        <MenuLabel>Options</MenuLabel>
        {p.isData && (
          <>
            <MenuCheckboxItem checked={p.sortKeys} onCheckedChange={p.onSortKeys} onSelect={keepOpen}>
              Sort keys
            </MenuCheckboxItem>
            <MenuCheckboxItem checked={p.removeEmpty} onCheckedChange={p.onRemoveEmpty} onSelect={keepOpen}>
              Drop empty values
            </MenuCheckboxItem>
          </>
        )}
        {p.isJson && (
          <>
            <MenuSeparator />
            <MenuLabel>Indent</MenuLabel>
            <MenuRadioGroup value={String(p.indent)} onValueChange={(v) => p.onIndent(Number(v))}>
              <MenuRadioItem value="2" onSelect={keepOpen}>2 spaces</MenuRadioItem>
              <MenuRadioItem value="4" onSelect={keepOpen}>4 spaces</MenuRadioItem>
              <MenuRadioItem value="0" onSelect={keepOpen}>None</MenuRadioItem>
            </MenuRadioGroup>
          </>
        )}
        {p.isData && (
          <>
            <MenuSeparator />
            <MenuLabel>Quotes</MenuLabel>
            <MenuRadioGroup value={p.quoteStyle} onValueChange={(v) => p.onQuoteStyle(v as "double" | "single")}>
              <MenuRadioItem value="double" onSelect={keepOpen}>Double</MenuRadioItem>
              <MenuRadioItem value="single" onSelect={keepOpen}>Single</MenuRadioItem>
            </MenuRadioGroup>
          </>
        )}
        {p.isSql && (
          <>
            <MenuLabel>Table name</MenuLabel>
            <MenuCustom>
              <TextField aria-label="SQL table name" placeholder="Automatic" value={p.sqlTable} wrapperClassName="w-full" onChange={(e) => p.onSqlTable(e.target.value)} />
            </MenuCustom>
          </>
        )}
        {p.isType && (
          <>
            <MenuLabel>Type name</MenuLabel>
            <MenuCustom>
              <TextField aria-label="Type name" placeholder="JsonData" value={p.typeName} wrapperClassName="w-full" onChange={(e) => p.onTypeName(e.target.value)} />
            </MenuCustom>
          </>
        )}
        <MenuSeparator />
        {narrow && p.canMoveToInput && <MenuItem onSelect={p.onMoveToInput}>Move to input</MenuItem>}
        {hasOptions && <MenuItem onSelect={p.onResetOptions}>Reset</MenuItem>}
      </MenuContent>
    </Menu>
  ) : null;

  return (
    <div ref={rootRef}>
      <PaneHeader
        className={narrow ? "flex-nowrap [&>div:last-child]:flex-nowrap" : undefined}
        left={
          <>
            <OutputPicker selected={p.selected} learned={p.learned} onSelect={p.onSelect} curl={p.curl} compact={compact} collapsed={narrow} />
            {p.isSql && (
              <Select
                aria-label="SQL dialect"
                options={[
                  { value: "postgres", label: "PostgreSQL" },
                  { value: "mysql", label: "MySQL" },
                  { value: "sqlite", label: "SQLite" },
                ]}
                value={p.sqlDialect}
                onChange={(v) => p.onSqlDialect(v as "sqlite" | "postgres" | "mysql")}
              />
            )}
            {status}
          </>
        }
        right={
          <ResultActions
            onDownload={p.onDownload}
            canDownload={p.canDownload}
            copy={p.copy}
            options={
              <>
                {optionsMenu}
                {p.canMoveToInput && !narrow && (
                  <IconButton label="Move to input" onClick={p.onMoveToInput}>
                    <ArrowLeftEndOnRectangleIcon />
                  </IconButton>
                )}
              </>
            }
          >
            {p.isData && narrow && (
              <span data-tour="view-switcher" className="shrink-0">
                <Select
                  aria-label="Output view"
                  className="shrink-0"
                  options={VIEWS.map((v) => ({ value: v.value, label: v.text, disabled: v.value !== "raw" && !p.canVisualize }))}
                  value={p.view}
                  onChange={(v) => p.onView(v as View)}
                />
              </span>
            )}
            {p.isData && !narrow && (
              <span data-tour="view-switcher">
                <Segmented aria-label="Output view" value={p.view} onChange={p.onView} options={VIEWS.map((v) => ({
                    value: v.value,
                    icon: v.icon,
                    label: v.value === p.view ? v.text : <span className="sr-only">{v.text}</span>,
                    "aria-label": v.text,
                    disabled: v.value !== "raw" && !p.canVisualize,
                  }))} />
              </span>
            )}
          </ResultActions>
        }
      />
    </div>
  );
}
