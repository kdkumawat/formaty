"use client";

import { useCallback, useEffect, useRef } from "react";

type Action =
  | "parse"
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
}

export function useJsonWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(
    new Map<
      string,
      {
        resolve: (value: unknown) => void;
        reject: (reason?: unknown) => void;
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
      const { id, ok, result, error } = event.data;
      const current = pending.current.get(id);
      if (!current) return;
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
    <T,>(action: Action, payload: Record<string, unknown>): Promise<T> => {
      const worker = workerRef.current;
      if (!worker) {
        return Promise.reject(new Error("Worker not initialized"));
      }
      const id = crypto.randomUUID();
      return new Promise<T>((resolve, reject) => {
        pending.current.set(id, {
          resolve: (value) => resolve(value as T),
          reject,
        });
        worker.postMessage({ id, action, payload });
      });
    },
    [],
  );

  return { run };
}
