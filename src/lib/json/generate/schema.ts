import type { JsonValue } from "../core";

export function inferJsonSchema(input: JsonValue): JsonValue {
  if (Array.isArray(input)) {
    return {
      type: "array",
      items: input.length ? inferJsonSchema(mergeSamples(input)) : {},
    };
  }
  if (input === null) {
    return { type: "null" };
  }
  if (typeof input === "object") {
    const properties: Record<string, JsonValue> = {};
    const required: string[] = [];
    Object.entries(input as Record<string, JsonValue>).forEach(([key, value]) => {
      properties[key] = inferJsonSchema(value);
      required.push(key);
    });
    return {
      type: "object",
      properties,
      required,
      additionalProperties: true,
    };
  }
  if (typeof input === "number" && Number.isInteger(input)) return { type: "integer" };
  return { type: typeof input };
}

/**
 * Collapse sibling samples into one representative value: object keys are unioned,
 * numbers stay integer only if every sample is, anything else takes the first sample.
 */
export function mergeSamples(values: JsonValue[]): JsonValue {
  const vals = values.filter((v) => v !== undefined);
  const isObj = (v: JsonValue) => !!v && typeof v === "object" && !Array.isArray(v);
  if (vals.every((v) => typeof v === "number")) {
    return vals.every((v) => Number.isInteger(v)) ? vals[0] : 0.5;
  }
  if (vals.every(Array.isArray)) return (vals as JsonValue[][]).flat();
  if (vals.every(isObj)) {
    const keys = [...new Set(vals.flatMap((v) => Object.keys(v as object)))];
    return Object.fromEntries(
      keys.map((k) => [
        k,
        mergeSamples(vals.filter((v) => k in (v as object)).map((v) => (v as Record<string, JsonValue>)[k])),
      ]),
    );
  }
  return vals[0];
}

/**
 * Generate a minimal but valid OpenAPI 3.1 spec from a JSON value: the inferred
 * JSON Schema is exposed as `components.schemas.Root` and referenced by a
 * default `GET /` path (overridable via opts). Best-effort - never claims to
 * recover real endpoint semantics from data alone.
 */
export function generateOpenApiSpec(
  input: JsonValue,
  opts?: { title?: string; version?: string; path?: string },
): string {
  const schema = inferJsonSchema(input);
  const path = opts?.path?.trim().startsWith("/") ? opts.path.trim() : "/";
  const spec = {
    openapi: "3.1.0",
    info: {
      title: opts?.title?.trim() || "API",
      version: opts?.version?.trim() || "1.0.0",
    },
    paths: {
      [path]: {
        get: {
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/Root" },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Root: schema,
      },
    },
  };
  return JSON.stringify(spec, null, 2);
}
