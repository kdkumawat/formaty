"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const STEPS = ["Paste", "Convert", "Query", "Visualize", "Generate Types"];

export function Workflow() {
  return (
    <section className="px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-semibold tracking-tight text-[var(--workspace-text)] text-xl md:text-3xl"
        >
          From Raw Data to Insight in Seconds
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-2 md:gap-3"
        >
          {STEPS.map((step, i) => (
            <span key={step} className="flex items-center gap-2 md:gap-3">
              <span className="flex items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--workspace-border)] text-[10px] font-medium text-[var(--workspace-text)]">
                  {i + 1}
                </span>
                <span className="text-xs font-medium text-[var(--workspace-text)]">{step}</span>
              </span>
              {i < STEPS.length - 1 && (
                <span className="hidden text-[var(--workspace-text-muted)] md:inline">→</span>
              )}
            </span>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link href="/playground" className="btn btn-primary btn-sm rounded-lg">
            Open Editor
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
