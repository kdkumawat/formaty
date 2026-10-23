import type { ReactNode } from "react";
import { focusRing } from "@/components/kit/styles";

/** One docs section: anchor, display heading, then prose. */
export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-[var(--workspace-border)] pt-10 first:border-t-0 first:pt-0">
      <h2 className="font-display text-[clamp(22px,2.4vw,30px)] font-extrabold leading-[1.1] tracking-[-0.03em] text-balance">
        <a href={`#${id}`} className="hover:underline">{title}</a>
      </h2>
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-4 font-display text-[18px] font-extrabold tracking-[-0.02em]">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[16px] leading-[1.65] sm:text-[17px]">{children}</p>;
}

/** A UI label, written as the interface shows it. */
export function Ui({ children }: { children: ReactNode }) {
  return <strong className="font-semibold">{children}</strong>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-[var(--workspace-border)] bg-sunk px-1.5 py-0.5 font-mono text-[14px]">{children}</kbd>
  );
}

/** Hairline rows: term left, explanation right. */
export function Terms({ items }: { items: [ReactNode, ReactNode][] }) {
  return (
    <dl className="border-t border-[var(--workspace-border)]">
      {items.map(([t, d], i) => (
        <div key={i} className="grid gap-x-6 gap-y-1 border-b border-[var(--workspace-border)] py-3 sm:grid-cols-[170px_minmax(0,1fr)]">
          <dt className="text-[16px] font-semibold">{t}</dt>
          <dd className="text-[16px] leading-[1.6] text-[var(--workspace-text-muted)]">{d}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Numbered steps for a real sequence. */
export function Steps({ children }: { children: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {children.map((c, i) => (
        <li key={i} className="grid grid-cols-[2rem_minmax(0,1fr)] text-[16px] leading-[1.65] sm:text-[17px]">
          <span className="font-display font-extrabold text-[var(--workspace-text)]">{i + 1}.</span>
          <span>{c}</span>
        </li>
      ))}
    </ol>
  );
}

export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    // Scrolls sideways on narrow screens, so it needs focus and a name.
    <div role="region" tabIndex={0} aria-label={`Table: ${head.join(", ")}`} className={`overflow-x-auto ${focusRing}`}>
      <table className="w-full min-w-[480px] border-collapse text-left text-[16px]">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="border-b border-[var(--workspace-border)] py-2.5 pr-4 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="border-b border-[var(--workspace-border)] py-2.5 pr-4 align-top text-[var(--workspace-text-muted)] first:text-[var(--workspace-text)]">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
