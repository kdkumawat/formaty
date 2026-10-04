"use client";

import { useCallback, useEffect, useRef } from "react";

type Action =
  | "parse"
  | "parseFormat"
  | "search"
  | "sort"
  | "removeEmpty"
  | "flatten"
  | "unflatten"
  | "generateTs"
  | "generateTypes"
  | "schema"
  | "validate"
  | "format"
  | "minify"
  | "convert";

interface WorkerResponse<T> {
  id: string;
  ok: boolean;
  result?: T;
  error?: string;
  /** Set on progress messages from the worker. */
  progress?: { done: number; total: number };
}

export interface RunOptions {
  /** Cancel the in-flight call. Aborting restarts the worker (work can't be interrupted otherwise). */
  signal?: AbortSignal;
  /** Transferable objects to move to the worker (zero-copy). */
  transfer?: Transferable[];
  /** Progress callback. */
  onProgress?: (p: { done: number; total: number }) => void;
}

interface PendingEntry {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  onProgress?: (p: { done: number; total: number }) => void;
}

export function useJsonWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<string, PendingEntry>());
  const disposed = useRef(false);

  const rejectAll = useCallback((reason: unknown) => {
    const entries = [...pending.current.values()];
    pending.current.clear();
    for (const entry of entries) entry.reject(reason);
  }, []);

  const spawn = useCallback(() => {
    const worker = new Worker(new URL("../workers/json.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event: MessageEvent<WorkerResponse<unknown>>) => {
      const { id, ok, result, error, progress } = event.data;
      const current = pending.current.get(id);
      if (!current) return;
      if (progress) {
        current.onProgress?.(progress);
        return;
      }
      pending.current.delete(id);
      if (ok) current.resolve(result);
      else current.reject(new Error(error ?? "Worker failed"));
    };
    // Crash (e.g. out of memory): fail everything in flight and start fresh.
    const onFailure = () => {
      if (workerRef.current !== worker) return;
      worker.terminate();
      workerRef.current = null;
      rejectAll(new Error("Worker crashed"));
      if (!disposed.current) workerRef.current = spawn();
    };
    worker.onerror = onFailure;
    worker.onmessageerror = onFailure;
    return worker;
  }, [rejectAll]);

  useEffect(() => {
    disposed.current = false;
    workerRef.current = spawn();
    return () => {
      disposed.current = true;
      workerRef.current?.terminate();
      workerRef.current = null;
      rejectAll(new DOMException("Worker disposed", "AbortError"));
    };
  }, [spawn, rejectAll]);

  const run = useCallback(
    <T,>(action: Action, payload: Record<string, unknown>, opts: RunOptions = {}): Promise<T> => {
      const worker = workerRef.current;
      if (!worker) {
        return Promise.reject(new Error("Worker not initialized"));
      }
      const { signal } = opts;
      if (signal?.aborted) {
        return Promise.reject(new DOMException("Aborted", "AbortError"));
      }
      const id = crypto.randomUUID();
      return new Promise<T>((resolve, reject) => {
        const onAbort = () => {
          if (!pending.current.delete(id)) return;
          reject(new DOMException("Aborted", "AbortError"));
          // Worker is busy with this call and can't be interrupted: replace it.
          // Other in-flight calls on the old worker are lost, so fail them too.
          if (workerRef.current === worker) {
            worker.terminate();
            rejectAll(new DOMException("Worker restarted", "AbortError"));
            if (!disposed.current) workerRef.current = spawn();
          }
        };
        const cleanup = () => signal?.removeEventListener("abort", onAbort);
        pending.current.set(id, {
          resolve: (value) => {
            cleanup();
            resolve(value as T);
          },
          reject: (reason) => {
            cleanup();
            reject(reason);
          },
          onProgress: opts.onProgress,
        });
        signal?.addEventListener("abort", onAbort, { once: true });
        try {
          worker.postMessage(
            { id, action, payload },
            opts.transfer ? { transfer: opts.transfer } : undefined,
          );
        } catch (e) {
          pending.current.delete(id);
          cleanup();
          reject(e);
        }
      });
    },
    [spawn, rejectAll],
  );

  return { run };
}
