"use client";

import { useCallback, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@/components/workspace/Tooltip";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  url?: string;
  duration: number;
}

export interface ToastInput {
  message: string;
  type?: ToastType;
  url?: string;
  duration?: number;
}

/**
 * Module-level toast store so any component can call `toast(...)` without a
 * provider. `<Toaster />` is mounted once and subscribes via useSyncExternalStore.
 */
const MAX_TOASTS = 3;
const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 2000,
  info: 2000,
  error: 4000,
};

let items: ToastItem[] = [];
const listeners = new Set<() => void>();
const timers = new Map<number, number>();
let nextId = 0;

function emit() {
  for (const l of listeners) l();
}

function removeToast(id: number) {
  const timer = timers.get(id);
  if (timer) {
    window.clearTimeout(timer);
    timers.delete(id);
  }
  items = items.filter((t) => t.id !== id);
  emit();
}

export function toast(input: ToastInput) {
  const type = input.type ?? "info";
  const duration = input.duration ?? DEFAULT_DURATION[type];
  const item: ToastItem = {
    id: ++nextId,
    message: input.message,
    type,
    url: input.url,
    duration,
  };
  items = [...items, item];
  if (items.length > MAX_TOASTS) {
    const evicted = items[0];
    if (evicted) removeToast(evicted.id);
  }
  emit();
  timers.set(item.id, window.setTimeout(() => removeToast(item.id), duration));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return items;
}

const EMPTY_TOASTS: ToastItem[] = [];
function getServerSnapshot() {
  return EMPTY_TOASTS;
}

const typeStyles: Record<ToastType, { icon: typeof CheckCircleIcon; accent: string }> = {
  success: { icon: CheckCircleIcon, accent: "text-emerald-500" },
  info: { icon: InformationCircleIcon, accent: "text-primary" },
  error: { icon: ExclamationTriangleIcon, accent: "text-red-500" },
};

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const { icon: Icon, accent } = typeStyles[item.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 28, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 28, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      role={item.type === "error" ? "alert" : "status"}
      onClick={onDismiss}
      className="pointer-events-auto flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--workspace-border)]/60 bg-[var(--workspace-panel)]/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur-md transition-colors hover:border-primary/30"
    >
      <Icon className={`mt-px h-4 w-4 shrink-0 ${accent}`} aria-hidden />
      <span className="min-w-0 flex-1">
        <p
          className={`font-medium leading-snug ${
            item.type === "error" ? "text-error" : "text-[var(--workspace-text)]"
          }`}
        >
          {item.message}
        </p>
        {item.url && (
          <Tooltip content={item.url} className="mt-0.5 block max-w-full truncate leading-snug text-[var(--workspace-text-muted)]">
            {item.url}
          </Tooltip>
        )}
      </span>
      <Tooltip content="Dismiss">
        <XMarkIcon className="mt-0.5 h-3 w-3 shrink-0 cursor-pointer text-[var(--workspace-text-muted)]/70" aria-hidden />
      </Tooltip>
    </motion.div>
  );
}

/** Mount once (e.g. at the workspace root). Renders stacked toasts bottom-right. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const dismiss = useCallback((id: number) => removeToast(id), []);
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(15rem,calc(100vw-2rem))] flex-col items-stretch gap-2"
      aria-live="polite"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
