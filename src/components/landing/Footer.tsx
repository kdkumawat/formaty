import Link from "next/link";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { Logo } from "@/components/Logo";
import { GROUPS } from "@/components/utils/readings";
import { ALL_TOOL_ROUTES } from "@/lib/seo";
import { WRAP } from "./ui";
import { utilHref, utilLabel } from "./utilLinks";

type L = { route: string; label: string };
const ROUTES = new Set<string>(ALL_TOOL_ROUTES);
const tools = (rows: [string, string][]): L[] => rows.filter(([r]) => ROUTES.has(r)).map(([r, label]) => ({ route: `/${r}`, label }));

const COLUMNS: { title: string; href?: string; links: L[] }[] = [
  {
    title: "Format and convert",
    links: tools([
      ["json-formatter", "JSON formatter"],
      ["xml-formatter", "XML formatter"],
      ["yaml-formatter", "YAML formatter"],
      ["toml-formatter", "TOML formatter"],
      ["csv-formatter", "CSV formatter"],
      ["json-to-yaml", "JSON to YAML"],
      ["yaml-to-json", "YAML to JSON"],
      ["json-to-xml", "JSON to XML"],
      ["xml-to-json", "XML to JSON"],
      ["json-to-csv", "JSON to CSV"],
      ["csv-to-json", "CSV to JSON"],
    ]),
  },
  {
    title: "Generate",
    links: tools([
      ["json-to-sql", "JSON to SQL"],
      ["json-to-typescript", "JSON to TypeScript"],
      ["json-to-zod", "JSON to Zod"],
      ["json-to-go", "JSON to Go"],
      ["json-to-python", "JSON to Python"],
      ["schema-generator", "Schema generator"],
      ["curl-to-fetch", "cURL to fetch"],
      ["api-import", "API import"],
    ]),
  },
  {
    title: "Compare and read",
    links: tools([
      ["compare-lists", "Compare lists"],
      ["compare-csv", "Compare CSV"],
      ["json-diff", "JSON diff"],
      ["find-duplicates-in-list", "Find duplicates"],
      ["json-viewer", "JSON viewer"],
      ["graph-viewer", "Graph viewer"],
      ["jsonpath-tester", "JSONPath tester"],
      ["json-schema-validator", "Schema validator"],
    ]),
  },
  {
    title: "Utilities",
    href: "/utils",
    links: GROUPS.flatMap((g) => g.tools).slice(0, 11).map((id) => ({ route: utilHref(id), label: utilLabel(id) })),
  },
];

const LINK =
  "inline-flex min-h-8 items-center text-[14px] text-[var(--workspace-text-muted)] underline decoration-transparent decoration-1 underline-offset-4 transition-colors duration-150 hover:text-[var(--workspace-text)] hover:decoration-current pointer-coarse:min-h-11";
const HEADING = "mb-2 py-1.5 font-sans text-[13px] font-medium leading-normal tracking-normal text-[var(--workspace-text)]";

/** Shared by every marketing page: the sitemap on the page's 12-column grid. */
export function Footer() {
  return (
    <footer className="border-t border-[var(--workspace-border)] pb-8 pt-12">
      <div className={WRAP}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4 lg:grid-cols-12">
          <div className="col-span-2 flex flex-col items-start gap-3 md:col-span-4">
            <Link href="/" aria-label="Formaty home" className="inline-flex h-11 items-center rounded-md">
              <Logo size={24} wordmark />
            </Link>
            <p className="max-w-[26em] text-[14px] leading-[1.55] text-[var(--workspace-text-muted)]">
              Format, convert, compare and generate. In your browser, nowhere else.
            </p>
          </div>
          {COLUMNS.map((c) => (
            <nav key={c.title} aria-label={c.title} className="lg:col-span-2">
              <h3 className={HEADING}>{c.href ? <Link href={c.href} className="underline-offset-4 hover:underline">{c.title}</Link> : c.title}</h3>
              <ul>
                {c.links.map((l) => (
                  <li key={l.route}>
                    <Link href={l.route} className={LINK}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-[var(--workspace-border)] pt-4">
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5">
            <Link href="/playground" className={LINK}>Playground</Link>
            <Link href="/tools" className={LINK}>All tools</Link>
            <Link href="/guides" className={LINK}>Guides</Link>
            <Link href="/docs" className={LINK}>Docs</Link>
            <Link href="/#privacy" className={LINK}>Privacy</Link>
            <Link href="/changelog" className={LINK}>Changelog</Link>
            <a href="https://github.com/kdkumawat/formaty" target="_blank" rel="noopener noreferrer" className={LINK}>GitHub</a>
            <a href="https://www.buymeacoffee.com/kdkumawat" target="_blank" rel="noopener noreferrer" className={LINK}>Buy me a coffee</a>
            <a href="https://www.linkedin.com/in/kdkumawat" target="_blank" rel="noopener noreferrer" className={LINK}>LinkedIn</a>
            <a href="https://x.com/kuldeep_kumawat" target="_blank" rel="noopener noreferrer" className={LINK}>X</a>
            <FeedbackDialog trigger="link" label="Feedback" className="min-h-8 !text-[14px] underline decoration-transparent decoration-1 underline-offset-4 hover:decoration-current pointer-coarse:min-h-11" />
          </nav>
          <span className="text-[13px] text-[var(--workspace-text-muted)]">Free. No account. Open source on GitHub. © {new Date().getFullYear()} Formaty</span>
        </div>
      </div>
    </footer>
  );
}
