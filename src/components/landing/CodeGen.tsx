"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

const LANGS: { id: string; label: string; output: string }[] = [
  {
    id: "typescript",
    label: "TypeScript",
    output: `interface Root {
  id: number;
  email: string;
  roles: string[];
}`,
  },
  {
    id: "zod",
    label: "Zod",
    output: `z.object({
  id: z.number(),
  email: z.string(),
  roles: z.array(z.string()),
})`,
  },
  {
    id: "go",
    label: "Go",
    output: `type Root struct {
  ID    int      \`json:"id"\`
  Email string   \`json:"email"\`
  Roles []string \`json:"roles"\`
}`,
  },
  {
    id: "python",
    label: "Python",
    output: `@dataclass
class Root:
    id: int
    email: str
    roles: list[str]`,
  },
  {
    id: "pydantic",
    label: "Pydantic",
    output: `class Root(BaseModel):
    id: int
    email: str
    roles: list[str]`,
  },
  {
    id: "java",
    label: "Java",
    output: `public class Root {
  private int id;
  private String email;
  private List<String> roles;
}`,
  },
  {
    id: "csharp",
    label: "C#",
    output: `public class Root {
  public int Id { get; set; }
  public string Email { get; set; }
  public List<string> Roles { get; set; }
}`,
  },
  {
    id: "rust",
    label: "Rust",
    output: `#[derive(Serialize, Deserialize)]
struct Root {
  id: i64,
  email: String,
  roles: Vec<String>,
}`,
  },
  {
    id: "kotlin",
    label: "Kotlin",
    output: `data class Root(
  val id: Int,
  val email: String,
  val roles: List<String>
)`,
  },
  {
    id: "swift",
    label: "Swift",
    output: `struct Root: Codable {
  let id: Int
  let email: String
  let roles: [String]
}`,
  },
  {
    id: "protobuf",
    label: "Protobuf",
    output: `message Root {
  int32 id = 1;
  string email = 2;
  repeated string roles = 3;
}`,
  },
  {
    id: "sql",
    label: "SQL",
    output: `CREATE TABLE items (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL,
  roles TEXT
);

INSERT INTO items (id, email, roles) VALUES
  (1, 'a@b.com', '["admin"]');`,
  },
];

const INPUT = `{
  "id": 1,
  "email": "a@b.com",
  "roles": ["admin"]
}`;

export function CodeGen() {
  const [active, setActive] = useState("typescript");
  const lang = LANGS.find((l) => l.id === active) ?? LANGS[0];

  return (
    <section className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl space-y-4 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Code generation
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]">
            Turn data into code.
          </h2>
          <p className="mx-auto max-w-xl text-sm text-[var(--workspace-text-muted)] md:text-base">
            One JSON sample, twelve typed outputs - interfaces, validation schemas, structs, and
            database DDL. Pick a language:
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-10 max-w-4xl overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] shadow-xl shadow-black/10"
        >
          {/* Language selector */}
          <div className="flex flex-wrap gap-1.5 border-b border-[var(--workspace-border)] p-2.5">
            {LANGS.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setActive(l.id)}
                className={`rounded-lg px-3 py-1.5 font-mono text-[11px] font-medium transition-all duration-150 ${
                  active === l.id
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "text-[var(--workspace-text-muted)] hover:bg-[var(--workspace-panel)] hover:text-[var(--workspace-text)]"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="grid gap-0 md:grid-cols-2">
            <div className="border-b border-[var(--workspace-border)] p-4 md:border-b-0 md:border-r">
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--workspace-text-muted)]">
                Input JSON
              </p>
              <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed text-[var(--workspace-text)]">
                {INPUT}
              </pre>
            </div>
            <div className="p-4">
              <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                {lang.label}
              </p>
              <pre
                key={lang.id}
                className="overflow-x-auto font-mono text-[11px] leading-relaxed text-[var(--workspace-text)]"
              >
                {lang.output}
              </pre>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-3">
            <Link
              href="/json-to-typescript"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:scale-[1.03]"
            >
              Generate your types
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
            <span className="hidden text-xs text-[var(--workspace-text-muted)] sm:inline">
              Nested objects → nested types · arrays → lists · nulls → optionals
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
