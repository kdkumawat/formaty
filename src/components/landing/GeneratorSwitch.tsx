"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import { Highlighted } from "@/components/Highlighted";
import { Chip, Segmented } from "@/components/kit";
import type { HighlightLang } from "@/lib/highlight";
import { CODE, LINK_SM, PLATE } from "./ui";

export interface Target {
  id: string;
  label: string;
  href: string;
  /** Text of the link under the output. */
  open: string;
  lang: HighlightLang;
  code: string;
}
export interface Source {
  id: string;
  label: string;
  input: string;
  inputLang: HighlightLang;
  targets: Target[];
}

/** "From JSON" inside a sentence. */
const lower = (label: string) => label[0].toLowerCase() + label.slice(1);
const BAR = "flex min-h-11 shrink-0 items-center border-b border-[var(--workspace-border)] px-3 py-2";
const PRE = `${CODE} h-[320px] focus-visible:-outline-offset-2`;
/** Names a block when the blocks are stacked for a reader without JavaScript; with the switch running it stays hidden. */
const NAME = "border-y border-[var(--workspace-border)] px-3 py-2 text-[13px] font-semibold leading-none";

/**
 * One payload on the left, what it generates on the right. The source switch and the output chips are the
 * playground's own controls. Every output is in the page. The unselected ones carry `data-off`, which hides them
 * (`.mk-gen [data-off]` in globals.css); for a reader without JavaScript the noscript rule below shows them all,
 * stacked and named. Not the `hidden` attribute: Tailwind's reset makes that one impossible to undo from here.
 */
export function GeneratorSwitch({ sources }: { sources: Source[] }) {
  const [sourceId, setSourceId] = useState(sources[0].id);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const source = sources.find((s) => s.id === sourceId) ?? sources[0];
  const target = source.targets.find((t) => t.id === picked[source.id]) ?? source.targets[0];

  return (
    <div className={`${PLATE} grid lg:grid-cols-12`}>
      <noscript>
        <style>{`.mk-gen [data-off]{display:block}.mk-gen pre{height:auto;max-height:320px}.mk-gen .mk-js{display:none}`}</style>
      </noscript>
      <div className="mk-gen flex min-w-0 flex-col border-[var(--workspace-border)] max-lg:border-b lg:col-span-5 lg:border-r">
        <div className={`${BAR} mk-js`}>
          <Segmented
            aria-label="Start from"
            tone="neutral"
            value={source.id}
            onChange={setSourceId}
            options={sources.map((s) => ({ value: s.id, label: s.label }))}
          />
        </div>
        {sources.map((s) => (
          <Fragment key={s.id}>
            <p data-off="" className={NAME}>{s.label}</p>
            <pre role="group" data-off={s.id !== source.id ? "" : undefined} tabIndex={0} aria-label={`Input: ${s.label}`} className={`${PRE} max-lg:h-auto max-lg:max-h-[320px]`}>
              <Highlighted code={s.input} lang={s.inputLang} />
            </pre>
          </Fragment>
        ))}
      </div>
      <div className="mk-gen flex min-w-0 flex-col lg:col-span-7">
        <div role="group" aria-label="Generate" className={`${BAR} mk-js flex-wrap gap-1`}>
          {source.targets.map((t) => (
            <Chip key={t.id} on={t.id === target.id} onClick={() => setPicked((p) => ({ ...p, [source.id]: t.id }))}>
              {t.label}
            </Chip>
          ))}
        </div>
        {sources.flatMap((s) =>
          s.targets.map((t) => (
            <Fragment key={`${s.id}-${t.id}`}>
              <p data-off="" className={NAME}>{t.label}, {lower(s.label)}</p>
              <pre role="group" data-off={t !== target ? "" : undefined} tabIndex={0} aria-label={`${t.label}, ${lower(s.label)}`} className={PRE}>
                <Highlighted code={t.code} lang={t.lang} />
              </pre>
            </Fragment>
          )),
        )}
        <div className="mk-js flex min-h-11 shrink-0 items-center border-t border-[var(--workspace-border)] px-3">
          <Link href={target.href} className={LINK_SM}>
            {target.open}
          </Link>
        </div>
      </div>
    </div>
  );
}
