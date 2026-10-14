import Link from "next/link";
import { Button } from "@/components/kit";
import { Logo } from "@/components/Logo";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";
import { WRAP } from "./ui";

const NAV =
  "inline-flex h-9 items-center rounded-md px-2.5 text-[14px] font-medium text-[var(--workspace-text-muted)] transition-colors duration-[120ms] hover:text-[var(--workspace-text)] pointer-coarse:h-11";
const ITEM =
  "flex min-h-14 items-center border-b border-[var(--workspace-border)] font-display text-[22px] font-semibold tracking-[-0.02em] text-[var(--workspace-text)]";
const ICON =
  "inline-flex size-11 items-center justify-center rounded-md text-[var(--workspace-text-muted)] transition-colors duration-[120ms] hover:bg-control hover:text-[var(--workspace-text)]";
const GITHUB = "https://github.com/kdkumawat/formaty";
/** Header-size secondary button: the amber key belongs to the page, not the bar. */
const OPEN = "rounded-md px-3.5 text-[14px] font-semibold pointer-coarse:h-11";

const brand = (
  <Link href="/" aria-label="Formaty home" className="inline-flex h-11 items-center rounded-md">
    <Logo size={24} wordmark />
  </Link>
);

const GithubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  </svg>
);

/**
 * The site header: brand, the five places, GitHub, the theme switch and a secondary "Open playground".
 */
export function SiteHeader() {
  return (
    <header className="mk-header sticky top-0 z-40 border-b border-[var(--workspace-border)]">
      <div className={`${WRAP} flex h-[var(--mk-header)] items-center gap-x-4`}>
        {brand}
        <nav aria-label="Primary" className="ml-4 flex items-center gap-x-0.5 max-md:hidden">
          <Link href="/tools" className={NAV}>Tools</Link>
          <Link href="/utils" className={NAV}>Utilities</Link>
          <Link href="/guides" className={NAV}>Guides</Link>
          <Link href="/docs" className={NAV}>Docs</Link>
          <Link href="/changelog" className={NAV}>Changelog</Link>
        </nav>
        <div className="ml-auto flex items-center gap-x-1">
          <a href={GITHUB} aria-label="Formaty on GitHub" className={`${ICON} max-md:hidden`}>
            <GithubIcon />
          </a>
          <span className="max-md:hidden">
            <ThemeToggle />
          </span>
          <Button asChild variant="secondary" size="md" className={`${OPEN} md:ml-2`}>
            <Link href="/playground">
              <span className="max-md:hidden">Open playground</span>
              <span className="md:hidden">Playground</span>
            </Link>
          </Button>
          <MobileMenu
            brand={brand}
            action={
              <Button asChild variant="secondary" size="md" className={OPEN}>
                <Link href="/playground">Playground</Link>
              </Button>
            }
          >
            <Link href="/tools" className={ITEM}>Tools</Link>
            <Link href="/utils" className={ITEM}>Utilities</Link>
            <Link href="/guides" className={ITEM}>Guides</Link>
            <Link href="/docs" className={ITEM}>Docs</Link>
            <Link href="/changelog" className={ITEM}>Changelog</Link>
            <a href={GITHUB} className={ITEM}>GitHub</a>
            <div className="-mx-3 pt-2">
              <ThemeToggle withLabel />
            </div>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
