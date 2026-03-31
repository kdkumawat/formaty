import Link from "next/link";
import { ArrowRightIcon, ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/components/Logo";
import type { ToolPageConfig, ToolRoute } from "@/lib/seo";
import { TOOL_PAGES } from "@/lib/seo";

interface ToolPageProps {
  config: ToolPageConfig;
}

function RelatedTools({ related }: { related: ToolRoute[] }) {
  return (
    <aside className="mt-12">
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--workspace-text-muted)]">
        Related tools
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {related.map((route) => {
          const c = TOOL_PAGES[route];
          return (
            <li key={route}>
              <Link
                href={`/${route}`}
                className="group flex items-center justify-between rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              >
                <span className="text-sm font-medium text-[var(--workspace-text)] group-hover:text-primary">
                  {c.h1}
                </span>
                <ArrowRightIcon className="h-3.5 w-3.5 text-[var(--workspace-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export function ToolPage({ config }: ToolPageProps) {
  return (
    <article className="min-h-screen bg-[var(--workspace-background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-0.5 text-[var(--workspace-text)] transition-opacity hover:opacity-85"
          >
            <Logo size={22} />
            <span className="text-lg font-bold tracking-tight text-primary">ormaty</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/docs"
              className="hidden rounded-lg px-3 py-1.5 text-sm text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] sm:inline-flex"
            >
              Docs
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-3 py-1.5 text-sm text-[var(--workspace-text-muted)] transition-colors hover:border-primary/30 hover:text-primary"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              All tools
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.08) 0%, transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl px-4 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="mb-5 flex items-center gap-1.5 text-xs text-[var(--workspace-text-muted)]">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span>/</span>
            <span className="text-[var(--workspace-text)]">{config.h1}</span>
          </nav>

          <h1 className="text-3xl font-bold tracking-tight text-[var(--workspace-text)] md:text-4xl">
            {config.h1}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--workspace-text-muted)]">
            {config.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/playground?tool=${config.route}`}
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-content shadow-lg shadow-primary/20 transition-all hover:scale-[1.03] hover:shadow-primary/30"
            >
              Try {config.h1}
              <ArrowRightIcon
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-5 py-2.5 text-sm font-medium text-[var(--workspace-text)] transition-all hover:border-primary/30 hover:scale-[1.03]"
            >
              Open Playground
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Left column: about + example */}
          <div className="space-y-10 lg:col-span-2">
            {/* About */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-[var(--workspace-text)]">
                About
              </h2>
              <div className="prose prose-sm max-w-none text-[var(--workspace-text-muted)]">
                {config.content.split("\n\n").map((para, i) => (
                  <p key={i} className="mb-3 leading-relaxed last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            </section>

            {/* Example */}
            <section>
              <h2 className="mb-4 text-lg font-semibold text-[var(--workspace-text)]">
                Example
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                      Input
                    </p>
                  </div>
                  <pre className="overflow-x-auto rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4 font-mono text-xs leading-relaxed text-[var(--workspace-text)]">
                    {config.inputExample}
                  </pre>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                      Output
                    </p>
                  </div>
                  <pre className="overflow-x-auto rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4 font-mono text-xs leading-relaxed text-[var(--workspace-text)] whitespace-pre-wrap">
                    {config.outputExample}
                  </pre>
                </div>
              </div>
            </section>

            {/* Relations */}
            <RelatedTools related={config.relatedTools} />
          </div>

          {/* Right column: use-cases + CTA */}
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6">
              <h2 className="mb-4 text-sm font-semibold text-[var(--workspace-text)]">
                Use cases
              </h2>
              <ul className="space-y-3">
                {config.useCases.map((uc) => (
                  <li key={uc} className="flex items-start gap-2.5 text-sm text-[var(--workspace-text-muted)]">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                    {uc}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-primary/25 bg-[var(--workspace-panel)] p-6">
              <div
                className="pointer-events-none absolute inset-0 rounded-xl bg-primary/[0.03]"
                aria-hidden
              />
              <h3 className="mb-2 font-semibold text-[var(--workspace-text)]">{config.h1}</h3>
              <p className="mb-4 text-sm text-[var(--workspace-text-muted)]">
                Free, local-first - no data leaves your browser.
              </p>
              <Link
                href={`/playground?tool=${config.route}`}
                className="group flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-content shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
              >
                Open Tool
                <ArrowRightIcon
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
