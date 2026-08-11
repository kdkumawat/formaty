"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
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
    color: "text-amber-400 bg-amber-400/10 border-amber-400/25",
    glow: "hover:shadow-amber-500/10 hover:border-amber-400/30",
    badge: "Popular",
  },
  {
    route: "/json-viewer",
    title: "JSON Viewer",
    desc: "Explore nested data interactively in tree view",
    icon: EyeIcon,
    color: "text-sky-400 bg-sky-400/10 border-sky-400/25",
    glow: "hover:shadow-sky-500/10 hover:border-sky-400/30",
  },
  {
    route: "/json-diff",
    title: "Compare",
    desc: "Document diff + list/set compare with SQL IN export",
    icon: ArrowsRightLeftIcon,
    color: "text-rose-400 bg-rose-400/10 border-rose-400/25",
    glow: "hover:shadow-rose-500/10 hover:border-rose-400/30",
    badge: "New",
  },
  {
    route: "/playground",
    title: "Developer Utils",
    desc: "UUID, Base64, JWT decode, hash, time, URL, password…",
    icon: BoltIcon,
    color: "text-violet-400 bg-violet-400/10 border-violet-400/25",
    glow: "hover:shadow-violet-500/10 hover:border-violet-400/30",
    badge: "New",
  },
  {
    route: "/json-to-typescript",
    title: "JSON → TypeScript",
    desc: "Auto-generate typed interfaces from any JSON payload",
    icon: CodeBracketIcon,
    color: "text-blue-400 bg-blue-400/10 border-blue-400/25",
    glow: "hover:shadow-blue-500/10 hover:border-blue-400/30",
    badge: "Popular",
  },
  {
    route: "/jsonpath-tester",
    title: "JSONPath Query",
    desc: "Extract nested values with JSONPath & JMESPath",
    icon: MagnifyingGlassIcon,
    color: "text-violet-400 bg-violet-400/10 border-violet-400/25",
    glow: "hover:shadow-violet-500/10 hover:border-violet-400/30",
  },
  {
    route: "/graph-viewer",
    title: "Graph Viewer",
    desc: "Visualize complex JSON relationships as a graph",
    icon: ShareIcon,
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
    glow: "hover:shadow-emerald-500/10 hover:border-emerald-400/30",
  },
  {
    route: "/api-import",
    title: "API Import",
    desc: "Paste a cURL command and inspect the live response",
    icon: CloudArrowDownIcon,
    color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/25",
    glow: "hover:shadow-cyan-500/10 hover:border-cyan-400/30",
  },
  {
    route: "/schema-generator",
    title: "Schema Generator",
    desc: "Generate JSON Schema from any data structure",
    icon: CubeIcon,
    color: "text-orange-400 bg-orange-400/10 border-orange-400/25",
    glow: "hover:shadow-orange-500/10 hover:border-orange-400/30",
  },
  {
    route: "/xml-formatter",
    title: "XML Formatter",
    desc: "Format, validate and prettify XML documents",
    icon: BoltIcon,
    color: "text-red-400 bg-red-400/10 border-red-400/25",
    glow: "hover:shadow-red-500/10 hover:border-red-400/30",
  },
  {
    route: "/yaml-formatter",
    title: "YAML Formatter",
    desc: "Format and syntax-check YAML configurations",
    icon: Cog6ToothIcon,
    color: "text-lime-400 bg-lime-400/10 border-lime-400/25",
    glow: "hover:shadow-lime-500/10 hover:border-lime-400/30",
  },
  {
    route: "/toml-formatter",
    title: "TOML Formatter",
    desc: "Format TOML config files with live validation",
    icon: TagIcon,
    color: "text-teal-400 bg-teal-400/10 border-teal-400/25",
    glow: "hover:shadow-teal-500/10 hover:border-teal-400/30",
  },
  {
    route: "/csv-formatter",
    title: "CSV Formatter",
    desc: "Format, validate and preview CSV data as a table",
    icon: TableCellsIcon,
    color: "text-indigo-400 bg-indigo-400/10 border-indigo-400/25",
    glow: "hover:shadow-indigo-500/10 hover:border-indigo-400/30",
  },
];

export function FeatureGrid() {
  return (
    <section className="border-t border-[var(--workspace-border)] px-4 py-12 md:py-20">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-primary"
          >
            <span className="h-1 w-1 rounded-full bg-primary" />
            13 tools · one workspace
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]"
          >
            Everything in one workspace
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-md text-sm text-[var(--workspace-text-muted)] md:text-base"
          >
            Format, convert, query, compare and transform - all local, all free, no sign-up.
          </motion.p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ route, title, desc, icon: Icon, color, glow, badge }, i) => (
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.04 * (i % 4) }}
              className={i < 2 ? "lg:col-span-2" : undefined}
            >
              <Link
                href={route}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
                }}
                className={`glow-card group relative flex h-full flex-col gap-4 overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/10 ${glow}`}
              >
                {badge && (
                  <span className="absolute right-4 top-4 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {badge}
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${color}`}>
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="font-semibold text-[var(--workspace-text)] transition-colors group-hover:text-primary">
                    {title}
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-[var(--workspace-text-muted)]">{desc}</p>
                <span className="mt-auto inline-flex items-center gap-1 font-mono text-[10px] text-[var(--workspace-text-muted)] transition-colors group-hover:text-primary/80">
                  {route}
                  <ArrowRightIcon className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
