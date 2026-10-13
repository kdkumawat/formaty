import Link from "next/link";
import { KeyLink } from "./KeyLink";
import { GRID, H1, LINK, WRAP } from "./ui";

/** The bookend: back on ink, one line and the amber key, laid out like the hero's head. The footer continues on the same ink. */
export function FinalCTA() {
  return (
    <section data-mk-stage className="mk-ink border-t border-[var(--workspace-border)] bg-[var(--workspace-background)]">
      <div className={`${WRAP} ${GRID} items-end !gap-y-6 py-[clamp(64px,8vw,112px)]`}>
        <h2 className={`${H1} lg:col-span-7`}>Got something to paste?</h2>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-1 lg:col-span-5 lg:pb-1.5">
          <KeyLink href="/playground">Open the playground</KeyLink>
          <Link href="/tools" className={LINK}>Browse every tool</Link>
        </div>
      </div>
    </section>
  );
}
