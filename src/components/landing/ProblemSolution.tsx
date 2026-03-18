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

const ITEMS = [
  { icon: DocumentTextIcon, label: "Format", route: "/json-formatter" },
  { icon: ArrowsRightLeftIcon, label: "Convert", route: "/json-to-xml" },
  { icon: MagnifyingGlassIcon, label: "Query", route: "/jsonpath-tester" },
  { icon: ChartBarIcon, label: "Visualize", route: "/graph-viewer" },
  { icon: CodeBracketIcon, label: "Generate", route: "/json-to-typescript" },
];

export function ProblemSolution() {
  return (
    <section className="px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-3 text-center"
        >
          <h2 className="font-semibold tracking-tight text-[var(--workspace-text)] text-xl md:text-3xl">
            Stop juggling multiple tools
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            One workspace for your entire data workflow.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {ITEMS.map(({ icon: Icon, label, route }) => (
            <Link
              key={label}
              href={route}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3 transition-colors hover:border-primary/40"
            >
              <Icon className="h-5 w-5 text-[var(--workspace-text-muted)]" />
              <span className="text-xs font-medium text-[var(--workspace-text)]">{label}</span>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
