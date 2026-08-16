import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/components/Logo";
import { GUIDE_ROUTES, getGuideConfig } from "@/lib/guides";
import { getCanonicalUrl, getPlayUrl, SITE_URL } from "@/lib/seo";
import { getPageConfigByRoute } from "@/lib/seoUtils";

export async function generateStaticParams() {
  return GUIDE_ROUTES.map((slug) => ({ slug }));
}

/** With `output: "export"`, unknown paths must 404 - not try to render on demand. */
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = getGuideConfig(slug);
  if (!config) return {};
  const canonical = getCanonicalUrl(`/guides/${slug}`);
  return {
    title: config.title,
    description: config.description,
    alternates: { canonical },
    openGraph: {
      title: `${config.title} | Formaty`,
      description: config.description,
      url: canonical,
      siteName: "Formaty",
      type: "article",
      images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: config.h1 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${config.title} | Formaty`,
      description: config.description,
      images: [`${SITE_URL}/og.png`],
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = getGuideConfig(slug);
  if (!config) notFound();
  const canonical = getCanonicalUrl(`/guides/${slug}`);
  const tool = getPageConfigByRoute(config.toolRoute);
  const playUrl = getPlayUrl(config.toolRoute);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Formaty", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${SITE_URL}/guides` },
      { "@type": "ListItem", position: 3, name: config.h1, item: canonical },
    ],
  };

  const faqLd =
    config.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: config.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <article className="min-h-screen bg-[var(--workspace-background)]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--workspace-border)] bg-[var(--workspace-background)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-0.5 text-[var(--workspace-text)] transition-opacity hover:opacity-85"
          >
            <Logo size={22} />
            <span className="text-lg font-bold tracking-tight text-primary">ormaty</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/tools"
              className="hidden rounded-lg px-3 py-1.5 text-sm text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)] sm:inline-flex"
            >
              Tools
            </Link>
            <Link
              href="/playground"
              className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-all hover:scale-[1.03]"
            >
              Playground
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)]">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
          <nav className="mb-5 flex items-center gap-1.5 text-xs text-[var(--workspace-text-muted)]">
            <Link href="/" className="transition-colors hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/guides" className="transition-colors hover:text-primary">Guides</Link>
            <span>/</span>
            <span className="text-[var(--workspace-text)]">{config.h1}</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--workspace-text)] md:text-3xl">
            {config.h1}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[var(--workspace-text-muted)]">
            {config.intro}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Steps */}
        <ol className="space-y-8">
          {config.steps.map((step, i) => (
            <li key={step.heading}>
              <div className="flex items-baseline gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <h2 className="text-base font-semibold text-[var(--workspace-text)]">{step.heading}</h2>
              </div>
              <p className="mt-2 pl-9 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
                {step.body}
              </p>
              {step.code && (
                <div className="mt-3 pl-9">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                    {step.code.label}
                  </p>
                  <pre className="overflow-x-auto rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4 font-mono text-xs leading-relaxed text-[var(--workspace-text)]">
                    {step.code.content}
                  </pre>
                </div>
              )}
            </li>
          ))}
        </ol>

        {/* Tool CTA */}
        <div className="relative mt-12 overflow-hidden rounded-2xl border border-primary/25 bg-[var(--workspace-panel)] p-6">
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-primary/[0.03]" aria-hidden />
          <h2 className="relative text-lg font-semibold text-[var(--workspace-text)]">Try this in Formaty</h2>
          <p className="relative mt-1 text-sm text-[var(--workspace-text-muted)]">
            {config.toolCta} - free, local-first, no data leaves your browser.
          </p>
          <Link
            href={playUrl}
            className="group relative mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.03] hover:shadow-primary/30"
          >
            Open {tool?.h1 ?? "the tool"}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        {/* FAQ */}
        {config.faq.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-[var(--workspace-text)]">FAQ</h2>
            <div className="space-y-3">
              {config.faq.map((f) => (
                <details
                  key={f.q}
                  className="group rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3"
                >
                  <summary className="cursor-pointer list-none text-sm font-medium text-[var(--workspace-text)]">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--workspace-text-muted)]">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Related tools */}
        {config.relatedTools.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-[var(--workspace-text)]">Related tools</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {config.relatedTools.map((route) => {
                const c = getPageConfigByRoute(route);
                if (!c) return null;
                return (
                  <Link
                    key={route}
                    href={`/${route}`}
                    className="group flex items-center justify-between rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
                  >
                    <span className="text-sm font-medium text-[var(--workspace-text)] group-hover:text-primary">
                      {c.h1}
                    </span>
                    <ArrowRightIcon className="h-3.5 w-3.5 text-[var(--workspace-text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Related guides */}
        {config.relatedGuides.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-[var(--workspace-text)]">More guides</h2>
            <ul className="space-y-2">
              {config.relatedGuides.map((slug) => {
                const g = getGuideConfig(slug);
                if (!g) return null;
                return (
                  <li key={slug}>
                    <Link
                      href={`/guides/${slug}`}
                      className="text-sm text-[var(--workspace-text-muted)] transition-colors hover:text-primary"
                    >
                      {g.h1}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
    </article>
  );
}
