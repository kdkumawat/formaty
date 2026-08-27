/**
 * Input-size classification and hard caps.
 *
 * Single source of truth for the thresholds used across the workspace —
 * ingestion, view routing, and editor large-mode all import from here.
 */

export const LARGE_INPUT_BYTES = 400 * 1024;
export const HUGE_INPUT_BYTES = 2 * 1024 * 1024;

/** Hard ceiling for any single user-supplied string entering the worker. */
export const WORKER_INPUT_CAP_BYTES = 200 * 1024 * 1024; // 200 MB

/** Band for a byte count. */
export type InputBand = "small" | "large" | "huge";

export function classifySize(bytes: number): InputBand {
  if (!Number.isFinite(bytes) || bytes < 0) return "small";
  if (bytes >= HUGE_INPUT_BYTES) return "huge";
  if (bytes >= LARGE_INPUT_BYTES) return "large";
  return "small";
}

export class InputTooLargeError extends Error {
  readonly bytes: number;
  readonly cap: number;
  constructor(bytes: number, cap: number, label = "input") {
    super(`${label} is too large: ${bytes} bytes exceeds cap of ${cap} bytes`);
    this.name = "InputTooLargeError";
    this.bytes = bytes;
    this.cap = cap;
  }
}

export function assertBelowCap(bytes: number, cap: number, label = "input"): void {
  if (bytes > cap) {
    throw new InputTooLargeError(bytes, cap, label);
  }
}
