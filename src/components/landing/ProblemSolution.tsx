"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  DocumentTextIcon,
  ArrowsRightLeftIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";

const CAPABILITIES = [
  {
    icon: DocumentTextIcon,
    label: "Format & Validate",
    desc: "JSON, XML, YAML, TOML, CSV",
    route: "/json-formatter",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: ArrowsRightLeftIcon,
    label: "Convert Formats",
    desc: "Between all major formats",
    route: "/json-to-yaml",
    color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
  },
  {
    icon: MagnifyingGlassIcon,
    label: "Query Data",
    desc: "JSONPath & JMESPath",
    route: "/jsonpath-tester",
    color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: ChartBarIcon,
    label: "Visualize",
    desc: "Tree, table, graph views",
    route: "/graph-viewer",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: CodeBracketIcon,
    label: "Generate Types",
    desc: "10 programming languages",
    route: "/json-to-typescript",
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  },
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
            All-in-one
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--workspace-text)] md:text-4xl">
            Stop juggling multiple tools
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            One workspace for your entire data workflow. Paste once, do everything.
          </p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CAPABILITIES.map(({ icon: Icon, label, desc, route, color }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.07 * i }}
            >
              <Link
                href={route}
                className="group flex flex-col items-center gap-3 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-md"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border ${color}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[var(--workspace-text)]">
                    {label}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--workspace-text-muted)]">
                    {desc}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
