"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { fadeUp } from "@/lib/motion";

type Step = { label: string; tone: "in" | "mid" | "out" };

type UseCaseCardProps = {
  index: number;
  eyebrow: string;
  title: string;
  summary: string;
  steps: [Step, Step, Step];
  preview: React.ReactNode;
  cta: { label: string; href: string };
  accent: string;
};

export function UseCaseCard({
  index,
  eyebrow,
  title,
  summary,
  steps,
  preview,
  cta,
  accent,
}: UseCaseCardProps) {
  return (
    <motion.article
      variants={fadeUp}
      className="group relative flex h-full flex-col gap-5 overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-black/10 md:p-6"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${accent}`}>
            {eyebrow}
          </p>
          <h3 className="text-lg font-semibold leading-snug text-[var(--workspace-text)] transition-colors group-hover:text-primary md:text-xl">
            {title}
          </h3>
        </div>
        <span className="font-mono text-[10px] font-semibold text-[var(--workspace-text-muted)] tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
      </header>

      <p className="text-sm leading-relaxed text-[var(--workspace-text-muted)]">
        {summary}
      </p>

      {/* Paste → Transform → Export pipeline */}
      <ol className="grid grid-cols-3 gap-1.5">
        {steps.map((step, i) => (
          <li
            key={step.label}
            className="rounded-md border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 py-1.5"
          >
            <p className="font-mono text-[9px] font-semibold uppercase tracking-widest text-[var(--workspace-text-muted)]">
              {i === 0 ? "Paste" : i === 1 ? "Transform" : "Export"}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-medium text-[var(--workspace-text)]">
              {step.label}
            </p>
          </li>
        ))}
      </ol>

      {/* Tiny monospace preview */}
      <div className="overflow-hidden rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)]">
        {preview}
      </div>

      <Link
        href={cta.href}
        className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:scale-[1.03] hover:bg-primary/15"
      >
        {cta.label}
        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </motion.article>
  );
}
