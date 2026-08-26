"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon, ArrowsRightLeftIcon, DocumentMagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Reveal } from "@/components/motion";
import { slideInLeft, slideInRight, staggerContainer } from "@/lib/motion";

type Tab = "lists" | "docs";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "lists", label: "Lists & IDs", icon: ArrowsRightLeftIcon },
  { id: "docs", label: "JSON · XML · YAML", icon: DocumentMagnifyingGlassIcon },
];

const PROD = ["1001", "1002", "1003", "1004", "1005"];
const STAGE = ["1002", "1003", "1005", "1006", "1007"];

const OUTCOMES_LISTS = [
  { label: "Common", count: 3, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
  { label: "Only prod", count: 2, color: "text-sky-600 dark:text-sky-400 bg-sky-500/10" },
  { label: "Only stage", count: 2, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
  { label: "Duplicates", count: 0, color: "text-amber-700 dark:text-amber-400 bg-amber-500/10" },
];

const OUTCOMES_DOCS = [
  { label: "Common", count: 17, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
  { label: "Only prod", count: 4, color: "text-sky-600 dark:text-sky-400 bg-sky-500/10" },
  { label: "Only stage", count: 2, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
  { label: "Changed", count: 3, color: "text-orange-600 dark:text-orange-400 bg-orange-500/10" },
];

const COPY_AS = ["SQL IN", "NOT IN", "JSON", "CSV", "Markdown"];

const COMPARE_LINKS = [
  { label: "Lists", href: "/compare-lists" },
  { label: "IDs", href: "/compare-ids" },
  { label: "CSV files", href: "/compare-csv" },
  { label: "CSV columns", href: "/csv-column-compare" },
  { label: "Duplicates", href: "/find-duplicates-in-list" },
];

const DOC_LINKS = [
  { label: "JSON", href: "/json-diff" },
  { label: "YAML", href: "/json-diff" },
  { label: "XML", href: "/json-diff" },
];

export function Compare() {
  const [tab, setTab] = useState<Tab>("lists");
  const outcomes = tab === "lists" ? OUTCOMES_LISTS : OUTCOMES_DOCS;
  const links = tab === "lists" ? COMPARE_LINKS : DOC_LINKS;
  const primaryHref = tab === "lists" ? "/compare-lists" : "/json-diff";
  const primaryLabel = tab === "lists" ? "Open List Compare" : "Open Document Diff";

  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl space-y-10">
        <Reveal className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Compare
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]">
            Compare data, not just text.
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            Line-by-line diff misses the point when what changed is a reordered array or a missing
            record. Formaty compares structurally - and for lists, as sets.
          </p>
        </Reveal>

        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-1 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-pressed={tab === id}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  tab === id
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "text-[var(--workspace-text-muted)] hover:text-[var(--workspace-text)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </button>
            ))}
          </div>

          <motion.div
            key={tab}
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            className="grid items-stretch gap-5 lg:grid-cols-2"
          >
            <motion.div variants={slideInLeft} className="space-y-4">
              {tab === "lists" ? (
                <ul className="space-y-2.5 text-sm text-[var(--workspace-text-muted)]">
                  {[
                    "Common, missing, and extra records at a glance",
                    "Copy as SQL IN, NOT IN, ANY(ARRAY[...]), VALUES, or INSERT",
                    "Count-aware mode - see how many extra occurrences each side has",
                    "Works on UUIDs, integers, strings - anything pasteable",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-2.5 text-sm text-[var(--workspace-text-muted)]">
                  {[
                    "Document diff for JSON / XML / YAML with path-level summaries",
                    "Optional order-free array comparison keyed by an ID field",
                    "Side-by-side line-level highlights for spot-checking",
                    "Falls back across formats - paste any pair of supported docs",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                {links.map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3 py-1 font-mono text-[11px] font-medium text-[var(--workspace-text)] transition-all hover:border-primary/50 hover:text-primary"
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <Link
                href={primaryHref}
                className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-[1.03] hover:shadow-primary/30"
              >
                {primaryLabel}
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </motion.div>

            <motion.div
              variants={slideInRight}
              className="overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] shadow-xl shadow-black/10"
            >
              <div className="flex items-center gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-2.5">
                <span className={`h-2 w-2 rounded-full ${tab === "lists" ? "bg-rose-400" : "bg-orange-400"}`} />
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                  {tab === "lists" ? "prod  vs  stage" : "v1  vs  v2"}
                </span>
              </div>

              {tab === "lists" ? (
                <div className="grid grid-cols-2 divide-x divide-[var(--workspace-border)] font-mono text-[11px]">
                  <div className="space-y-1 p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sky-500">Production</p>
                    {PROD.map((id) => (
                      <p key={id} className="text-[var(--workspace-text)]">
                        {id}
                      </p>
                    ))}
                  </div>
                  <div className="space-y-1 p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-violet-500">Staging</p>
                    {STAGE.map((id) => (
                      <p key={id} className="text-[var(--workspace-text)]">
                        {id}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 divide-x divide-[var(--workspace-border)] font-mono text-[10.5px] leading-relaxed">
                  <div className="space-y-1 p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-sky-500">v1.json</p>
                    <p className="text-[var(--workspace-text)]">{"{"}</p>
                    <p className="pl-3 text-[var(--workspace-text)]"><span className="text-sky-400">&quot;name&quot;</span>: <span className="text-emerald-500">&quot;api&quot;</span>,</p>
                    <p className="pl-3 text-[var(--workspace-text)]"><span className="text-sky-400">&quot;replicas&quot;</span>: <span className="text-amber-500">3</span>,</p>
                    <p className="pl-3 text-[var(--workspace-text)]"><span className="text-sky-400">&quot;image&quot;</span>: <span className="text-emerald-500">&quot;v1.2&quot;</span></p>
                    <p className="text-[var(--workspace-text)]">{"}"}</p>
                  </div>
                  <div className="space-y-1 p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-violet-500">v2.json</p>
                    <p className="text-[var(--workspace-text)]">{"{"}</p>
                    <p className="pl-3 text-[var(--workspace-text)]"><span className="text-sky-400">&quot;name&quot;</span>: <span className="text-emerald-500">&quot;api&quot;</span>,</p>
                    <p className="pl-3 text-[var(--workspace-text)]"><span className="text-sky-400">&quot;replicas&quot;</span>: <span className="text-amber-500">5</span>,</p>
                    <p className="pl-3 text-[var(--workspace-text)]"><span className="text-sky-400">&quot;image&quot;</span>: <span className="text-emerald-500">&quot;v1.3&quot;</span></p>
                    <p className="text-[var(--workspace-text)]">{"}"}</p>
                  </div>
                </div>
              )}

              <div className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4">
                <div className="space-y-2">
                  {outcomes.map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className={`w-24 rounded-md px-2.5 py-1 text-center font-mono text-[11px] font-semibold ${color}`}>
                        {label}
                      </span>
                      <span className="h-px flex-1 bg-[var(--workspace-border)]" />
                      <span className="font-mono text-[11px] tabular-nums text-[var(--workspace-text)]">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-[10px] font-medium uppercase tracking-wider text-[var(--workspace-text-muted)]">
                    Copy as
                  </span>
                  {COPY_AS.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--workspace-text-muted)]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
