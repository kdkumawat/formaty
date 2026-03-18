"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES: { route: string; title: string; desc: string }[] = [
  { route: "/json-formatter", title: "JSON Formatter", desc: "Beautify and validate JSON" },
  { route: "/json-viewer", title: "JSON Viewer", desc: "Explore data in tree view" },
  { route: "/json-diff", title: "JSON Diff", desc: "Compare JSON with precision" },
  { route: "/json-to-typescript", title: "JSON to TypeScript", desc: "Generate types from JSON" },
  { route: "/jsonpath-tester", title: "JSONPath Query", desc: "Extract with JSONPath/JMESPath" },
  { route: "/graph-viewer", title: "Graph Viewer", desc: "Visualize JSON as a graph" },
  { route: "/api-import", title: "API Import (cURL)", desc: "Fetch and inspect API responses" },
  { route: "/schema-generator", title: "Schema Generator", desc: "Create JSON schema from data" },
  { route: "/xml-formatter", title: "XML Formatter", desc: "Format and validate XML" },
  { route: "/yaml-formatter", title: "YAML Formatter", desc: "Format YAML configs" },
  { route: "/toml-formatter", title: "TOML Formatter", desc: "Format TOML files" },
  { route: "/csv-formatter", title: "CSV Formatter", desc: "Format and validate CSV" },
];

export function FeatureGrid() {
  return (
    <section className="border-t border-[var(--workspace-border)] px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-semibold tracking-tight text-[var(--workspace-text)] text-xl md:text-3xl"
        >
          Tools
        </motion.h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ route, title, desc }, i) => (
            <motion.div
              key={route}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.03 * i }}
            >
              <Link
                href={route}
                className="block rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40"
              >
                <h3 className="font-semibold text-[var(--workspace-text)]">{title}</h3>
                <p className="mt-1 text-xs text-[var(--workspace-text-muted)]">{desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
