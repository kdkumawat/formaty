"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRightIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { Reveal } from "@/components/motion";
import { fadeUp, staggerContainer } from "@/lib/motion";
import { useReducedMotionSafe } from "@/lib/motion";

const ZONES = [
  { city: "London", tz: "Europe/London" },
  { city: "New York", tz: "America/New_York" },
  { city: "Tokyo", tz: "Asia/Tokyo" },
];

function formatTime(tz: string, now: Date): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz,
      hour12: false,
    }).format(now);
  } catch {
    return "-";
  }
}

function formatOffset(tz: string, now: Date): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(now);
    const off = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    return off.replace("GMT", "UTC");
  } catch {
    return "";
  }
}

export function Instant() {
  const [now, setNow] = useState<Date | null>(null);
  const reduced = useReducedMotionSafe();

  useEffect(() => {
    setNow(new Date());
    if (reduced) return;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <section className="relative overflow-hidden border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-14 md:py-20">
      <div
        className="pointer-events-none absolute -right-20 top-1/3 h-[420px] w-[420px]"
        style={{
          background: "radial-gradient(circle, rgba(251,191,36,0.10) 0%, transparent 65%)",
          filter: "blur(64px)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal className="space-y-5" variants={fadeUp}>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Timezones
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--workspace-text)] md:text-[2.6rem] md:leading-[1.1]">
              Plan meetings across timezones without leaving the page.
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-[var(--workspace-text-muted)] md:text-base">
              Type a wall clock, pick cities, get a multi-zone timeline. DST-safe, shareable as a
              URL, and never leaves your browser.
            </p>
            <ul className="space-y-2.5 text-sm text-[var(--workspace-text-muted)]">
              {[
                "Curated cities + the full IANA zone list",
                "Sunrise / sunset bands on the timeline",
                "Share any moment as a link - state encoded in the URL",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  {t}
                </li>
              ))}
            </ul>
            <Link
              href="/utils/instant"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-primary/35"
            >
              Open Instant
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </Reveal>

          <Reveal as="div" variants={fadeUp} delay={0.08}>
            <div className="overflow-hidden rounded-2xl border border-[var(--workspace-border)] bg-[var(--workspace-background)] shadow-xl shadow-black/10">
              <div className="flex items-center gap-2 border-b border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-2.5">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/15 text-amber-500">
                  <GlobeAltIcon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--workspace-text)]">
                  Instant
                </span>
                <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] text-[var(--workspace-text-muted)]">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>

              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                className="divide-y divide-[var(--workspace-border)]"
              >
                {ZONES.map((z) => (
                  <motion.li
                    key={z.tz}
                    variants={fadeUp}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--workspace-text)]">
                        {z.city}
                      </p>
                      <p className="font-mono text-[10px] text-[var(--workspace-text-muted)]">
                        {z.tz}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-base font-bold tabular-nums text-[var(--workspace-text)]">
                        {now ? formatTime(z.tz, now) : "--:--"}
                      </p>
                      <p className="font-mono text-[10px] text-[var(--workspace-text-muted)]">
                        {now ? formatOffset(z.tz, now) : ""}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>

              <div className="border-t border-[var(--workspace-border)] bg-[var(--workspace-panel)] px-4 py-2.5">
                <p className="font-mono text-[10px] text-[var(--workspace-text-muted)]">
                  type a wall clock, pick cities, share the moment →
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
