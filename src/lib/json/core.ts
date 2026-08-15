import { XMLBuilder } from "fast-xml-parser";
import { JSONPath } from "jsonpath-plus";
import yaml from "js-yaml";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type SearchMode = "key" | "value" | "type" | "jsonpath";

export interface SearchMatch {
  path: string;
  valuePreview: string;
}

export type TypeTargetLanguage =
  | "typescript"
  | "zod"
  | "java"
  | "csharp"
  | "python"
  | "pydantic"
  | "go"
  | "protobuf"
  | "kotlin"
  | "swift"
  | "rust"
  | "sql";

/**
 * Convert Python/JS-style single-quoted strings to double-quoted JSON strings.
 * Leaves already double-quoted segments intact; strips trailing commas.
 */
function normalizeLooseJson(input: string): string {
  let out = "";
  let i = 0;
  const n = input.length;
  while (i < n) {
    const c = input[i];
    if (c === '"') {
      out += c;
      i++;
      while (i < n) {
        if (input[i] === "\\") {
          out += input[i] + (input[i + 1] ?? "");
          i += 2;
          continue;
        }
        out += input[i];
        if (input[i] === '"') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (c === "'") {
      out += '"';
      i++;
      while (i < n) {
        if (input[i] === "\\") {
          const next = input[i + 1];
          if (next === "'") {
            out += "'";
            i += 2;
            continue;
          }
          out += input[i] + (next ?? "");
          i += 2;
          continue;
        }
        if (input[i] === "'") {
          out += '"';
          i++;
          break;
        }
        if (input[i] === '"') {
          out += '\\"';
          i++;
          continue;
        }
        out += input[i];
        i++;
      }
      continue;
    }
    out += c;
    i++;
  }
  return out.replace(/,\s*([\]}])/g, "$1");
}

/** Parse JSON; accepts common loose forms (single quotes, trailing commas). */
export function parseJsonInput(input: string): JsonValue {
  try {
    return JSON.parse(input) as JsonValue;
  } catch (strictErr) {
    try {
      return JSON.parse(normalizeLooseJson(input)) as JsonValue;
    } catch {
      throw strictErr;
    }
  }
}

export interface FormatJsonOptions {
  indentation?: number;
  quoteStyle?: "single" | "double";
  sortKeys?: boolean;
}

function normalizeIndentation(indentation: number | undefined): number {
  if (!Number.isFinite(indentation)) return 2;
  return Math.max(0, Math.min(12, Math.floor(indentation ?? 2)));
}

function toSingleQuotedJsonString(input: string): string {
  return input.replace(/"(?:\\.|[^"\\])*"/g, (token) => {
    const content = token.slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'");
    return `'${content}'`;
  });
}

export function formatJson(input: JsonValue, options?: FormatJsonOptions): string {
  const quoteStyle = options?.quoteStyle ?? "double";
  const indentation = normalizeIndentation(options?.indentation);
  const normalizedInput = options?.sortKeys ? sortKeysDeep(input) : input;
  const formatted = JSON.stringify(normalizedInput, null, indentation);
  if (quoteStyle === "single") {
    return toSingleQuotedJsonString(formatted);
  }
  return formatted;
}

export function minifyJson(input: JsonValue): string {
  return JSON.stringify(input);
}

export function sortKeysDeep(input: JsonValue): JsonValue {
  if (Array.isArray(input)) {
    return input.map(sortKeysDeep);
  }
  if (input && typeof input === "object") {
    const next: Record<string, JsonValue> = {};
    Object.keys(input)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        next[key] = sortKeysDeep((input as Record<string, JsonValue>)[key]);
      });
    return next;
  }
  return input;
}

export function removeEmptyDeep(input: JsonValue): JsonValue {
  if (Array.isArray(input)) {
    return input
      .map(removeEmptyDeep)
      .filter((v) => !(v === null || v === "" || v === undefined));
  }
  if (input && typeof input === "object") {
    const next: Record<string, JsonValue> = {};
    Object.entries(input as Record<string, JsonValue>).forEach(([key, value]) => {
      const cleaned = removeEmptyDeep(value);
      if (
        cleaned !== null &&
        cleaned !== "" &&
        cleaned !== undefined &&
        !(Array.isArray(cleaned) && cleaned.length === 0) &&
        !(
          typeof cleaned === "object" &&
          !Array.isArray(cleaned) &&
          Object.keys(cleaned).length === 0
        )
      ) {
        next[key] = cleaned;
      }
    });
    return next;
  }
  return input;
}

export function sortArraysDeep(input: JsonValue): JsonValue {
  if (Array.isArray(input)) {
    const processed = input.map(sortArraysDeep);
    return processed.sort((a, b) => {
      const sa = typeof a === "object" ? JSON.stringify(a) : String(a ?? "");
      const sb = typeof b === "object" ? JSON.stringify(b) : String(b ?? "");
      return sa.localeCompare(sb);
    });
  }
  if (input && typeof input === "object") {
    const next: Record<string, JsonValue> = {};
    Object.entries(input as Record<string, JsonValue>).forEach(([key, value]) => {
      next[key] = sortArraysDeep(value);
    });
    return next;
  }
  return input;
}

export function deduplicateArraysDeep(input: JsonValue): JsonValue {
  if (Array.isArray(input)) {
    const processed = input.map(deduplicateArraysDeep);
    const seen = new Set<string>();
    return processed.filter((item) => {
      const key = JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  if (input && typeof input === "object") {
    const next: Record<string, JsonValue> = {};
    Object.entries(input as Record<string, JsonValue>).forEach(([key, value]) => {
      next[key] = deduplicateArraysDeep(value);
    });
    return next;
  }
  return input;
}

export function flattenJson(input: JsonValue, prefix = ""): Record<string, JsonValue> {
  const out: Record<string, JsonValue> = {};
  if (Array.isArray(input)) {
    input.forEach((value, index) => {
      const key = prefix ? `${prefix}.${index}` : String(index);
      Object.assign(out, flattenJson(value, key));
    });
    return out;
  }
  if (input && typeof input === "object") {
    Object.entries(input as Record<string, JsonValue>).forEach(([key, value]) => {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      Object.assign(out, flattenJson(value, nextKey));
    });
    return out;
  }
  out[prefix] = input;
  return out;
}

export function unflattenJson(flat: Record<string, JsonValue>): JsonValue {
  const result: Record<string, JsonValue> = {};
  Object.entries(flat).forEach(([path, value]) => {
    const parts = path.split(".");
    let current: Record<string, JsonValue> | JsonValue[] = result;
    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const nextPart = parts[index + 1];
      const keyIsIndex = /^\d+$/.test(part);
      const nextIsIndex = !!nextPart && /^\d+$/.test(nextPart);

      if (isLast) {
        if (Array.isArray(current)) {
          current[Number(part)] = value;
        } else {
          current[part] = value;
        }
        return;
      }

      if (Array.isArray(current)) {
        const idx = Number(part);
        if (current[idx] === undefined) {
          current[idx] = nextIsIndex ? [] : {};
        }
        current = current[idx] as Record<string, JsonValue> | JsonValue[];
      } else if (keyIsIndex) {
        const idx = Number(part);
        const existing = current[idx as unknown as keyof typeof current];
        if (!Array.isArray(existing)) {
          current[idx as unknown as keyof typeof current] = nextIsIndex ? [] : {};
        }
        current = current[idx as unknown as keyof typeof current] as Record<
          string,
          JsonValue
        > | JsonValue[];
      } else {
        if (current[part] === undefined) {
          current[part] = nextIsIndex ? [] : {};
        }
        current = current[part] as Record<string, JsonValue> | JsonValue[];
      }
    });
  });
  return result;
}

function pathPreview(path: string[], token: string, type: "key" | "index"): string {
  if (type === "index") {
    return `${path.join("")}[${token}]`;
  }
  return `${path.join("")}${path.length ? "." : ""}${token}`;
}

function valuePreview(value: JsonValue): string {
  if (typeof value === "string") return value.slice(0, 80);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  if (Array.isArray(value)) return `[Array(${value.length})]`;
  return "{Object}";
}

export function searchJson(
  input: JsonValue,
  query: string,
  mode: SearchMode,
  caseSensitive: boolean,
): SearchMatch[] {
  if (!query.trim()) return [];
  if (mode === "jsonpath") {
    try {
      const paths = JSONPath({
        path: query,
        json: input,
        resultType: "path",
      }) as string[];
      return paths.map((p) => ({ path: p, valuePreview: "JSONPath match" }));
    } catch {
      return [];
    }
  }

  const normalizedQuery = caseSensitive ? query : query.toLowerCase();
  const matches: SearchMatch[] = [];

  const visit = (value: JsonValue, path: string[]) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const p = pathPreview(path, String(index), "index");
        if (mode === "type") {
          const t = Array.isArray(item) ? "array" : item === null ? "null" : typeof item;
          if ((caseSensitive ? t : t.toLowerCase()).includes(normalizedQuery)) {
            matches.push({ path: p, valuePreview: valuePreview(item) });
          }
        } else if (mode === "value") {
          const target = valuePreview(item);
          if ((caseSensitive ? target : target.toLowerCase()).includes(normalizedQuery)) {
            matches.push({ path: p, valuePreview: target });
          }
        }
        visit(item, [...path, `[${index}]`]);
      });
      return;
    }

    if (value && typeof value === "object") {
      Object.entries(value).forEach(([key, nestedValue]) => {
        const p = pathPreview(path, key, "key");
        if (mode === "key") {
          const target = caseSensitive ? key : key.toLowerCase();
          if (target.includes(normalizedQuery)) {
            matches.push({ path: p, valuePreview: valuePreview(nestedValue) });
          }
        }
        if (mode === "value") {
          const target = valuePreview(nestedValue);
          if ((caseSensitive ? target : target.toLowerCase()).includes(normalizedQuery)) {
            matches.push({ path: p, valuePreview: target });
          }
        }
        if (mode === "type") {
          const t = Array.isArray(nestedValue)
            ? "array"
            : nestedValue === null
              ? "null"
              : typeof nestedValue;
          if ((caseSensitive ? t : t.toLowerCase()).includes(normalizedQuery)) {
            matches.push({ path: p, valuePreview: t });
          }
        }
        visit(nestedValue, [...path, key]);
      });
    }
  };

  visit(input, []);
  return matches.slice(0, 5000);
}

function inferTypeName(value: JsonValue): string {
  if (Array.isArray(value)) {
    if (!value.length) return "unknown[]";
    return `${inferTypeName(value[0])}[]`;
  }
  if (value === null) return "null";
  if (typeof value === "object") return "Record<string, unknown>";
  return typeof value;
}

export function generateTypeScript(input: JsonValue, rootName = "JsonData"): string {
  const lines: string[] = [];
  const emitted = new Set<string>();
  const usedTypeNames = new Set<string>([rootName]);

  const typeNameFromKey = (key: string): string => {
    const base = capitalize(key) || "Type";
    if (!usedTypeNames.has(base)) {
      usedTypeNames.add(base);
      return base;
    }
    let suffix = 2;
    while (usedTypeNames.has(`${base}${suffix}`)) {
      suffix += 1;
    }
    const unique = `${base}${suffix}`;
    usedTypeNames.add(unique);
    return unique;
  };

  const walk = (value: JsonValue, name: string) => {
    if (!value || typeof value !== "object" || Array.isArray(value) || emitted.has(name)) return;

    const fieldLines: string[] = [];
    Object.entries(value as Record<string, JsonValue>).forEach(([key, nested]) => {
      const fieldName = /^[$A-Z_][0-9A-Z_$]*$/i.test(key) ? key : `"${key}"`;
      if (nested && typeof nested === "object" && !Array.isArray(nested)) {
        const childName = typeNameFromKey(key);
        walk(nested, childName);
        fieldLines.push(`  ${fieldName}: ${childName};`);
      } else if (Array.isArray(nested) && nested[0] && typeof nested[0] === "object") {
        const childName = typeNameFromKey(key);
        walk(nested[0], childName);
        fieldLines.push(`  ${fieldName}: ${childName}[];`);
      } else {
        fieldLines.push(`  ${fieldName}: ${inferTypeName(nested)};`);
      }
    });

    emitted.add(name);
    lines.push(`export interface ${name} {`);
    fieldLines.forEach((field) => {
      lines.push(field);
    });
    lines.push("}");
    lines.push("");
  };

  walk(input, rootName);
  return lines.join("\n").trim();
}

export type SqlDialect = "sqlite" | "postgres" | "mysql";

export interface SqlGenerateOptions {
  dialect: SqlDialect;
  /** Override the root table name (default: inferred from the root type). */
  tableName?: string;
  /** Optional schema prefix, e.g. "public" (PostgreSQL) or a database name (MySQL). */
  schemaName?: string;
  /** Identifier quoting: none, double ("name"), or backtick (`name`). Defaults per dialect. */
  quoteStyle?: "none" | "double" | "backtick";
  /** Emit explicit NULL / NOT NULL constraints based on the observed data. */
  nullable?: boolean;
  /** Include the synthetic id primary key when the data has no usable id field. */
  includeId?: boolean;
}


/**
 * Generate CREATE TABLE + INSERT seed statements from JSON for a chosen
 * SQL dialect. Type inference is heuristic - types come from the sample data
 * and are communicated in the emitted SQL (comments + explicit NULLs when
 * `nullable` is enabled) rather than overclaimed as perfect.
 */
export function generateSql(input: JsonValue, options: SqlGenerateOptions): string {
  const dialect = options.dialect;
  const toSqlIdentifier = (value: string): string => {
    const cleaned = value
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase();
    return cleaned || "column_name";
  };

  const quoteIdent = (name: string): string => {
    if (options.quoteStyle === "backtick") return `\`${name}\``;
    if (options.quoteStyle === "double" || dialect === "postgres") return `"${name}"`;
    return name;
  };
  const qualify = (name: string): string => {
    const schema = options.schemaName?.trim();
    const table = quoteIdent(name);
    return schema ? `${quoteIdent(schema)}.${table}` : table;
  };

  const sqlTypeByPrimitive = (type: string): string => {
    switch (dialect) {
      case "postgres":
        if (type === "number") return "DOUBLE PRECISION";
        if (type === "boolean") return "BOOLEAN";
        return "TEXT";
      case "mysql":
        if (type === "number") return "DOUBLE";
        if (type === "boolean") return "TINYINT(1)";
        return "TEXT";
      case "sqlite":
      default:
        if (type === "number") return "REAL";
        if (type === "boolean") return "INTEGER";
        return "TEXT";
    }
  };
  const arrayJsonType = (): string =>
    dialect === "postgres" ? "JSONB" : dialect === "mysql" ? "JSON" : "TEXT";
  const idType = (): string =>
    dialect === "postgres" ? "SERIAL" : dialect === "mysql" ? "INT AUTO_INCREMENT" : "INTEGER";
  const pkSuffix = (): string => (dialect === "mysql" ? "PRIMARY KEY" : "PRIMARY KEY");
  const quoteSql = (value: unknown): string => {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    const escaped = String(value).replace(/'/g, "''");
    return `'${escaped}'`;
  };

  // Reuse the TypeScript discovery to get interfaces (types are per first sample).
  // Arrays of objects are unwrapped so the row type becomes the root interface.
  const rootName = "JsonData";
  const rootForTypes: JsonValue = Array.isArray(input) && input.length > 0 ? input[0] : input;
  const tsLines = generateTypeScript(rootForTypes, rootName).split("\n");
  const interfaces: Record<string, Array<{ name: string; type: string }>> = {};
  let current: string | null = null;
  tsLines.forEach((line) => {
    const start = line.match(/^export interface (\w+) \{$/);
    if (start) {
      current = start[1];
      interfaces[current] = [];
      return;
    }
    if (line.trim() === "}") {
      current = null;
      return;
    }
    if (!current) return;
    const field = line.trim().match(/^"?([^":]+)"?: (.+);$/);
    if (field) {
      interfaces[current].push({ name: field[1], type: field[2] });
    }
  });

  const entries = Object.entries(interfaces);
  if (!entries.length || !interfaces[rootName]) {
    return "-- Unable to infer object schema for SQL generation.\n-- Provide a JSON object or array of objects as root input.";
  }

  const tableByType = new Map(entries.map(([typeName]) => [typeName, toSqlIdentifier(typeName)]));
  if (options.tableName?.trim()) {
    tableByType.set(rootName, toSqlIdentifier(options.tableName));
  }

  type ParentRef = { columnName: string; targetType: string; targetTable: string };
  type ScalarField = { fieldName: string; columnName: string; sourceType: string };
  type ObjectRef = { fieldName: string; columnName: string; targetType: string; targetTable: string };
  type PrimitiveArray = { fieldName: string; columnName: string };
  type ChildArrayRef = { fieldName: string; targetType: string; fkColumn: string };
  type TableMeta = {
    typeName: string;
    tableName: string;
    scalarFields: ScalarField[];
    objectRefs: ObjectRef[];
    primitiveArrays: PrimitiveArray[];
    parentRefs: ParentRef[];
    childArrayRefs: ChildArrayRef[];
  };

  const metaByType = new Map<string, TableMeta>();
  for (const [typeName, fields] of entries) {
    const tableName = tableByType.get(typeName) ?? toSqlIdentifier(typeName);
    const scalarFields: ScalarField[] = [];
    const objectRefs: ObjectRef[] = [];
    const primitiveArrays: PrimitiveArray[] = [];
    const childArrayRefs: ChildArrayRef[] = [];

    fields.forEach((field) => {
      const fieldType = field.type.trim();
      if (fieldType.endsWith("[]")) {
        const innerType = fieldType.slice(0, -2);
        if (interfaces[innerType]) {
          childArrayRefs.push({
            fieldName: field.name,
            targetType: innerType,
            fkColumn: `${tableName}_id`,
          });
        } else {
          primitiveArrays.push({
            fieldName: field.name,
            columnName: `${toSqlIdentifier(field.name)}_json`,
          });
        }
      } else if (interfaces[fieldType]) {
        objectRefs.push({
          fieldName: field.name,
          columnName: `${toSqlIdentifier(field.name)}_id`,
          targetType: fieldType,
          targetTable: tableByType.get(fieldType) ?? toSqlIdentifier(fieldType),
        });
      } else {
        scalarFields.push({
          fieldName: field.name,
          columnName: toSqlIdentifier(field.name),
          sourceType: fieldType,
        });
      }
    });

    metaByType.set(typeName, {
      typeName,
      tableName,
      scalarFields,
      objectRefs,
      primitiveArrays,
      parentRefs: [],
      childArrayRefs,
    });
  }

  metaByType.forEach((meta) => {
    meta.childArrayRefs.forEach((rel) => {
      const childMeta = metaByType.get(rel.targetType);
      if (!childMeta) return;
      if (!childMeta.parentRefs.some((p) => p.columnName === rel.fkColumn)) {
        childMeta.parentRefs.push({
          columnName: rel.fkColumn,
          targetType: meta.typeName,
          targetTable: meta.tableName,
        });
      }
    });
  });

  // Nullability scan: for each table column, did we ever observe a missing/null value?
  const nullableColumns = new Map<string, Set<string>>();
  if (options.nullable) {
    const observe = (value: JsonValue, typeName: string, inherited: string[] = []) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return;
      const meta = metaByType.get(typeName);
      if (!meta) return;
      const set = nullableColumns.get(typeName) ?? new Set<string>();
      nullableColumns.set(typeName, set);
      const obj = value as Record<string, JsonValue>;
      meta.scalarFields.forEach((field) => {
        const v = obj[field.fieldName];
        if (v === null || v === undefined) set.add(field.columnName);
      });
      meta.primitiveArrays.forEach((field) => {
        if (!Array.isArray(obj[field.fieldName])) set.add(field.columnName);
      });
      meta.objectRefs.forEach((ref) => {
        const nested = obj[ref.fieldName];
        if (nested === null || nested === undefined) set.add(ref.columnName);
        observe(nested, ref.targetType);
      });
      meta.childArrayRefs.forEach((rel) => {
        const children = obj[rel.fieldName];
        if (!Array.isArray(children)) {
          set.add(rel.fkColumn);
          return;
        }
        children.forEach((child) => observe(child, rel.targetType));
      });
      // parent refs are always provided by the parent, never nullable
      void inherited;
    };
    const roots = Array.isArray(input) ? input : [input];
    roots.forEach((root) => observe(root, rootName));
  }

  const nullability = (typeName: string, columnName: string): string => {
    if (!options.nullable) return "";
    if (nullableColumns.get(typeName)?.has(columnName)) return " NULL";
    return " NOT NULL";
  };

  const createTableStatements = Array.from(metaByType.values()).map((meta) => {
    const idField = meta.scalarFields.find((f) => f.columnName === "id" || f.fieldName === "id");
    const columns: string[] = [];
    if (idField && options.includeId !== false) {
      const idColumn =
        idField.sourceType === "number"
          ? `${quoteIdent("id")} ${idType()} ${pkSuffix()}`
          : `${quoteIdent("id")} ${sqlTypeByPrimitive(idField.sourceType)} PRIMARY KEY`;
      columns.push(idColumn);
    } else if (options.includeId !== false) {
      columns.push(`${quoteIdent("id")} ${idType()} ${pkSuffix()}`);
    }
    meta.scalarFields.forEach((field) => {
      if (field.columnName === "id" || field.fieldName === "id") return;
      columns.push(
        `${quoteIdent(field.columnName)} ${sqlTypeByPrimitive(field.sourceType)}${nullability(meta.typeName, field.columnName)}`,
      );
    });
    meta.objectRefs.forEach((ref) => {
      columns.push(
        `${quoteIdent(ref.columnName)} ${dialect === "mysql" ? "INT" : "INTEGER"}${nullability(meta.typeName, ref.columnName)}`,
      );
    });
    meta.primitiveArrays.forEach((field) => {
      columns.push(
        `${quoteIdent(field.columnName)} ${arrayJsonType()}${nullability(meta.typeName, field.columnName)}`,
      );
    });
    meta.parentRefs.forEach((ref) => {
      columns.push(`${quoteIdent(ref.columnName)} ${dialect === "mysql" ? "INT" : "INTEGER"}`);
    });

    const foreignKeys: string[] = [];
    meta.objectRefs.forEach((ref) => {
      foreignKeys.push(`FOREIGN KEY (${quoteIdent(ref.columnName)}) REFERENCES ${quoteIdent(ref.targetTable)}(id)`);
    });
    meta.parentRefs.forEach((ref) => {
      foreignKeys.push(`FOREIGN KEY (${quoteIdent(ref.columnName)}) REFERENCES ${quoteIdent(ref.targetTable)}(id)`);
    });

    const body = [...columns, ...foreignKeys].map((line) => `  ${line}`).join(",\n");
    const inferred = meta.scalarFields.length
      ? `\n  -- inferred types: ${meta.scalarFields.map((f) => `${f.columnName}: ${f.sourceType}`).join(", ")}`
      : "";
    return `CREATE TABLE ${qualify(meta.tableName)} (\n${body}${inferred}\n);`;
  });

  const idCounterByTable = new Map<string, number>();
  const insertStatements: string[] = [];
  const nextId = (tableName: string): number => {
    const next = (idCounterByTable.get(tableName) ?? 0) + 1;
    idCounterByTable.set(tableName, next);
    return next;
  };

  const insertEntity = (
    value: JsonValue,
    typeName: string,
    inheritedRefs: Record<string, number> = {},
  ): number | null => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const meta = metaByType.get(typeName);
    if (!meta) return null;

    const row: Record<string, unknown> = {};
    meta.scalarFields.forEach((field) => {
      const current = (value as Record<string, JsonValue>)[field.fieldName];
      if (
        current === null ||
        typeof current === "string" ||
        typeof current === "number" ||
        typeof current === "boolean"
      ) {
        row[field.columnName] = current;
      } else {
        row[field.columnName] = null;
      }
    });
    meta.primitiveArrays.forEach((field) => {
      const current = (value as Record<string, JsonValue>)[field.fieldName];
      row[field.columnName] = Array.isArray(current) ? JSON.stringify(current) : null;
    });
    meta.objectRefs.forEach((ref) => {
      const nested = (value as Record<string, JsonValue>)[ref.fieldName];
      const nestedId = insertEntity(nested, ref.targetType);
      row[ref.columnName] = nestedId;
    });
    Object.entries(inheritedRefs).forEach(([columnName, id]) => {
      row[columnName] = id;
    });

    const id = nextId(meta.tableName);
    row.id = id;
    const columns = Object.keys(row);
    const values = columns.map((column) => quoteSql(row[column]));
    insertStatements.push(
      `INSERT INTO ${qualify(meta.tableName)} (${columns.map(quoteIdent).join(", ")}) VALUES (${values.join(", ")});`,
    );

    meta.childArrayRefs.forEach((rel) => {
      const children = (value as Record<string, JsonValue>)[rel.fieldName];
      if (!Array.isArray(children)) return;
      children.forEach((child) => {
        insertEntity(child, rel.targetType, { [rel.fkColumn]: id });
      });
    });

    return id;
  };

  if (Array.isArray(input)) {
    input.forEach((item) => {
      insertEntity(item, rootName);
    });
  } else {
    insertEntity(input, rootName);
  }

  return [
    `-- Auto-generated SQL schema and seed data (${dialect})`,
    "",
    "-- CREATE TABLE",
    ...createTableStatements,
    "",
    "-- INSERT DATA",
    ...insertStatements,
  ].join("\n");
}

export function generateTypes(
  input: JsonValue,
  language: TypeTargetLanguage,
  rootName = "JsonData",
): string {
  if (language === "typescript") {
    return generateTypeScript(input, rootName);
  }

  const lines = generateTypeScript(input, rootName).split("\n");
  const interfaces: Record<string, Array<{ name: string; type: string }>> = {};
  let current: string | null = null;

  lines.forEach((line) => {
    const start = line.match(/^export interface (\w+) \{$/);
    if (start) {
      current = start[1];
      interfaces[current] = [];
      return;
    }
    if (line.trim() === "}") {
      current = null;
      return;
    }
    if (!current) return;
    const field = line.trim().match(/^"?([^":]+)"?: (.+);$/);
    if (field) {
      interfaces[current].push({ name: field[1], type: field[2] });
    }
  });

  const mapType = (type: string): string => {
    if (language === "zod") {
      if (type.endsWith("[]")) return `z.array(${mapType(type.slice(0, -2))})`;
      if (type === "string") return "z.string()";
      if (type === "number") return "z.number()";
      if (type === "boolean") return "z.boolean()";
      if (type === "null") return "z.null()";
      if (type === "Record<string, unknown>") return "z.record(z.string(), z.unknown())";
      if (type === "unknown[]") return "z.array(z.unknown())";
      return `${type}Schema`;
    }
    if (language === "pydantic") {
      if (type.endsWith("[]")) return `list[${mapType(type.slice(0, -2))}]`;
      if (type === "string") return "str";
      if (type === "number") return "float";
      if (type === "boolean") return "bool";
      if (type === "null") return "None";
      if (type === "Record<string, unknown>") return "dict[str, Any]";
      if (type === "unknown[]") return "list[Any]";
      return type;
    }
    if (language === "python") {
      if (type.endsWith("[]")) return `list[${mapType(type.slice(0, -2))}]`;
      if (type === "string") return "str";
      if (type === "number") return "float";
      if (type === "boolean") return "bool";
      if (type === "null") return "None";
      return type;
    }
    if (language === "java") {
      if (type.endsWith("[]")) return `List<${mapType(type.slice(0, -2))}>`;
      if (type === "string") return "String";
      if (type === "number") return "double";
      if (type === "boolean") return "boolean";
      if (type === "null") return "Object";
      return type;
    }
    if (language === "csharp") {
      if (type.endsWith("[]")) return `List<${mapType(type.slice(0, -2))}>`;
      if (type === "string") return "string";
      if (type === "number") return "double";
      if (type === "boolean") return "bool";
      if (type === "null") return "object?";
      return type;
    }
    if (language === "go") {
      if (type.endsWith("[]")) return `[]${mapType(type.slice(0, -2))}`;
      if (type === "string") return "string";
      if (type === "number") return "float64";
      if (type === "boolean") return "bool";
      if (type === "null") return "any";
      return type;
    }
    if (language === "protobuf") {
      if (type.endsWith("[]")) return `repeated ${mapType(type.slice(0, -2))}`;
      if (type === "string") return "string";
      if (type === "number") return "double";
      if (type === "boolean") return "bool";
      if (type === "null") return "string";
      return type;
    }
    if (language === "kotlin") {
      if (type.endsWith("[]")) return `List<${mapType(type.slice(0, -2))}>`;
      if (type === "string") return "String";
      if (type === "number") return "Double";
      if (type === "boolean") return "Boolean";
      if (type === "null") return "Any?";
      return type;
    }
    if (language === "swift") {
      if (type.endsWith("[]")) return `[${mapType(type.slice(0, -2))}]`;
      if (type === "string") return "String";
      if (type === "number") return "Double";
      if (type === "boolean") return "Bool";
      if (type === "null") return "String?";
      return type;
    }
    if (language === "rust") {
      if (type.endsWith("[]")) return `Vec<${mapType(type.slice(0, -2))}>`;
      if (type === "string") return "String";
      if (type === "number") return "f64";
      if (type === "boolean") return "bool";
      if (type === "null") return "Option<String>";
      return type;
    }
    return type;
  };

  const toPascal = (value: string): string =>
    value
      .split(/[^a-zA-Z0-9]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");

  const entries = Object.entries(interfaces);

  if (language === "sql") {
    return generateSql(input, { dialect: "sqlite" });
  }

  if (language === "zod") {
    if (!entries.length) {
      return `import { z } from "zod";\n\nexport const ${rootName}Schema = z.unknown();\nexport type ${rootName} = z.infer<typeof ${rootName}Schema>;`;
    }
    // Emit nested schemas first (interfaces appear in discovery order; reverse for deps)
    const schemaBlocks = entries
      .map(
        ([name, fields]) =>
          `export const ${name}Schema = z.object({\n${fields
            .map((f) => `  ${/^[$A-Z_][0-9A-Z_$]*$/i.test(f.name) ? f.name : JSON.stringify(f.name)}: ${mapType(f.type)},`)
            .join("\n")}\n});`,
      )
      .join("\n\n");
    const typeBlocks = entries
      .map(([name]) => `export type ${name} = z.infer<typeof ${name}Schema>;`)
      .join("\n");
    return `import { z } from "zod";\n\n${schemaBlocks}\n\n${typeBlocks}`;
  }

  if (language === "pydantic") {
    if (!entries.length) {
      return `from pydantic import BaseModel\nfrom typing import Any\n\nclass ${rootName}(BaseModel):\n    pass`;
    }
    return `from pydantic import BaseModel, Field\nfrom typing import Any, Optional\n\n${entries
      .map(
        ([name, fields]) =>
          `class ${name}(BaseModel):\n${
            fields.length
              ? fields.map((f) => `    ${f.name}: ${mapType(f.type)}`).join("\n")
              : "    pass"
          }`,
      )
      .join("\n\n")}`;
  }

  if (language === "java") {
    return entries
      .map(
        ([name, fields]) =>
          `public class ${name} {\n${fields
            .map((f) => `  public ${mapType(f.type)} ${f.name};`)
            .join("\n")}\n}`,
      )
      .join("\n\n");
  }

  if (language === "csharp") {
    return `using System.Collections.Generic;\n\n${entries
      .map(
        ([name, fields]) =>
          `public class ${name}\n{\n${fields
            .map((f) => `    public ${mapType(f.type)} ${toPascal(f.name)} { get; set; }`)
            .join("\n")}\n}`,
      )
      .join("\n\n")}`;
  }

  if (language === "python") {
    return `from dataclasses import dataclass\n\n${entries
      .map(
        ([name, fields]) =>
          `@dataclass\nclass ${name}:\n${fields
            .map((f) => `    ${f.name}: ${mapType(f.type)}`)
            .join("\n")}`,
      )
      .join("\n\n")}`;
  }

  if (language === "go") {
    return `package types\n\n${entries
      .map(
        ([name, fields]) =>
          `type ${name} struct {\n${fields
            .map((f) => `\t${toPascal(f.name)} ${mapType(f.type)} \`json:"${f.name}"\``)
            .join("\n")}\n}`,
      )
      .join("\n\n")}`;
  }

  if (language === "protobuf") {
    return `syntax = "proto3";\n\n${entries
      .map(
        ([name, fields]) =>
          `message ${name} {\n${fields
            .map((f, idx) => `  ${mapType(f.type)} ${f.name} = ${idx + 1};`)
            .join("\n")}\n}`,
      )
      .join("\n\n")}`;
  }

  if (language === "kotlin") {
    return entries
      .map(
        ([name, fields]) =>
          `data class ${name}(\n${fields
            .map((f, idx) => `    val ${f.name}: ${mapType(f.type)}${idx < fields.length - 1 ? "," : ""}`)
            .join("\n")}\n)`,
      )
      .join("\n\n");
  }

  if (language === "swift") {
    return entries
      .map(
        ([name, fields]) =>
          `struct ${name}: Codable {\n${fields
            .map((f) => `    let ${f.name}: ${mapType(f.type)}`)
            .join("\n")}\n}`,
      )
      .join("\n\n");
  }

  if (language === "rust") {
    return `use serde::{Deserialize, Serialize};\n\n${entries
      .map(
        ([name, fields]) =>
          `#[derive(Debug, Serialize, Deserialize)]\nstruct ${name} {\n${fields
            .map((f) => `    ${f.name}: ${mapType(f.type)},`)
            .join("\n")}\n}`,
      )
      .join("\n\n")}`;
  }

  return generateTypeScript(input, rootName);
}

function capitalize(value: string): string {
  if (!value.length) return value;
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/[^a-zA-Z0-9]/g, "");
}

export function inferJsonSchema(input: JsonValue): JsonValue {
  if (Array.isArray(input)) {
    return {
      type: "array",
      items: input.length ? inferJsonSchema(input[0]) : {},
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
  return { type: typeof input };
}

export function toYaml(input: JsonValue): string {
  return yaml.dump(input);
}

export function toXml(input: JsonValue): string {
  const builder = new XMLBuilder({ format: true });
  return builder.build({ root: input as object });
}

export function toCsv(input: JsonValue, delimiter = ","): string {
  const rows = Array.isArray(input)
    ? input
    : typeof input === "object" && input !== null
      ? [input]
      : [{ value: input }];
  const headers = Array.from(
    new Set(rows.flatMap((item) => Object.keys(item as Record<string, JsonValue>))),
  );
  const lines = [
    headers.join(delimiter),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = (row as Record<string, JsonValue>)[header];
          const serialized =
            value === null || value === undefined
              ? ""
              : typeof value === "object"
                ? JSON.stringify(value)
                : String(value);
          return `"${serialized.replace(/"/g, '""')}"`;
        })
        .join(delimiter),
    ),
  ];
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeMarkdownCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
}

function tableRows(input: JsonValue): { rows: Record<string, JsonValue>[]; headers: string[] } {
  const raw = Array.isArray(input)
    ? input
    : typeof input === "object" && input !== null
      ? [input]
      : [{ value: input }];
  const rows = raw.filter(
    (item) => item !== null && typeof item === "object" && !Array.isArray(item),
  ) as Record<string, JsonValue>[];
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  return { rows, headers };
}

/** Render an array of objects (or a single object) as a GitHub-style Markdown table. */
export function toMarkdownTable(input: JsonValue): string {
  const { rows, headers } = tableRows(input);
  if (rows.length === 0 || headers.length === 0) return "";
  const header = `| ${headers.map(escapeMarkdownCell).join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) =>
    `| ${headers
      .map((h) => {
        const v = row[h];
        const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
        return escapeMarkdownCell(s);
      })
      .join(" | ")} |`,
  );
  return [header, divider, ...body].join("\n");
}

/** Render an array of objects (or a single object) as an HTML table. */
export function toHtmlTable(input: JsonValue): string {
  const { rows, headers } = tableRows(input);
  if (rows.length === 0 || headers.length === 0) return "";
  const thead = `    <tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr>`;
  const tbody = rows
    .map((row) => {
      const cells = headers
        .map((h) => {
          const v = row[h];
          const s = v === null || v === undefined ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
          return `<td>${escapeHtml(s)}</td>`;
        })
        .join("");
      return `    <tr>${cells}</tr>`;
    })
    .join("\n");
  return ["<table>", "  <thead>", thead, "  </thead>", "  <tbody>", tbody, "  </tbody>", "</table>"].join("\n");
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
