"use client";

import { useEffect, useState } from "react";

export interface TocItem {
  id: string;
  label: string;
}

/** Plain list of section links; the section nearest the top of the viewport is marked. */
export function DocsToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-10% 0px -70% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <ul className="flex flex-col">
      {items.map((i) => (
        <li key={i.id}>
          <a
            href={`#${i.id}`}
            aria-current={active === i.id ? "location" : undefined}
            className={`block border-l-2 py-1.5 pl-3 text-[15px] hover:text-[var(--workspace-text)] ${
              active === i.id
                ? "border-brand font-semibold text-[var(--workspace-text)]"
                : "border-transparent text-[var(--workspace-text-muted)]"
            }`}
          >
            {i.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
