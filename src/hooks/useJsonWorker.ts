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
  /** Cancel the in-flight call. */
  signal?: AbortSignal;
  /** Transferable objects to move to the worker (zero-copy). */
  transfer?: Transferable[];
  /** Progress callback. */
  onProgress?: (p: { done: number; total: number }) => void;
}

export function useJsonWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(
    new Map<
      string,
      {
        resolve: (value: unknown) => void;
        reject: (reason?: unknown) => void;
        onProgress?: (p: { done: number; total: number }) => void;
        signal?: AbortSignal;
      }
    >(),
  );

  useEffect(() => {
    const worker = new Worker(new URL("../workers/json.worker.ts", import.meta.url), {
      type: "module",
    });
    const pendingMap = pending.current;
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse<unknown>>) => {
      const { id, ok, result, error, progress } = event.data;
      const current = pending.current.get(id);
      if (!current) return;
      if (progress) {
        current.onProgress?.(progress);
        return;
      }
      if (ok) current.resolve(result);
      else current.reject(new Error(error ?? "Worker failed"));
      pending.current.delete(id);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      pendingMap.clear();
    };
  }, []);

  const run = useCallback(
    <T,>(action: Action, payload: Record<string, unknown>, opts: RunOptions = {}): Promise<T> => {
      const worker = workerRef.current;
      if (!worker) {
        return Promise.reject(new Error("Worker not initialized"));
      }
      const id = crypto.randomUUID();
      return new Promise<T>((resolve, reject) => {
        const entry = {
          resolve: (value: unknown) => resolve(value as T),
          reject,
          onProgress: opts.onProgress,
          signal: opts.signal,
        };
        pending.current.set(id, entry);
        if (opts.signal) {
          if (opts.signal.aborted) {
            pending.current.delete(id);
            reject(new DOMException("Aborted", "AbortError"));
            return;
          }
          const onAbort = () => {
            pending.current.delete(id);
            reject(new DOMException("Aborted", "AbortError"));
          };
          opts.signal.addEventListener("abort", onAbort, { once: true });
        }
        try {
          worker.postMessage(
            { id, action, payload },
            opts.transfer ? { transfer: opts.transfer } : undefined,
          );
        } catch (e) {
          pending.current.delete(id);
          reject(e);
        }
      });
    },
    [],
  );

  const cancel = useCallback((id: string) => {
    const worker = workerRef.current;
    if (!worker) return;
    if (pending.current.delete(id)) {
      worker.postMessage({ id, action: "__cancel__" });
    }
  }, []);

  return { run, cancel };
}
