import Link from "next/link";

const FORMATS = [
  { name: "JSON", play: "/playground" },
  { name: "XML", play: "/playground?tool=xml-to-json" },
  { name: "YAML", play: "/playground?tool=yaml-to-json" },
  { name: "TOML", play: "/playground" },
  { name: "CSV", play: "/playground?tool=csv-to-json" },
];

const OPERATIONS = [
  "Beautify",
  "Minify",
  "Flatten",
  "Unflatten",
  "Validate",
  "Compare",
  "Schema",
  "Type generation",
  "Utils (UUID, Base64, JWT…)",
];

const VIEWS = [
  { name: "Tree view", route: "/json-viewer" },
  { name: "Graph view", route: "/graph-viewer" },
  { name: "Table view", route: "/playground" },
  { name: "JSONPath / JMESPath", route: "/jsonpath-tester" },
  { name: "Document / list compare", route: "/json-diff" },
  { name: "Utils (UUID, JWT, Base64…)", route: "/playground" },
];

const TYPE_LANGS = [
  "TypeScript",
  "Python",
  "Java",
  "Go",
  "C#",
  "Rust",
  "Kotlin",
  "Swift",
  "SQL",
  "Protobuf",
];

export function Capabilities() {
  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem]">
          Everything you need
        </h2>

        <div className="space-y-12">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              Formats
            </h3>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map(({ name, play }) => (
                <Link
                  key={name}
                  href={play}
                  className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-1.5 text-sm font-medium text-[var(--workspace-text)] transition-all hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              Operations
            </h3>
            <div className="flex flex-wrap gap-2">
              {OPERATIONS.map((op) => (
                <span
                  key={op}
                  className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-1.5 text-sm font-medium text-[var(--workspace-text-muted)]"
                >
                  {op}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              Views & Query
            </h3>
            <div className="flex flex-wrap gap-2">
              {VIEWS.map(({ name, route }) => (
                <Link
                  key={name}
                  href={route}
                  className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-1.5 text-sm font-medium text-[var(--workspace-text)] transition-all hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                >
                  {name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
              Type generation
            </h3>
            <div className="flex flex-wrap gap-2">
              {TYPE_LANGS.map((lang) => (
                <Link
                  key={lang}
                  href="/playground?tool=json-to-typescript"
                  className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-1.5 text-sm font-medium text-[var(--workspace-text)] transition-all hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                >
                  {lang}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
