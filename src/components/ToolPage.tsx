import Link from "next/link";
import { FinalCTA, Footer, SiteHeader, WRAP } from "@/components/landing";
import { ToolDemo } from "@/components/landing/ToolDemo";
import { initialInputs, resolveLive } from "@/components/landing/live/kinds";
import { presetState } from "@/components/landing/live/playLink";
import { FaqList, H2_SM, PageHero, PrivacyBand, PROSE } from "@/components/landing/PageParts";
import { LINK } from "@/components/landing/ui";
import { TOOL_PRESETS, type ToolPageConfig, type ToolRoute } from "@/lib/seo";
import type { UtilPageConfig } from "@/lib/seoUtils";
import { UTIL_PAGES, getPageConfig } from "@/lib/seoUtils";
import { INSTANT_PAGE } from "@/lib/seoInstant";

type PageConfig = ToolPageConfig | UtilPageConfig;

const SECTION = "grid gap-x-8 gap-y-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]";

const STEPS = [
  "Paste or type on the left.",
  "The result updates as you type.",
  "Copy it, or continue in the playground with the same input.",
];

/** Related tools as plain links. */
function RelatedTools({ related }: { related: string[] }) {
  const links = related.flatMap((route) => {
    const isInstant = route === "instant";
    const c = isInstant ? INSTANT_PAGE : getPageConfig(route);
    if (!c) return [];
    const href = isInstant || route in UTIL_PAGES ? `/utils/${route}` : `/${route}`;
    return [{ route, href, label: c.h1 }];
  });
  if (!links.length) return null;
  return (
    <section className={SECTION}>
      <h2 className={H2_SM}>Related tools</h2>
      <ul className="grid gap-x-8 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.route} className="border-b border-[var(--workspace-border)]">
            <Link href={l.href} className={`${LINK} w-full`}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ToolPage({ config }: { config: PageConfig }) {
  const isUtil = "util" in config;
  const playUrl = isUtil ? `/playground?util=${config.util}` : `/playground?tool=${config.route}`;
  const spec = resolveLive(config.route, isUtil ? config.util : undefined);
  const live = spec.kind !== "static";
  const preset = isUtil ? {} : (TOOL_PRESETS[config.route as ToolRoute] ?? {});
  const { a, b } = initialInputs(spec, config, preset);
  // Mirrors the FAQPage JSON-LD emitted on this route.
  const faq = [
    {
      q: `How do I use the ${config.h1} tool?`,
      a: `Open the ${config.h1} page, paste or type your data, and the tool processes it instantly - all in your browser with no upload.`,
    },
    {
      q: `Is the ${config.h1} tool free?`,
      a: "Yes. Every Formaty tool is free, requires no sign-up, and runs 100% locally in your browser.",
    },
    {
      q: `Does the ${config.h1} tool upload my data?`,
      a: "No. All processing happens locally in your browser using Web Workers. Your data never leaves your device.",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--workspace-background)] text-[var(--workspace-text)]">
      {/* The stage always carries an amber key here (the tool's Copy, or the page's own action), so the header link starts plain. */}
      <SiteHeader quiet />
      <main id="main" className="flex-1">
        <PageHero
          header={false}
          small
          tight={live}
          crumbs={[
            { label: "Formaty", href: "/" },
            isUtil ? { label: "Utils", href: "/utils" } : { label: "Tools", href: "/tools" },
            { label: config.h1 },
          ]}
          title={config.h1}
          intro={config.description}
          action={live ? undefined : { href: playUrl, label: `Open ${config.h1} in the playground` }}
          window={
            <ToolDemo
              spec={spec}
              a={a}
              b={b}
              inputExample={config.inputExample}
              outputExample={config.outputExample}
              playBase={presetState(preset)}
              playFallback={playUrl}
            />
        }
      />

        <div className={`${WRAP} flex flex-col gap-[clamp(40px,5vw,72px)] py-[clamp(40px,5vw,72px)]`}>
          <section className={SECTION}>
            <h2 className={H2_SM}>What it does</h2>
            <div className="flex flex-col gap-4">
              {config.content.split("\n\n").map((para, i) => (
                <p key={i} className={PROSE}>{para}</p>
              ))}
            </div>
          </section>

          <section className={SECTION}>
            <h2 className={H2_SM}>When to use it</h2>
            <ul className="border-t border-[var(--workspace-border)]">
              {config.useCases.map((uc) => (
                <li key={uc} className="border-b border-[var(--workspace-border)] py-3.5 text-[16px] leading-[1.5]">{uc}</li>
              ))}
            </ul>
          </section>

          {spec.kind !== "static" && (
            <section className={SECTION}>
              <h2 className={H2_SM}>How it works here</h2>
              <ol className="border-t border-[var(--workspace-border)]">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex gap-4 border-b border-[var(--workspace-border)] py-3.5 text-[16px] leading-[1.5]">
                    <span aria-hidden className="w-6 flex-none font-display text-lg font-bold tabular-nums text-[var(--workspace-text-muted)]">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <RelatedTools related={config.relatedTools} />
        </div>

        <PrivacyBand />

        <section className={`${WRAP} ${SECTION} pb-[clamp(40px,5vw,72px)] pt-[clamp(40px,5vw,72px)]`}>
          <h2 className={H2_SM}>FAQ</h2>
          <FaqList items={faq} />
        </section>
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
