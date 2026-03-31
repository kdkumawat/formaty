"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const STEPS = [
  {
    step: "01",
    title: "Paste",
    desc: "Drop in JSON, XML, YAML, TOML, or CSV from any source",
  },
  {
    step: "02",
    title: "Convert",
    desc: "Switch formats instantly - JSON to YAML in one click",
  },
  {
    step: "03",
    title: "Query",
    desc: "Extract values with JSONPath or JMESPath expressions",
  },
  {
    step: "04",
    title: "Visualize",
    desc: "Explore as tree, table, or interactive relationship graph",
  },
  {
    step: "05",
    title: "Generate",
    desc: "Export typed code - TypeScript, Python, Go, Rust + 6 more",
  },
];

export function Workflow() {
  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-primary"
          >
            How it works
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="text-2xl font-bold tracking-tight text-[var(--workspace-text)] md:text-4xl"
          >
            From raw data to insight in seconds
          </motion.h2>
        </div>

        <div className="relative mx-auto max-w-xl">
          {/* Connector line */}
          <div
            className="absolute left-[15px] top-6 bottom-6 hidden w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent md:block"
            aria-hidden
          />
          <div className="space-y-5">
            {STEPS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.09 * i }}
                className="flex items-start gap-5"
              >
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 shadow-sm shadow-primary/20">
                  <span className="font-mono text-[11px] font-bold text-primary">{step}</span>
                </div>
                <div className="pt-0.5">
                  <h3 className="font-semibold text-[var(--workspace-text)]">{title}</h3>
                  <p className="mt-0.5 text-sm text-[var(--workspace-text-muted)]">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Link
            href="/playground"
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-content shadow-lg shadow-primary/20 transition-all hover:scale-[1.03]"
          >
            Start working
            <ArrowRightIcon
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
