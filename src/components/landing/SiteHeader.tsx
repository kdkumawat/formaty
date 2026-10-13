import Link from "next/link";
import { Button } from "@/components/kit";
import { Logo } from "@/components/Logo";
import { HeaderShell } from "./HeaderShell";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

const NAV =
  "inline-flex h-9 items-center rounded-md px-2.5 text-[14px] font-medium text-[var(--workspace-text-muted)] transition-colors duration-[140ms] hover:text-[var(--workspace-text)] pointer-coarse:h-11";
const ITEM =
  "flex min-h-14 items-center border-b border-[var(--workspace-border)] font-display text-[22px] font-semibold tracking-[-0.02em] text-[var(--workspace-text)]";
/** The kit's primary key at header size. `.mk-play` lets the bar turn it into plain text while a page key is on screen. */
const KEY = "mk-play rounded-lg px-3.5 text-[14px] font-semibold pointer-coarse:h-11";
const GITHUB = "https://github.com/kdkumawat/formaty";

const brand = (
  <Link
    href="/"
    aria-label="Formaty home"
    className="inline-flex h-11 items-center gap-2.5 rounded-md font-display text-[21px] font-[650] tracking-[-0.035em] text-[var(--workspace-text)]"
  >
    <Logo size={26} />
    formaty
  </Link>
);

/**
 * The site header: on ink wherever ink is under it, otherwise a slim bar in the page theme.
 * The playground link is the amber key. Pass `quiet` on pages whose stage already carries its own amber key:
 * the link is then plain text from the first paint, and stays plain for as long as a page key is on screen.
 */
export function SiteHeader({ quiet = false }: { quiet?: boolean }) {
  return (
    <HeaderShell quiet={quiet}>
      {brand}
      <div className="flex items-center gap-x-1">
        <nav aria-label="Primary" className="flex items-center gap-x-1">
          <div className="flex items-center gap-x-0.5 max-md:hidden">
            <Link href="/tools" className={NAV}>Tools</Link>
            <Link href="/guides" className={NAV}>Guides</Link>
            <Link href="/docs" className={NAV}>Docs</Link>
            <a href={GITHUB} className={NAV}>GitHub</a>
            <ThemeToggle />
          </div>
          <Button asChild variant="primary" size="md" className={`${KEY} md:ml-2`}>
            <Link href="/playground">
              <span className="max-md:hidden">Open the playground</span>
              <span className="md:hidden">Playground</span>
            </Link>
          </Button>
        </nav>
        <MobileMenu
          brand={brand}
          action={
            <Button asChild variant="primary" size="md" className={KEY}>
              <Link href="/playground">Playground</Link>
            </Button>
          }
        >
          <Link href="/tools" className={ITEM}>Tools</Link>
          <Link href="/guides" className={ITEM}>Guides</Link>
          <Link href="/docs" className={ITEM}>Docs</Link>
          <Link href="/changelog" className={ITEM}>Changelog</Link>
          <a href={GITHUB} className={ITEM}>GitHub</a>
          <div className="-mx-3 pt-2">
            <ThemeToggle withLabel />
          </div>
        </MobileMenu>
      </div>
    </HeaderShell>
  );
}
