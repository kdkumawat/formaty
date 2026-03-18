"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--workspace-background)] px-4 py-10 md:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,80,200,0.08),transparent)]" aria-hidden />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12">
        <div className="flex-1 space-y-4 text-center lg:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-semibold tracking-tight text-[var(--workspace-text)] text-3xl md:text-5xl"
          >
            Work with Data. Instantly.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-sm md:text-base text-[var(--workspace-text-muted)]"
          >
            Format, convert, query, and visualize JSON, XML, YAML, TOML, and CSV — all in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-2 lg:justify-start"
          >
            <Link href="/playground" className="btn btn-primary btn-sm rounded-lg">
              Go to playground
            </Link>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-md flex-1"
        >
          <div className="rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-3">
            <div className="space-y-1 font-mono text-xs text-[var(--workspace-text-muted)]">
              <div>{"{"}</div>
              <div className="pl-3">"id": 1,</div>
              <div className="pl-3">"name": <span className="text-primary">"formaty"</span>,</div>
              <div className="pl-3">"tags": [<span className="text-primary">"json"</span>, <span className="text-primary">"yaml"</span>]</div>
              <div>{"}"}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
