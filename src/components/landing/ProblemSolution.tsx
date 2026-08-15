"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const DATA_TYPES = [
  { label: "JSON", color: "text-amber-500 border-amber-500/25 bg-amber-500/5" },
  { label: "CSV", color: "text-sky-500 border-sky-500/25 bg-sky-500/5" },
  { label: "YAML", color: "text-lime-600 border-lime-600/25 bg-lime-600/5" },
  { label: "XML", color: "text-red-500 border-red-500/25 bg-red-500/5" },
  { label: "TOML", color: "text-teal-500 border-teal-500/25 bg-teal-500/5" },
  { label: "Lists", color: "text-violet-500 border-violet-500/25 bg-violet-500/5" },
  { label: "API responses", color: "text-cyan-500 border-cyan-500/25 bg-cyan-500/5" },
];

const WORKFLOWS = [
  { label: "Format", route: "/json-formatter" },
  { label: "Inspect", route: "/json-viewer" },
  { label: "Query", route: "/jsonpath-tester" },
  { label: "Compare", route: "/compare-lists" },
  { label: "Convert", route: "/json-to-yaml" },
  { label: "Generate", route: "/json-to-sql" },
];

export function ProblemSolution() {
  return (
    <section className="px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            One dataset. Many workflows.
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]">
            Paste once. Do everything.
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            The same data flows through every step of your workflow - no copying between six
            different websites.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.06 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          {DATA_TYPES.map(({ label, color }) => (
            <span
              key={label}
              className={`inline-flex items-center rounded-md border px-3 py-1 font-mono text-xs font-medium ${color}`}
            >
              {label}
            </span>
          ))}
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {WORKFLOWS.map(({ label, route }, i) => (
            <span key={label} className="flex items-center gap-1.5">
              {i > 0 && <ArrowRightIcon className="h-3 w-3 text-[var(--workspace-text-muted)]" aria-hidden />}
              <Link
                href={route}
                className="rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1.5 text-xs font-semibold text-[var(--workspace-text)] transition-all hover:border-primary/40 hover:text-primary"
              >
                {label}
              </Link>
            </span>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mx-auto max-w-lg text-center text-xs leading-relaxed text-[var(--workspace-text-muted)]"
        >
          Example: paste a JSON API response, extract the user IDs with a JSONPath query, send them
          to List Compare against a database export, and copy the result as a SQL IN clause. All in
          one workspace, all local.
        </motion.p>
      </div>
    </section>
  );
}
