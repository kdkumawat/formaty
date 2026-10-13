import { GRID, H1, LABEL, LINK, WRAP } from "./ui";

const ROWS: [string, string, boolean?][] = [
  ["Format, convert, compare, query or generate", "Nothing", true],
  ["Open the site", "A request for the static files"],
  ["Click Share", "Your choice each time. A link that carries the data uploads nothing. A short link uploads that tab, and says so before you confirm."],
  ["Run an imported cURL request", "That request, from your browser to the API you named"],
  ["Accept analytics", "Page views. Never editor content."],
];

const CHECK = [
  "Open your browser's developer tools and switch to the Network panel.",
  "Paste the largest file you have into the playground and convert it.",
  "Read the request list. Nothing was added to it.",
];

const CELL = "border-b border-[var(--workspace-border)] py-3.5 align-top";

/**
 * The claim that separates Formaty from an upload-and-wait formatter, opening the ink band the page ends on:
 * the sentence, how it is built, the full list of what does use the network, and how to check it yourself.
 */
export function Privacy() {
  return (
    <section id="privacy" data-mk-stage className="mk-ink border-t border-[var(--workspace-border)] bg-[var(--workspace-background)]">
      <div className={`${WRAP} flex flex-col gap-[clamp(36px,5vw,64px)] py-[clamp(72px,9vw,128px)]`}>
        <div className={`${GRID} items-end !gap-y-6`}>
          <h2 className={`${H1} max-w-[12ch] lg:col-span-7`}>What you paste stays in this tab.</h2>
          <div className="flex min-w-0 flex-col items-start gap-2 lg:col-span-5 lg:pb-1.5">
            <p className="max-w-[34em] text-[16px] leading-[1.6] text-[var(--workspace-text-muted)] sm:text-[17px]">
              Formaty has no server that reads your data. The editor hands your text to a Web Worker inside the page and the worker hands back the result. That is the whole path.
            </p>
            <a href="https://github.com/kdkumawat/formaty/blob/main/src/workers/json.worker.ts" className={LINK}>
              Read the worker source on GitHub
            </a>
          </div>
        </div>
        <div className={GRID}>
          <table className="w-full border-collapse border-t border-[var(--workspace-border)] text-left lg:col-span-7">
            <caption className="sr-only">Everything Formaty sends over the network</caption>
            <thead>
              <tr>
                <th scope="col" className={`${LABEL} ${CELL} w-[44%] pr-6`}>When you</th>
                <th scope="col" className={`${LABEL} ${CELL}`}>What leaves your browser</th>
              </tr>
            </thead>
            <tbody className="text-[15px] leading-normal">
              {ROWS.map(([when, sent, strong]) => (
                <tr key={when}>
                  <th scope="row" className={`${CELL} pr-6 font-sans font-normal tracking-normal`}>{when}</th>
                  <td className={`${CELL} ${strong ? "font-semibold" : "text-[var(--workspace-text-muted)]"}`}>{sent}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="min-w-0 lg:col-span-4 lg:col-start-9">
            <h3 className={`${LABEL} ${CELL} border-t`}>Check it yourself</h3>
            <ol>
              {CHECK.map((step, i) => (
                <li key={step} className={`${CELL} flex gap-4 text-[15px] leading-normal`}>
                  <span aria-hidden className="w-[1ch] flex-none font-mono text-[13px] leading-[22px] text-[var(--workspace-text-muted)]">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
