import Link from "next/link";
import { Highlighted } from "@/components/Highlighted";
import { COMPARE_KIND_LABELS } from "@/components/workspace/constants";
import { summarizeDiffFromText } from "@/lib/json/diff";
import {
  DEFAULT_LIST_PARSE_OPTIONS,
  buildListSummary,
  compareLists,
  formatListItems,
  normalizeListKey,
  parseListText,
  type ListSummarySection,
} from "@/lib/json/listCompare";
import { ALL_TOOL_ROUTES } from "@/lib/seo";
import { SectionHead } from "./PageParts";
import { CODE, LINK_SM, PLATE, SPACE, WRAP } from "./ui";

// Two order lists that overlap, with one repeat in A, so every result has something to show.
const LIST_A = "ord_1041\nord_1042\nord_1043\nord_1044\nord_1045\nord_1046\nord_1047\nord_1047\nord_1048";
const LIST_B = "ord_1042\nord_1043\nord_1045\nord_1046\nord_1049\nord_1050";

const DOC_A = `name: checkout
replicas: 2
image: app:1.8.2
env:
  LOG_LEVEL: info
  REGION: eu-west-1`;
const DOC_B = `name: checkout
replicas: 4
image: app:1.9.0
env:
  LOG_LEVEL: info
  TIMEOUT: 30s`;

/** Everything below is what the playground's compare returns for the inputs shown. */
const opts = DEFAULT_LIST_PARSE_OPTIONS;
const lists = compareLists(LIST_A, LIST_B, opts);
const summary = buildListSummary(lists);
const shared = new Set(lists.common.map((i) => i.key));
const copiesAs = formatListItems(lists.leftOnly, "sql-in-single");
const diff = summarizeDiffFromText(DOC_A, DOC_B);
/** The Summary tab in one line, worded like the status the document compare shows. */
const listStatus = summary.sections.map((s) => `${s.count} ${s.label[0].toLowerCase()}${s.label.slice(1)}`).join(", ");

/** The result tabs in the order the playground shows them, under the names on its tabs. */
const TABS: { bucket: ListSummarySection["bucket"]; label: string; dot?: string }[] = [
  { bucket: "leftOnly", label: "Only in A", dot: "bg-side-a" },
  { bucket: "common", label: "In both", dot: "bg-brand" },
  { bucket: "rightOnly", label: "Only in B", dot: "bg-side-b" },
  { bucket: "leftDupes", label: "Repeated" },
];

const ROUTES = new Set<string>(ALL_TOOL_ROUTES);
const MORE = [
  ["find-duplicates-in-list", "Find the repeats in one list"],
  ["compare-csv", "Compare two CSV files by a key column"],
  ["json-diff", "Diff two JSON documents"],
].filter(([r]) => ROUTES.has(r));

const HEAD = "flex h-11 shrink-0 items-center gap-2 border-b border-[var(--workspace-border)] px-3";
const TITLE = "shrink-0 whitespace-nowrap font-sans text-[14px] font-semibold leading-none tracking-normal";
/** The result in one line, at the right of a plate's header. The columns below say the same, so it gives way on a phone. */
const STATUS = "ml-auto min-w-0 truncate text-[13px] leading-none text-[var(--workspace-text-muted)] max-[439px]:hidden";
const COL = "flex h-9 items-center gap-1.5 whitespace-nowrap border-b border-[var(--workspace-border)] px-3 text-[13px] leading-none";
const ITEMS = "px-3 py-2 font-mono text-[13px] leading-[22px]";
const FOOT = "flex min-h-11 shrink-0 items-center border-t border-[var(--workspace-border)] px-3";
const Dot = ({ className }: { className: string }) => <span aria-hidden className={`size-2 shrink-0 rounded-[2px] ${className}`} />;

/** One pasted list. Each line carries the colour of where it ends up: its own side, or ink when both lists have it. */
function Pasted({ name, dot, text }: { name: string; dot: string; text: string }) {
  const lines = parseListText(text, opts);
  return (
    <div className="min-w-0 bg-sunk">
      <p className={COL}>
        <Dot className={dot} />
        <span className="font-semibold">{name}</span>
        <span className="tabular-nums text-[var(--workspace-text-muted)]">{lines.length}</span>
      </p>
      <ul className={ITEMS}>
        {lines.map((line, i) => (
          <li key={i} className="flex items-center gap-2">
            <span aria-hidden className={`h-3 w-0.5 shrink-0 rounded-full ${shared.has(normalizeListKey(line, opts)) ? "bg-brand" : dot}`} />
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Lists() {
  return (
    <div className={`${PLATE} flex flex-col lg:col-span-7`}>
      <div className={HEAD}>
        <h3 className={TITLE}>{COMPARE_KIND_LABELS.list}</h3>
        <span className={STATUS}>{listStatus}</span>
      </div>
      <div className="grid flex-1 grid-cols-6 sm:grid-cols-[repeat(2,minmax(0,1fr))_repeat(4,minmax(0,1.05fr))]">
        <div className="col-span-6 grid grid-cols-2 border-[var(--workspace-border)] max-sm:border-b sm:col-span-2 sm:border-r">
          <Pasted name="List A" dot="bg-side-a" text={LIST_A} />
          <Pasted name="List B" dot="bg-side-b" text={LIST_B} />
        </div>
        <div className="col-span-6 grid grid-cols-2 min-[440px]:grid-cols-4 max-[439px]:[&>div:nth-child(n+3)>p]:border-t sm:col-span-4">
          {TABS.map((t) => {
            const section = summary.sections.find((s) => s.bucket === t.bucket);
            return (
              <div key={t.bucket} className="min-w-0">
                <p className={COL}>
                  {t.dot && <Dot className={t.dot} />}
                  {t.label}
                  <span className="font-semibold tabular-nums">{section?.count ?? 0}</span>
                </p>
                <ul className={ITEMS}>
                  {section?.rows.map((r) => (
                    <li key={r.value}>
                      {r.value}
                      {r.note && <span className="text-[var(--workspace-text-muted)]"> {r.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-[var(--workspace-border)] px-3 py-2.5">
        <p className="text-[13px] leading-normal text-[var(--workspace-text-muted)]">Only in A, copied as a SQL IN list</p>
        <pre role="group" tabIndex={0} aria-label="Only in A as a SQL IN list" className={`${CODE} !whitespace-pre-wrap !px-0 !pb-0 !pt-1`}>
          <Highlighted code={copiesAs} lang="sql" />
        </pre>
      </div>
      <div className={FOOT}>
        <Link href="/compare-lists" className={LINK_SM}>Compare your own lists</Link>
      </div>
    </div>
  );
}

function Documents() {
  if (!diff) return null;
  const status = [`${diff.changed} changed`, `${diff.removed} only in A`, `${diff.added} only in B`].join(", ");
  const TH = "h-9 border-b border-[var(--workspace-border)] px-3 text-left font-sans text-[13px] font-medium leading-none tracking-normal";
  return (
    <div className={`${PLATE} flex flex-col lg:col-span-5`}>
      <div className={HEAD}>
        <h3 className={TITLE}>{COMPARE_KIND_LABELS.document}</h3>
        <span className={STATUS}>{status}</span>
      </div>
      <div className="grid grid-cols-2 border-b border-[var(--workspace-border)] bg-sunk">
        {[
          ["Document A", "bg-side-a", DOC_A],
          ["Document B", "bg-side-b", DOC_B],
        ].map(([name, dot, text], i) => (
          <div key={name} className={`min-w-0 ${i === 0 ? "border-r border-[var(--workspace-border)]" : ""}`}>
            <p className={COL}>
              <Dot className={dot} />
              <span className="font-semibold">{name}</span>
            </p>
            <pre role="group" tabIndex={0} aria-label={name} className={`${CODE} focus-visible:-outline-offset-2`}>
              <Highlighted code={text} lang="yaml" />
            </pre>
          </div>
        ))}
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <caption className="sr-only">What differs between the two documents, field by field</caption>
          <thead>
            <tr>
              <th scope="col" className={`${TH} text-[var(--workspace-text-muted)]`}>Field</th>
              <th scope="col" className={TH}>A</th>
              <th scope="col" className={TH}>B</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {diff.rows.map((r) => (
              <tr key={r.path} className="border-b border-[var(--workspace-border)] last:border-b-0">
                <th scope="row" className="h-8 whitespace-nowrap px-3 text-left font-mono text-[13px] font-normal tracking-normal text-[var(--workspace-text-muted)]">{r.path}</th>
                <td className={`whitespace-nowrap px-3 ${r.change === "added" ? "text-[var(--workspace-text-muted)]" : "text-side-a"}`}>{r.change === "added" ? "missing" : r.left}</td>
                <td className={`whitespace-nowrap px-3 ${r.change === "removed" ? "text-[var(--workspace-text-muted)]" : "text-side-b"}`}>{r.change === "removed" ? "missing" : r.right}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={FOOT}>
        <Link href="/json-diff" className={LINK_SM}>Compare your own documents</Link>
      </div>
    </div>
  );
}

export function Compare() {
  return (
    <section id="compare" className={`${WRAP} flex flex-col gap-[clamp(28px,3.4vw,44px)] ${SPACE}`}>
      <SectionHead title="What is missing, what is shared, what changed.">
        <p>
          Paste two lists and every item lands in a result you can copy as a SQL list, JSON, CSV or Markdown. Paste two documents and the differences line up field by field.
        </p>
      </SectionHead>
      <div className="flex flex-col gap-3">
        <div className="grid gap-4 lg:grid-cols-12">
          <Lists />
          <Documents />
        </div>
        <ul className="flex flex-wrap gap-x-7">
          {MORE.map(([route, label]) => (
            <li key={route}>
              <Link href={`/${route}`} className={LINK_SM}>{label}</Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
