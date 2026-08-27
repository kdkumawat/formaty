/**
 * Guarded ingestion helpers. Each function enforces a hard byte cap and
 * honors an optional `AbortSignal` so the workspace can cancel a read that
 * would otherwise OOM the tab.
 *
 * Browsers do not expose a native "maxBytes" for FileReader/fetch, so we
 * count UTF-8 bytes (or chunk-streamed bytes) as we read and bail at the cap.
 */

import { InputTooLargeError } from "./size";

const TEXT_DECODER = new TextDecoder("utf-8", { fatal: false });

export interface ReadResult {
  text: string;
  bytes: number;
  truncated: boolean;
}

const DEFAULT_FILE_READ_CAP = 200 * 1024 * 1024; // 200 MB

export class AbortError extends Error {
  constructor() {
    super("Aborted");
    this.name = "AbortError";
  }
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new AbortError();
}

/**
 * Read a `File` as text, but stop at `maxBytes` UTF-8 bytes. Resolves with
 * `{ text, bytes, truncated }` — if the file exceeds the cap, `text` is the
 * prefix and `truncated: true`. Works in both browser and node (uses Blob
 * slicing + TextDecoder instead of FileReader so the helper is portable).
 */
export async function readFileAsTextGuarded(
  file: Blob,
  maxBytes: number = DEFAULT_FILE_READ_CAP,
  signal?: AbortSignal,
): Promise<ReadResult> {
  throwIfAborted(signal);
  const size = file.size;
  const slice = file.slice(0, Math.min(size, maxBytes));
  const buf = await slice.arrayBuffer();
  throwIfAborted(signal);
  const text = TEXT_DECODER.decode(buf);
  return {
    text,
    bytes: Math.min(size, maxBytes),
    truncated: size > maxBytes,
  };
}

export interface FetchUrlOptions {
  maxBytes: number;
  timeoutMs: number;
  signal?: AbortSignal;
}

const DEFAULT_FETCH_MAX = 100 * 1024 * 1024; // 100 MB
const DEFAULT_FETCH_TIMEOUT = 30_000;

/**
 * Fetch a URL and return the body as text, capped at `maxBytes` bytes.
 * Honors `signal` and `timeoutMs`. Streams via `Response.body.getReader()`
 * so we never materialize more than `maxBytes` in memory.
 */
export async function fetchUrlText(
  url: string,
  opts: Partial<FetchUrlOptions> = {},
): Promise<ReadResult> {
  const maxBytes = opts.maxBytes ?? DEFAULT_FETCH_MAX;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_FETCH_TIMEOUT;
  if (opts.signal?.aborted) throw new AbortError();
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  if (opts.signal) {
    opts.signal.addEventListener("abort", onAbort, { once: true });
  }
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }
    if (!res.body) {
      const text = await res.text();
      if (text.length > maxBytes) {
        throw new InputTooLargeError(text.length, maxBytes, "fetched response");
      }
      return { text, bytes: new Blob([text]).size, truncated: false };
    }
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    let truncated = false;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (received + value.byteLength > maxBytes) {
        const room = Math.max(0, maxBytes - received);
        if (room > 0) chunks.push(value.subarray(0, room));
        received = maxBytes;
        truncated = true;
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        break;
      }
      chunks.push(value);
      received += value.byteLength;
    }
    const joined = concatChunks(chunks, received);
    return { text: TEXT_DECODER.decode(joined), bytes: received, truncated };
  } finally {
    clearTimeout(timer);
    if (opts.signal) opts.signal.removeEventListener("abort", onAbort);
  }
}

function concatChunks(chunks: Uint8Array[], total: number): Uint8Array {
  if (chunks.length === 1) return chunks[0]!;
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}
