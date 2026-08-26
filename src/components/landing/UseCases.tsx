"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import { Reveal } from "@/components/motion";
import { UseCaseCard } from "./UseCaseCard";

/* ── Tiny previews (monospace, color-coded to feel like real output) ───── */

function DebugWebhookPreview() {
  return (
    <pre className="font-mono text-[10.5px] leading-[1.65]">
{`# curl -X POST https://api.example.com/webhook
$ .ids[*]
{
  "user_id": 4821,
  "email": "alice@…",
  "plan": "pro",
  "trial": false
}

→ SQL:  WHERE id IN
   ('4821', '4917', '5003')`}
    </pre>
  );
}

function ReconcileCsvPreview() {
  return (
    <pre className="font-mono text-[10.5px] leading-[1.65]">
{`key, prod, stage
a,   1,    1   ✓
b,   1,    0   ← missing
c,   1,    1   ✓
d,   0,    1   ← extra

→ INSERT INTO prod (key) VALUES ('b');`}
    </pre>
  );
}

function TypeApiPreview() {
  return (
    <pre className="font-mono text-[10.5px] leading-[1.65]">
{`interface User {
  id:    number;
  email: string;
  roles: string[];
}

// + Zod · Pydantic · Go · Java · Rust · …`}
    </pre>
  );
}

function JsonToYamlPreview() {
  return (
    <pre className="font-mono text-[10.5px] leading-[1.65]">
{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api`}
    </pre>
  );
}

function DedupIdsPreview() {
  return (
    <pre className="font-mono text-[10.5px] leading-[1.65]">
{`user-7   ×3   ← duplicate
user-12  ×2
user-3   ×1
user-7   ×3

→ unique:  user-7, user-12, user-3`}
    </pre>
  );
}

function TimezonePreview() {
  return (
    <pre className="font-mono text-[10.5px] leading-[1.65]">
{`10:30  Mon 13 Oct
─────────────────
London    10:30
New York  05:30
Tokyo     18:30

→ share:  /utils/instant?at=…&tz=…`}
    </pre>
  );
}

/* ── Section ───────────────────────────────────────────────────────────── */

export function UseCases() {
  return (
    <section id="use-cases" className="scroll-mt-16 border-t border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl space-y-10">
        <Reveal className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Workflows
          </p>
          <h2 className="text-3xl font-semibold leading-[1.08] tracking-tight text-[var(--workspace-text)] md:text-[2.6rem]">
            Real jobs. One paste each.
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            Six everyday developer tasks. Pick one and try it on your own data - every workflow runs
            locally, in your browser, with no signup.
          </p>
        </Reveal>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          <UseCaseCard
            index={1}
            eyebrow="API · cURL"
            title="Debug a webhook"
            summary="Paste a cURL command, see the live response, extract the fields you care about with JSONPath, export the IDs as a SQL IN clause."
            steps={[
              { label: "cURL", tone: "in" },
              { label: "JSONPath", tone: "mid" },
              { label: "SQL IN", tone: "out" },
            ]}
            preview={<DebugWebhookPreview />}
            cta={{ label: "Open API Import", href: "/api-import" }}
            accent="text-sky-500"
          />

          <UseCaseCard
            index={2}
            eyebrow="Data · CSV"
            title="Reconcile two DB exports"
            summary="Pick a key column, see which rows are common, missing, or changed between the two CSVs, and copy an INSERT for the missing rows."
            steps={[
              { label: "Two CSVs", tone: "in" },
              { label: "Key compare", tone: "mid" },
              { label: "SQL INSERT", tone: "out" },
            ]}
            preview={<ReconcileCsvPreview />}
            cta={{ label: "Open Compare CSV", href: "/compare-csv" }}
            accent="text-emerald-500"
          />

          <UseCaseCard
            index={3}
            eyebrow="Types · Code"
            title="Type a new API in 5 seconds"
            summary="Drop in a single JSON response, get twelve typed outputs - TypeScript, Zod, Pydantic, Go, Java, Rust, Protobuf, SQL, and more."
            steps={[
              { label: "JSON sample", tone: "in" },
              { label: "Infer types", tone: "mid" },
              { label: "TS / Zod / Go", tone: "out" },
            ]}
            preview={<TypeApiPreview />}
            cta={{ label: "Open Type Generator", href: "/json-to-typescript" }}
            accent="text-violet-500"
          />

          <UseCaseCard
            index={4}
            eyebrow="Config · YAML"
            title="Migrate a JSON config to K8s YAML"
            summary="Turn an API-shaped JSON payload into a Kubernetes manifest, a GitHub Actions workflow, or a Docker Compose file - round-trippable."
            steps={[
              { label: "JSON config", tone: "in" },
              { label: "Convert", tone: "mid" },
              { label: "YAML manifest", tone: "out" },
            ]}
            preview={<JsonToYamlPreview />}
            cta={{ label: "Open JSON → YAML", href: "/json-to-yaml" }}
            accent="text-lime-600"
          />

          <UseCaseCard
            index={5}
            eyebrow="Lists · Cleanup"
            title="Find duplicate IDs"
            summary="Paste a newline list, get counts per value, dedupe, sort, and export the cleaned list as JSON, CSV, or a SQL VALUES clause."
            steps={[
              { label: "List", tone: "in" },
              { label: "Count + dedupe", tone: "mid" },
              { label: "Clean list", tone: "out" },
            ]}
            preview={<DedupIdsPreview />}
            cta={{ label: "Open Dedup Tool", href: "/find-duplicates-in-list" }}
            accent="text-rose-500"
          />

          <UseCaseCard
            index={6}
            eyebrow="Time · Instant"
            title="Plan a meeting across timezones"
            summary="Type a wall clock, pick cities, get a multi-zone timeline. DST-safe, shareable as a URL, and never leaves your browser."
            steps={[
              { label: "Wall clock", tone: "in" },
              { label: "Project zones", tone: "mid" },
              { label: "Share link", tone: "out" },
            ]}
            preview={<TimezonePreview />}
            cta={{ label: "Open Instant", href: "/utils/instant" }}
            accent="text-amber-500"
          />
        </motion.div>
      </div>
    </section>
  );
}
