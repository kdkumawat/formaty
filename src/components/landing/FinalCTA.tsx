"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-[var(--workspace-border)] px-4 py-16 md:py-24">
      <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden />

      <div
        className="blob-drift-a pointer-events-none absolute -left-20 -top-20 h-[500px] w-[500px]"
        style={{
          background: "radial-gradient(circle, rgba(109,109,244,0.16) 0%, transparent 65%)",
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
        <h2 className="text-3xl font-semibold leading-tight tracking-tight text-[var(--workspace-text)] sm:text-4xl md:text-5xl">
          Have some data?
          <br />
          <span className="gradient-text">Paste it into Formaty.</span>
        </h2>
        <p className="text-base text-[var(--workspace-text-muted)] md:text-lg">
          Local, offline, no signup - open the playground and start.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/playground"
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-primary/35 hover:shadow-2xl"
          >
            Open Playground
            <ArrowRightIcon
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <Link
            href="/#tools"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-6 py-3.5 text-base font-medium text-[var(--workspace-text)] shadow-sm transition-all hover:border-primary/40 hover:scale-[1.03] hover:shadow-md"
          >
            Explore all tools
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
