import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FaqList, Footer, KeyLink, LINK, PageHero, RULE, WRAP } from "@/components/landing";
import { CodeBlock } from "@/components/CodeBlock";
import { GUIDE_ROUTES, getGuideConfig } from "@/lib/guides";
import { guessLang } from "@/lib/highlight";
import { getCanonicalUrl, getPlayUrl, SITE_URL } from "@/lib/seo";
import { getPageConfig } from "@/lib/seoUtils";

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
  const tool = getPageConfig(config.toolRoute);
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

  const slugId = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const related = config.relatedTools.flatMap((route) => {
    const c = getPageConfig(route);
    return c ? [{ route, label: c.h1 }] : [];
  });
  const guides = config.relatedGuides.flatMap((slug) => {
    const g = getGuideConfig(slug);
    return g ? [{ slug, label: g.h1 }] : [];
  });
  const H = "font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.03em]";
  /** The code in a step is SQL, TypeScript or JSON; the label says which when the text alone does not. */
  const langOf = (label: string, content: string) => (/typescript/i.test(label) ? "code" : /sql/i.test(label) ? "sql" : guessLang(content));

  return (
    <div className="min-h-screen bg-[var(--workspace-background)] text-[var(--workspace-text)]">
      <PageHero
        small
        crumbs={[{ label: "Formaty", href: "/" }, { label: "Guides", href: "/guides" }, { label: config.h1 }]}
        title={config.h1}
        intro={config.intro}
      />

      <main id="main" className={`${WRAP} grid gap-x-16 py-[clamp(28px,4vw,56px)] lg:grid-cols-[200px_minmax(0,1fr)]`}>
        <nav aria-label="On this page" className="hidden lg:block">
          <ol className="sticky top-24 flex flex-col text-[15px]">
            {config.steps.map((step) => (
              <li key={step.heading}>
                <a href={`#${slugId(step.heading)}`} className="block py-1.5 text-[var(--workspace-text-muted)] hover:text-[var(--workspace-text)] hover:underline">
                  {step.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-w-0 max-w-[70ch]">
          <ol className="flex flex-col gap-8">
            {config.steps.map((step, i) => (
              <li key={step.heading}>
                <h2 id={slugId(step.heading)} className={`scroll-mt-6 ${H}`}>
                  <span className="mr-3 text-[var(--workspace-text-muted)]">{i + 1}.</span>
                  {step.heading}
                </h2>
                <p className="mt-2 text-[16px] leading-[1.65] sm:text-[17px]">{step.body}</p>
                {step.code && <CodeBlock className="mt-4" code={step.code.content} label={step.code.label} language={langOf(step.code.label, step.code.content)} />}
              </li>
            ))}
          </ol>

          <section className={`mt-12 ${RULE} pt-8`}>
            <h2 className={H}>Try this in Formaty</h2>
            <p className="mt-2 text-[16px] leading-[1.65] text-[var(--workspace-text-muted)] sm:text-[17px]">
              {config.toolCta} - free, local-first, no data leaves your browser.
            </p>
            <KeyLink href={playUrl} className="mt-5">
              Open {tool?.h1 ?? "the tool"} in the playground
            </KeyLink>
          </section>

          {config.faq.length > 0 && (
            <section className="mt-12">
              <h2 className={`mb-3 ${H}`}>FAQ</h2>
              <FaqList items={config.faq} />
            </section>
          )}

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className={`mb-1 ${H}`}>Related tools</h2>
              <ul className="flex flex-wrap gap-x-6">
                {related.map((r) => (
                  <li key={r.route}><Link href={`/${r.route}`} className={LINK}>{r.label}</Link></li>
                ))}
              </ul>
            </section>
          )}

          {guides.length > 0 && (
            <section className="mt-8">
              <h2 className={`mb-1 ${H}`}>More guides</h2>
              <ul className="flex flex-wrap gap-x-6">
                {guides.map((g) => (
                  <li key={g.slug}><Link href={`/guides/${g.slug}`} className={LINK}>{g.label}</Link></li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>

      <Footer />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}
    </div>
  );
}
