import { KeyLink } from "./KeyLink";
import { WRAP } from "./ui";

/** The closing band: one slim row, the page's one amber action. */
export function FinalCTA() {
  return (
    <section className="border-b border-[var(--workspace-border)]">
      <div className={`${WRAP} flex flex-wrap items-center justify-between gap-x-10 gap-y-4 py-8`}>
        <h2 className="mk-display text-[clamp(22px,calc(1rem+1vw),30px)] font-[650] leading-[1.1]">Got something to paste?</h2>
        <KeyLink href="/playground">
          Open the playground
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </KeyLink>
      </div>
    </section>
  );
}
