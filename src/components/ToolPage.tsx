import Link from "next/link";
import { Logo } from "@/components/Logo";
import type { ToolPageConfig, ToolRoute } from "@/lib/seo";
import { TOOL_PAGES } from "@/lib/seo";

interface ToolPageProps {
  config: ToolPageConfig;
}

function RelatedTools({ related }: { related: ToolRoute[] }) {
  return (
    <aside className="mt-12 rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
        Related tools
      </h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {related.map((route) => {
          const c = TOOL_PAGES[route];
          return (
            <li key={route}>
              <Link
                href={`/${route}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {c.h1}
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
      <header className="sticky top-0 z-10 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center text-[var(--workspace-text)] hover:opacity-80">
            <Logo size={24} />
            <span className="shrink-0 text-base font-bold text-primary">
              ormaty
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-sm text-[var(--workspace-text-muted)] hover:text-primary">
              Docs
            </Link>
            <Link href="/" className="text-sm text-[var(--workspace-text-muted)] hover:text-primary">
              ← All tools
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-[var(--workspace-text)]">{config.h1}</h1>
        <p className="mt-6 leading-relaxed text-[var(--workspace-text)]">{config.content}</p>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--workspace-text)]">Example</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--workspace-text-muted)]">Input</p>
              <pre className="overflow-x-auto rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4 text-sm text-[var(--workspace-text)]">
                {config.inputExample}
              </pre>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-[var(--workspace-text-muted)]">Output</p>
              <pre className="overflow-x-auto rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4 text-sm text-[var(--workspace-text)] whitespace-pre-wrap">
                {config.outputExample}
              </pre>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-[var(--workspace-text)]">Use cases</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[var(--workspace-text)]">
            {config.useCases.map((uc) => (
              <li key={uc}>{uc}</li>
            ))}
          </ul>
        </section>

        <div className="mt-10">
          <Link
            href={`/playground?tool=${config.route}`}
            className="btn btn-primary rounded-lg px-6 py-2.5 font-medium"
          >
            Try {config.h1} →
          </Link>
        </div>

        <RelatedTools related={config.relatedTools} />
      </div>
    </article>
  );
}
