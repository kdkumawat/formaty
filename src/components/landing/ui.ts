/**
 * Shared class strings for the marketing pages: an ink stage on top, then canvas, hairlines, type and space.
 * One grid (12 columns, 1200px of content), one spacing scale (8, 16, 24, 40, then the section step).
 */
export const WRAP = "mx-auto w-full max-w-[1280px] px-[clamp(16px,4vw,40px)]";
/** The step between sections. */
export const SPACE = "pt-[clamp(72px,9vw,128px)]";
export const SPACE_B = "pb-[clamp(72px,9vw,128px)]";
/** 12-column grid that collapses to one column below 1024px. A section head splits it 7 and 5. */
export const GRID = "grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-12";
/** The one big thing: 34px at 360 wide, 47 at 768, 55 at 1024, 68 from 1440 up. */
export const H1 = "mk-display text-[clamp(34px,calc(1.4rem+3.2vw),68px)] font-[650] leading-[0.98]";
export const H2 = "mk-display text-[clamp(28px,calc(1.1rem+1.9vw),46px)] font-[650] leading-[1.03]";
export const BODY = "max-w-[34em] text-[16px] leading-[1.6] text-[var(--workspace-text-muted)] sm:text-[17px]";
/** Small label over a column or a pane. Sentence case, never capitals. */
export const LABEL = "font-sans text-[13px] font-medium leading-normal tracking-normal text-[var(--workspace-text-muted)]";
/** Plain text link for section-level pointers to a tool. Never a button. */
export const LINK =
  "inline-flex min-h-11 items-center text-[16px] font-medium text-[var(--workspace-text)] underline decoration-1 underline-offset-[5px] decoration-[color-mix(in_srgb,currentColor_35%,transparent)] transition-[text-decoration-color] duration-[140ms] hover:decoration-current";
/** The same link at the size of a pane footer or a table cell. */
export const LINK_SM =
  "inline-flex min-h-9 items-center text-[14px] font-medium text-[var(--workspace-text)] underline decoration-1 underline-offset-4 decoration-[color-mix(in_srgb,currentColor_35%,transparent)] transition-[text-decoration-color] duration-[140ms] hover:decoration-current pointer-coarse:min-h-11";
/** Hairline that separates a list from what is above it. */
export const RULE = "border-t border-[var(--workspace-border)]";
/** A specimen of the product laid on the page: panel fill, hairline, 14px corners. */
export const PLATE = "mk-plate overflow-hidden rounded-[14px] text-[var(--workspace-text)]";
/** Code inside a specimen: the playground's editor metrics. */
export const CODE = "m-0 overflow-auto px-3 py-2 font-mono text-[13px] leading-[1.6] whitespace-pre text-[var(--workspace-text)]";
