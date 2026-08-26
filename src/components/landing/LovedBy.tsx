"use client";

import { Reveal } from "@/components/motion";
import { staggerContainer, fadeUp } from "@/lib/motion";
import { motion } from "framer-motion";

const STACK: { name: string; href: string }[] = [
  { name: "Postman", href: "/api-import" },
  { name: "cURL", href: "/api-import" },
  { name: "Kubernetes", href: "/json-to-yaml" },
  { name: "GitHub Actions", href: "/yaml-formatter" },
  { name: "Docker Compose", href: "/yaml-formatter" },
  { name: "VS Code", href: "/tools" },
  { name: "OpenAPI", href: "/json-to-typescript" },
  { name: "Webhooks", href: "/api-import" },
];

export function LovedBy() {
  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl space-y-8">
        <Reveal className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Loved by
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]">
            Used in the wild.
          </h2>
          <p className="text-sm text-[var(--workspace-text-muted)] md:text-base">
            Formaty slots into the tools you already use - paste from Postman, decode webhooks,
            validate OpenAPI, build K8s manifests.
          </p>
        </Reveal>

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-2.5"
        >
          {STACK.map(({ name, href }) => (
            <motion.li
              key={name}
              variants={fadeUp}
              className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-1.5 text-xs font-semibold text-[var(--workspace-text)] transition-colors hover:border-primary/30 hover:text-primary"
            >
              <a href={href}>{name}</a>
            </motion.li>
          ))}
        </motion.ul>

        <Reveal delay={0.1} className="text-center text-xs text-[var(--workspace-text-muted)]">
          Free, local-first, open source. <span aria-hidden>·</span> Star us on GitHub if it
          saves you a tab.
        </Reveal>
      </div>
    </section>
  );
}
