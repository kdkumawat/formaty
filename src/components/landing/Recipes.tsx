"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const RECIPES: {
  title: string;
  desc: string;
  before: string;
  after: string;
  route: string;
  cta: string;
}[] = [
  {
    title: "Debug an API response",
    desc: "Paste a minified webhook payload and read it like a human.",
    before: '{"event":"user.created","data":{"id":123,"email":"a@b.com"}}',
    after: `{
  "event": "user.created",
  "data": {
    "id": 123,
    "email": "a@b.com"
  }
}`,
    route: "/json-formatter",
    cta: "Format JSON",
  },
  {
    title: "Turn JSON into K8s YAML",
    desc: "Convert an API object into a ready-to-apply manifest.",
    before: '{"apiVersion":"v1","kind":"Pod","metadata":{"name":"app"}}',
    after: `apiVersion: v1
kind: Pod
metadata:
  name: app`,
    route: "/json-to-yaml",
    cta: "JSON to YAML",
  },
  {
    title: "Type your API client",
    desc: "Generate TypeScript interfaces from one sample payload.",
    before: '{"id":1,"email":"a@b.com","roles":["admin"]}',
    after: `interface Root {
  id: number;
  email: string;
  roles: string[];
}`,
    route: "/json-to-typescript",
    cta: "Generate types",
  },
  {
    title: "Run cURL without a terminal",
    desc: "Paste a cURL command and inspect the live response.",
    before: 'curl -X GET "https://api.github.com/users/octocat"',
    after: `{
  "login": "octocat",
  "id": 583231,
  "type": "User"
}`,
    route: "/api-import",
    cta: "Import cURL",
  },
];

export function Recipes() {
  return (
    <section className="border-t border-[var(--workspace-border)] px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-primary"
          >
            Recipes
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 }}
            className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]"
          >
            Real workflows, in one paste
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-lg text-sm text-[var(--workspace-text-muted)] md:text-base"
          >
            Every day, developers use Formaty for the same handful of jobs. Pick one and try it.
          </motion.p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {RECIPES.map(({ title, desc, before, after, route, cta }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.06 * i }}
              className="flex flex-col gap-4 rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[var(--workspace-text)]">{title}</h3>
                  <p className="mt-1 text-xs text-[var(--workspace-text-muted)]">{desc}</p>
                </div>
                <Link
                  href={route}
                  className="group inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-primary-foreground"
                >
                  {cta}
                  <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)]">
                  <p className="border-b border-[var(--workspace-border)] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                    Before
                  </p>
                  <pre className="overflow-x-auto p-2.5 font-mono text-[10.5px] leading-relaxed text-[var(--workspace-text)]">
                    {before}
                  </pre>
                </div>
                <div className="overflow-hidden rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-background)]">
                  <p className="border-b border-[var(--workspace-border)] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-500/80">
                    After
                  </p>
                  <pre className="overflow-x-auto p-2.5 font-mono text-[10.5px] leading-relaxed text-[var(--workspace-text)]">
                    {after}
                  </pre>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
