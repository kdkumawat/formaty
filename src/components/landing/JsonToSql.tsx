"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const SAMPLE_JSON = `[
  { "id": 1, "name": "Alice", "active": true },
  { "id": 2, "name": "Bob",   "active": false }
]`;

const SAMPLE_SQL = `CREATE TABLE items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  active BOOLEAN
);

INSERT INTO items (id, name, active) VALUES
  (1, 'Alice', true),
  (2, 'Bob', false);`;

export function JsonToSql() {
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
            JSON → SQL
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]">
            Turn JSON into a database schema.
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            Paste an API response and get a <span className="font-semibold text-[var(--workspace-text)]">CREATE TABLE</span> plus{" "}
            <span className="font-semibold text-[var(--workspace-text)]">INSERT seed rows</span> - with column types inferred
            from your data. PostgreSQL, MySQL, or SQLite.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2"
        >
          <div className="overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-background)]">
            <div className="flex items-center gap-2 border-b border-[var(--workspace-border)] px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                JSON
              </span>
              <span className="ml-auto font-mono text-[10px] text-[var(--workspace-text-muted)]">
                API response
              </span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-[var(--workspace-text)]">
              {SAMPLE_JSON}
            </pre>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-background)]">
            <div className="flex items-center gap-2 border-b border-[var(--workspace-border)] px-4 py-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                SQL
              </span>
              <span className="ml-auto flex gap-1">
                {["PostgreSQL", "MySQL", "SQLite"].map((d) => (
                  <span
                    key={d}
                    className="rounded border border-[var(--workspace-border)] px-1.5 py-0.5 font-mono text-[9px] text-[var(--workspace-text-muted)]"
                  >
                    {d}
                  </span>
                ))}
              </span>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-[var(--workspace-text)]">
              {SAMPLE_SQL}
            </pre>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/json-to-sql"
            className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.03]"
          >
            Open JSON → SQL
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
          <span className="text-xs text-[var(--workspace-text-muted)]">
            Choose table &amp; column names · quote style · nullable &amp; primary-key hints
          </span>
        </motion.div>
      </div>
    </section>
  );
}
