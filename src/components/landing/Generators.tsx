import { CURL_TARGETS, generateCurlCode } from "@/lib/curl/codegen";
import { parseCurl } from "@/lib/curl/parseCurl";
import { generateTypes, inferJsonSchema, type JsonValue } from "@/lib/json/core";
import { generateSql } from "@/lib/json/generate/sql";
import { ALL_TOOL_ROUTES } from "@/lib/seo";
import { GeneratorSwitch, type Source } from "./GeneratorSwitch";
import { SectionHead } from "./PageParts";
import { SPACE, WRAP } from "./ui";

const ROUTES = new Set<string>(ALL_TOOL_ROUTES);
const href = (route: string) => (ROUTES.has(route) ? `/${route}` : "/playground");

const ROW: JsonValue = { id: 4821, email: "alice@example.com", plan: "pro", active: true, seats: 12 };
const CURL = `curl -X POST https://api.example.com/v1/users \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"alice@example.com","plan":"pro"}'`;

const TYPES = [
  ["typescript", "TypeScript", "json-to-typescript"],
  ["zod", "Zod", "json-to-zod"],
  ["go", "Go", "json-to-go"],
  ["python", "Python", "json-to-python"],
  ["pydantic", "Pydantic", "json-to-pydantic"],
  ["java", "Java", "json-to-java"],
  ["csharp", "C#", "json-to-csharp"],
  ["protobuf", "Protobuf", "json-to-protobuf"],
] as const;

const parsed = parseCurl(CURL);
const fromJson = (label: string) => `Generate ${label} from your own JSON`;

/** Every output below is what the playground's own functions return for the input shown. */
const SOURCES: Source[] = [
  {
    id: "json",
    label: "From JSON",
    input: JSON.stringify(ROW, null, 2),
    inputLang: "json",
    targets: [
      { id: "sql", label: "SQL", href: href("json-to-sql"), open: fromJson("SQL"), lang: "sql", code: generateSql([ROW], { dialect: "postgres", tableName: "users" }) },
      ...TYPES.map(([id, label, route]) => ({ id, label, href: href(route), open: fromJson(label), lang: "code" as const, code: generateTypes(ROW, id, "User") })),
      { id: "schema", label: "JSON Schema", href: href("schema-generator"), open: fromJson("a JSON Schema"), lang: "json", code: JSON.stringify(inferJsonSchema(ROW), null, 2) },
    ],
  },
  {
    id: "curl",
    label: "From a cURL command",
    input: CURL,
    inputLang: "bash",
    targets: CURL_TARGETS.map((t) => {
      const label = t.short === "axios" ? "Axios" : t.short;
      return {
        id: t.id,
        label,
        href: href(t.seoRoute ?? ""),
        open: `Generate ${label} code from your own cURL command`,
        lang: "code" as const,
        code: generateCurlCode(parsed, t.id),
      };
    }),
  },
];

const [JSON_SOURCE, CURL_SOURCE] = SOURCES;

export function Generators() {
  return (
    <section id="generate" className={`${WRAP} flex flex-col gap-[clamp(28px,3.4vw,44px)] ${SPACE}`}>
      <SectionHead title="One payload, written in the language you need.">
        <p>
          {JSON_SOURCE.targets.length + CURL_SOURCE.targets.length} generators: {JSON_SOURCE.targets.length} read JSON and write a table with its inserts, a typed model or a schema, and {CURL_SOURCE.targets.length} turn a cURL command into client code. Pick one and read what you would copy.
        </p>
      </SectionHead>
      <GeneratorSwitch sources={SOURCES} />
    </section>
  );
}
