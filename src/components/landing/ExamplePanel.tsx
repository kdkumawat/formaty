"use client";

import { Highlighted } from "@/components/Highlighted";
import { PaneHeader, ResultActions } from "@/components/kit";
import { guessLang } from "@/lib/highlight";

function Pane({ label, code }: { label: string; code: string }) {
  return (
    <section aria-label={label} className="flex min-h-[160px] min-w-0 flex-1 flex-col border-[var(--workspace-border)] max-[900px]:border-b min-[901px]:border-r min-[901px]:last:border-r-0">
      <PaneHeader title={label} right={<ResultActions copy={{ getText: () => code, disabled: !code }} />} />
      <pre role="group" tabIndex={0} aria-label={label} className="m-0 min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[13px] leading-[1.6] whitespace-pre text-[var(--workspace-text)]">
        <Highlighted code={code} lang={guessLang(code)} />
      </pre>
    </section>
  );
}

/** Static worked example for tools that cannot run inline: input left, output right, each copyable. */
export function ExamplePanel({ input, output }: { input: string; output: string }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto min-[901px]:flex-row min-[901px]:overflow-hidden">
      <Pane label="Example input" code={input} />
      <Pane label="Example output" code={output} />
    </div>
  );
}
