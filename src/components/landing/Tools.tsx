"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  BoltIcon,
  CodeBracketIcon,
  CubeIcon,
  DocumentTextIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ShareIcon,
  SwatchIcon,
  TableCellsIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";
import { Reveal } from "@/components/motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

type Tool = {
  route: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const TOOLS: Tool[] = [
  { route: "/json-formatter", title: "JSON Formatter", desc: "Beautify, minify, validate - with loose-mode tolerance.", icon: DocumentTextIcon, color: "text-amber-400 bg-amber-400/10 border-amber-400/25" },
  { route: "/compare-lists", title: "Compare Lists", desc: "Reconcile two lists or DB exports - SQL IN / NOT IN export.", icon: ArrowsRightLeftIcon, color: "text-rose-400 bg-rose-400/10 border-rose-400/25" },
  { route: "/json-to-typescript", title: "Type Generator", desc: "Twelve typed outputs from one JSON sample.", icon: CodeBracketIcon, color: "text-violet-400 bg-violet-400/10 border-violet-400/25" },
  { route: "/json-viewer", title: "JSON Viewer", desc: "Tree, table, and graph views of any JSON.", icon: EyeIcon, color: "text-sky-400 bg-sky-400/10 border-sky-400/25" },
  { route: "/json-to-sql", title: "JSON → SQL", desc: "CREATE TABLE + INSERT seeds for Postgres, MySQL, SQLite.", icon: CubeIcon, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25" },
  { route: "/sql-in-clause-generator", title: "SQL IN", desc: "Paste a list, get a WHERE col IN (…) clause with chunking.", icon: CodeBracketIcon, color: "text-teal-400 bg-teal-400/10 border-teal-400/25" },
  { route: "/api-import", title: "cURL Import", desc: "Paste a cURL, run it, inspect the live response.", icon: BoltIcon, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/25" },
  { route: "/compare-csv", title: "Compare CSV", desc: "Pick a key column, see common / missing / extra / changed.", icon: TableCellsIcon, color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/25" },
  { route: "/playground", title: "Developer Utils", desc: "UUID, Base64, JWT decode, hash, time, URL, password…", icon: SwatchIcon, color: "text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/25" },
  { route: "/jsonpath-tester", title: "JSONPath", desc: "Run JSONPath and JMESPath queries against any JSON.", icon: MagnifyingGlassIcon, color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25" },
  { route: "/schema-generator", title: "JSON Schema", desc: "Infer a JSON Schema from a sample payload.", icon: CubeIcon, color: "text-orange-400 bg-orange-400/10 border-orange-400/25" },
  { route: "/graph-viewer", title: "Graph Viewer", desc: "Visualize nested structures as an interactive graph.", icon: ShareIcon, color: "text-blue-400 bg-blue-400/10 border-blue-400/25" },
];

const CONVERSIONS = [
  { label: "JSON → XML", href: "/json-to-xml" },
  { label: "JSON → YAML", href: "/json-to-yaml" },
  { label: "JSON → TOML", href: "/json-to-toml" },
  { label: "JSON → CSV", href: "/json-to-csv" },
  { label: "XML → JSON", href: "/xml-to-json" },
  { label: "YAML → JSON", href: "/yaml-to-json" },
  { label: "TOML → JSON", href: "/toml-to-json" },
  { label: "CSV → JSON", href: "/csv-to-json" },
];

export function Tools() {
  return (
    <section id="tools" className="scroll-mt-16 border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl space-y-12">
        <Reveal className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">
            <span className="h-1 w-1 rounded-full bg-primary" />
            Every tool
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]">
            One workspace. 40+ tools.
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            Format, convert, query, compare, and generate - every tool opens the real thing, runs
            locally, and is free to use forever.
          </p>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {TOOLS.map(({ route, title, desc, icon: Icon, color }) => (
            <motion.div key={route} variants={fadeUp}>
              <Link
                href={route}
                className="group flex h-full flex-col gap-3 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${color}`}>
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--workspace-text)] transition-colors group-hover:text-primary">
                    {title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-[var(--workspace-text-muted)]">
                  {desc}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 font-mono text-[10px] text-[var(--workspace-text-muted)] transition-colors group-hover:text-primary">
                  {route}
                  <ArrowRightIcon className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Conversion strip */}
        <Reveal delay={0.05} className="space-y-3">
          <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--workspace-text-muted)]">
            One-click conversions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {CONVERSIONS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1 font-mono text-[11px] font-medium text-[var(--workspace-text)] transition-all hover:border-primary/40 hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
