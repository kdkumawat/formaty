"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-[var(--workspace-border)] px-4 py-16 md:py-24">
      {/* Grid */}
      <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden />

      {/* Blob A - top left */}
      <div
        className="blob-drift-a pointer-events-none absolute -left-20 -top-20 h-[500px] w-[500px]"
        style={{
          background: "radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
        aria-hidden
      />
      {/* Blob B - bottom right */}
      <div
        className="blob-drift-b pointer-events-none absolute -bottom-20 -right-20 h-[500px] w-[500px]"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
        aria-hidden
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative mx-auto max-w-2xl space-y-8 text-center"
      >
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-[var(--workspace-text)] sm:text-4xl md:text-5xl">
          Start working with your data.{" "}
          <span className="gradient-text">Right now.</span>
        </h2>
        <p className="text-base text-[var(--workspace-text-muted)] md:text-lg">
          No install. No sign-up. No data leaves your browser.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/playground"
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-content shadow-xl shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-primary/35 hover:shadow-2xl"
          >
            Open Playground
            <ArrowRightIcon
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <Link
            href="/json-formatter"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-6 py-3.5 text-base font-medium text-[var(--workspace-text)] shadow-sm transition-all hover:border-primary/40 hover:scale-[1.03] hover:shadow-md"
          >
            JSON Formatter
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
