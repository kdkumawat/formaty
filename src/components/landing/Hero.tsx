import Link from "next/link";
import { ALL_TOOL_ROUTES } from "@/lib/seo";
import { HeroBench } from "./HeroBench";
import { KeyLink } from "./KeyLink";
import { LINK, WRAP } from "./ui";

const ICON = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;
const GITHUB = "https://github.com/kdkumawat/formaty";
const FACTS = [
  { text: "No sign-up", d: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.6 5.6l12.8 12.8" },
  { text: "Works offline", d: "M5 12.5l4.5 4.5L19 7.5" },
];

/** What it is, what it does, why trust it, and the working product beside it. */
export function Hero() {
  return (
    <div className="mk-dotgrid border-b border-[var(--workspace-border)]">
      <div className={`${WRAP} grid items-center gap-x-10 gap-y-8 py-8 min-[1100px]:grid-cols-12 min-[1100px]:py-10`}>
        <div className="flex flex-col items-start gap-5 min-[1100px]:col-span-5">
          <h1 className="mk-display text-[clamp(34px,3.4vw,48px)] font-[700] leading-[1.02]">Paste any data. Copy it in the shape you need.</h1>
          <p className="max-w-[34em] text-[16px] leading-[1.55] text-[var(--workspace-text-muted)] sm:text-[17px]">
            Format, convert and compare JSON, XML, YAML, TOML, CSV and cURL, or turn them into SQL, types and client code. Everything runs in this tab; nothing is uploaded.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <KeyLink href="/playground">
              Open the playground
              <svg {...ICON} width={20} height={20}>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </KeyLink>
            <Link href="/tools" className={LINK}>Browse all {ALL_TOOL_ROUTES.length} tools</Link>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-[var(--workspace-text-muted)]">
            {FACTS.map((f) => (
              <li key={f.text} className="inline-flex items-center gap-1.5">
                <svg {...ICON}>
                  <path d={f.d} />
                </svg>
                {f.text}
              </li>
            ))}
            <li>
              <a href={GITHUB} className="inline-flex items-center gap-1.5 underline decoration-transparent underline-offset-4 hover:text-[var(--workspace-text)] hover:decoration-current">
                <svg {...ICON}>
                  <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
                </svg>
                Open source
              </a>
            </li>
          </ul>
        </div>
        <div className="min-w-0 min-[1100px]:col-span-7">
          <HeroBench />
        </div>
      </div>
    </div>
  );
}
