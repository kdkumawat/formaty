import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/landing/Footer";
import { SITE_URL } from "@/lib/seo";
import { INSTANT_PAGE } from "@/lib/seoInstant";
import { getToolAccent } from "@/lib/toolAccents";
import { UTIL_PAGES, UTIL_ROUTES } from "@/lib/seoUtils";

const SITE_NAME = "Formaty";
const TITLE = "Developer Utils - Free Online Tools | Formaty";
const DESCRIPTION =
  "17+ free online developer utils: UUID generator, Base64 encoder, JWT decoder, SHA hash, password generator, URL encode/parse, case converter, regex tester, color converter, cron explainer, timezone converter and more. No sign-up, runs locally in your browser.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "developer utils",
    "developer tools online",
    "uuid generator online",
    "base64 encode decode",
    "jwt decoder online",
    "sha-256 hash generator",
    "password generator online",
    "url encoder decoder",
    "regex tester online",
    "color converter online",
    "cron expression explainer",
    "timezone converter",
    "lorem ipsum generator",
    "text case converter",
    "hex converter",
    "html entity encoder",
    "json string escape",
    "number base converter",
    "local-first",
    "no signup",
    "free developer tools",
  ],
  alternates: { canonical: "/utils" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/utils`,
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og.png`],
  },
};

/** Group utils into scannable categories. */
const UTIL_GROUPS: Array<{ title: string; blurb: string; routes: string[] }> = [
  {
    title: "Identifiers & encoding",
    blurb: "Generate IDs and move data safely between encodings.",
    routes: ["uuid-generator", "base64-encoder", "hex-converter", "number-base-converter", "json-string-escape", "html-encoder"],
  },
  {
    title: "Auth & security",
    blurb: "Inspect tokens, hash values, and create strong secrets.",
    routes: ["jwt-decoder", "sha-hash-generator", "password-generator"],
  },
  {
    title: "Text & patterns",
    blurb: "Reshape text and test expressions before they ship.",
    routes: ["text-case-converter", "regex-tester", "lorem-ipsum-generator", "text-stats", "url-encoder-decoder", "url-parser"],
  },
  {
    title: "Time & data formats",
    blurb: "Decode timestamps, schedules, and color values.",
    routes: ["instant", "cron-expression-explainer", "color-converter"],
  },
];

/** Config lookup that also resolves the /utils/instant page. */
function configFor(route: string) {
  return route === "instant" ? INSTANT_PAGE : UTIL_PAGES[route];
}

export default function UtilsIndexPage() {
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Formaty developer utils",
    description: DESCRIPTION,
    itemListElement: [...UTIL_ROUTES, "instant"].map((route, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: configFor(route).h1,
      url: `${SITE_URL}/utils/${route}`,
    })),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Developer Utils", item: `${SITE_URL}/utils` },
    ],
  };

  return (
    <article className="flex min-h-screen flex-col bg-[var(--workspace-background)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

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
              href="/playground"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-[1.03]"
            >
              Open Playground
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
            background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, rgba(139,92,246,0.05) 45%, transparent 65%)",
            filter: "blur(64px)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-20">
          <nav className="mb-6 flex items-center gap-1.5 text-xs text-[var(--workspace-text-muted)]">
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
            <span>/</span>
            <span className="text-[var(--workspace-text)]">Utils</span>
          </nav>
          <h1 className="max-w-2xl text-[2.1rem] font-semibold leading-[1.05] tracking-[-0.03em] text-[var(--workspace-text)] md:text-5xl">
            Developer utils,{" "}
            <span className="gradient-text">all in one place.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--workspace-text-muted)]">
            17+ free online utilities for everyday engineering work — identifiers, encoding, hashing,
            text reshaping, timezones, and format conversion. Everything runs locally in your
            browser: no sign-up, no uploads, no limits.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/playground"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-primary/35"
            >
              Open Playground
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <Link
              href="/json-formatter"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-5 py-2.5 text-sm font-medium text-[var(--workspace-text)] shadow-sm transition-all hover:scale-[1.03] hover:border-primary/40"
            >
              Format JSON
            </Link>
          </div>
        </div>
      </div>

      {/* Utils grid */}
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-14">
        <div className="space-y-12">
          {UTIL_GROUPS.map((group) => (
            <section key={group.title}>
              <div className="mb-5 flex items-baseline gap-3">
                <h2 className="text-lg font-semibold text-[var(--workspace-text)]">{group.title}</h2>
                <span className="hidden text-sm text-[var(--workspace-text-muted)] sm:inline">{group.blurb}</span>
                <div className="ml-auto h-px flex-1 bg-[var(--workspace-border)]" />
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.routes
                  .filter((r) => r === "instant" || UTIL_ROUTES.includes(r))
                  .map((route) => {
                    const config = configFor(route);
                    const accent = getToolAccent(route);
                    return (
                      <li key={route}>
                        <Link
                          href={`/utils/${route}`}
                          className="group flex h-full flex-col rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                        >
                          <span className="flex items-center justify-between">
                            <span className="flex items-center gap-2.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${accent.solid}`} aria-hidden />
                              <span className="text-sm font-semibold text-[var(--workspace-text)] group-hover:text-primary">
                                {config.h1}
                              </span>
                            </span>
                            <ArrowRightIcon className="h-3.5 w-3.5 text-[var(--workspace-text-muted)] opacity-0 transition-all group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" />
                          </span>
                          <span className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--workspace-text-muted)]">
                            {config.description}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
      </div>

      <Footer />
    </article>
  );
}
