"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowsRightLeftIcon,
  CodeBracketIcon,
  MagnifyingGlassIcon,
  ShareIcon,
  CloudArrowDownIcon,
  CubeIcon,
  BoltIcon,
  Cog6ToothIcon,
  TagIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";

const FEATURES: {
  route: string;
  title: string;
  desc: string;
  icon: typeof DocumentTextIcon;
  color: string;
  glow: string;
  badge?: string;
}[] = [
  {
    route: "/json-formatter",
    title: "JSON Formatter",
    desc: "Beautify and validate JSON with full syntax highlighting",
    icon: DocumentTextIcon,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    glow: "hover:shadow-amber-500/10 hover:border-amber-500/30",
    badge: "Popular",
  },
  {
    route: "/json-viewer",
    title: "JSON Viewer",
    desc: "Explore nested data interactively in tree view",
    icon: EyeIcon,
    color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    glow: "hover:shadow-sky-500/10 hover:border-sky-500/30",
  },
  {
    route: "/json-diff",
    title: "JSON Diff",
    desc: "Side-by-side diff with precise change highlighting",
    icon: ArrowsRightLeftIcon,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    glow: "hover:shadow-rose-500/10 hover:border-rose-500/30",
  },
  {
    route: "/json-to-typescript",
    title: "JSON → TypeScript",
    desc: "Auto-generate typed interfaces from any JSON payload",
    icon: CodeBracketIcon,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    glow: "hover:shadow-blue-500/10 hover:border-blue-500/30",
    badge: "Popular",
  },
  {
    route: "/jsonpath-tester",
    title: "JSONPath Query",
    desc: "Extract nested values with JSONPath & JMESPath",
    icon: MagnifyingGlassIcon,
    color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    glow: "hover:shadow-violet-500/10 hover:border-violet-500/30",
  },
  {
    route: "/graph-viewer",
    title: "Graph Viewer",
    desc: "Visualize complex JSON relationships as a graph",
    icon: ShareIcon,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    glow: "hover:shadow-emerald-500/10 hover:border-emerald-500/30",
  },
  {
    route: "/api-import",
    title: "API Import",
    desc: "Paste a cURL command and inspect the live response",
    icon: CloudArrowDownIcon,
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    glow: "hover:shadow-cyan-500/10 hover:border-cyan-500/30",
  },
  {
    route: "/schema-generator",
    title: "Schema Generator",
    desc: "Generate JSON Schema from any data structure",
    icon: CubeIcon,
    color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    glow: "hover:shadow-orange-500/10 hover:border-orange-500/30",
  },
  {
    route: "/xml-formatter",
    title: "XML Formatter",
    desc: "Format, validate and prettify XML documents",
    icon: BoltIcon,
    color: "text-red-500 bg-red-500/10 border-red-500/20",
    glow: "hover:shadow-red-500/10 hover:border-red-500/30",
  },
  {
    route: "/yaml-formatter",
    title: "YAML Formatter",
    desc: "Format and syntax-check YAML configurations",
    icon: Cog6ToothIcon,
    color: "text-lime-500 bg-lime-500/10 border-lime-500/20",
    glow: "hover:shadow-lime-500/10 hover:border-lime-500/30",
  },
  {
    route: "/toml-formatter",
    title: "TOML Formatter",
    desc: "Format TOML config files with live validation",
    icon: TagIcon,
    color: "text-teal-500 bg-teal-500/10 border-teal-500/20",
    glow: "hover:shadow-teal-500/10 hover:border-teal-500/30",
  },
  {
    route: "/csv-formatter",
    title: "CSV Formatter",
    desc: "Format, validate and preview CSV data as a table",
    icon: TableCellsIcon,
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    glow: "hover:shadow-indigo-500/10 hover:border-indigo-500/30",
  },
];

export function FeatureGrid() {
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
            12 powerful tools
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="text-2xl font-bold tracking-tight text-[var(--workspace-text)] md:text-4xl"
          >
            Everything in one workspace
          </motion.h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ route, title, desc, icon: Icon, color, glow, badge }, i) => (
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.04 * i }}
            >
              <Link
                href={route}
                className={`group relative flex flex-col gap-4 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${glow}`}
              >
                {badge && (
                  <span className="absolute right-3 top-3 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {badge}
                  </span>
                )}
                <div
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${color}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--workspace-text)] transition-colors group-hover:text-primary">
                    {title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--workspace-text-muted)]">
                    {desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
