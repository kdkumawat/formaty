import Link from "next/link";
import { Button } from "@/components/kit";
import { cn } from "@/lib/utils";

/**
 * The one amber action of a view: the kit's primary key, at the size a page headline calls for.
 */
export function KeyLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="primary" size="lg" className={cn("h-auto min-h-12 max-w-full whitespace-normal rounded-[10px] px-6 py-2 text-center text-base font-semibold", className)}>
      <Link href={href}>
        {children}
      </Link>
    </Button>
  );
}
