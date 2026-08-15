"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const CASES = [
  {
    title: "Backend Engineers",
    desc: "Debug database records, API responses, JSON, SQL, and ID lists. Reconcile production vs staging in one paste.",
    route: "/compare-lists",
    tag: "Reconcile",
  },
  {
    title: "Frontend Engineers",
    desc: "Generate TypeScript types, Zod schemas, and validation code straight from API response samples.",
    route: "/json-to-typescript",
    tag: "Generate",
  },
  {
    title: "DevOps Engineers",
    desc: "Inspect YAML, JSON, configs, and API responses. Convert between formats for manifests and pipelines.",
    route: "/json-to-yaml",
    tag: "Convert",
  },
  {
    title: "QA Engineers",
    desc: "Compare payloads between environments, generate fixtures, and inspect data with tree and table views.",
    route: "/json-diff",
    tag: "Compare",
  },
  {
    title: "Data Engineers",
    desc: "Reconcile CSV and JSON datasets, extract records with queries, and export to SQL or spreadsheets.",
    route: "/compare-csv",
    tag: "Reconcile",
  },
];

export function UseCases() {
  return (
    <section className="border-t border-[var(--workspace-border)] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-primary"
          >
            Who it&apos;s for
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]"
          >
            Built for how developers work
          </motion.h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CASES.map(({ title, desc, route, tag }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.07 * i }}
            >
              <Link
                href={route}
                className="group flex h-full flex-col gap-3 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <span className="w-max rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {tag}
                </span>
                <h3 className="text-lg font-semibold text-[var(--workspace-text)] transition-colors group-hover:text-primary">
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--workspace-text-muted)]">{desc}</p>
                <span className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-[var(--workspace-text-muted)] transition-colors group-hover:text-primary">
                  Open workflow
                  <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
