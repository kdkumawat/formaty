import Ajv from "ajv";
import {
  flattenJson,
  formatJson,
  generateSql,
  generateTypes,
  generateTypeScript,
  inferJsonSchema,
  minifyJson,
  parseJsonInput,
  removeEmptyDeep,
  searchJson,
  sortKeysDeep,
  sortArraysDeep,
  deduplicateArraysDeep,
  toCsv,
  toXml,
  toYaml,
  unflattenJson,
  type JsonValue,
  type SearchMode,
  type SqlGenerateOptions,
  type TypeTargetLanguage,
} from "@/lib/json/core";
import { parseInput, stringifyOutput, type FormatKind, type FormatStringifyOptions } from "@/lib/formats";
import { WORKER_INPUT_CAP_BYTES, assertBelowCap } from "@/lib/io/size";

type WorkerAction =
  | "parse"
  | "parseFormat"
  | "search"
  | "sort"
  | "sortArrays"
  | "dedup"
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

interface WorkerRequest {
  id: string;
  action: WorkerAction;
  payload: Record<string, unknown>;
}

interface WorkerResponse {
  id: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

// `self` is the DedicatedWorkerGlobalScope when this module is loaded as a
// real Web Worker. In Node (vitest, jsdom) it is undefined; we keep a stub so
// the pure `dispatch` function stays importable for unit tests.
const ctx: Worker =
  (typeof self !== "undefined"
    ? (self as unknown as Worker)
    : ({
        postMessage: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      } as unknown as Worker));
const ajv = new Ajv({ allErrors: true, strict: false });

/** Actions that accept a `payload.input` string. The byte cap is enforced
 *  before any parsing to keep a 200 MB paste from OOMing the worker. */
const STRING_INPUT_ACTIONS = new Set<WorkerAction>([
  "parse",
  "parseFormat",
  "format",
  "minify",
  "convert",
]);

/** Pure dispatcher. Exported for unit testing. Returns the response payload
 *  (no id, no postMessage) so the caller can serialize it. */
export function dispatch(action: string, payload: Record<string, unknown>): {
  ok: boolean;
  result?: unknown;
  error?: string;
} {
  try {
    if (STRING_INPUT_ACTIONS.has(action as WorkerAction)) {
      const input = payload.input;
      if (typeof input === "string") {
        assertBelowCap(input.length, WORKER_INPUT_CAP_BYTES, "worker input");
      }
    }

    let result: unknown;
    switch (action as WorkerAction) {
      case "parse":
        result = parseJsonInput(payload.input as string);
        break;
      case "parseFormat":
        result = parseInput(payload.input as string, payload.format as FormatKind);
        break;
      case "search":
        result = searchJson(
          payload.json as JsonValue,
          payload.query as string,
          payload.mode as SearchMode,
          Boolean(payload.caseSensitive),
        );
        break;
      case "sort":
        result = sortKeysDeep(payload.json as JsonValue);
        break;
      case "sortArrays":
        result = sortArraysDeep(payload.json as JsonValue);
        break;
      case "dedup":
        result = deduplicateArraysDeep(payload.json as JsonValue);
        break;
      case "removeEmpty":
        result = removeEmptyDeep(payload.json as JsonValue);
        break;
      case "flatten":
        result = flattenJson(payload.json as JsonValue);
        break;
      case "unflatten":
        result = unflattenJson(payload.json as Record<string, JsonValue>);
        break;
      case "generateTs":
        result = generateTypeScript(
          payload.json as JsonValue,
          (payload.rootName as string) || "JsonData",
        );
        break;
      case "generateTypes": {
        const language = (payload.language as TypeTargetLanguage) || "typescript";
        if (language === "sql") {
          const opts = (payload.sqlOptions as Partial<SqlGenerateOptions> | undefined) ?? {};
          result = generateSql(payload.json as JsonValue, {
            ...opts,
            dialect: opts.dialect ?? "sqlite",
          });
        } else {
          result = generateTypes(
            payload.json as JsonValue,
            language,
            (payload.rootName as string) || "JsonData",
          );
        }
        break;
      }
      case "schema":
        result = inferJsonSchema(payload.json as JsonValue);
        break;
      case "validate": {
        const schemaId = "__current__";
        const validate = ajv.compile(payload.schema as object);
        const valid = validate(payload.json);
        result = { valid, errors: validate.errors ?? [] };
        // Bound the schema cache: AJV keeps compiled schemas in a Map.
        ajv.removeSchema(schemaId);
        break;
      }
      case "format":
        result = formatJson(payload.json as JsonValue, {
          indentation: payload.indentation as number | undefined,
          quoteStyle: payload.quoteStyle as "single" | "double" | undefined,
          sortKeys: Boolean(payload.sortKeys),
        });
        break;
      case "minify":
        result = minifyJson(payload.json as JsonValue);
        break;
      case "convert": {
        const json = payload.json as JsonValue;
        const toFormat = payload.toFormat as FormatKind | undefined;
        const formatOptions = payload.formatOptions as FormatStringifyOptions | undefined;
        const csvDelimiter = (payload.csvDelimiter as string | undefined) ?? ",";
        if (toFormat) {
          result = stringifyOutput(json, toFormat, { ...formatOptions, csvDelimiter });
        } else {
          const kind = payload.kind as string;
          if (kind === "yaml") result = toYaml(json);
          else if (kind === "xml") result = toXml(json);
          else if (kind === "csv") result = toCsv(json, csvDelimiter);
          else result = stringifyOutput(json, kind as FormatKind);
        }
        break;
      }
      default:
        return { ok: false, error: `Unsupported action: ${String(action)}` };
    }
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Worker execution failed",
    };
  }
}

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, action, payload } = event.data;
  const response: WorkerResponse = { id, ...dispatch(action, payload) };
  ctx.postMessage(response);
};

export {};
