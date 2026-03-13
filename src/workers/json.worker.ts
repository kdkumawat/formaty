import Ajv from "ajv";
import {
  flattenJson,
  formatJson,
  generateTypes,
  generateTypeScript,
  inferJsonSchema,
  minifyJson,
  parseJsonInput,
  removeEmptyDeep,
  searchJson,
  sortKeysDeep,
  toCsv,
  toXml,
  toYaml,
  unflattenJson,
  type JsonValue,
  type SearchMode,
  type TypeTargetLanguage,
} from "@/lib/json/core";
import { parseInput, stringifyOutput, type FormatKind, type FormatStringifyOptions } from "@/lib/formats";

type WorkerAction =
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

const ctx: Worker = self as unknown as Worker;
const ajv = new Ajv({ allErrors: true, strict: false });

ctx.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, action, payload } = event.data;

  try {
    let result: unknown;

    switch (action) {
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
      case "generateTypes":
        result = generateTypes(
          payload.json as JsonValue,
          (payload.language as TypeTargetLanguage) || "typescript",
          (payload.rootName as string) || "JsonData",
        );
        break;
      case "schema":
        result = inferJsonSchema(payload.json as JsonValue);
        break;
      case "validate": {
        const validate = ajv.compile(payload.schema as object);
        const valid = validate(payload.json);
        result = {
          valid,
          errors: validate.errors ?? [],
        };
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
        if (toFormat) {
          result = stringifyOutput(json, toFormat, formatOptions);
        } else {
          const kind = payload.kind as string;
          if (kind === "yaml") result = toYaml(json);
          else if (kind === "xml") result = toXml(json);
          else if (kind === "csv") result = toCsv(json);
          else result = stringifyOutput(json, kind as FormatKind);
        }
        break;
      }
      default:
        throw new Error(`Unsupported action: ${String(action)}`);
    }

    const response: WorkerResponse = { id, ok: true, result };
    ctx.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      ok: false,
      error: error instanceof Error ? error.message : "Worker execution failed",
    };
    ctx.postMessage(response);
  }
};

export {};
