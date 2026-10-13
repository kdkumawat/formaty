import Link from "next/link";
import { Footer, H1, KeyLink, LINK, SiteHeader, Stage, WRAP } from "@/components/landing";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--workspace-background)] text-[var(--workspace-text)]">
      <SiteHeader quiet />
      <Stage>
        <main id="main" className={`${WRAP} flex min-h-[calc(72vh-var(--mk-header))] flex-col justify-center gap-5 py-[clamp(48px,8vw,112px)]`}>
          <h1 className={`${H1} max-w-[14ch]`}>This page does not exist.</h1>
          <p className="max-w-[34em] text-[16px] text-[var(--workspace-text-muted)] sm:text-[17px]">
            It may have moved or never been here. Your data is safe: Formaty runs in your browser tab.
          </p>
          <div className="flex flex-wrap items-center gap-x-7 gap-y-2 pt-2">
            <KeyLink href="/playground">Open the playground</KeyLink>
            <Link href="/tools" className={LINK}>Browse all tools</Link>
          </div>
        </main>
      </Stage>
      <Footer />
    </div>
  );
}
