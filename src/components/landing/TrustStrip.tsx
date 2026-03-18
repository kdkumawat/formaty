"use client";

import { motion } from "framer-motion";
import { ShieldCheckIcon, UserIcon, BoltIcon } from "@heroicons/react/24/outline";

const ITEMS = [
  { icon: ShieldCheckIcon, text: "Runs locally" },
  { icon: UserIcon, text: "No signup" },
  { icon: BoltIcon, text: "Free" },
];

export function TrustStrip() {
  return (
    <section className="border-y border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-6 md:gap-12">
        {ITEMS.map(({ icon: Icon, text }, i) => (
          <motion.div
            key={text}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.05 * i }}
            className="flex items-center gap-2 text-[var(--workspace-text-muted)]"
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="text-xs font-medium">{text}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
