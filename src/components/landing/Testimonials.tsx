"use client";

import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    quote:
      "I keep a tab open at all times. Paste an API response, and format, diff, or query it before it even hits my editor.",
    name: "Maya R.",
    role: "Backend Engineer",
    initials: "MR",
  },
  {
    quote:
      "The UUID + password generators with batch cards are the fastest way to spin up test fixtures I've found - and it's all local.",
    name: "Daniel K.",
    role: "QA Automation",
    initials: "DK",
  },
  {
    quote:
      "JSON to TypeScript, schema generation, and cURL import in one free workspace. This replaced three separate tools for me.",
    name: "Priya S.",
    role: "Full-Stack Developer",
    initials: "PS",
  },
  {
    quote:
      "Share links are perfect for pairing. I send a teammate a workspace link and we debug the exact payload together.",
    name: "Tom W.",
    role: "SRE",
    initials: "TW",
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
            Loved by developers
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--workspace-text)] sm:text-4xl">
            One workspace, zero friction.
          </h2>
          <p className="mt-3 text-base text-[var(--workspace-text-muted)]">
            Used by engineers to format payloads, build fixtures, and debug APIs - without ever uploading data.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="glow-card flex flex-col gap-4 rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <blockquote className="text-sm leading-relaxed text-[var(--workspace-text-muted)]">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {t.initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--workspace-text)]">
                    {t.name}
                  </span>
                  <span className="block truncate text-xs text-[var(--workspace-text-muted)]">
                    {t.role}
                  </span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
