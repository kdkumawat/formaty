"use client";

import { useMemo, useRef, useState } from "react";
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip } from "@/components/workspace/Tooltip";
import { toast } from "@/components/Toast";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_MAX_ITEMS,
  FEEDBACK_MAX_MESSAGE,
  FEEDBACK_MIN_MESSAGE,
  feedbackConfigured,
  submitFeedback,
  type FeedbackCategory,
} from "@/lib/feedback";

interface FeedbackEntry {
  id: number;
  message: string;
  category: FeedbackCategory;
}

const DEFAULT_CATEGORY: FeedbackCategory = "suggestion";

const iconTriggerClass =
  "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-border)]/40 hover:text-[var(--workspace-text)]";

export interface FeedbackDialogProps {
  trigger?: "icon" | "link" | "button";
  label?: string;
  className?: string;
}

/** Feedback dialog with a multi-entry composer - several items in one submission. */
export function FeedbackDialog({
  trigger = "icon",
  label = "Feedback",
  className = "",
}: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<FeedbackEntry[]>([
    { id: 1, message: "", category: DEFAULT_CATEGORY },
  ]);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot - humans never fill this
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const nextIdRef = useRef(2);
  const configured = feedbackConfigured();

  const validItems = useMemo(
    () => entries.filter((e) => e.message.trim().length >= FEEDBACK_MIN_MESSAGE),
    [entries],
  );

  const updateEntry = (id: number, patch: Partial<Omit<FeedbackEntry, "id">>) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const addEntry = () => {
    if (entries.length >= FEEDBACK_MAX_ITEMS) return;
    setEntries((prev) => [
      ...prev,
      { id: nextIdRef.current++, message: "", category: DEFAULT_CATEGORY },
    ]);
  };

  const removeEntry = (id: number) => {
    setEntries((prev) => (prev.length > 1 ? prev.filter((e) => e.id !== id) : prev));
  };

  const resetComposer = () => {
    setEntries([{ id: nextIdRef.current++, message: "", category: DEFAULT_CATEGORY }]);
    setEmail("");
    setWebsite("");
    setError(null);
  };

  const handleSubmit = async () => {
    if (validItems.length === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await submitFeedback({
      items: validItems.map((e) => ({
        message: e.message,
        category: e.category,
        email: email.trim() ? email.trim() : undefined,
      })),
      page: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : undefined,
      browser:
        typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : undefined,
      website,
    });
    setSubmitting(false);
    if (res.ok) {
      const count = res.count ?? validItems.length;
      setSentCount(count);
      toast({
        message: count > 1 ? `Thanks! ${count} feedback items sent.` : "Thanks for your feedback!",
        type: "success",
      });
      resetComposer();
    } else if (res.error === "not-configured") {
      setError("not-configured");
    } else if (res.error === "network") {
      setError("network");
    } else {
      setError(typeof res.error === "string" ? res.error : "server");
    }
  };

  const renderError = () => {
    if (error === "not-configured") {
      return (
        <p className="rounded-md border border-[var(--workspace-border)] bg-muted/40 px-3 py-2 text-xs leading-relaxed text-[var(--workspace-text-muted)]">
          Feedback is not connected yet. While it ships, please open an issue on{" "}
          <a
            href="https://github.com/kdkumawat/formaty/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            GitHub
          </a>{" "}
          - it is the fastest way to reach us.
        </p>
      );
    }
    if (error === "network") {
      return (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Could not reach the feedback service. Check your connection and try again.
        </p>
      );
    }
    if (error) {
      return (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Something went wrong ({error}). Please try again.
        </p>
      );
    }
    return null;
  };

  const triggerNode =
    trigger === "icon" ? (
      <Tooltip content={label}>
        <button
          type="button"
          aria-label={label}
          className={`${iconTriggerClass} ${className}`}
          onClick={() => setOpen(true)}
        >
          <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 shrink-0" />
        </button>
      </Tooltip>
    ) : trigger === "link" ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-xs text-[var(--workspace-text-muted)] transition-colors hover:text-primary ${className}`}
      >
        {label}
      </button>
    ) : (
      <Button type="button" variant="outline" className={className} onClick={() => setOpen(true)}>
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        {label}
      </Button>
    );

  return (
    <>
      {triggerNode}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base">Send feedback</DialogTitle>
            <DialogDescription className="text-xs leading-relaxed">
              Help improve Formaty. Add several items at once - they are submitted together in one
              batch, and you can keep adding more after sending.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[55vh] space-y-2.5 overflow-y-auto pr-1">
            {entries.map((entry, idx) => (
              <div
                key={entry.id}
                className="rounded-lg border border-[var(--workspace-border)] bg-[var(--workspace-panel)]/60 p-2.5"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-[var(--workspace-text-muted)]">
                    Item {idx + 1}
                  </span>
                  <Select
                    value={entry.category}
                    onValueChange={(v) => updateEntry(entry.id, { category: v as FeedbackCategory })}
                  >
                    <SelectTrigger className="h-7 w-36 shrink-0 rounded-md text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FEEDBACK_CATEGORIES.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {entries.length > 1 && (
                    <button
                      type="button"
                      aria-label="Remove item"
                      className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-border)]/40 hover:text-[var(--workspace-text)]"
                      onClick={() => removeEntry(entry.id)}
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Textarea
                  value={entry.message}
                  onChange={(e) => updateEntry(entry.id, { message: e.target.value })}
                  placeholder="What should we improve?"
                  className="min-h-[64px] resize-y text-sm"
                  maxLength={FEEDBACK_MAX_MESSAGE}
                />
                <p className="mt-1 text-right text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
                  {entry.message.length}/{FEEDBACK_MAX_MESSAGE}
                </p>
              </div>
            ))}

            {entries.length < FEEDBACK_MAX_ITEMS && (
              <button
                type="button"
                onClick={addEntry}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--workspace-border)] px-3 py-2 text-xs font-medium text-[var(--workspace-text-muted)] transition-colors hover:border-primary/40 hover:text-primary"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add another item ({entries.length}/{FEEDBACK_MAX_ITEMS})
              </button>
            )}
          </div>

          <div className="space-y-2">
            {/* Honeypot - visually hidden, bots fill it, we silently drop those */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
            />
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email (optional - only if you want a reply)"
              className="h-9 text-sm"
            />
            {renderError()}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[var(--workspace-border)] pt-3">
            <p className="min-w-0 text-[10px] leading-snug text-[var(--workspace-text-muted)]">
              {sentCount !== null && (
                <span className="mb-0.5 block font-medium text-emerald-500">
                  Last send: {sentCount} item{sentCount === 1 ? "" : "s"}
                </span>
              )}
              Your current page and browser info are attached automatically. No account needed.
            </p>
            <Button
              type="button"
              disabled={validItems.length === 0 || submitting}
              onClick={() => void handleSubmit()}
              className="shrink-0"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              {submitting
                ? "Sending..."
                : `Send ${validItems.length} item${validItems.length === 1 ? "" : "s"}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
