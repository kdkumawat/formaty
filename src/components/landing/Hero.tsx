import Link from "next/link";
import { HeroDemo } from "./HeroDemo";
import { KeyLink } from "./KeyLink";
import { Stage } from "./PageParts";
import { GRID, H1, LINK, WRAP } from "./ui";

/**
 * The ink stage (the page renders the site header above it): the claim on the left, one sentence and the amber key on the right, and under them the
 * playground itself, running. The paddings follow the viewport height so the whole window is on screen at 1280x720.
 */
export function Hero() {
  return (
    <Stage
      window={
        <div className="mk-rise">
          <HeroDemo />
        </div>
      }
    >
      <section className={`${WRAP} ${GRID} items-end !gap-y-6 pb-[clamp(28px,5svh,56px)] pt-[clamp(28px,6svh,72px)]`}>
        <h1 className={`${H1} lg:col-span-7`}>
          Any format in.
          <br />
          Any shape out.
        </h1>
        <div className="flex min-w-0 flex-col items-start gap-6 lg:col-span-5 lg:pb-1.5">
          <p className="max-w-[34em] text-[16px] leading-[1.55] text-[var(--workspace-text-muted)] sm:text-[17px]">
            Paste JSON, XML, YAML, TOML, CSV or a cURL command and copy it out converted, compared, or as SQL, types and client code, without anything leaving this tab.
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-1">
            <KeyLink href="/playground">Open the playground</KeyLink>
            <Link href="/tools" className={LINK}>Browse every tool</Link>
          </div>
        </div>
      </section>
    </Stage>
  );
}
