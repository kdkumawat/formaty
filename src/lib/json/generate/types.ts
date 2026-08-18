import type { JsonValue } from "../core";
import { generateSql } from "./sql";

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
