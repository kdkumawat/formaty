import type { JsonValue } from "../core";
import { generateTypeScript } from "./types";

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
