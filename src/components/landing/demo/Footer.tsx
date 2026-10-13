import Link from "next/link";
import { Button } from "@/components/kit";

/** Strip under a demo scene, where the playground's status bar sits. */
export function DemoFooter({ href, note = "Runs in this tab. Nothing is uploaded." }: { href: string; note?: string }) {
  return (
    <div className="flex min-h-9 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--workspace-border)] px-3 py-1 text-[12px] text-[var(--workspace-text-muted)]">
      <span>{note}</span>
      <Button asChild variant="ghost" className="ml-auto">
        <Link href={href}>Continue in the playground</Link>
      </Button>
    </div>
  );
}
