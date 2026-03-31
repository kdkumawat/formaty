"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const CONVERSIONS = [
  { route: "/json-to-xml",   from: "JSON", to: "XML",   fromColor: "text-amber-500", toColor: "text-red-500",    glow: "hover:border-amber-500/30 hover:shadow-amber-500/8" },
  { route: "/json-to-yaml",  from: "JSON", to: "YAML",  fromColor: "text-amber-500", toColor: "text-lime-600",   glow: "hover:border-lime-500/30 hover:shadow-lime-500/8" },
  { route: "/json-to-csv",   from: "JSON", to: "CSV",   fromColor: "text-amber-500", toColor: "text-sky-500",    glow: "hover:border-sky-500/30 hover:shadow-sky-500/8" },
  { route: "/xml-to-json",   from: "XML",  to: "JSON",  fromColor: "text-red-500",   toColor: "text-amber-500", glow: "hover:border-red-500/30 hover:shadow-red-500/8" },
  { route: "/yaml-to-json",  from: "YAML", to: "JSON",  fromColor: "text-lime-600",  toColor: "text-amber-500", glow: "hover:border-lime-500/30 hover:shadow-lime-500/8" },
  { route: "/csv-to-json",   from: "CSV",  to: "JSON",  fromColor: "text-sky-500",   toColor: "text-amber-500", glow: "hover:border-sky-500/30 hover:shadow-sky-500/8" },
];

export function ConversionGrid() {
  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-2 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl font-bold tracking-tight text-[var(--workspace-text)] md:text-3xl"
          >
            Format Conversions
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="text-sm text-[var(--workspace-text-muted)]"
          >
            One-click conversion between all major data formats
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          {CONVERSIONS.map(({ route, from, to, fromColor, toColor, glow }) => (
            <Link
              key={route}
              href={route}
              className={`group flex items-center justify-center gap-2.5 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-4 font-mono text-sm font-medium shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${glow}`}
            >
              <span className={fromColor}>{from}</span>
              <ArrowRightIcon
                className="h-3.5 w-3.5 text-[var(--workspace-text-muted)] transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
              <span className={toColor}>{to}</span>
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
