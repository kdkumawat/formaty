import Link from "next/link";
import { KeyLink } from "./KeyLink";
import { SiteHeader } from "./SiteHeader";
import { LINK, WRAP } from "./ui";

export const PROSE = "max-w-[70ch] text-[16px] leading-[1.65] text-[var(--workspace-text)] sm:text-[17px]";
export const H2_SM = "mk-display text-[clamp(21px,calc(1rem+0.6vw),26px)] font-[650] leading-[1.1]";

export type Crumb = { label: string; href?: string };

/**
 * The top of a page, on the canvas: `children` (breadcrumb, title, intro) and, below them, an optional `window`
 * (the live tool of a tool page). Named by the page title when it stands outside <main>.
 */
export function Stage({ children, window, labelledBy }: { children: React.ReactNode; window?: React.ReactNode; labelledBy?: string }) {
  const Tag = labelledBy ? "section" : "div";
  return (
    <Tag aria-labelledby={labelledBy}>
      {children}
      {window && <div className={WRAP}>{window}</div>}
    </Tag>
  );
}

/**
 * Site header and a short title block: breadcrumb, h1, one sentence and an optional amber action.
 * A page whose main content starts on the stage (a tool page: the tool is the window) renders the header itself
 * and puts this inside its <main> with `header={false}`.
 */
export function PageHero({
  crumbs,
  title,
  intro,
  action,
  small = false,
  tight = false,
  header = true,
  window,
  children,
}: {
  crumbs?: Crumb[];
  title: string;
  intro?: string;
  /** Amber primary action. */
  action?: { href: string; label: string };
  small?: boolean;
  /** Compact hero for pages where a tool follows straight away. */
  tight?: boolean;
  /** False when the page renders <SiteHeader> itself, above its <main>. */
  header?: boolean;
  /** The live tool, under the title. */
  window?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const pad = tight
    ? "gap-2.5 pb-6 pt-[clamp(16px,2.5vw,32px)]"
    : `gap-4 pt-[clamp(24px,4vw,56px)] ${window ? "pb-8" : small ? "pb-[clamp(32px,4vw,56px)]" : "pb-[clamp(40px,5vw,72px)]"}`;
  return (
    <>
      {header && <SiteHeader />}
      <Stage window={window} labelledBy={header ? "page-title" : undefined}>
        <div className={`${WRAP} flex flex-col ${pad}`}>
          {crumbs && (
            <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 text-[13px] text-[var(--workspace-text-muted)]">
              {crumbs.map((c, i) => (
                <span key={c.label} className="inline-flex items-center gap-2">
                  {i > 0 && <span aria-hidden>/</span>}
                  {c.href ? (
                    <Link href={c.href} className="inline-flex min-h-8 items-center underline-offset-4 transition-colors duration-150 hover:text-[var(--workspace-text)] hover:underline pointer-coarse:min-h-11">{c.label}</Link>
                  ) : (
                    <span aria-current="page" className="inline-flex min-h-8 items-center text-[var(--workspace-text)] pointer-coarse:min-h-11">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1
            id="page-title"
            className={`mk-display font-[700] ${
              tight
                ? "max-w-[28ch] text-[clamp(26px,calc(1rem+1.2vw),36px)] leading-[1.08]"
                : small
                ? "max-w-[24ch] text-[clamp(28px,calc(1.1rem+1.8vw),44px)] leading-[1.04]"
                : "max-w-[20ch] text-[clamp(32px,calc(1.2rem+2.4vw),52px)] leading-[1.05]"
            }`}
          >
            {title}
          </h1>
          {intro && (
            <p className={`max-w-[44em] text-[16px] leading-[1.55] text-[var(--workspace-text-muted)] ${tight ? "line-clamp-2" : "sm:text-[17px]"}`}>
              {intro}
            </p>
          )}
          {action && (
            <div className="pt-2">
              <KeyLink href={action.href}>{action.label}</KeyLink>
            </div>
          )}
          {children}
        </div>
      </Stage>
    </>
  );
}

export type RowItem = { href: string; title: string; desc?: string };

/** Hairline-separated rows: title left, one line right, the whole row is the link. */
export function RowList({ items }: { items: RowItem[] }) {
  return (
    <ul className="border-t border-[var(--workspace-border)]">
      {items.map((it) => (
        <li key={it.href} className="border-b border-[var(--workspace-border)]">
          <Link href={it.href} className="group grid gap-x-8 gap-y-1 py-3.5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <span className="text-[16px] font-medium text-[var(--workspace-text)] underline decoration-transparent decoration-1 underline-offset-[5px] transition-[text-decoration-color] duration-150 group-hover:decoration-current">
              {it.title}
            </span>
            {it.desc && <span className="line-clamp-2 text-[15px] text-[var(--workspace-text-muted)]">{it.desc}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Grouped lists under plain display headings. */
export function GroupedRows({ groups }: { groups: { title: string; blurb?: string; items: RowItem[] }[] }) {
  return (
    <div className={`${WRAP} flex flex-col gap-[clamp(40px,6vw,72px)] py-[clamp(40px,6vw,80px)]`}>
      {groups.map((g) => (
        <section key={g.title} className="grid gap-x-8 gap-y-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className={H2_SM}>{g.title}</h2>
            {g.blurb && <p className="mt-3 max-w-[28em] text-[16px] text-[var(--workspace-text-muted)]">{g.blurb}</p>}
          </div>
          <div className="min-w-0 lg:col-span-8">
            <RowList items={g.items} />
          </div>
        </section>
      ))}
    </div>
  );
}

/** Native details list: no boxes, the whole row opens it. */
export function FaqList({ items, openFirst = false }: { items: { q: string; a: string }[]; openFirst?: boolean }) {
  return (
    <div className="border-t border-[var(--workspace-border)]">
      {items.map((f, i) => (
        <details key={f.q} open={openFirst && i === 0} className="group border-b border-[var(--workspace-border)]">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-2 text-[16px] font-medium text-[var(--workspace-text)] [&::-webkit-details-marker]:hidden">
            {f.q}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden className="flex-none text-[var(--workspace-text-muted)] transition-transform duration-150 group-open:rotate-45">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </summary>
          <p className="max-w-[60ch] pb-5 text-[16px] leading-[1.6] text-[var(--workspace-text-muted)]">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/** Short band pointing at the privacy section of the home page. */
export function PrivacyBand() {
  return (
    <section className="border-y border-[var(--workspace-border)]">
      <div className={`${WRAP} flex flex-wrap items-center justify-between gap-x-10 gap-y-2 py-7`}>
        <p className={H2_SM}>What you paste stays in this tab.</p>
        <Link href="/#privacy" className={LINK}>
          How the privacy works
        </Link>
      </div>
    </section>
  );
}
