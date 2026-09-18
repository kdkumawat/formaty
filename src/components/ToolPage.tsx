"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon, ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/landing/Footer";
import type { ToolPageConfig } from "@/lib/seo";
import type { UtilPageConfig } from "@/lib/seoUtils";
import { UTIL_PAGES, getPageConfig } from "@/lib/seoUtils";
import { INSTANT_PAGE } from "@/lib/seoInstant";
import { getToolAccent, type ToolAccent } from "@/lib/toolAccents";

type PageConfig = ToolPageConfig | UtilPageConfig;

interface ToolPageProps {
  config: PageConfig;
}

/* ─────────────────────────── Code windows ─────────────────────────── */

/** Minimal tokenizer for the example window: keys, strings, numbers, comments, punctuation. */
function Highlighted({ code, accent }: { code: string; accent: ToolAccent }) {
  const lines = code.split("\n");
  return (
    <pre className="whitespace-pre font-mono text-[11.5px] leading-[1.75] text-[var(--workspace-text)]">
      {lines.map((line, li) => {
        const tokens: React.JSX.Element[] = [];
        // Simple stateful scan: strings, numbers, comments, punctuation.
        let i = 0;
        let buf = "";
        const flush = (cls?: string) => {
          if (buf) {
            tokens.push(
              cls
                ? <span key={tokens.length} className={cls}>{buf}</span>
                : <span key={tokens.length}>{buf}</span>,
            );
            buf = "";
          }
        };
        while (i < line.length) {
          const ch = line[i];
          // string
          if (ch === '"' || ch === "'") {
            flush();
            const quote = ch;
            let j = i + 1;
            while (j < line.length && line[j] !== quote) j++;
            const end = Math.min(j + 1, line.length);
            tokens.push(
              <span key={tokens.length} className={accent.value}>
                {line.slice(i, end)}
              </span>,
            );
            i = end;
            continue;
          }
          // number
          if (/[0-9]/.test(ch) && (i === 0 || /[^A-Za-z0-9_]/.test(line[i - 1]))) {
            flush();
            let j = i;
            while (j < line.length && /[0-9a-fA-FxX.]/.test(line[j])) j++;
            tokens.push(
              <span key={tokens.length} className="text-amber-500">
                {line.slice(i, j)}
              </span>,
            );
            i = j;
            continue;
          }
          // comment
          if (ch === "#" || (ch === "/" && line[i + 1] === "/")) {
            flush();
            tokens.push(
              <span key={tokens.length} className="text-[var(--workspace-text-muted)]/70">
                {line.slice(i)}
              </span>,
            );
            i = line.length;
            continue;
          }
          // key: "word" followed by : or = (JSON/YAML/TOML/TS-style keys)
          if (/[A-Za-z_$]/.test(ch)) {
            let j = i;
            while (j < line.length && /[A-Za-z0-9_$]/.test(line[j])) j++;
            const word = line.slice(i, j);
            let k = j;
            while (k < line.length && line[k] === " ") k++;
            const next = line[k];
            if (next === ":" || next === "=") {
              flush();
              tokens.push(
                <span key={tokens.length} className={accent.key}>
                  {word}
                </span>,
              );
              i = j;
              continue;
            }
            buf += word;
            i = j;
            continue;
          }
          buf += ch;
          i++;
        }
        flush();
        return (
          <span key={li} className="block">
            {tokens.length ? tokens : "\u00A0"}
            {li < lines.length - 1 ? "" : ""}
          </span>
        );
      })}
    </pre>
  );
}

/** Fallback for non-code examples (e.g. "v4 · v1 · v7 · v5" for UUID). */
function PlainExample({ code, accent }: { code: string; accent: ToolAccent }) {
  return (
    <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-[1.75]">
      <span className={accent.value}>{code}</span>
    </pre>
  );
}

function ExamplePane({
  title,
  code,
  accent,
  tone,
}: {
  title: string;
  code: string;
  accent: ToolAccent;
  tone: "input" | "output";
}) {
  // Heuristic: only highlight when it looks like code.
  const looksLikeCode = /[{[<>:$=]|\/\//.test(code) && code.length > 20;
  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${tone === "input" ? "bg-rose-400" : "bg-emerald-400"}`} />
        <p
          className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
            tone === "input" ? "text-[var(--workspace-text-muted)]" : accent.text
          }`}
        >
          {title}
        </p>
      </div>
      <div className="relative flex-1 overflow-x-auto rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)]/70 p-4">
        {looksLikeCode ? <Highlighted code={code} accent={accent} /> : <PlainExample code={code} accent={accent} />}
      </div>
    </div>
  );
}

function ExampleWindow({ config, accent }: { config: PageConfig; accent: ToolAccent }) {
  return (
    <div className="relative">
      {/* Rim glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-[1.15rem]"
        style={{
          background: `linear-gradient(135deg, rgba(${accent.rgb},0.45) 0%, rgba(${accent.rgb},0.2) 45%, rgba(${accent.rgb},0.1) 100%)`,
          filter: "blur(1px)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -inset-8 rounded-3xl"
        style={{
          background: `radial-gradient(ellipse, rgba(${accent.rgb},0.12) 0%, transparent 65%)`,
          filter: "blur(30px)",
        }}
        aria-hidden
      />
      {/* Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] shadow-2xl shadow-black/20">
        {/* Mac chrome */}
        <div className="flex items-center gap-1.5 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <span className="ml-3 font-mono text-xs text-[var(--workspace-text-muted)]">
            formaty · {config.route}
          </span>
          <span className="ml-auto flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Valid
          </span>
        </div>
        {/* Panes */}
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:divide-x sm:divide-[var(--workspace-border)]">
          <ExamplePane title="Input" code={config.inputExample} accent={accent} tone="input" />
          <ExamplePane title="Output" code={config.outputExample} accent={accent} tone="output" />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Sections ─────────────────────────── */

function RelatedTools({ related }: { related: string[] }) {
  return (
    <section className="mt-16">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--workspace-text-muted)]">
          Related tools
        </h2>
        <div className="h-px flex-1 bg-[var(--workspace-border)]" />
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {related.map((route) => {
          const isInstant = route === "instant";
          const c = isInstant ? INSTANT_PAGE : getPageConfig(route);
          if (!c) return null;
          const href = isInstant || route in UTIL_PAGES ? `/utils/${route}` : `/${route}`;
          const ra = getToolAccent(route);
          return (
            <li key={route}>
              <Link
                href={href}
                className="group flex items-center justify-between rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                <span className="flex items-center gap-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${ra.solid}`} aria-hidden />
                  <span className="text-sm font-medium text-[var(--workspace-text)] group-hover:text-primary">
                    {c.h1}
                  </span>
                </span>
                <ArrowRightIcon className="h-3.5 w-3.5 text-[var(--workspace-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function UseCases({ items, accent }: { items: string[]; accent: ToolAccent }) {
  return (
    <div className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6">
      <h2 className="mb-4 text-sm font-semibold text-[var(--workspace-text)]">Use cases</h2>
      <ul className="space-y-3">
        {items.map((uc) => (
          <li key={uc} className="flex items-start gap-2.5 text-sm text-[var(--workspace-text-muted)]">
            <CheckCircleIcon className={`mt-0.5 h-4 w-4 shrink-0 ${accent.text}`} aria-hidden />
            {uc}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CtaCard({ config, accent }: { config: PageConfig; accent: ToolAccent }) {
  const playUrl =
    "util" in config ? `/playground?util=${config.util}` : `/playground?tool=${config.route}`;
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-[var(--workspace-panel)] p-6">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 90% 70% at 50% -10%, rgba(${accent.rgb},0.1) 0%, transparent 70%)`,
        }}
        aria-hidden
      />
      <div className="relative">
        <h3 className="mb-2 font-semibold text-[var(--workspace-text)]">{config.h1}</h3>
        <p className="mb-4 text-sm text-[var(--workspace-text-muted)]">
          Free, local-first — no data leaves your browser.
        </p>
        <Link
          href={playUrl}
          className="group flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:shadow-primary/30"
        >
          Open Tool
          <ArrowRightIcon
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────── Page ─────────────────────────── */

export function ToolPage({ config }: ToolPageProps) {
  const playUrl =
    "util" in config ? `/playground?util=${config.util}` : `/playground?tool=${config.route}`;
  const accent = getToolAccent(config.route);

  return (
    <article className="flex min-h-screen flex-col bg-[var(--workspace-background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--workspace-border)]/70 bg-[var(--workspace-background)]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link
            href="/"
            aria-label="Formaty home"
            className="flex items-center gap-0.5 text-[var(--workspace-text)] transition-opacity hover:opacity-85"
          >
            <Logo size={22} />
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/docs"
              className="hidden rounded-lg px-3 py-1.5 text-sm text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] sm:inline-flex"
            >
              Docs
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1.5 text-sm text-[var(--workspace-text-muted)] transition-colors hover:border-primary/30 hover:text-primary"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              All tools
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[var(--workspace-border)]">
        <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="blob-drift-a pointer-events-none absolute -right-32 -top-40 h-[560px] w-[560px]"
          style={{
            background: `radial-gradient(circle, rgba(${accent.rgb},0.16) 0%, rgba(${accent.rgb},0.05) 45%, transparent 65%)`,
            filter: "blur(64px)",
          }}
          aria-hidden
        />
        <div
          className="blob-drift-b pointer-events-none absolute -bottom-44 -left-28 h-[480px] w-[480px]"
          style={{
            background: `radial-gradient(circle, rgba(${accent.rgb},0.12) 0%, rgba(${accent.rgb},0.04) 45%, transparent 65%)`,
            filter: "blur(64px)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-20">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-6 flex items-center gap-1.5 text-xs text-[var(--workspace-text-muted)]"
          >
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
            <span>/</span>
            <span className="text-[var(--workspace-text)]">{config.h1}</span>
          </motion.nav>

          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left: copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold"
                style={{
                  borderColor: `rgba(${accent.rgb},0.35)`,
                  background: `rgba(${accent.rgb},0.08)`,
                  color: "var(--workspace-text)",
                }}
              >
                <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${accent.solid}`} aria-hidden />
                <span className={accent.text}>Local-first</span>
                <span className="text-[var(--workspace-text-muted)]">·</span>
                <span className="text-[var(--workspace-text-muted)]">100% free · no signup</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.06 }}
                className="mt-5 text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--workspace-text)] md:text-5xl"
              >
                {config.h1}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.13 }}
                className="mt-4 max-w-lg text-base leading-relaxed text-[var(--workspace-text-muted)]"
              >
                {config.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mt-7 flex flex-wrap gap-3"
              >
                <Link
                  href={playUrl}
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/35"
                >
                  Try {config.h1}
                  <ArrowRightIcon
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <Link
                  href="/playground"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-5 py-2.5 text-sm font-medium text-[var(--workspace-text)] shadow-sm transition-all hover:scale-[1.03] hover:border-primary/40"
                >
                  Open Playground
                </Link>
              </motion.div>

              {/* Trust row */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.28 }}
                className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2"
              >
                {[
                  ["Web Worker", "processing"],
                  ["Works offline", "after first visit"],
                  ["No uploads", "ever"],
                ].map(([v, l]) => (
                  <div key={v} className="flex items-center gap-1.5">
                    <CheckCircleIcon className={`h-3.5 w-3.5 ${accent.text}`} aria-hidden />
                    <span className="text-xs font-semibold text-[var(--workspace-text)]">{v}</span>
                    <span className="text-xs text-[var(--workspace-text-muted)]">{l}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right: example window */}
            <motion.div
              initial={{ opacity: 0, x: 28, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.65, delay: 0.18, type: "spring", stiffness: 80 }}
            >
              <ExampleWindow config={config} accent={accent} />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-14">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Left column: about */}
          <div className="lg:col-span-2">
            <section>
              <div className="mb-5 flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--workspace-text)]">About</h2>
                <div className="h-px flex-1 bg-[var(--workspace-border)]" />
              </div>
              <div className="space-y-4 text-[15px] leading-relaxed text-[var(--workspace-text-muted)]">
                {config.content.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>

            <RelatedTools related={config.relatedTools} />

            {/* FAQ - mirrors the FAQPage JSON-LD emitted on this route */}
            <section className="mt-16">
              <div className="mb-5 flex items-center gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--workspace-text-muted)]">
                  FAQ
                </h2>
                <div className="h-px flex-1 bg-[var(--workspace-border)]" />
              </div>
              <div className="space-y-3">
                <details className="group rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-medium text-[var(--workspace-text)]">
                    How do I use the {config.h1} tool?
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
                    Open the {config.h1} page, paste or type your data, and the tool processes it
                    instantly - all in your browser with no upload.
                  </p>
                </details>
                <details className="group rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-medium text-[var(--workspace-text)]">
                    Is the {config.h1} tool free?
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
                    Yes. Every Formaty tool is free, requires no sign-up, and runs 100% locally in
                    your browser.
                  </p>
                </details>
                <details className="group rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-medium text-[var(--workspace-text)]">
                    Does the {config.h1} tool upload my data?
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
                    No. All processing happens locally in your browser using Web Workers. Your data
                    never leaves your device.
                  </p>
                </details>
              </div>
            </section>
          </div>

          {/* Right column: use cases + CTA */}
          <div className="space-y-6">
            <UseCases items={config.useCases} accent={accent} />
            <CtaCard config={config} accent={accent} />
          </div>
        </div>
      </div>

      <Footer />
    </article>
  );
}
