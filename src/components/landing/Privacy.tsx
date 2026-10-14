import { H2, LABEL, LINK_SM, WRAP } from "./ui";

const WORKER = "https://github.com/kdkumawat/formaty/blob/main/src/workers/json.worker.ts";

const ROWS: [string, string, boolean?][] = [
  ["Format, convert, compare, query or generate", "Nothing", true],
  ["Open the site", "A request for the static files"],
  ["Click Share", "Your choice each time. A link that carries the data uploads nothing. A short link uploads that tab, and says so before you confirm."],
  ["Run an imported cURL request", "That request, from your browser to the API you named"],
  ["Accept analytics", "Page views. Never editor content."],
];

const CELL = "border-b border-[var(--workspace-border)] py-2.5 align-top";

const POINTS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Private by construction",
    body: (
      <>
        Your text goes from the editor to a Web Worker in this page and back. No server reads it. Check it yourself: DevTools, Network panel.{" "}
        <a href={WORKER} className={`${LINK_SM} !min-h-0 !text-[inherit]`}>Read the worker source</a>.
      </>
    ),
  },
  {
    title: "Fast and offline",
    body: "No round trips, so results appear as you type. Once loaded it works without a network, and your session is restored on reload.",
  },
  {
    title: "Share without uploading",
    body: "A share link carries the data in the URL hash, which browsers never send to a server. A short link is made only when you ask for one, and it says so first.",
  },
];

/** Why trust it: three plain claims, and the full list of what does use the network, folded away. */
export function Privacy() {
  return (
    <section id="privacy" className="border-b border-[var(--workspace-border)]">
      <div className={`${WRAP} flex flex-col gap-8 py-14 min-[901px]:py-20`}>
        <h2 className={`${H2} max-w-[22ch]`}>Why developers trust it.</h2>
        <div className="grid gap-x-10 gap-y-6 min-[901px]:grid-cols-3">
          {POINTS.map((p) => (
            <div key={p.title} className="flex flex-col gap-2 border-t border-[var(--workspace-text)] pt-4">
              <h3 className="font-sans text-[18px] font-semibold leading-tight tracking-normal">{p.title}</h3>
              <p className="text-[15px] leading-[1.6] text-[var(--workspace-text-muted)]">{p.body}</p>
            </div>
          ))}
        </div>
        <details className="group rounded-[10px] border border-[var(--workspace-border)]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
            Everything that uses the network
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden className="flex-none text-[var(--workspace-text-muted)] transition-transform duration-150 group-open:rotate-45">
              <path d="M8 3v10M3 8h10" />
            </svg>
          </summary>
          <table className="w-full border-collapse px-4 text-left">
            <caption className="sr-only">Everything Formaty sends over the network</caption>
            <thead>
              <tr>
                <th scope="col" className={`${LABEL} ${CELL} w-[44%] border-t pl-4 pr-6`}>When you</th>
                <th scope="col" className={`${LABEL} ${CELL} border-t pr-4`}>What leaves your browser</th>
              </tr>
            </thead>
            <tbody className="text-[15px] leading-normal">
              {ROWS.map(([when, sent, strong]) => (
                <tr key={when}>
                  <th scope="row" className={`${CELL} pl-4 pr-6 font-sans font-normal tracking-normal last:border-b-0`}>{when}</th>
                  <td className={`${CELL} pr-4 ${strong ? "font-semibold" : "text-[var(--workspace-text-muted)]"}`}>{sent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </section>
  );
}
