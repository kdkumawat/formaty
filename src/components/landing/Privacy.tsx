"use client";

import { motion } from "framer-motion";
import { CheckIcon } from "@heroicons/react/24/outline";

const CLAIMS = [
  {
    title: "Runs in your browser",
    desc: "Formatting, conversion, comparison, queries, and type generation all execute client-side in a Web Worker.",
  },
  {
    title: "Works offline",
    desc: "After the first visit, the whole app runs from a cached service worker - no network needed.",
  },
  {
    title: "No signup",
    desc: "There are no accounts, no logins, and no cloud persistence. Just open and use it.",
  },
  {
    title: "No uploads for local workflows",
    desc: "Transform, compare, and utils never send your data anywhere. Your data stays in your browser.",
  },
  {
    title: "Explicit, optional exceptions",
    desc: "Sharing encodes your state into the link you choose to copy. Executing a cURL request talks to the API you point it at. Both are explicit actions.",
  },
];

export function Privacy() {
  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl space-y-4 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Privacy
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]">
            Your data stays yours.
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            Formaty is a local-first developer tool. For every local workflow - format, convert,
            compare, query, generate - your data never leaves your device.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-2"
        >
          {CLAIMS.map(({ title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] p-5"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckIcon className="h-3 w-3 text-emerald-500" aria-hidden />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-[var(--workspace-text)]">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--workspace-text-muted)]">{desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 }}
          className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-[var(--workspace-text-muted)]"
        >
          Share links encode your data into the URL itself - nothing is stored on a server, and
          nothing is transmitted until you decide to send the link. Local session state is kept in
          your browser&apos;s localStorage only.
        </motion.p>
      </div>
    </section>
  );
}
