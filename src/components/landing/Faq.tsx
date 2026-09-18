"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

/** Questions mirror the FAQPage JSON-LD in src/app/layout.tsx. Keep in sync. */
const FAQS = [
  {
    q: "Is Formaty really free?",
    a: "Yes. Formaty is completely free with no sign-up required. Every tool — formatters, converters, compare, and developer utils — is free to use forever.",
  },
  {
    q: "Does Formaty upload my data to a server?",
    a: "No. Everything runs locally in your browser using WebWorkers. Your input never leaves your device, except when you explicitly use the Share feature to create a link.",
  },
  {
    q: "Which formats does Formaty support?",
    a: "JSON, XML, YAML, TOML, and CSV formatting and conversion, plus cURL import, JSONPath/JMESPath querying, schema and type generation, diff, and developer utils like UUID, Base64, JWT, hash, regex, and color conversion.",
  },
  {
    q: "Can I use Formaty offline?",
    a: "Yes. Formaty is a local-first tool that works without a network connection once loaded. Your session is also persisted so data is restored on reload.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[var(--workspace-text-muted)]">
          FAQ
        </p>
        <h2 className="text-center text-3xl font-semibold tracking-[-0.02em] text-[var(--workspace-text)] md:text-4xl">
          Frequently asked questions
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-center text-base text-[var(--workspace-text-muted)]">
          Everything you need to know about Formaty&apos;s local-first approach.
        </p>

        <div className="mt-10 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] transition-colors hover:border-primary/25"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[15px] font-semibold text-[var(--workspace-text)]">{item.q}</span>
                  <ChevronDownIcon
                    className={`h-4 w-4 shrink-0 text-[var(--workspace-text-muted)] transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                    aria-hidden
                  />
                </button>
                <div
                  className={`grid transition-all duration-200 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-[var(--workspace-text-muted)]">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* JSON-LD mirrors the FAQPage schema in src/app/layout.tsx */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQS.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
    </section>
  );
}
