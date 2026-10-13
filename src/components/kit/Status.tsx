import type { ReactNode } from "react";
import { CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/16/solid";
import { cn } from "@/lib/utils";
import { mutedText } from "./styles";

export interface EmptyStateProps {
  title: string;
  /** One 12px muted line. */
  description?: ReactNode;
  icon?: ReactNode;
  /** Usually one Button. */
  action?: ReactNode;
  className?: string;
}

/** Centered empty or zero-result state. */
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1 px-4 py-8 text-center", className)}>
      {icon && <span aria-hidden className={cn("mb-1 [&>svg]:size-5", mutedText)}>{icon}</span>}
      <p className="text-[14px] font-semibold text-[var(--workspace-text)]">{title}</p>
      {description && <p className={cn("max-w-xs text-[12px]", mutedText)}>{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export interface StatusTextProps {
  tone: "ok" | "bad" | "muted";
  children: ReactNode;
  className?: string;
}

/** Inline status with icon: ok (check), bad (exclamation), muted (dot). */
export function StatusText({ tone, children, className }: StatusTextProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[13px] font-medium",
        tone === "ok" && "text-ok",
        tone === "bad" && "text-bad",
        tone === "muted" && mutedText,
        className,
      )}
    >
      {tone === "ok" ? (
        <CheckCircleIcon aria-hidden className="size-4 shrink-0" />
      ) : tone === "bad" ? (
        <ExclamationCircleIcon aria-hidden className="size-4 shrink-0" />
      ) : (
        <span aria-hidden className="mx-1 size-2 shrink-0 rounded-full bg-current opacity-60" />
      )}
      {children}
    </span>
  );
}
