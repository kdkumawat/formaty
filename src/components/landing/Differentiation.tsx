"use client";

import { motion } from "framer-motion";

export function Differentiation() {
  return (
    <section className="border-t border-[var(--workspace-border)] px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-semibold tracking-tight text-[var(--workspace-text)] text-xl md:text-3xl"
        >
          One tool instead of many
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2"
        >
          <div className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
              Other tools
            </h3>
            <ul className="space-y-1.5 text-sm text-[var(--workspace-text-muted)]">
              <li>• Single-purpose formatter</li>
              <li>• Separate converter</li>
              <li>• Switch tabs, copy-paste</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
              Formaty
            </h3>
            <ul className="space-y-1.5 text-sm text-[var(--workspace-text)]">
              <li>• Format, convert, query, visualize</li>
              <li>• One workspace, one paste</li>
              <li>• Full workflow in one place</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
