"use client";

import { useEffect, useState } from "react";
import { WRAP } from "./ui";

/**
 * Fixed header bar. Over an ink surface (the stage at the top, the closing band and the footer) it wears the
 * ink tokens; over the page it takes the page theme and a hairline.
 *
 * It also keeps the page to one amber key per view: while a page's own key is on screen, the header's
 * playground link is plain text (`data-quiet`). `quiet` says the stage at the top of the page carries a key of
 * its own (the hero's, or the Copy key of a live tool), so the link is plain from the first paint until that
 * stage has scrolled away.
 */
export function HeaderShell({ quiet = false, children }: { quiet?: boolean; children: React.ReactNode }) {
  const [past, setPast] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [keyInView, setKeyInView] = useState(false);

  useEffect(() => {
    const stages = [...document.querySelectorAll("[data-mk-stage]")];
    // A line through the middle of the bar: is there ink under it?
    const under = (s: Element) => {
      const r = s.getBoundingClientRect();
      return r.top <= 28 && r.bottom > 28;
    };
    const read = () => {
      setPast(!stages.some(under));
      setAtTop(stages.length > 0 && under(stages[0]));
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);

    const seen = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target);
          else seen.delete(e.target);
        }
        setKeyInView(seen.size > 0);
      },
      { rootMargin: "-56px 0px 0px 0px" },
    );
    document.querySelectorAll("[data-mk-key]").forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", read);
      io.disconnect();
    };
  }, []);

  return (
    <header
      data-past={past ? "" : undefined}
      data-quiet={keyInView || (quiet && atTop) ? "" : undefined}
      className={`mk-header fixed inset-x-0 top-0 z-40 ${past ? "" : "mk-ink"}`}
    >
      <div className={`${WRAP} flex h-[var(--mk-header)] items-center justify-between gap-x-4`}>{children}</div>
    </header>
  );
}
