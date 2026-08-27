/**
 * Hardening helpers for Monaco when the input crosses `HUGE_INPUT_BYTES`.
 *
 * Goals at huge size:
 *  - disable language workers (the JSON language service re-tokenizes the
 *    whole document on every keystroke — catastrophic for >10 MB inputs);
 *  - disable bracket pair colorization, folding, minimap, line numbers;
 *  - cap the visible line count so Monaco doesn't lay out the entire model.
 */

import type { editor } from "monaco-editor";
import { HUGE_INPUT_BYTES } from "@/lib/io/size";

let noopWorkerPinned = false;

/** Apply `largeFileOptimizations` to a Monaco editor. Safe to call on any
 *  editor; the options are additive on top of the editor's existing config. */
export function applyLargeFileOptions(
  ed: editor.IStandaloneCodeEditor,
  monaco: typeof import("monaco-editor"),
): void {
  ed.updateOptions({
    largeFileOptimizations: true,
    wordWrap: "on",
    minimap: { enabled: false },
    folding: false,
    lineNumbers: "on",
    bracketPairColorization: { enabled: false },
    guides: { indentation: false, bracketPairs: false, highlightActiveIndentation: false },
    renderLineHighlight: "none",
    occurrencesHighlight: "off",
    selectionHighlight: false,
    quickSuggestions: false,
    parameterHints: { enabled: false },
    suggestOnTriggerCharacters: false,
    codeLens: false,
    lightbulb: { enabled: monaco.editor.ShowLightbulbIconMode.Off },
  });
  // Disable JSON diagnostics on this model so the language worker doesn't
  // re-schemas-validate the entire document on every keystroke.
  // The `@monaco-editor/react` build exposes this as a deprecated path, but
  // it still works for the singleton loaded via the CDN loader.
  const jsonLang = (monaco.languages as unknown as {
    json?: {
      jsonDefaults: {
        setDiagnosticsOptions: (opts: Record<string, unknown>) => void;
      };
    };
  }).json;
  if (jsonLang?.jsonDefaults) {
    try {
      jsonLang.jsonDefaults.setDiagnosticsOptions({
        validate: false,
        allowComments: false,
        schemas: [],
        enableSchemaRequest: false,
      });
    } catch {
      // The monaco instance may not have jsonDefaults registered; ignore.
    }
  }
}

/** Pin `MonacoEnvironment.getWorker` to a no-op worker so the CDN-spawned
 *  JSON / TS / CSS workers don't tokenize a huge model. Idempotent. */
export function pinNoopJsonWorker(): void {
  if (noopWorkerPinned) return;
  if (typeof self === "undefined") return;
  const w = self as unknown as {
    MonacoEnvironment?: { getWorker?: (id: string, label: string) => Worker };
  };
  const noopSrc = "self.onmessage=()=>{};";
  const blob = new Blob([noopSrc], { type: "text/javascript" });
  const url = URL.createObjectURL(blob);
  const create = () => new Worker(url);
  const existing = w.MonacoEnvironment;
  w.MonacoEnvironment = {
    ...(existing ?? {}),
    getWorker(_id: string, _label: string) {
      return create();
    },
  };
  noopWorkerPinned = true;
}

/** True when the input string is above the huge threshold. */
export function isHugeInput(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.length > HUGE_INPUT_BYTES;
}
