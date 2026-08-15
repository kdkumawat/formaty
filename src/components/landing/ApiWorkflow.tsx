"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const STEPS = [
  {
    label: "Paste cURL",
    code: "curl -X GET \"https://api.github.com/users/octocat\"",
    color: "text-sky-400",
  },
  {
    label: "Response",
    code: `{
  "login": "octocat",
  "id": 583231,
  "type": "User"
}`,
    color: "text-amber-400",
  },
  {
    label: "Inspect",
    code: "tree · table · graph · query",
    color: "text-emerald-400",
  },
  {
    label: "Generate",
    code: "types · schema · SQL · fetch/axios",
    color: "text-violet-400",
  },
];

export function ApiWorkflow() {
  return (
    <section className="border-t border-[var(--workspace-border)] px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl space-y-4 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            API debugging
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]">
            From cURL to useful data.
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            Inspect and transform API responses without leaving your browser - format, query, diff,
            and generate code from the same response.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-10 max-w-4xl"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ label, code, color }, i) => (
              <div
                key={label}
                className="relative flex flex-col gap-2.5 rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4"
              >
                {i < STEPS.length - 1 && (
                  <ArrowRightIcon
                    className="absolute -right-3 top-1/2 z-10 hidden h-4 w-4 -translate-y-1/2 text-[var(--workspace-text-muted)] lg:block"
                    aria-hidden
                  />
                )}
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--workspace-text-muted)]">
                  {String(i + 1).padStart(2, "0")} · {label}
                </span>
                <pre className={`min-h-[70px] overflow-x-auto font-mono text-[10.5px] leading-relaxed ${color}`}>
                  {code}
                </pre>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              { label: "HTTP status", to: "" },
              { label: "Response headers", to: "" },
              { label: "Timing & size", to: "" },
              { label: "cURL → fetch / axios / python / go", to: "/curl-to-fetch" },
            ].map(({ label, to }) =>
              to ? (
                <Link
                  key={label}
                  href={to}
                  className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3.5 py-1.5 font-mono text-[11px] text-[var(--workspace-text)] transition-all hover:border-primary/50 hover:text-primary"
                >
                  {label}
                </Link>
              ) : (
                <span
                  key={label}
                  className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3.5 py-1.5 font-mono text-[11px] text-[var(--workspace-text)]"
                >
                  {label}
                </span>
              ),
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
