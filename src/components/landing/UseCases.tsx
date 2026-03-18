"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const CASES = [
  { title: "Debug API responses", desc: "Format and inspect JSON from APIs and webhooks.", route: "/json-formatter" },
  { title: "Convert configs", desc: "Switch between JSON, YAML, XML, TOML for configs.", route: "/json-to-yaml" },
  { title: "Generate models", desc: "Create TypeScript, Python, Go types from JSON.", route: "/json-to-typescript" },
  { title: "Query data", desc: "Extract values with JSONPath and JMESPath.", route: "/jsonpath-tester" },
];

export function UseCases() {
  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-semibold tracking-tight text-[var(--workspace-text)] text-xl md:text-3xl"
        >
          Use Cases
        </motion.h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CASES.map(({ title, desc, route }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.03 * i }}
            >
              <Link
                href={route}
                className="block rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40"
              >
                <h3 className="font-semibold text-[var(--workspace-text)]">{title}</h3>
                <p className="mt-1 text-xs text-[var(--workspace-text-muted)]">{desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
