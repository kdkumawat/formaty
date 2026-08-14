"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BoltIcon,
  ArrowsRightLeftIcon,
  ShareIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { GitHubStars } from "@/components/GitHubStars";

const WORKFLOWS = [
  {
    icon: BoltIcon,
    color: "text-amber-400 bg-amber-400/10 border-amber-400/25",
    title: "Debug API responses",
    desc: "Paste a webhook payload, format it, and diff two versions side by side before it ever reaches your editor.",
    route: "/json-formatter",
    cta: "Start debugging",
  },
  {
    icon: ArrowsRightLeftIcon,
    color: "text-rose-400 bg-rose-400/10 border-rose-400/25",
    title: "Compare configs & lists",
    desc: "Diff documents or compare two lists with a SQL IN export - catch what changed before you deploy.",
    route: "/json-diff",
    cta: "Compare data",
  },
  {
    icon: CodeBracketIcon,
    color: "text-blue-400 bg-blue-400/10 border-blue-400/25",
    title: "Generate types & schemas",
    desc: "Type your API client, generate JSON Schema, or export interfaces for 10+ languages from one sample.",
    route: "/json-to-typescript",
    cta: "Generate types",
  },
  {
    icon: ShareIcon,
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
    title: "Share exact state",
    desc: "Share a workspace link with a teammate and debug the exact payload together. Everything else stays local.",
    route: "/playground",
    cta: "Open playground",
  },
];

export function Testimonials() {
  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)]/40 px-4 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Built for real workflows
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--workspace-text)] sm:text-4xl">
            One workspace, zero friction.
          </h2>
          <p className="mt-3 text-base text-[var(--workspace-text-muted)]">
            The jobs developers do every day - without ever uploading data.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <GitHubStars />
            <span className="text-xs text-[var(--workspace-text-muted)]">
              Free, local-first, open source
            </span>
          </div>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOWS.map(({ icon: Icon, color, title, desc, route, cta }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glow-card flex flex-col gap-4 rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${color}`}>
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="text-sm font-semibold text-[var(--workspace-text)]">{title}</h3>
              <p className="text-sm leading-relaxed text-[var(--workspace-text-muted)]">{desc}</p>
              <Link
                href={route}
                className="mt-auto inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-primary transition-colors hover:underline"
              >
                {cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
