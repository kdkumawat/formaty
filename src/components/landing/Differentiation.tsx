"use client";

import { motion } from "framer-motion";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";

const BEFORE = [
  "Open a JSON formatter tab",
  "Open a separate YAML converter",
  "Copy-paste between multiple tools",
  "Maintain 5+ bookmarks",
  "No query, diff, or type generation",
];

const AFTER = [
  "One paste → format, convert, diff",
  "Built-in YAML / XML / TOML / CSV support",
  "Query instantly with JSONPath & JMESPath",
  "Visualize as tree, table, or graph",
  "Generate TypeScript types in one click",
];

export function Differentiation() {
  return (
    <section className="border-t border-[var(--workspace-border)] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl font-bold tracking-tight text-[var(--workspace-text)] md:text-4xl"
          >
            Replace 5 tools with one
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="mx-auto max-w-lg text-sm text-[var(--workspace-text-muted)] md:text-base"
          >
            Stop context-switching between browser tabs.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-4 md:grid-cols-2"
        >
          {/* Before */}
          <div className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6">
            <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/10">
                <XMarkIcon className="h-3 w-3 text-rose-500" />
              </span>
              Before: multiple tools
            </h3>
            <ul className="space-y-3">
              {BEFORE.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-[var(--workspace-text-muted)]"
                >
                  <XMarkIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-[var(--workspace-panel)] p-6">
            <div
              className="pointer-events-none absolute inset-0 rounded-xl bg-primary/[0.025]"
              aria-hidden
            />
            <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/15">
                <CheckIcon className="h-3 w-3 text-primary" />
              </span>
              Formaty: one workspace
            </h3>
            <ul className="space-y-3">
              {AFTER.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 text-sm text-[var(--workspace-text)]"
                >
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
