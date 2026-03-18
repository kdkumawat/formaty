"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const CONVERSIONS = [
  { route: "/json-to-xml", label: "JSON → XML" },
  { route: "/json-to-yaml", label: "JSON → YAML" },
  { route: "/json-to-csv", label: "JSON → CSV" },
  { route: "/xml-to-json", label: "XML → JSON" },
  { route: "/yaml-to-json", label: "YAML → JSON" },
  { route: "/csv-to-json", label: "CSV → JSON" },
];

export function ConversionGrid() {
  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-8 md:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-semibold tracking-tight text-[var(--workspace-text)] text-lg md:text-2xl"
        >
          Format Conversions
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-3 md:grid-cols-3"
        >
          {CONVERSIONS.map(({ route, label }) => (
            <Link
              key={route}
              href={route}
              className="rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3 py-2 text-center text-sm font-medium text-[var(--workspace-text)] transition-colors hover:border-primary/40 hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
