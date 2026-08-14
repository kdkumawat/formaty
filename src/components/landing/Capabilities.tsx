import Link from "next/link";

const FORMATS = [
  { name: "JSON", play: "/playground?tool=json-formatter" },
  { name: "XML", play: "/playground?tool=xml-to-json" },
  { name: "YAML", play: "/playground?tool=yaml-to-json" },
  { name: "TOML", play: "/playground?tool=toml-formatter" },
  { name: "CSV", play: "/playground?tool=csv-to-json" },
];

const OPERATIONS = [
  { label: "Beautify", route: "/playground?tool=json-formatter" },
  { label: "Minify", route: "/playground?tool=json-formatter" },
  { label: "Flatten", route: "/playground?tool=json-formatter" },
  { label: "Unflatten", route: "/playground?tool=json-formatter" },
  { label: "Validate", route: "/playground?tool=json-formatter" },
  { label: "Compare", route: "/json-diff" },
  { label: "Schema", route: "/schema-generator" },
  { label: "Type generation", route: "/json-to-typescript" },
  { label: "Utils (UUID, Base64, JWT…)", route: "/playground?util=uuid" },
];

const VIEWS = [
  { name: "Tree view", route: "/json-viewer" },
  { name: "Graph view", route: "/graph-viewer" },
  { name: "Table view", route: "/playground?tool=json-to-csv" },
  { name: "JSONPath / JMESPath", route: "/jsonpath-tester" },
  { name: "Document / list compare", route: "/json-diff" },
  { name: "Utils (UUID, JWT, Base64…)", route: "/playground?util=uuid" },
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
              {OPERATIONS.map(({ label, route }) => (
                <Link
                  key={label}
                  href={route}
                  className="rounded-full border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-4 py-1.5 text-sm font-medium text-[var(--workspace-text)] transition-all hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
                >
                  {label}
                </Link>
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
