"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookmarkIcon,
  EyeIcon,
  CircleStackIcon,
  LinkIcon,
  ArrowDownTrayIcon,
  CpuChipIcon,
  CommandLineIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";

const CONVERSIONS = [
  { route: "/json-to-xml",  from: "JSON", to: "XML",  fromColor: "text-amber-500", toColor: "text-red-500",   glow: "hover:border-amber-500/30 hover:shadow-amber-500/8" },
  { route: "/json-to-yaml", from: "JSON", to: "YAML", fromColor: "text-amber-500", toColor: "text-lime-600",  glow: "hover:border-lime-500/30 hover:shadow-lime-500/8" },
  { route: "/json-to-csv",  from: "JSON", to: "CSV",  fromColor: "text-amber-500", toColor: "text-sky-500",   glow: "hover:border-sky-500/30 hover:shadow-sky-500/8" },
  { route: "/xml-to-json",  from: "XML",  to: "JSON", fromColor: "text-red-500",   toColor: "text-amber-500", glow: "hover:border-red-500/30 hover:shadow-red-500/8" },
  { route: "/yaml-to-json", from: "YAML", to: "JSON", fromColor: "text-lime-600",  toColor: "text-amber-500", glow: "hover:border-lime-500/30 hover:shadow-lime-500/8" },
  { route: "/csv-to-json",  from: "CSV",  to: "JSON", fromColor: "text-sky-500",   toColor: "text-amber-500", glow: "hover:border-sky-500/30 hover:shadow-sky-500/8" },
];

const CMD_ITEMS = [
  { label: "Beautify", category: "Actions", active: true },
  { label: "Convert to YAML", category: "Convert to" },
  { label: "View: Graph", category: "View as" },
  { label: "Generate TypeScript types", category: "Generate Types" },
  { label: "Minify", category: "Actions" },
  { label: "View: Table", category: "View as" },
  { label: "Load GitHub API sample", category: "Samples" },
];

const FEATURES = [
  {
    icon: BookmarkIcon,
    title: "Pin your favourite actions",
    desc: "Keep the tools you use constantly a single click away. Pin any operation to the toolbar so it never hides.",
    color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    tag: "Toolbar",
  },
  {
    icon: EyeIcon,
    title: "Four powerful views",
    desc: "Switch between Raw, Tree, Table, and Graph views for any JSON - no re-paste needed. Every view is live.",
    color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
    tag: "Views",
  },
  {
    icon: CircleStackIcon,
    title: "Session always restored",
    desc: "Your last input, output, and settings are saved locally. Refresh or close - everything is exactly where you left it.",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    tag: "Persistence",
  },
  {
    icon: LinkIcon,
    title: "Share via link",
    desc: "Generate a compact shareable URL that encodes your data and configuration - send it to a teammate in one click.",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    tag: "Sharing",
  },
  {
    icon: ArrowDownTrayIcon,
    title: "Download any output",
    desc: "Export your formatted, converted, or generated output as a file. The right extension is set automatically.",
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
    tag: "Export",
  },
  {
    icon: CpuChipIcon,
    title: "Runs entirely in your browser",
    desc: "WebWorker-powered processing means zero latency and zero data sent to any server - even on huge payloads.",
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    tag: "Privacy",
  },
];

export function PowerFeatures() {
  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Workspace features
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--workspace-text)] md:text-4xl">
            Built for your workflow
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            Formaty isn't just a formatter - it's a full workspace that remembers how you work.
          </p>
        </motion.div>

        {/* Command palette - full-width showcase card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-2xl border border-primary/20 bg-[var(--workspace-background)]"
        >
          <div className="grid gap-0 lg:grid-cols-2">
            {/* Left: copy */}
            <div className="flex flex-col justify-center gap-5 p-7 lg:p-10">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <CommandLineIcon className="h-5 w-5" aria-hidden />
                </div>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  New
                </span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-[var(--workspace-text)]">
                  Command palette
                </h3>
                <p className="text-sm leading-relaxed text-[var(--workspace-text-muted)]">
                  Press <kbd className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--workspace-text)]">⌘K</kbd> anywhere in the workspace to instantly search and run any action, no menu-hunting required.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-[var(--workspace-text-muted)]">
                {[
                  "Convert, beautify, minify, flatten in one keystroke",
                  "Switch views: Raw, Tree, Graph, Table, Query",
                  "Generate types for TypeScript, Go, Python & more",
                  "Load samples and examples instantly",
                  "Change theme, share, copy and download",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: visual preview */}
            <div className="flex items-center justify-center border-t border-primary/10 bg-[var(--workspace-panel)] p-6 lg:border-l lg:border-t-0 lg:p-8">
              <div className="w-full max-w-sm overflow-hidden rounded-xl border border-[var(--workspace-border)] shadow-2xl shadow-black/30">
                {/* Search bar */}
                <div className="flex items-center gap-2.5 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3.5 py-2.5">
                  <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-text-muted)]" />
                  <span className="flex-1 text-[12px] text-[var(--workspace-text-muted)]">Search commands…</span>
                  <kbd className="rounded border border-[var(--workspace-border)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--workspace-text-muted)]">ESC</kbd>
                </div>
                {/* Items */}
                <div className="divide-y divide-[var(--workspace-border)]">
                  <div className="px-3.5 pb-1 pt-2.5">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-[var(--workspace-text-muted)]/50">Actions</p>
                    {CMD_ITEMS.slice(0, 1).map(({ label }) => (
                      <div key={label} className="flex items-center gap-2.5 rounded-md bg-primary/10 px-2.5 py-1.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span className="flex-1 text-[12px] font-medium text-primary">{label}</span>
                        <kbd className="rounded border border-primary/20 px-1 py-0.5 font-mono text-[9px] text-primary/60">↵</kbd>
                      </div>
                    ))}
                  </div>
                  <div className="px-3.5 pb-1 pt-2.5">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-[var(--workspace-text-muted)]/50">Convert to</p>
                    {CMD_ITEMS.slice(1, 2).map(({ label }) => (
                      <div key={label} className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--workspace-text-muted)]/30" />
                        <span className="flex-1 text-[12px] text-[var(--workspace-text)]">{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-3.5 pb-1 pt-2.5">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-[var(--workspace-text-muted)]/50">View as</p>
                    {CMD_ITEMS.slice(2, 3).map(({ label }) => (
                      <div key={label} className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--workspace-text-muted)]/30" />
                        <span className="flex-1 text-[12px] text-[var(--workspace-text)]">{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-3.5 pb-1 pt-2.5">
                    <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-[var(--workspace-text-muted)]/50">Generate Types</p>
                    {CMD_ITEMS.slice(3, 4).map(({ label }) => (
                      <div key={label} className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--workspace-text-muted)]/30" />
                        <span className="flex-1 text-[12px] text-[var(--workspace-text)]">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Footer */}
                <div className="flex items-center gap-3 border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3.5 py-2 text-[9px] text-[var(--workspace-text-muted)]/60">
                  <span className="flex items-center gap-1"><kbd className="rounded border border-[var(--workspace-border)] px-1 py-px font-mono">↑↓</kbd> navigate</span>
                  <span className="flex items-center gap-1"><kbd className="rounded border border-[var(--workspace-border)] px-1 py-px font-mono">↵</kbd> run</span>
                  <span className="ml-auto flex items-center gap-1"><kbd className="rounded border border-[var(--workspace-border)] px-1 py-px font-mono">⌘K</kbd> open</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Workspace feature cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc, color, tag }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 * i }}
              className="flex flex-col gap-4 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] p-5"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border ${color}`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <span className="rounded-full border border-[var(--workspace-border)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                  {tag}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--workspace-text)]">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--workspace-text-muted)]">
                  {desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Format conversions */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--workspace-text-muted)]">Format conversions</p>
            <span className="h-px flex-1 bg-[var(--workspace-border)]" aria-hidden />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-3 gap-2 sm:grid-cols-6"
          >
            {CONVERSIONS.map(({ route, from, to, fromColor, toColor, glow }) => (
              <Link
                key={route}
                href={route}
                className={`group flex items-center justify-center gap-1.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3 py-2 font-mono text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${glow}`}
              >
                <span className={fromColor}>{from}</span>
                <ArrowRightIcon className="h-3 w-3 shrink-0 text-[var(--workspace-text-muted)] transition-transform group-hover:translate-x-0.5" aria-hidden />
                <span className={toColor}>{to}</span>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
