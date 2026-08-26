"use client";

import { motion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Reveal } from "@/components/motion";
import { fadeUp, staggerContainer } from "@/lib/motion";

const CLAIMS = [
  {
    title: "Open source",
    desc: "The whole app is on GitHub. Read the code, audit the worker, run your own copy.",
  },
  {
    title: "Service worker cache",
    desc: "After the first load, the app, fonts, and worker ship from a local cache. No CDN, no API on repeat visits.",
  },
  {
    title: "URL-only sharing",
    desc: "Share links encode your input into the URL itself - nothing is stored on a server until you decide to send it.",
  },
  {
    title: "No telemetry, no cookies",
    desc: "Analytics is opt-in and anonymized. No third-party trackers, no fingerprinting, no advertising.",
  },
];

export function Privacy() {
  return (
    <section id="privacy" className="scroll-mt-16 border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Privacy
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]">
            Your data stays yours.
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            Formaty is a local-first developer tool. Beyond the four points below, your data never leaves your device.
          </p>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2"
        >
          {CLAIMS.map(({ title, desc }) => (
            <motion.div
              key={title}
              variants={fadeUp}
              className="flex items-start gap-3 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] p-5"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckIcon className="h-3 w-3 text-emerald-500" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[var(--workspace-text)]">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--workspace-text-muted)]">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
