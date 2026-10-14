import Link from "next/link";
import { Button } from "@/components/kit";
import { cn } from "@/lib/utils";

/**
 * The one amber action of a view: the kit's primary key, at the size a page headline calls for.
 */
export function KeyLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="primary" size="lg" className={cn("h-12 rounded-[10px] px-6 text-base font-semibold", className)}>
      <Link href={href}>
        {children}
      </Link>
    </Button>
  );
}
