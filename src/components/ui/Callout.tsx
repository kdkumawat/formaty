import { Lightbulb, Info, AlertTriangle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalloutVariant = "tip" | "note" | "warning" | "info";

const VARIANT_CLASSES: Record<CalloutVariant, { wrap: string; icon: string; title: string }> = {
  tip: {
    wrap: "border-emerald-500/25 bg-emerald-500/5",
    icon: "text-emerald-600",
    title: "text-emerald-700 dark:text-emerald-400",
  },
  note: {
    wrap: "border-sky-500/25 bg-sky-500/5",
    icon: "text-sky-600 dark:text-sky-400",
    title: "text-sky-700 dark:text-sky-400",
  },
  warning: {
    wrap: "border-amber-500/30 bg-amber-500/5",
    icon: "text-amber-600 dark:text-amber-400",
    title: "text-amber-700 dark:text-amber-400",
  },
  info: {
    wrap: "border-primary/25 bg-primary/5",
    icon: "text-primary",
    title: "text-primary",
  },
};

const VARIANT_ICON: Record<CalloutVariant, React.ComponentType<{ className?: string }>> = {
  tip: Lightbulb,
  note: BookOpen,
  warning: AlertTriangle,
  info: Info,
};

const VARIANT_TITLE: Record<CalloutVariant, string> = {
  tip: "Tip",
  note: "Note",
  warning: "Warning",
  info: "Info",
};

export function Callout({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = VARIANT_ICON[variant];
  const v = VARIANT_CLASSES[variant];
  return (
    <div
      role="note"
      className={cn(
        "flex gap-3 rounded-xl border p-4 text-sm leading-relaxed",
        v.wrap,
        className,
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", v.icon)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className={cn("mb-1 text-xs font-bold uppercase tracking-wider", v.title)}>
          {title ?? VARIANT_TITLE[variant]}
        </p>
        <div className="text-[var(--workspace-text-muted)] [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-[var(--workspace-background)] [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs">
          {children}
        </div>
      </div>
    </div>
  );
}
