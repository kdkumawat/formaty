import { FaqList } from "./PageParts";
import { H2, WRAP } from "./ui";

/** Questions mirror the FAQPage JSON-LD in src/app/layout.tsx. Keep in sync. */
const FAQS = [
  {
    q: "Is Formaty really free?",
    a: "Yes. Formaty is completely free with no sign-up required. Every tool, including formatters, converters, compare and developer utils, is free to use.",
  },
  {
    q: "Does Formaty upload my data to a server?",
    a: "No. Everything runs locally in your browser using Web Workers. Your input never leaves your device, except when you explicitly use the Share feature to create a link.",
  },
  {
    q: "Which formats does Formaty support?",
    a: "JSON, XML, YAML, TOML and CSV formatting and conversion, plus cURL import, JSONPath and JMESPath querying, schema and type generation, diff, and developer utils like UUID, Base64, JWT, hash, regex and color conversion.",
  },
  {
    q: "Can I use Formaty offline?",
    a: "Yes. Formaty is a local-first tool that works without a network connection once loaded. Your session is also persisted, so data is restored on reload.",
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="border-b border-[var(--workspace-border)]">
      <div className={`${WRAP} flex flex-col gap-6 py-14 min-[901px]:py-20`}>
        <h2 className={H2}>Before you paste</h2>
        <div className="grid gap-x-10 min-[901px]:grid-cols-2">
          <FaqList items={FAQS.slice(0, 2)} />
          <FaqList items={FAQS.slice(2)} />
        </div>
      </div>
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
