"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AdjustmentsHorizontalIcon,
  BookOpenIcon,
  CodeBracketIcon,
  EllipsisHorizontalIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  PlayCircleIcon,
  QuestionMarkCircleIcon,
  ShareIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import {
  Button,
  IconButton,
  Kbd,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  SidePanel,
  TruncatedText,
} from "@/components/kit";
import { cn } from "@/lib/utils";
import { InlineRename } from "./InlineRename";
import { NewTabMenu, type NewTabSpec } from "./NewTabMenu";

export interface ChromeTab {
  id: string;
  /** Name shown on the tab (custom or automatic). */
  name: string;
  /** True when the user renamed this tab. */
  custom: boolean;
}

interface HeaderProps {
  tabs: ChromeTab[];
  activeTabId: string;
  onSwitchTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  /** Called with a new, non-empty name. An empty name or Escape leaves the tab as it was. */
  onRenameTab: (id: string, name: string) => void;
  onNewTab: (spec: NewTabSpec) => void;
  onReopenTab: () => void;
  closedTabName: string | null;
  onOpenCommandPalette: () => void;
  onOpenTour: () => void;
  /** Share panel body (opens attached under the Share button). */
  shareContent: ReactNode;
  shareOpen: boolean;
  onShareOpenChange: (open: boolean) => void;
  /** Full workspace settings panel (opens from the gear). */
  settingsContent: ReactNode;
  settingsOpen: boolean;
  onSettingsOpenChange: (open: boolean) => void;
}

function TabButton({
  tab,
  active,
  onSwitch,
  onClose,
  onRename,
}: {
  tab: ChromeTab;
  active: boolean;
  onSwitch: () => void;
  onClose: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (active) document.getElementById(`tab-${tab.id}`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active, tab.id]);

  return (
    <div
      id={`tab-${tab.id}`}
      className={cn(
        "group relative flex h-[30px] min-w-0 max-w-[180px] shrink-0 items-center rounded-t-md text-[13px] font-medium transition-colors max-[900px]:h-9",
        // Renaming keeps the tab's exact size; an inset ring inside its own edge is the only cue.
        editing
          ? "bg-[var(--workspace-panel)] text-[var(--workspace-text)] ring-[1.5px] ring-inset ring-[var(--focus)]"
          : active
          ? "bg-[var(--workspace-panel)] text-[var(--workspace-text)]"
          : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)]/60 hover:text-[var(--workspace-text)]",
      )}
      onMouseDown={(e) => {
        if (e.button === 1) {
          e.preventDefault();
          onClose();
        }
      }}
    >
      {editing ? (
        <div className="grid min-w-0 flex-1 py-1 pl-2.5 pr-1">
          <InlineRename
            initial={tab.name}
            label="Rename tab"
            onDone={(value) => {
              setEditing(false);
              // Empty or unchanged keeps the current name.
              if (value && value !== tab.name) onRename(value);
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          role="tab"
          aria-selected={active}
          onClick={onSwitch}
          onDoubleClick={() => setEditing(true)}
          onKeyDown={(e) => {
            if (e.key === "F2") setEditing(true);
          }}
          className="min-w-0 flex-1 rounded-t-md py-1 pl-2.5 pr-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        >
          <TruncatedText>{tab.name}</TruncatedText>
        </button>
      )}
      {/* Stays in the layout while renaming (just hidden) so the tab keeps its width. */}
      <IconButton
        label="Close tab"
        shortcut="⌥W"
        onClick={onClose}
        className={cn(
          "mr-1 !size-6 min-w-0",
          editing && "invisible",
          !active && "opacity-0 focus-visible:opacity-100 group-hover:opacity-100 max-[900px]:opacity-100",
        )}
      >
        <XMarkIcon />
      </IconButton>
    </div>
  );
}

export function Header(props: HeaderProps) {
  return (
    <header className="flex h-9 shrink-0 items-end gap-1 px-3 max-[900px]:h-11">
      <Link href="/" aria-label="Formaty home" className="mb-1 mr-1 flex h-7 shrink-0 items-center transition-opacity hover:opacity-80">
        <Logo size={20} />
      </Link>

      <div
        role="tablist"
        aria-label="Open tabs"
        data-tour="tab-bar"
        className="flex min-w-0 items-end gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {props.tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            active={tab.id === props.activeTabId}
            onSwitch={() => props.onSwitchTab(tab.id)}
            onClose={() => props.onCloseTab(tab.id)}
            onRename={(name) => props.onRenameTab(tab.id, name)}
          />
        ))}
      </div>
      <div className="mb-px shrink-0">
        <NewTabMenu onOpen={props.onNewTab} onReopen={props.onReopenTab} closedName={props.closedTabName} />
      </div>

      <span className="flex-1" />

      <div className="mb-px flex shrink-0 items-center gap-1">
        {/* Desktop cluster. Below 640px these triggers are hidden and the overflow menu drives the same panels. */}
        <div className="flex items-center gap-1 max-sm:hidden">
          <Button
            variant="secondary"
            data-tour="command-palette"
            aria-label="Search every tool"
            icon={<MagnifyingGlassIcon />}
            className="w-[200px] justify-start max-[1000px]:w-9 max-[1000px]:px-0 max-[1000px]:[&>:not(:first-child)]:hidden"
            onClick={props.onOpenCommandPalette}
          >
            <span className="min-w-0 flex-1 truncate text-left font-normal text-[var(--workspace-text-muted)]">Search every tool</span>
            <Kbd keys="⌘K" />
          </Button>
        </div>
        <SidePanel
          title="Share"
          open={props.shareOpen}
          onOpenChange={props.onShareOpenChange}
          trigger={
            <Button variant="ghost" icon={<ShareIcon />} className="max-sm:hidden">
              Share
            </Button>
          }
        >
          {props.shareContent}
        </SidePanel>

        <div className="max-sm:hidden">
          <Menu>
            <MenuTrigger asChild>
              <IconButton label="Help">
                <QuestionMarkCircleIcon />
              </IconButton>
            </MenuTrigger>
            <MenuContent align="end">
              <HelpItems onOpenTour={props.onOpenTour} />
            </MenuContent>
          </Menu>
        </div>

        <SidePanel
          title="Settings"
          open={props.settingsOpen}
          onOpenChange={props.onSettingsOpenChange}
          trigger={
            <IconButton label="Settings" data-tour="settings-gear" className="max-sm:hidden">
              <AdjustmentsHorizontalIcon />
            </IconButton>
          }
        >
          {props.settingsContent}
        </SidePanel>

        <div className="sm:hidden">
          <Menu>
            <MenuTrigger asChild>
              <IconButton label="More">
                <EllipsisHorizontalIcon />
              </IconButton>
            </MenuTrigger>
            <MenuContent align="end">
              <MenuItem icon={<MagnifyingGlassIcon />} onSelect={props.onOpenCommandPalette}>
                Search every tool
              </MenuItem>
              <MenuItem icon={<ShareIcon />} onSelect={() => props.onShareOpenChange(true)}>
                Share
              </MenuItem>
              <MenuItem icon={<AdjustmentsHorizontalIcon />} onSelect={() => props.onSettingsOpenChange(true)}>
                Settings
              </MenuItem>
              <MenuSeparator />
              <HelpItems onOpenTour={props.onOpenTour} />
            </MenuContent>
          </Menu>
        </div>
      </div>
    </header>
  );
}

function HelpItems({ onOpenTour }: { onOpenTour: () => void }) {
  const router = useRouter();
  return (
    <>
      <MenuItem icon={<KeyIcon />} shortcut="⌘/" onSelect={() => window.dispatchEvent(new Event("formaty:open-shortcuts"))}>
        Keyboard shortcuts
      </MenuItem>
      <MenuItem icon={<PlayCircleIcon />} onSelect={onOpenTour}>
        Take the tour
      </MenuItem>
      <MenuItem icon={<BookOpenIcon />} onSelect={() => router.push("/docs")}>
        Documentation
      </MenuItem>
      <MenuItem icon={<CodeBracketIcon />} onSelect={() => window.open("https://github.com/kdkumawat/formaty", "_blank", "noopener,noreferrer")}>
        GitHub
      </MenuItem>
    </>
  );
}
