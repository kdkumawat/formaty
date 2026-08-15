"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const COMPARE_TYPES = [
  { label: "JSON", route: "/json-diff" },
  { label: "Lists", route: "/compare-lists" },
  { label: "IDs", route: "/compare-ids" },
  { label: "CSV", route: "/compare-csv" },
  { label: "YAML", route: "/json-diff" },
  { label: "XML", route: "/json-diff" },
];

const OUTCOMES = [
  { label: "Common", count: "1,204", color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
  { label: "Only prod", count: "17", color: "text-sky-600 dark:text-sky-400 bg-sky-500/10" },
  { label: "Only stage", count: "9", color: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
  { label: "Changed", count: "3", color: "text-orange-600 dark:text-orange-400 bg-orange-500/10" },
  { label: "Duplicates", count: "2", color: "text-amber-700 dark:text-amber-400 bg-amber-500/10" },
];

export function CompareSection() {
  return (
    <section className="border-t border-[var(--workspace-border)] px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Compare
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]">
              Compare data, not just text.
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-[var(--workspace-text-muted)] md:text-base">
              Line-by-line diff misses the point when what changed is a reordered array or a
              missing record. Formaty compares structurally - and for lists, as sets - so the
              result tells you what&apos;s actually different.
            </p>
            <ul className="max-w-lg space-y-2.5 text-sm text-[var(--workspace-text-muted)]">
              {[
                "Document diff for JSON / XML / YAML with path-level summaries",
                "Optional order-free array comparison keyed by an ID field",
                "List & set compare with count-aware mode for repeated values",
                "CSV column compare: pick a key column, see changed rows",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2">
              {COMPARE_TYPES.map(({ label, route }) => (
                <Link
                  key={label}
                  href={route}
                  className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3.5 py-1.5 font-mono text-[11px] font-medium text-[var(--workspace-text)] transition-all hover:border-primary/50 hover:text-primary"
                >
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] shadow-xl shadow-black/10"
          >
            <div className="flex items-center gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                Result buckets
              </span>
            </div>
            <div className="space-y-2.5 p-5">
              {OUTCOMES.map(({ label, count, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className={`w-24 rounded-md px-2.5 py-1 text-center font-mono text-[11px] font-semibold ${color}`}>
                    {label}
                  </span>
                  <span className="h-px flex-1 bg-[var(--workspace-border)]" />
                  <span className="font-mono text-[11px] tabular-nums text-[var(--workspace-text)]">{count}</span>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="mr-1 text-[10px] font-medium uppercase tracking-wider text-[var(--workspace-text-muted)]">
                  Copy as
                </span>
                {["SQL IN", "NOT IN", "JSON", "CSV", "Markdown"].map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--workspace-text-muted)]"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Link
                  href="/compare-lists"
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-[1.03]"
                >
                  Open Compare
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
                <Link
                  href="/json-diff"
                  className="text-sm font-medium text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
                >
                  or diff JSON documents
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
