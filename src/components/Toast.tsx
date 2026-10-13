"use client";

import { useSyncExternalStore } from "react";
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { IconButton } from "@/components/kit/Button";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  url?: string;
  duration: number;
  action?: ToastAction;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastInput {
  message: string;
  type?: ToastType;
  url?: string;
  duration?: number;
  action?: ToastAction;
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
// Remaining ms per toast while paused (hover or focus).
const remaining = new Map<number, { left: number; started: number }>();
let nextId = 0;

function emit() {
  for (const l of listeners) l();
}

function removeToast(id: number) {
  window.clearTimeout(timers.get(id));
  timers.delete(id);
  remaining.delete(id);
  items = items.filter((t) => t.id !== id);
  emit();
}

function schedule(id: number, ms: number) {
  remaining.set(id, { left: ms, started: Date.now() });
  timers.set(id, window.setTimeout(() => removeToast(id), ms));
}

function pause(id: number) {
  const r = remaining.get(id);
  if (!r || !timers.has(id)) return;
  window.clearTimeout(timers.get(id));
  timers.delete(id);
  remaining.set(id, { left: Math.max(r.left - (Date.now() - r.started), 400), started: 0 });
}

function resume(id: number) {
  const r = remaining.get(id);
  if (r && !timers.has(id)) schedule(id, r.left);
}

export function toast(input: ToastInput) {
  const type = input.type ?? "info";
  const item: ToastItem = {
    id: ++nextId,
    message: input.message,
    type,
    url: input.url,
    duration: input.duration ?? DEFAULT_DURATION[type],
    action: input.action,
  };
  items = [...items, item];
  if (items.length > MAX_TOASTS) {
    const evicted = items[0];
    if (evicted) removeToast(evicted.id);
  }
  emit();
  schedule(item.id, item.duration);
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

function ToastCard({ item }: { item: ToastItem }) {
  const error = item.type === "error";
  return (
    <div
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
      onMouseEnter={() => pause(item.id)}
      onMouseLeave={() => resume(item.id)}
      onFocus={() => pause(item.id)}
      onBlur={() => resume(item.id)}
      className="pointer-events-auto flex min-h-9 max-w-[420px] items-center gap-2 rounded-[10px] bg-[var(--workspace-text)] py-1 pl-3 pr-1 text-[13px] leading-snug text-[var(--workspace-panel)] shadow-menu transition-[opacity,translate] duration-[140ms] ease-out starting:translate-y-1 starting:opacity-0"
    >
      {item.type === "success" && <CheckCircleIcon aria-hidden className="size-4 shrink-0 text-[var(--ok-inverse)]" />}
      {error && <XCircleIcon aria-hidden className="size-4 shrink-0 text-[var(--bad-inverse)]" />}
      <span className="line-clamp-2 min-w-0 break-words font-medium">
        {item.message}
        {item.url && <span className="ml-2 font-normal opacity-70">{item.url}</span>}
      </span>
      {item.action && (
        <button
          type="button"
          onClick={() => {
            item.action?.onClick();
            removeToast(item.id);
          }}
          className="shrink-0 rounded px-1 font-semibold underline underline-offset-2 outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        >
          {item.action.label}
        </button>
      )}
      <IconButton
        label="Dismiss"
        onClick={() => removeToast(item.id)}
        tooltipSide="top"
        className="h-7 w-7 shrink-0 text-current hover:bg-[color-mix(in_srgb,var(--workspace-panel)_20%,transparent)] max-[900px]:h-7 max-[900px]:w-7"
      >
        <XMarkIcon />
      </IconButton>
    </div>
  );
}

/** Mount once (e.g. at the workspace root). Renders stacked toasts bottom-centre, newest at the bottom. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 bottom-10 z-[300] flex flex-col items-center gap-1.5 px-3"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} item={t} />
      ))}
    </div>
  );
}
