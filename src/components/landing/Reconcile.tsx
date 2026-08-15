"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const PROD = ["1001", "1002", "1003", "1004", "1005"];
const STAGE = ["1002", "1003", "1005", "1006", "1007"];

const prodSet = new Set(PROD);
const stageSet = new Set(STAGE);
const common = PROD.filter((id) => stageSet.has(id));
const onlyProd = PROD.filter((id) => !stageSet.has(id));
const onlyStage = STAGE.filter((id) => !prodSet.has(id));

function SqlIn({ ids }: { ids: string[] }) {
  return (
    <span className="font-mono text-[10.5px] leading-relaxed">
      <span className="text-sky-400">WHERE</span>{" "}
      <span className="text-[var(--workspace-text)]">id IN (</span>
      {ids.map((id, i) => (
        <span key={id}>
          {i > 0 && <span className="text-[var(--workspace-text-muted)]">, </span>}
          <span className="text-emerald-500">&apos;{id}&apos;</span>
        </span>
      ))}
      <span className="text-[var(--workspace-text)]">)</span>
    </span>
  );
}

export function Reconcile() {
  return (
    <section className="relative overflow-hidden border-t border-[var(--workspace-border)] px-4 py-14 md:py-20">
      <div className="pointer-events-none absolute inset-0 hero-grid" aria-hidden />
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-[500px] w-[500px]"
        style={{
          background: "radial-gradient(circle, rgba(109,109,244,0.1) 0%, transparent 65%)",
          filter: "blur(56px)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl space-y-4 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Database debugging
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]">
            Debug database records without writing another script.
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            Paste the results of two <code className="rounded bg-[var(--workspace-panel)] px-1.5 py-0.5 font-mono text-[0.85em] text-primary">SELECT id FROM …</code> queries and see exactly which records are common, missing, or extra - then copy the result as SQL.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] shadow-xl shadow-black/10"
        >
          {/* Column labels */}
          <div className="grid grid-cols-2 divide-x divide-[var(--workspace-border)] border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]">
            <div className="flex items-center gap-2 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--workspace-text)]">
                Production
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--workspace-text)]">
                Staging
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 divide-x divide-[var(--workspace-border)]">
            {/* Inputs */}
            <div className="p-4 font-mono text-[11px] leading-relaxed">
              <p className="mb-2 text-sky-500/70 select-none">SELECT id FROM users;</p>
              <div className="space-y-1">
                {PROD.map((id) => (
                  <p key={id} className="text-[var(--workspace-text)]">{id}</p>
                ))}
              </div>
            </div>
            <div className="p-4 font-mono text-[11px] leading-relaxed">
              <p className="mb-2 text-violet-500/70 select-none">SELECT id FROM users;</p>
              <div className="space-y-1">
                {STAGE.map((id) => (
                  <p key={id} className="text-[var(--workspace-text)]">{id}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="border-t border-[var(--workspace-border)] bg-[var(--workspace-background)]">
            <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--workspace-border)] px-4 py-2">
              <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Common {common.length}
              </span>
              <span className="rounded-md bg-sky-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                Only prod {onlyProd.length}
              </span>
              <span className="rounded-md bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                Only stage {onlyStage.length}
              </span>
              <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                Duplicates
              </span>
            </div>
            <div className="grid gap-0 lg:grid-cols-2">
              <div className="space-y-2 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                  Only in Production - missing from Staging
                </p>
                <pre className="rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-3">
                  <SqlIn ids={onlyProd} />
                </pre>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                  Only in Staging - extra in Staging
                </p>
                <pre className="rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-3">
                  <SqlIn ids={onlyStage} />
                </pre>
              </div>
              <div className="space-y-2 border-t border-[var(--workspace-border)] p-4 lg:border-l lg:border-t-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                  What you get
                </p>
                <ul className="space-y-2 text-sm text-[var(--workspace-text-muted)]">
                  {[
                    "Common, missing, extra, and duplicate records at a glance",
                    "Copy as SQL IN, NOT IN, ANY(ARRAY[]), VALUES, or INSERT",
                    "Compare UUIDs, integers, strings, or any CSV column",
                    "Count-aware comparison - see how many extra occurrences each side has",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500/70" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/compare-lists"
                  className="group mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-[1.03] hover:shadow-primary/30"
                >
                  Compare two lists
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
