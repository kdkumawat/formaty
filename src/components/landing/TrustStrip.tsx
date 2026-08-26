"use client";

import {
  ShieldCheckIcon,
  UserIcon,
  GlobeAltIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";

const ITEMS = [
  { icon: ShieldCheckIcon, text: "100% local - data never leaves your browser" },
  { icon: UserIcon, text: "No account required" },
  { icon: GlobeAltIcon, text: "Works offline" },
  { icon: CpuChipIcon, text: "Powered by WebWorkers" },
];

export function TrustStrip() {
  return (
    <section className="fixed inset-x-0 bottom-0 z-40 overflow-hidden border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] py-2.5 backdrop-blur-sm">
      <div
        className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-24"
        style={{ background: "linear-gradient(to right, var(--workspace-panel), transparent)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-24"
        style={{ background: "linear-gradient(to left, var(--workspace-panel), transparent)" }}
        aria-hidden
      />

      <div className="flex w-full overflow-hidden" aria-hidden>
        <div className="marquee-track flex shrink-0 items-center gap-12 pr-12">
          {[...ITEMS, ...ITEMS].map(({ icon: Icon, text }, i) => (
            <div
              key={i}
              className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[var(--workspace-text-muted)]"
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="text-sm font-medium">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
