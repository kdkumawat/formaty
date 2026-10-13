"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export const NAME_MAX_LENGTH = 40;

interface InlineRenameProps {
  initial: string;
  /** Accessible name, e.g. "Rename tab". */
  label: string;
  /** Called once: the trimmed new text (Enter or leaving the field; may be empty), or null on Escape. */
  onDone: (value: string | null) => void;
  /** Text styles. Give it the same classes as the label it replaces so nothing moves. */
  className?: string;
}

/**
 * The one rename field in the product (tabs, List A and B, Document A and B).
 * It replaces a label in place: no border, no extra height, same font. A hidden copy of the text sizes the field,
 * so it is as wide as the label and grows as you type. The caller draws the "editing" cue (an inset ring on its own box).
 */
export function InlineRename({ initial, label, onDone, className }: InlineRenameProps) {
  const [draft, setDraft] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  const finished = useRef(false);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  const finish = (value: string | null) => {
    if (finished.current) return;
    finished.current = true;
    onDone(value);
  };

  return (
    <span className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] overflow-hidden", className)}>
      <span aria-hidden className="invisible col-start-1 row-start-1 overflow-hidden whitespace-pre">
        {draft || " "}
      </span>
      <input
        ref={ref}
        value={draft}
        maxLength={NAME_MAX_LENGTH}
        aria-label={label}
        spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => finish(draft.trim())}
        onKeyDown={(e) => {
          if (e.key === "Enter") finish(draft.trim());
          else if (e.key === "Escape") finish(null);
        }}
        className="col-start-1 row-start-1 h-full w-full min-w-0 border-0 bg-transparent p-0 text-inherit caret-current outline-none [font:inherit] [letter-spacing:inherit]"
      />
    </span>
  );
}
