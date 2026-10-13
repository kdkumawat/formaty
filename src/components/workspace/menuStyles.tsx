/* Shared dropdown menu styles - one design everywhere.
   Used by every Dropdown in the workspace, OutputActionBar, and ListComparePanel. */

export const menuItemClass =
  "inline-flex w-full cursor-pointer items-center gap-2 h-7 rounded px-2 text-left text-[13px] font-medium whitespace-nowrap text-[var(--workspace-text)] transition-colors hover:bg-accent focus-visible:bg-accent data-[highlighted]:bg-accent outline-none data-[disabled]:pointer-events-none disabled:opacity-40 data-[disabled]:opacity-40";

export const menuItemActiveClass = "!bg-primary/12 !text-primary hover:!bg-primary/15";

/** Grouped section label inside dropdown menus. */
export function menuSectionLabel(text: string) {
  return (
    <p className="px-2 pb-0.5 pt-1.5 text-xs font-medium text-[var(--workspace-text-muted)]">
      {text}
    </p>
  );
}

/** Hairline between menu groups. */
export const menuSeparator = <div className="my-1 h-px bg-[var(--workspace-border)]" role="separator" />;

/** Checkmark column for selection menus (invisible when unchecked keeps alignment). */
export function menuCheck(on: boolean) {
  return (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center ${
        on ? "text-primary" : "text-transparent"
      }`}
      aria-hidden
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
        <path
          fillRule="evenodd"
          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}
