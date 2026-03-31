"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const CASES = [
  {
    number: "01",
    title: "Debug API responses",
    desc: "Paste a raw API or webhook response, format it, explore the structure, and query specific fields - no more squinting at minified JSON.",
    route: "/json-formatter",
    tag: "Backend",
  },
  {
    number: "02",
    title: "Convert config files",
    desc: "Switch your config between JSON, YAML, TOML, and XML in one click. Perfect for Docker, Kubernetes, Terraform, and any DevOps workflow.",
    route: "/json-to-yaml",
    tag: "DevOps",
  },
  {
    number: "03",
    title: "Generate model types",
    desc: "Drop in any JSON payload and export typed interfaces for TypeScript, Python, Go, Rust, Java, C# and more - 10 languages supported.",
    route: "/json-to-typescript",
    tag: "Frontend",
  },
  {
    number: "04",
    title: "Query & transform data",
    desc: "Use JSONPath and JMESPath to extract, filter, and reshape nested structures without writing a single line of code.",
    route: "/jsonpath-tester",
    tag: "Data",
  },
];

export function UseCases() {
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
            Built for developers
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="text-2xl font-bold tracking-tight text-[var(--workspace-text)] md:text-4xl"
          >
            Use cases
          </motion.h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {CASES.map(({ number, title, desc, route, tag }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.07 * i }}
            >
              <Link
                href={route}
                className="group flex flex-col gap-4 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold text-[var(--workspace-border)] transition-colors group-hover:text-primary/25">
                    {number}
                  </span>
                  <span className="rounded-full border border-[var(--workspace-border)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--workspace-text-muted)]">
                    {tag}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--workspace-text)] transition-colors group-hover:text-primary">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
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
