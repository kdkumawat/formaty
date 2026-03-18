"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function FinalCTA() {
  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-10 md:py-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-xl space-y-6 text-center"
      >
        <h2 className="font-semibold tracking-tight text-[var(--workspace-text)] text-xl md:text-3xl">
          Start working with your data
        </h2>
        <Link href="/playground" className="btn btn-primary btn-sm rounded-lg">
          Open Editor
        </Link>
      </motion.div>
    </section>
  );
}
