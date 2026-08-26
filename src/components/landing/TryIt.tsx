"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { formatJson, minifyJson, parseJsonInput } from "@/lib/json/core";

const SAMPLE = '{"id":1,"name":"Alice","roles":["admin","dev"],"meta":{"active":true}}';

export function TryIt() {
  const [input, setInput] = useState(SAMPLE);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState(() => {
    try {
      return formatJson(parseJsonInput(SAMPLE), { indentation: 2 });
    } catch {
      return "";
    }
  });

  const run = (mode: "beautify" | "minify") => {
    try {
      const json = parseJsonInput(input);
      setError(null);
      setOutput(mode === "beautify" ? formatJson(json, { indentation: 2 }) : minifyJson(json));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input");
      setOutput("");
    }
  };

  const valid = useMemo(() => {
    try {
      parseJsonInput(input);
      return true;
    } catch {
      return false;
    }
  }, [input]);

  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)]/40 px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Try it right here
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--workspace-text)] sm:text-4xl">
            Paste JSON. Get results. No upload.
          </h2>
          <p className="mt-3 text-base text-[var(--workspace-text-muted)]">
            This runs the same engine as the playground, live in your browser.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] shadow-xl shadow-black/10"
        >
          {/* Input */}
          <div className="border-b border-[var(--workspace-border)] p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                Your JSON
              </p>
              <span
                className={`inline-flex items-center gap-1 font-mono text-[11px] font-semibold ${valid ? "text-emerald-500" : "text-red-400"}`}
                aria-live="polite"
              >
                {valid ? (
                  <CheckCircleIcon className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <ExclamationCircleIcon className="h-3.5 w-3.5" aria-hidden />
                )}
                {valid ? "Valid JSON" : "Invalid JSON"}
              </span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              rows={5}
              aria-label="JSON input"
              placeholder='Paste JSON, e.g. {"hello":"world"}'
              className="w-full resize-y rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] p-3 font-mono text-sm leading-relaxed text-[var(--workspace-text)] outline-none transition-colors focus:border-primary/50"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => run("beautify")}
                disabled={!valid}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SparklesIcon className="h-4 w-4" aria-hidden />
                Beautify
              </button>
              <button
                type="button"
                onClick={() => run("minify")}
                disabled={!valid}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-2 text-sm font-medium text-[var(--workspace-text)] transition-all hover:border-primary/40 hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Minify
              </button>
              <Link
                href="/playground"
                className="group ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary transition-colors hover:underline"
              >
                Open full playground
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Output */}
          <div className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
              Result
            </p>
            {error ? (
              <p
                role="alert"
                className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 font-mono text-sm text-red-300"
              >
                {error}
              </p>
            ) : (
              <pre
                aria-live="polite"
                aria-label="Formatted JSON output"
                className="max-h-64 overflow-auto rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] p-3 font-mono text-sm leading-relaxed text-[var(--workspace-text)]"
              >
                {output || " "}
              </pre>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
