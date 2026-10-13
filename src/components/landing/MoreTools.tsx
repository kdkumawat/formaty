import Link from "next/link";
import { GROUPS, TOOL_META } from "@/components/utils/readings";
import { UTIL_TABS } from "@/lib/utils/devtools";
import { SectionHead } from "./PageParts";
import { LABEL, LINK, PLATE, SPACE, WRAP } from "./ui";
import { utilHref, utilLabel } from "./utilLinks";
import { utilSample } from "./utilSamples";

const TH = `${LABEL} h-10 border-b border-[var(--workspace-border)] px-4 text-left`;
const CELL = "border-b border-[var(--workspace-border)] px-4";
const SAMPLE = "block truncate font-mono text-[13px] leading-[1.6]";

/**
 * The utilities as a reference table: group, name, and one worked example each. Names, groups and examples are
 * the playground's own, and each result is computed by the utility itself when the site is built.
 */
export async function MoreTools() {
  const groups = GROUPS.map((g) => ({ name: g.name || "Any input", tools: g.tools }));
  const samples = new Map(await Promise.all(groups.flatMap((g) => g.tools).map(async (id) => [id, await utilSample(id)] as const)));

  return (
    <section id="utils" className={`${WRAP} flex flex-col gap-[clamp(28px,3.4vw,44px)] ${SPACE}`}>
      <SectionHead title="Small tools for the small jobs.">
        <p>
          {UTIL_TABS.length} utilities, each shown with what it returns for its own sample. Not sure which one you need? {TOOL_META.auto.desc}
        </p>
        <Link href={utilHref("auto")} className={LINK}>
          Open {utilLabel("auto")}
        </Link>
      </SectionHead>
      <div className={PLATE}>
        <table className="-mb-px w-full table-fixed border-collapse">
          <caption className="sr-only">Every utility with one example of what it takes and what it returns</caption>
          <colgroup>
            <col className="w-[9.5rem] max-lg:hidden" />
            <col className="w-[46%] sm:w-[15rem]" />
            <col className="w-[27%] max-md:hidden" />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className={`${TH} max-lg:hidden`}>Group</th>
              <th scope="col" className={TH}>Utility</th>
              <th scope="col" className={`${TH} max-md:hidden`}>You give it</th>
              <th scope="col" className={TH}>You get</th>
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.name}>
              {g.tools.map((id, i) => {
                const s = samples.get(id);
                return (
                  <tr key={id} className="transition-colors duration-[120ms] hover:bg-sunk">
                    {i === 0 && (
                      <th scope="rowgroup" rowSpan={g.tools.length} className={`${LABEL} border-b border-r border-[var(--workspace-border)] px-4 pt-3 text-left align-top max-lg:hidden`}>
                        {g.name}
                      </th>
                    )}
                    <th scope="row" className="border-b border-[var(--workspace-border)] p-0 text-left font-sans font-normal tracking-normal">
                      <Link
                        href={utilHref(id)}
                        className="flex min-h-11 items-center px-4 py-2 text-[14px] font-medium leading-tight sm:text-[15px] underline decoration-transparent decoration-1 underline-offset-[5px] transition-[text-decoration-color] duration-[140ms] hover:decoration-current focus-visible:-outline-offset-2"
                      >
                        {utilLabel(id)}
                      </Link>
                    </th>
                    <td className={`${CELL} text-[var(--workspace-text-muted)] max-md:hidden`}>
                      <span className={SAMPLE}>{s?.give}</span>
                    </td>
                    <td className={`${CELL}`}>
                      <span className={SAMPLE}>{s?.get}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
