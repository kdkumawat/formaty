"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { createPortal } from "react-dom";
import { TOUR_STEPS } from "@/lib/tourSteps";

interface GuidedTourProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fired on completion / skip / esc so the caller can mark the user onboarded. */
  onExit: (reason: "done" | "skip" | "esc", step: number) => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const RETRY_INTERVAL_MS = 100;
const RETRY_LIMIT = 30; // ~3s
const CARD_WIDTH = 320;
const PAD = 12;
const MOBILE_BREAKPOINT = 1280;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Spotlight + tooltip guided tour for the Formaty workspace.
 *
 * Renders at `document.body` (portal) so it is never clipped by workspace panes.
 * The spotlight is a screen-sized dim with a "hole" cut around the target; the
 * hole and dim are pointer-events-none so the page stays fully usable while the
 * tour is open (the tour is passive — no focus trap, no auto-advance).
 *
 * Below the desktop breakpoint the spotlight is skipped and the same steps show
 * as a scrollable centered card.
 */
export function GuidedTour({ open, onOpenChange, onExit }: GuidedTourProps) {
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(true);
  const [rect, setRect] = useState<Rect | null>(null);
  const [resolved, setResolved] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  // Centered when the step asks for it, on compact layouts, or when the target
  // never appeared (retries exhausted) - the card must always render controls.
  const centered = step.centered || !isDesktop || gaveUp;

  // Only render the portal after mount (document.body doesn't exist on the server).
  useEffect(() => {
    setMounted(true);
  }, []);

  // Desktop detection (mirrors the workspace 1280px breakpoint).
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [mounted]);

  // Reset to the intro step each time the tour opens.
  useEffect(() => {
    if (open) setStepIndex(0);
  }, [open]);

  const findTarget = useCallback((target: string | undefined): HTMLElement | null => {
    if (!target) return null;
    return document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  }, []);

  // Resolve the current step's target, retrying while Monaco / panes mount async.
  // Centered steps still resolve their target when one exists so the finale can
  // draw a ring around the palette trigger (highlighted, not opened).
  useEffect(() => {
    if (!open) return;
    if (!step.target || !isDesktop) {
      setResolved(false);
      setGaveUp(false);
      setRect(null);
      setCardPos(null);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    setResolved(false);
    setGaveUp(false);
    const tryResolve = () => {
      if (cancelled) return;
      const el = findTarget(step.target);
      if (el) {
        setResolved(true);
        return;
      }
      attempts++;
      if (attempts >= RETRY_LIMIT) {
        // Target never mounted (e.g. compact menus off changes the toolbar) - fall
        // back to a centered card so the tour never strands the user.
        setResolved(false);
        setGaveUp(true);
        return;
      }
      window.setTimeout(tryResolve, RETRY_INTERVAL_MS);
    };
    tryResolve();
    return () => {
      cancelled = true;
    };
  }, [open, step.target, step.centered, isDesktop, findTarget, stepIndex]);

  // Measure the target + place the tooltip card (flip below/above the target).
  // For centered steps only the ring rect is needed (no card placement).
  useEffect(() => {
    if (!open || !isDesktop) {
      setRect(null);
      setCardPos(null);
      return;
    }
    if (!resolved) {
      setRect(null);
      setCardPos(null);
      return;
    }
    const measure = () => {
      const el = findTarget(step.target);
      if (!el) {
        setRect(null);
        setCardPos(null);
        return;
      }
      const r = el.getBoundingClientRect();
      const next: Rect = { top: r.top, left: r.left, width: r.width, height: r.height };
      setRect(next);
      // Estimate card height to decide above/below; exact height is clamped
      // after render via a follow-up effect.
      const cardHeight = cardRef.current?.offsetHeight ?? 190;
      const below = next.top + next.height + PAD + cardHeight <= window.innerHeight - PAD;
      const top = below ? next.top + next.height + PAD : Math.max(PAD, next.top - PAD - cardHeight);
      const left = clamp(next.left + next.width / 2 - CARD_WIDTH / 2, PAD, window.innerWidth - CARD_WIDTH - PAD);
      setCardPos({ top, left });
    };
    if (step.centered) {
      // Centered step: only measure the target for the ring highlight.
      const el = findTarget(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      }
      setCardPos(null);
      return;
    }
    measure();
    // Recompute while the target settles (layout shifts) and on resize/scroll.
    const settleTimer = window.setTimeout(measure, 120);
    const onResize = () => {
      window.setTimeout(measure, 50);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, isDesktop, step.centered, resolved, step.target, findTarget, stepIndex]);

  // Clamp the card fully inside the viewport once it has rendered (handles the
  // estimated height above and short screens).
  useEffect(() => {
    if (!cardPos || !open) return;
    const card = cardRef.current;
    if (!card) return;
    const ch = card.offsetHeight;
    const cw = card.offsetWidth;
    if (ch === 0 || cw === 0) return;
    setCardPos((prev) => {
      if (!prev) return prev;
      const top = clamp(prev.top, PAD, Math.max(PAD, window.innerHeight - ch - PAD));
      const left = clamp(prev.left, PAD, Math.max(PAD, window.innerWidth - cw - PAD));
      if (top === prev.top && left === prev.left) return prev;
      return { top, left };
    });
  }, [cardPos, open]);

  // Esc closes the tour.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onExit("esc", stepIndex);
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, stepIndex, onExit, onOpenChange]);

  // Initial focus on the card when it appears / step changes.
  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => cardRef.current?.focus(), 60);
      return () => window.clearTimeout(t);
    }
  }, [open, stepIndex]);

  const goNext = useCallback(() => {
    if (isLast) {
      onExit("done", stepIndex);
      onOpenChange(false);
      return;
    }
    setStepIndex((i) => i + 1);
  }, [isLast, stepIndex, onExit, onOpenChange]);

  const goBack = useCallback(() => {
    setStepIndex((i) => Math.max(0, i - 1));
  }, []);

  const skip = useCallback(() => {
    onExit("skip", stepIndex);
    onOpenChange(false);
  }, [stepIndex, onExit, onOpenChange]);

  // Non-centered steps get a dim + ring; centered steps (finale) get ring only.
  const hasHighlight = isDesktop && resolved && rect !== null && !!step.target;
  const showSpotlight = !centered && hasHighlight;
  const showRing = hasHighlight && (showSpotlight || step.centered);

  const controls = useMemo(
    () => (
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--workspace-border)] pt-3">
        <button
          type="button"
          onClick={skip}
          className="rounded px-2 py-1 text-[11px] font-medium text-[var(--workspace-text-muted)] transition-colors hover:bg-[var(--workspace-border)]/40 hover:text-[var(--workspace-text)]"
        >
          Skip
        </button>
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="rounded border border-[var(--workspace-border)] bg-[var(--workspace-background)] px-3 py-1 text-[11px] font-medium text-[var(--workspace-text)] transition-colors hover:bg-[var(--workspace-border)]/40"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            className="rounded bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    ),
    [stepIndex, isLast, goBack, goNext, skip],
  );

  const dots = (
    <div className="flex items-center gap-1.5">
      {TOUR_STEPS.map((s, i) => (
        <span
          key={s.id}
          aria-hidden
          className={`h-1 rounded-full transition-all duration-200 ${
            i === stepIndex ? "w-3.5 bg-primary" : i < stepIndex ? "w-1 bg-primary/40" : "w-1 bg-[var(--workspace-border)]"
          }`}
        />
      ))}
    </div>
  );

  const cardBody = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">{step.title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--workspace-text)]">{step.body}</p>
      <div className="mt-3 flex items-center justify-between">
        {dots}
        <span className="text-[10px] tabular-nums text-[var(--workspace-text-muted)]">
          {stepIndex + 1}/{TOUR_STEPS.length}
        </span>
      </div>
      {controls}
    </>
  );

  const content = centered ? (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {showRing && rect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none fixed rounded-[10px] border-2"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            borderColor: "var(--primary)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.15), 0 0 18px rgba(0,0,0,0.25)",
          }}
        />
      )}
      <motion.div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-label="Product tour"
        tabIndex={-1}
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={`w-full overflow-y-auto rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4 shadow-2xl shadow-black/20 outline-none ${
          !isDesktop ? "max-h-[80vh] max-w-[92vw]" : "max-w-sm"
        }`}
        style={{ maxWidth: isDesktop ? "24rem" : "92vw" }}
      >
        {cardBody}
      </motion.div>
    </div>
  ) : (
    <div className="fixed inset-0 z-[300] pointer-events-none">
      {showSpotlight && rect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="pointer-events-none absolute"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
            borderRadius: 10,
          }}
        />
      )}
      {showRing && rect && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="pointer-events-none absolute rounded-[10px] border-2"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            borderColor: "var(--primary)",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.15), 0 0 18px rgba(0,0,0,0.25)",
          }}
        />
      )}
      {cardPos && (
        <motion.div
          ref={cardRef}
          role="dialog"
          aria-modal="false"
          aria-label="Product tour"
          tabIndex={-1}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="pointer-events-auto absolute w-80 rounded-xl border border-[var(--workspace-border)] bg-[var(--workspace-panel)] p-4 shadow-2xl shadow-black/20 outline-none"
          style={{ top: cardPos.top, left: cardPos.left, width: CARD_WIDTH }}
        >
          {cardBody}
        </motion.div>
      )}
    </div>
  );

  if (!mounted) return null;

  return (
    <MotionConfig reducedMotion="user">
      {createPortal(
        <AnimatePresence>{open ? content : null}</AnimatePresence>,
        document.body,
      )}
    </MotionConfig>
  );
}
