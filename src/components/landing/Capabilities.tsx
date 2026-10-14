import Link from "next/link";
import { Highlighted } from "@/components/Highlighted";
import { GROUPS } from "@/components/utils/readings";
import { stringifyOutput } from "@/lib/formats";
import type { HighlightLang } from "@/lib/highlight";
import { generateTypes } from "@/lib/json/core";
import { summarizeDiffFromText } from "@/lib/json/diff";
import { DEFAULT_LIST_PARSE_OPTIONS, buildListSummary, compareLists, formatListItems } from "@/lib/json/listCompare";
import { ALL_TOOL_ROUTES } from "@/lib/seo";
import { UTIL_TABS } from "@/lib/utils/devtools";
import { FormatTag, TAG_NAME, type TagId } from "./FormatTag";
import { H2, LINK_SM, WRAP } from "./ui";
import { utilHref, utilLabel } from "./utilLinks";

const ROUTES = new Set<string>(ALL_TOOL_ROUTES);
const FORMATS = ["json", "xml", "yaml", "toml", "csv"] as const;
const n = FORMATS.length;

const RECORD = { user: "alice", plan: "pro", seats: 12, active: true };
const toYaml = stringifyOutput(RECORD, "yaml").trimEnd();
const ts = generateTypes({ id: 4821, email: "alice@example.com", plan: "pro", active: true }, "typescript", "User").trimEnd();

// Two order lists, 5 shared: the same functions the playground's compare runs.
const opts = DEFAULT_LIST_PARSE_OPTIONS;
const lists = compareLists(
  "ord_1041\nord_1042\nord_1043\nord_1044\nord_1045\nord_1046\nord_1047\nord_1048",
  "ord_1042\nord_1043\nord_1045\nord_1046\nord_1047\nord_1049\nord_1050",
  opts,
);
const counts = buildListSummary(lists)
  .sections.filter((s) => s.bucket !== "leftDupes" && s.bucket !== "rightDupes")
  .map((s) => `${s.label} ${s.count}`)
  .join(" · ");
const where = formatListItems(lists.common, "sql-in-single");

const diff = summarizeDiffFromText(
  JSON.stringify({ plan: "pro", seats: 12, trial: true }),
  JSON.stringify({ plan: "team", seats: 14, region: "eu" }),
);
const CHANGE = {
  changed: { glyph: "~", text: "text-diff-change", fill: "bg-diff-change-bg" },
  removed: { glyph: "−", text: "text-diff-remove", fill: "bg-diff-remove-bg" },
  added: { glyph: "+", text: "text-diff-add", fill: "bg-diff-add-bg" },
} as const;

function Diff() {
  if (!diff) return null;
  return (
    <figure className="m-0 overflow-hidden rounded-md border border-[var(--workspace-border)] bg-[var(--sunk)]">
      <figcaption className="border-b border-[var(--workspace-border)] px-3 py-1 font-mono text-[12px] text-[var(--workspace-text-muted)]">Two documents, field by field</figcaption>
      <ul className="m-0 list-none p-0 font-mono text-[13px]">
        {diff.rows.map((r) => {
          const k = CHANGE[r.change];
          return (
            <li key={r.path} className={`flex gap-3 px-3 py-0.5 ${k.fill}`}>
              <span aria-hidden className={`w-3 font-semibold ${k.text}`}>{k.glyph}</span>
              <span className="w-14 shrink-0 text-[var(--workspace-text-muted)]">{r.path}</span>
              <span className="min-w-0 truncate">{r.change === "added" ? r.right : r.change === "removed" ? r.left : `${r.left} → ${r.right}`}</span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

type Ln = { label: string; href: string };
const tools = (rows: [string, string][]): Ln[] => rows.filter(([r]) => ROUTES.has(r)).map(([r, label]) => ({ href: `/${r}`, label }));
const count = (re: RegExp) => ALL_TOOL_ROUTES.filter((r) => re.test(r)).length;

const CHIP =
  "inline-flex h-8 items-center rounded-[4px] border border-[var(--input)] px-2.5 text-[13px] text-[var(--workspace-text)] transition-colors duration-[120ms] hover:bg-control pointer-coarse:h-11";
const CARD = "flex min-w-0 flex-col gap-4 rounded-[14px] border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-5 min-[901px]:p-6";

function Icon({ d }: { d: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="text-[var(--workspace-text-muted)]">
      <path d={d} />
    </svg>
  );
}

function Example({ label, code, lang }: { label: string; code: string; lang: HighlightLang }) {
  return (
    <figure className="m-0 overflow-hidden rounded-md border border-[var(--workspace-border)] bg-[var(--sunk)]">
      <figcaption className="border-b border-[var(--workspace-border)] px-3 py-1 font-mono text-[12px] text-[var(--workspace-text-muted)]">{label}</figcaption>
      <pre tabIndex={0} className="m-0 overflow-x-auto px-3 py-2 font-mono text-[13px] leading-[1.6] whitespace-pre text-[var(--workspace-text)]">
        <Highlighted code={code} lang={lang} />
      </pre>
    </figure>
  );
}

function Card({ icon, title, blurb, example, links, all }: { icon: string; title: string; blurb: React.ReactNode; example?: React.ReactNode; links: Ln[]; all: Ln }) {
  return (
    <article className={CARD}>
      <header className="flex items-center gap-2.5">
        <Icon d={icon} />
        <h3 className="font-sans text-[18px] font-semibold leading-tight tracking-normal">{title}</h3>
      </header>
      <p className="text-[15px] leading-[1.55] text-[var(--workspace-text-muted)]">{blurb}</p>
      {example}
      {links.length > 0 && <ul className="flex flex-wrap gap-1">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className={CHIP}>
              {l.label}
            </Link>
          </li>
        ))}
      </ul>}
      <Link href={all.href} className={`${LINK_SM} mt-auto`}>{all.label} →</Link>
    </article>
  );
}

/** The one capability section: four jobs, a real example for each, and the links that serve them. */
export function Capabilities() {
  const jobs = count(/-formatter$|-to-(json|yaml|xml|toml|csv)$/);
  const gen = count(/^json-to-|^curl-to-|schema-generator|api-import/);
  const cmp = count(/compare|diff|duplicates/);
  return (
    <section id="tools" className="border-b border-[var(--workspace-border)]">
      <div className={`${WRAP} flex flex-col gap-8 py-14 min-[901px]:py-20`}>
        <div className="flex flex-col gap-2">
          <h2 className={`${H2} max-w-[22ch]`}>One workspace, four jobs.</h2>
          <p className="max-w-[40em] text-[16px] text-[var(--workspace-text-muted)] sm:text-[17px]">Each one runs on the same paste, and each has a page of its own if you only need that.</p>
        </div>
        <div className="grid gap-4 min-[901px]:grid-cols-2 min-[901px]:gap-6">
          <Card
            icon="M7 7h11l-3-3m3 3-3 3M17 17H6l3 3m-3-3 3-3"
            title="Convert and format"
            blurb={
              <>
                <span className="mb-2 flex flex-wrap gap-1.5">
                  {[...FORMATS, "curl" as const].map((id) => (
                    <FormatTag key={id} id={id as TagId} />
                  ))}
                </span>
                {n} formats, {n * (n - 1)} conversions, a formatter each.
              </>
            }
            example={<Example label={`${TAG_NAME.json} → ${TAG_NAME.yaml}`} code={toYaml} lang="yaml" />}
            links={tools([
              ["json-formatter", "JSON formatter"],
              ["json-to-yaml", "JSON to YAML"],
              ["yaml-to-json", "YAML to JSON"],
              ["xml-to-json", "XML to JSON"],
              ["csv-to-json", "CSV to JSON"],
              ["toml-to-json", "TOML to JSON"],
            ])}
            all={{ href: "/tools", label: `All ${jobs} convert and format tools` }}
          />
          <Card
            icon="M8 8l-4 4 4 4m8-8 4 4-4 4M14 5l-4 14"
            title="Generate code"
            blurb="SQL inserts, types (TypeScript, Zod, Go, Python, Pydantic, Java, C#, Protobuf), JSON Schema, and cURL as fetch, Axios, Python or Go."
            example={<Example label="JSON → TypeScript" code={ts} lang="code" />}
            links={tools([
              ["json-to-sql", "JSON to SQL"],
              ["json-to-typescript", "JSON to TypeScript"],
              ["json-to-zod", "JSON to Zod"],
              ["json-to-go", "JSON to Go"],
              ["schema-generator", "Schema generator"],
              ["curl-to-fetch", "cURL to fetch"],
            ])}
            all={{ href: "/tools", label: `All ${gen} generators` }}
          />
          <Card
            icon="M4 6h7M4 12h16M4 18h7M15 6h5M15 18h5"
            title="Compare"
            blurb="Two lists into buckets you can copy as SQL, JSON or CSV. Two documents, field by field."
            example={
              <>
                <Example label="Two lists of order ids" code={`${counts}
${where}`} lang="sql" />
                <Diff />
              </>
            }
            links={tools([
              ["compare-lists", "Compare lists"],
              ["json-diff", "JSON diff"],
              ["compare-csv", "Compare CSV"],
              ["find-duplicates-in-list", "Find duplicates"],
            ])}
            all={{ href: "/tools", label: `All ${cmp} compare tools` }}
          />
          <Card
            icon="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4L15 12l-3-3z"
            title="Utilities"
            blurb={`${UTIL_TABS.length} small tools for the small jobs: encoders, hashes, time zones, regex and more.`}
            example={
              <dl className="m-0 flex flex-col gap-2">
                {GROUPS.filter((g) => g.name).map((g) => (
                  <div key={g.name} className="flex flex-col gap-1">
                    <dt className="text-[13px] text-[var(--workspace-text-muted)]">{g.name}</dt>
                    <dd className="m-0 flex flex-wrap gap-1">
                      {g.tools.map((id) => (
                        <Link key={id} href={utilHref(id)} className={CHIP}>{utilLabel(id)}</Link>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            }
            links={[]}
            all={{ href: "/utils", label: `All ${UTIL_TABS.length} utilities` }}
          />
        </div>
      </div>
    </section>
  );
}
