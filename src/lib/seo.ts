export const SITE_URL = process.env.SITE_URL || "https://formaty.dev";
export const SITE_NAME = "Formaty";

export const SEO_KEYWORDS: Record<string, string[]> = {
  "json-formatter": ["json formatter", "json beautifier", "format json online", "json validator online"],
  "json-viewer": ["json viewer", "json editor", "view json online", "json tree view"],
  "json-diff": ["json diff", "compare json", "json comparison tool", "diff json online"],
  "json-to-typescript": ["json to typescript", "generate typescript from json", "json to ts", "json type generator"],
  "jsonpath-tester": ["jsonpath tester", "json query tool", "jsonpath online", "jmespath tester"],
  "graph-viewer": ["json graph viewer", "json visualization", "json graph"],
  "api-import": ["curl to json", "import curl", "api test tool", "fetch api json"],
  "schema-generator": ["json schema generator", "generate json schema", "json schema from data"],
  "json-to-xml": ["json to xml", "convert json to xml", "json xml converter"],
  "xml-to-json": ["xml to json", "convert xml to json", "xml json converter"],
  "json-to-yaml": ["json to yaml", "convert json to yaml", "json yaml converter"],
  "yaml-to-json": ["yaml to json", "convert yaml to json", "yaml json converter"],
  "json-to-toml": ["json to toml", "convert json to toml", "json toml converter"],
  "toml-to-json": ["toml to json", "convert toml to json", "toml json converter"],
  "json-to-csv": ["json to csv", "convert json to csv", "json csv converter"],
  "csv-to-json": ["csv to json", "convert csv to json", "csv json converter"],
  "xml-formatter": ["xml formatter", "format xml online", "xml beautifier"],
  "yaml-formatter": ["yaml formatter", "format yaml online", "yaml beautifier"],
  "toml-formatter": ["toml formatter", "format toml online"],
  "csv-formatter": ["csv formatter", "format csv online"],
  "compare-lists": ["compare two lists", "list comparison tool", "find missing items", "compare lists online", "find common items", "compare two csv columns"],
  "sql-in-clause-generator": ["sql in clause generator", "generate sql in", "sql in list", "where id in generator"],
  "json-to-sql": ["json to sql", "convert json to sql", "json to sql insert", "generate sql from json", "json to ddl"],
  "json-to-go": ["json to go", "json to golang", "convert json to go struct", "go struct generator"],
  "json-to-python": ["json to python", "convert json to python", "json to dataclass", "python type generator"],
  "compare-ids": ["compare ids", "compare two id lists", "find missing ids", "compare database ids", "id comparison tool"],
  "find-duplicates-in-list": ["find duplicates in list", "duplicate finder", "find repeated values", "duplicate detection online", "unique values from list"],
  "sql-values-generator": ["sql values generator", "generate sql values", "sql insert values", "values clause generator"],
  "json-to-zod": ["json to zod", "generate zod schema from json", "zod schema generator", "json to zod schema"],
  "json-to-java": ["json to java", "json to java class", "java pojo generator", "convert json to java"],
  "json-to-csharp": ["json to csharp", "json to c#", "csharp class generator", "json to c# class"],
  "json-to-pydantic": ["json to pydantic", "pydantic model generator", "json to pydantic model", "pydantic from json"],
  "json-to-protobuf": ["json to protobuf", "protobuf message generator", "json to proto", "generate proto from json"],
  "json-schema-validator": ["json schema validator", "validate json against schema", "json schema check", "validate json schema"],
  "json-flattener": ["json flattener", "flatten nested json", "json flatten online", "unflatten json"],
  "compare-csv": ["compare csv files", "compare two csv", "csv comparison tool", "find differences in csv"],
  "csv-column-compare": ["compare csv columns", "csv column comparison", "compare two csv columns", "find missing values csv"],
  "curl-to-fetch": ["curl to fetch", "convert curl to fetch", "curl to javascript fetch", "curl to fetch online"],
  "curl-to-axios": ["curl to axios", "convert curl to axios", "curl to axios online"],
  "curl-to-python": ["curl to python", "convert curl to python requests", "curl to requests", "curl to python online"],
  "curl-to-go": ["curl to go", "convert curl to go", "curl to golang", "go http client generator"],
};

export type ToolRoute =
  | "json-formatter"
  | "json-viewer"
  | "json-diff"
  | "json-to-typescript"
  | "jsonpath-tester"
  | "graph-viewer"
  | "api-import"
  | "schema-generator"
  | "json-to-xml"
  | "xml-to-json"
  | "json-to-yaml"
  | "yaml-to-json"
  | "json-to-toml"
  | "toml-to-json"
  | "json-to-csv"
  | "csv-to-json"
  | "xml-formatter"
  | "yaml-formatter"
  | "toml-formatter"
  | "csv-formatter"
  | "compare-lists"
  | "sql-in-clause-generator"
  | "json-to-sql"
  | "json-to-go"
  | "json-to-python"
  | "compare-ids"
  | "find-duplicates-in-list"
  | "sql-values-generator"
  | "json-to-zod"
  | "json-to-java"
  | "json-to-csharp"
  | "json-to-pydantic"
  | "json-to-protobuf"
  | "json-schema-validator"
  | "json-flattener"
  | "compare-csv"
  | "csv-column-compare"
  | "curl-to-fetch"
  | "curl-to-axios"
  | "curl-to-python"
  | "curl-to-go";

export interface ToolPageConfig {
  route: ToolRoute;
  title: string;
  description: string;
  h1: string;
  content: string;
  inputExample: string;
  outputExample: string;
  useCases: string[];
  relatedTools: ToolRoute[];
}

export const TOOL_PAGES: Record<ToolRoute, ToolPageConfig> = {
  "json-formatter": {
    route: "json-formatter",
    title: "JSON Formatter | Formaty",
    description:
      "Beautify and validate JSON instantly. Free online JSON formatter with syntax highlighting, minify, and validation. No data leaves your browser.",
    h1: "JSON Formatter",
    content: `JSON is the standard for API responses and config files. Raw JSON from APIs often arrives minified or poorly formatted-hard to read and debug. A JSON formatter beautifies and indents your data so you can inspect structure, spot errors, and understand nested objects quickly.

Formatting messy JSON improves readability. Indentation helps trace nested objects and arrays. Syntax highlighting makes keys, values, and types stand out. Validation catches trailing commas, missing quotes, and invalid structures before your code runs.

Use cases: debugging API responses, inspecting webhook payloads, cleaning up config files, preparing JSON for documentation. Paste your data, get formatted output in one click. No signup, no server round-trip-everything runs locally in your browser.`,
    inputExample: '{"id":1,"name":"test","nested":{"key":"value"}}',
    outputExample: `{
  "id": 1,
  "name": "test",
  "nested": {
    "key": "value"
  }
}`,
    useCases: [
      "Debug API responses and webhooks",
      "Format minified JSON for readability",
      "Validate JSON before committing",
      "Prepare config files for review",
    ],
    relatedTools: ["json-viewer", "json-diff", "json-to-xml", "schema-generator"],
  },
  "json-viewer": {
    route: "json-viewer",
    title: "JSON Viewer | Formaty",
    description:
      "Explore JSON in tree view. Free online JSON viewer with expandable nodes, search, and copy. Inspect structured data instantly.",
    h1: "JSON Viewer",
    content: `Large JSON blobs are hard to navigate as raw text. A JSON viewer renders your data as a hierarchical tree-expand and collapse nodes, drill into nested objects, and find values quickly.

Tree view is ideal for API responses, config files, and log payloads. Click to expand arrays and objects. Copy paths or values with one click. Search across keys and values.

Use cases: inspecting API responses, exploring configuration, debugging webhook payloads, understanding data schemas. Works entirely in your browser. No upload, no server.`,
    inputExample: '{"users":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]}',
    outputExample: "Tree view with expandable nodes.",
    useCases: [
      "Inspect API response structure",
      "Navigate large JSON documents",
      "Copy paths and values",
      "Debug nested data",
    ],
    relatedTools: ["json-formatter", "graph-viewer", "jsonpath-tester", "json-diff"],
  },
  "json-diff": {
    route: "json-diff",
    title: "JSON Diff | Formaty",
    description:
      "Compare JSON files instantly. Free online JSON diff tool with side-by-side view and highlighting. No data leaves your device.",
    h1: "JSON Diff",
    content: `Comparing JSON manually is error-prone. A JSON diff tool highlights differences between two versions-added, removed, and changed keys and values.

Useful when comparing API responses before and after changes, validating config migrations, or reviewing schema updates. Side-by-side diff shows exactly what changed.

Use cases: API version comparison, config migration checks, schema evolution, debugging state changes. Paste two JSON blobs, get a clear diff. Runs locally.`,
    inputExample: 'Original: {"a":1} | Modified: {"a":2,"b":3}',
    outputExample: "Side-by-side diff with highlighted changes.",
    useCases: [
      "Compare API responses",
      "Validate config migrations",
      "Review schema changes",
      "Debug state differences",
    ],
    relatedTools: ["json-formatter", "json-viewer", "jsonpath-tester", "schema-generator"],
  },
  "json-to-typescript": {
    route: "json-to-typescript",
    title: "JSON to TypeScript | Formaty",
    description:
      "Generate TypeScript types from JSON. Free online JSON to TypeScript converter. Supports interfaces, types, and multiple languages.",
    h1: "JSON to TypeScript",
    content: `Typing API responses and config objects by hand is tedious. A JSON-to-TypeScript tool infers types from sample data and generates interfaces or type aliases.

Paste a JSON sample-API response, config, webhook payload-and get TypeScript definitions. Supports optional properties, unions, and nested structures. Also outputs Python, Go, Java, and more.

Use cases: typing API clients, generating DTOs, documenting schemas, onboarding new endpoints. One paste, instant types. No server upload.`,
    inputExample: '{"id":1,"email":"a@b.com","roles":["admin"]}',
    outputExample: "interface Root { id: number; email: string; roles: string[]; }",
    useCases: [
      "Type API responses",
      "Generate DTOs from samples",
      "Document data structures",
      "Onboard new APIs",
    ],
    relatedTools: ["json-formatter", "schema-generator", "json-viewer", "api-import"],
  },
  "jsonpath-tester": {
    route: "jsonpath-tester",
    title: "JSONPath Tester | Formaty",
    description:
      "Test JSONPath and JMESPath queries online. Extract data from JSON with JSONPath. Free, runs in browser.",
    h1: "JSONPath Tester",
    content: `Extracting specific values from large JSON requires precise queries. JSONPath and JMESPath let you target nodes by path, filter arrays, and project subsets.

A JSONPath tester lets you run queries against sample data and see results instantly. Debug $..users[*].email, $.data.items[?@.active], or complex JMESPath expressions before putting them in code.

Use cases: extracting nested values, filtering API responses, building data pipelines, debugging query logic. Paste JSON, write query, get results. All client-side.`,
    inputExample: '$.store.book[*].title',
    outputExample: '["Sayings of the Century","Sword of Honour","Moby Dick"]',
    useCases: [
      "Extract nested values from JSON",
      "Filter and project API data",
      "Debug JSONPath expressions",
      "Build data extraction logic",
    ],
    relatedTools: ["json-viewer", "json-formatter", "api-import", "graph-viewer"],
  },
  "graph-viewer": {
    route: "graph-viewer",
    title: "JSON Graph Viewer | Formaty",
    description:
      "Visualize JSON as a graph. Free online JSON graph viewer. See relationships and structure at a glance.",
    h1: "JSON Graph Viewer",
    content: `Complex JSON structures are easier to understand as graphs. A JSON graph viewer renders objects and arrays as nodes, with edges showing references and nesting.

Useful for understanding API response shapes, documenting data models, and spotting circular references. Zoom, pan, and explore large structures visually.

Use cases: understanding API schemas, documenting data models, spotting circular refs, onboarding. Paste JSON, view graph. Runs in browser.`,
    inputExample: '{"a":{"b":1},"c":{"b":1}}',
    outputExample: "Interactive graph visualization.",
    useCases: [
      "Understand API schemas",
      "Document data models",
      "Spot circular references",
      "Visualize nested structures",
    ],
    relatedTools: ["json-viewer", "jsonpath-tester", "schema-generator", "json-formatter"],
  },
  "api-import": {
    route: "api-import",
    title: "API Import (cURL) | Formaty",
    description:
      "Import cURL and inspect API responses. Paste cURL, fetch JSON, format and query. Free developer tool.",
    h1: "API Import (cURL)",
    content: `Testing APIs often starts with a cURL command from docs or Postman. An API import tool lets you paste cURL, execute the request, and inspect the response-formatted, validated, queryable.

No need to switch to another app. Paste cURL, hit run, get JSON in the editor. Then format, query with JSONPath, or generate types from the response.

Use cases: quick API checks, debugging webhooks, inspecting third-party responses, sharing reproducible requests. All in one place. Data stays local.`,
    inputExample: 'curl -X GET "https://api.example.com/users"',
    outputExample: "Fetched JSON response, formatted and queryable.",
    useCases: [
      "Quick API response inspection",
      "Debug webhook payloads",
      "Test third-party APIs",
      "Share reproducible requests",
    ],
    relatedTools: ["json-formatter", "json-viewer", "json-to-typescript", "jsonpath-tester"],
  },
  "schema-generator": {
    route: "schema-generator",
    title: "JSON Schema Generator | Formaty",
    description:
      "Generate JSON Schema from JSON data. Free online schema generator. Create validation schemas from samples.",
    h1: "JSON Schema Generator",
    content: `JSON Schema validates structure, types, and constraints. Writing schemas by hand is slow. A schema generator infers a schema from sample JSON.

Paste one or more samples-API responses, configs-and get a JSON Schema. Use it for validation, documentation, or code generation.

Use cases: validating API contracts, documenting schemas, generating OpenAPI, onboarding. Paste data, get schema. Client-side only.`,
    inputExample: '{"id":1,"name":"test","active":true}',
    outputExample: '{"type":"object","properties":{"id":{},"name":{},"active":{}}}',
    useCases: [
      "Validate API contracts",
      "Document data structures",
      "Generate OpenAPI schemas",
      "Create validation rules",
    ],
    relatedTools: ["json-formatter", "json-to-typescript", "json-viewer", "json-diff"],
  },
  "json-to-xml": {
    route: "json-to-xml",
    title: "JSON to XML Converter | Formaty",
    description:
      "Convert JSON to XML instantly. Free online JSON to XML converter with validation and formatting.",
    h1: "JSON to XML Converter",
    content: `JSON and XML serve different ecosystems. APIs often return JSON; legacy systems, SOAP, and configs may use XML. Converting JSON to XML bridges the gap.

Use cases: feeding JSON into XML-based pipelines, SOAP integrations, legacy system compatibility, config file migration. Paste JSON, get valid XML. No server upload.`,
    inputExample: '{"root":{"id":1,"name":"test"}}',
    outputExample: '<?xml version="1.0"?><root><id>1</id><name>test</name></root>',
    useCases: [
      "SOAP and legacy integrations",
      "Config migration to XML",
      "API to XML pipeline",
      "Cross-format compatibility",
    ],
    relatedTools: ["xml-to-json", "json-formatter", "json-to-yaml", "schema-generator"],
  },
  "xml-to-json": {
    route: "xml-to-json",
    title: "XML to JSON Converter | Formaty",
    description:
      "Convert XML to JSON instantly. Free online XML to JSON converter. Preserve structure, run in browser.",
    h1: "XML to JSON Converter",
    content: `XML is common in enterprise systems, SOAP, and configs. Modern apps prefer JSON. Converting XML to JSON lets you consume legacy data in JSON-native code.

Use cases: migrating XML configs, consuming SOAP responses in JS/TS, normalizing data for APIs. Paste XML, get JSON. Runs locally.`,
    inputExample: '<?xml version="1.0"?><root><id>1</id><name>test</name></root>',
    outputExample: '{"root":{"id":"1","name":"test"}}',
    useCases: [
      "Migrate XML configs to JSON",
      "Consume SOAP in JS/TS",
      "Normalize legacy data",
      "API integration",
    ],
    relatedTools: ["json-to-xml", "json-formatter", "yaml-to-json", "json-viewer"],
  },
  "json-to-yaml": {
    route: "json-to-yaml",
    title: "JSON to YAML Converter | Formaty",
    description:
      "Convert JSON to YAML instantly. Free online JSON to YAML converter. Ideal for configs and Kubernetes.",
    h1: "JSON to YAML Converter",
    content: `YAML is preferred for configs, Kubernetes manifests, and CI pipelines. JSON comes from APIs. Converting JSON to YAML helps you turn API output into config-ready format.

Use cases: Kubernetes manifest generation, CI config creation, config file conversion. Paste JSON, get YAML. No upload.`,
    inputExample: '{"apiVersion":"v1","kind":"Pod","metadata":{"name":"app"}}',
    outputExample: "apiVersion: v1\nkind: Pod\nmetadata:\n  name: app",
    useCases: [
      "Kubernetes manifest generation",
      "CI/CD config conversion",
      "Config file migration",
      "API to config pipeline",
    ],
    relatedTools: ["yaml-to-json", "json-formatter", "json-to-xml", "schema-generator"],
  },
  "yaml-to-json": {
    route: "yaml-to-json",
    title: "YAML to JSON Converter | Formaty",
    description:
      "Convert YAML to JSON instantly. Free online YAML to JSON converter. Preserve structure.",
    h1: "YAML to JSON Converter",
    content: `YAML configs and manifests need to be consumed as JSON in code. Converting YAML to JSON lets you parse and validate with standard JSON tools.

Use cases: parsing K8s manifests in code, validating YAML configs, API payload generation. Paste YAML, get JSON. Client-side.`,
    inputExample: "apiVersion: v1\nkind: Pod\nmetadata:\n  name: app",
    outputExample: '{"apiVersion":"v1","kind":"Pod","metadata":{"name":"app"}}',
    useCases: [
      "Parse K8s manifests in code",
      "Validate YAML configs",
      "API payload generation",
      "Config normalization",
    ],
    relatedTools: ["json-to-yaml", "json-formatter", "xml-to-json", "json-viewer"],
  },
  "json-to-toml": {
    route: "json-to-toml",
    title: "JSON to TOML Converter | Formaty",
    description:
      "Convert JSON to TOML instantly. Free online JSON to TOML converter. Ideal for Rust, Cargo, and config files.",
    h1: "JSON to TOML Converter",
    content: `TOML is the config format of choice for Rust (Cargo.toml), Python packaging, and modern tooling. JSON comes from APIs and data dumps. Converting JSON to TOML turns API-shaped data into a config-ready format.

Use cases: Cargo.toml generation, Python pyproject.toml config, tool config conversion. Paste JSON, get valid TOML. No upload - everything runs in your browser.`,
    inputExample: '{"package":{"name":"formaty","version":"1.0.0"}}',
    outputExample: '[package]\nname = "formaty"\nversion = "1.0.0"',
    useCases: [
      "Cargo.toml generation",
      "pyproject.toml config",
      "Tool config conversion",
      "API to config pipeline",
    ],
    relatedTools: ["toml-to-json", "json-formatter", "json-to-yaml", "json-to-xml"],
  },
  "toml-to-json": {
    route: "toml-to-json",
    title: "TOML to JSON Converter | Formaty",
    description:
      "Convert TOML to JSON instantly. Free online TOML to JSON converter. Preserve structure, run in browser.",
    h1: "TOML to JSON Converter",
    content: `TOML configs (Cargo.toml, pyproject.toml) often need to be consumed as JSON in code or APIs. Converting TOML to JSON lets you validate and process config data with standard JSON tooling.

Use cases: parsing config files in code, validating TOML configs, API payload generation. Paste TOML, get JSON. Client-side only.`,
    inputExample: '[package]\nname = "formaty"\nversion = "1.0.0"',
    outputExample: '{"package":{"name":"formaty","version":"1.0.0"}}',
    useCases: [
      "Parse configs in code",
      "Validate TOML configs",
      "API payload generation",
      "Config normalization",
    ],
    relatedTools: ["json-to-toml", "json-formatter", "yaml-to-json", "json-viewer"],
  },
  "json-to-csv": {
    route: "json-to-csv",
    title: "JSON to CSV Converter | Formaty",
    description:
      "Convert JSON to CSV instantly. Free online JSON to CSV converter. Flatten arrays for spreadsheets.",
    h1: "JSON to CSV Converter",
    content: `JSON arrays of objects map well to CSV for spreadsheets and analytics. Converting JSON to CSV flattens nested data into rows and columns.

Use cases: exporting API data to Excel, analytics pipelines, reporting. Paste JSON array, get CSV. Runs in browser.`,
    inputExample: '[{"id":1,"name":"A"},{"id":2,"name":"B"}]',
    outputExample: "id,name\n1,A\n2,B",
    useCases: [
      "Export API data to Excel",
      "Analytics pipelines",
      "Reporting and dashboards",
      "Data migration",
    ],
    relatedTools: ["csv-to-json", "json-formatter", "json-viewer", "jsonpath-tester"],
  },
  "csv-to-json": {
    route: "csv-to-json",
    title: "CSV to JSON Converter | Formaty",
    description:
      "Convert CSV to JSON instantly. Free online CSV to JSON converter. Parse CSV to structured data.",
    h1: "CSV to JSON Converter",
    content: `CSV is ubiquitous for exports and spreadsheets. APIs and code prefer JSON. Converting CSV to JSON turns rows into objects for programmatic use.

Use cases: importing spreadsheet data into apps, API payload creation, data pipeline normalization. Paste CSV, get JSON. No server.`,
    inputExample: "id,name,score\n1,Alice,95\n2,Bob,87",
    outputExample: '[{"id":"1","name":"Alice","score":"95"},{"id":"2","name":"Bob","score":"87"}]',
    useCases: [
      "Import spreadsheet data",
      "API payload creation",
      "Data pipeline normalization",
      "Config generation",
    ],
    relatedTools: ["json-to-csv", "json-formatter", "json-viewer", "schema-generator"],
  },
  "xml-formatter": {
    route: "xml-formatter",
    title: "XML Formatter | Formaty",
    description: "Beautify and format XML instantly. Free online XML formatter. Validate and indent XML.",
    h1: "XML Formatter",
    content: `XML from APIs and configs often arrives minified. An XML formatter indents and structures your data for readability. Validate syntax, fix formatting, and prepare XML for documentation or debugging. Use cases: SOAP responses, config files, RSS feeds. Paste XML, get formatted output. Runs in browser.`,
    inputExample: '<?xml version="1.0"?><root><a>1</a><b>2</b></root>',
    outputExample: '<?xml version="1.0"?>\n<root>\n  <a>1</a>\n  <b>2</b>\n</root>',
    useCases: ["Format SOAP responses", "Validate XML configs", "Debug RSS/Atom feeds", "Prepare XML for docs"],
    relatedTools: ["json-to-xml", "xml-to-json", "json-formatter", "yaml-formatter"],
  },
  "yaml-formatter": {
    route: "yaml-formatter",
    title: "YAML Formatter | Formaty",
    description: "Beautify and format YAML instantly. Free online YAML formatter. Valid for Kubernetes, CI configs.",
    h1: "YAML Formatter",
    content: `YAML configs and manifests need consistent formatting. A YAML formatter indents and structures your data. Validate syntax, fix indentation, and prepare for Kubernetes or CI. Use cases: K8s manifests, GitHub Actions, Docker Compose. Paste YAML, get formatted output. Client-side.`,
    inputExample: "apiVersion: v1\nkind: Pod\nmetadata:\n  name: app",
    outputExample: "apiVersion: v1\nkind: Pod\nmetadata:\n  name: app",
    useCases: ["Format K8s manifests", "Validate CI configs", "Debug Docker Compose", "YAML validation"],
    relatedTools: ["json-to-yaml", "yaml-to-json", "json-formatter", "xml-formatter"],
  },
  "toml-formatter": {
    route: "toml-formatter",
    title: "TOML Formatter | Formaty",
    description: "Beautify and format TOML instantly. Free online TOML formatter. Valid for Cargo, Rust configs.",
    h1: "TOML Formatter",
    content: `TOML is used for Cargo.toml, pyproject.toml, and config files. A TOML formatter validates and structures your data. Use cases: Rust projects, Python configs, package manifests. Paste TOML, get formatted output. No upload.`,
    inputExample: '[package]\nname="foo"\nversion="1.0"',
    outputExample: '[package]\nname = "foo"\nversion = "1.0"',
    useCases: ["Format Cargo.toml", "Validate pyproject.toml", "Config file formatting", "TOML validation"],
    relatedTools: ["json-formatter", "yaml-formatter", "json-to-yaml", "schema-generator"],
  },
  "csv-formatter": {
    route: "csv-formatter",
    title: "CSV Formatter | Formaty",
    description: "Format and validate CSV instantly. Free online CSV formatter. Align columns, fix delimiters.",
    h1: "CSV Formatter",
    content: `CSV from exports or spreadsheets can be messy. A CSV formatter validates structure, aligns columns, and handles quoted fields. Use cases: data exports, spreadsheet prep, ETL pipelines. Paste CSV, get formatted output. Runs in browser.`,
    inputExample: "id,name,score\n1,Alice,95\n2,Bob,87",
    outputExample: "id,name,score\n1,Alice,95\n2,Bob,87",
    useCases: ["Format data exports", "Validate spreadsheet CSV", "ETL pipeline prep", "CSV validation"],
    relatedTools: ["json-to-csv", "csv-to-json", "json-formatter", "json-viewer"],
  },
  "compare-lists": {
    route: "compare-lists",
    title: "Compare Two Lists | Formaty",
    description:
      "Compare two lists online and find common, missing, and extra items. Free list comparison tool with SQL IN / NOT IN export. Runs locally - no data leaves your browser.",
    h1: "Compare Two Lists",
    content: `Comparing two lists by eye is slow and error-prone, especially with hundreds of IDs. A list comparison tool computes the set operations for you: common items, items only in the left list, items only in the right list, union, and symmetric difference.

This is the classic database debugging workflow: paste the result of SELECT id FROM table_a on the left and SELECT id FROM table_b on the right, then see exactly which records are missing or extra on each side. Duplicate detection and counts are built in.

Every result bucket can be exported - copy as SQL IN, SQL NOT IN, PostgreSQL ARRAY, JSON, CSV, Markdown, or a Go slice - so the output is immediately actionable. Everything runs locally in your browser; nothing is uploaded.`,
    inputExample: "Left:\nid-1001\nid-1002\nid-1003\nid-1004\n\nRight:\nid-1002\nid-1003\nid-1005",
    outputExample: "Common: id-1002, id-1003\nOnly left: id-1001, id-1004\nOnly right: id-1005",
    useCases: [
      "Find missing records between two databases",
      "Reconcile production vs staging exports",
      "Compare API response ID lists",
      "Generate SQL IN / NOT IN clauses",
    ],
    relatedTools: ["sql-in-clause-generator", "json-diff", "json-to-sql"],
  },
  "sql-in-clause-generator": {
    route: "sql-in-clause-generator",
    title: "SQL IN Clause Generator | Formaty",
    description:
      "Generate a SQL IN clause from a list of values online. Paste IDs, choose quoting and chunking, copy WHERE col IN (...). Free and local-first.",
    h1: "SQL IN Clause Generator",
    content: `Writing WHERE id IN ('a', 'b', 'c') by hand is tedious and error-prone, and long lists need chunking to stay readable. A SQL IN clause generator takes a plain list - newline separated, comma separated, or a JSON array - and produces a copy-ready clause.

Choose single or double quotes, or no quotes for numeric lists. Large lists can be split into chunks. Beyond plain IN, the same input can become NOT IN, PostgreSQL ANY(ARRAY[...]) for very large lists, or INSERT statements.

Use cases: running ad-hoc queries on a list of IDs, feeding a filtered ID set into a query, and debugging database exports. Paste, copy, run - all in your browser.`,
    inputExample: "1001\n1002\n1003\n1004\n1005",
    outputExample: "id IN ('1001', '1002', '1003', '1004', '1005')",
    useCases: [
      "Query a list of IDs without scripting",
      "Filter by an exported ID set",
      "Generate chunks for very large lists",
      "Create NOT IN exclusion clauses",
    ],
    relatedTools: ["compare-lists", "json-to-sql", "jsonpath-tester"],
  },
  "json-to-sql": {
    route: "json-to-sql",
    title: "JSON to SQL Converter | Formaty",
    description:
      "Generate SQL DDL and INSERT seed statements from JSON online. Free JSON to SQL converter with CREATE TABLE and seed data. Runs locally.",
    h1: "JSON to SQL Converter",
    content: `Turning a JSON payload into database-ready SQL - CREATE TABLE definitions plus INSERT seed rows - is a common but tedious chore. A JSON to SQL converter infers column types from your data and emits both the schema and the seed statements.

Nested objects and arrays become related tables with foreign keys, so the output mirrors the structure of your JSON instead of flattening everything into one wide table.

Use cases: seeding a local database from an API response, scaffolding tables for a new feature, and generating fixtures for tests. Paste JSON, copy SQL - no server involved.`,
    inputExample: '[{"id":1,"name":"Alice","active":true},{"id":2,"name":"Bob","active":false}]',
    outputExample: "CREATE TABLE users (...);\nINSERT INTO users (id, name, active) VALUES (1, 'Alice', true);",
    useCases: [
      "Seed a database from API responses",
      "Scaffold tables for new features",
      "Generate test fixtures",
      "Prototype schemas from sample data",
    ],
    relatedTools: ["json-to-typescript", "sql-in-clause-generator", "json-to-csv", "schema-generator"],
  },
  "json-to-go": {
    route: "json-to-go",
    title: "JSON to Go Struct | Formaty",
    description:
      "Generate Go structs from JSON online. Free JSON to Go converter with nested structs, arrays, and JSON tags. Runs locally in your browser.",
    h1: "JSON to Go Struct Converter",
    content: `Consuming a JSON API in Go means writing structs by hand - field names, types, and json:"" tags for every response shape. A JSON to Go converter infers the structs directly from a sample payload.

Nested objects become nested structs, arrays become slices, and every field gets its JSON tag, so the output compiles and unmarshals correctly.

Use cases: scaffolding API clients, decoding third-party webhooks, and onboarding new endpoints. Paste JSON, copy Go - all client-side.`,
    inputExample: '{"id":1,"email":"a@b.com","roles":["admin","editor"]}',
    outputExample: "type Root struct {\n  ID    int      `json:\"id\"`\n  Email string   `json:\"email\"`\n  Roles []string `json:\"roles\"`\n}",
    useCases: [
      "Scaffold Go API clients",
      "Decode third-party webhooks",
      "Onboard new endpoints fast",
      "Keep structs in sync with payloads",
    ],
    relatedTools: ["json-to-python", "json-to-typescript", "json-to-sql", "schema-generator"],
  },
  "json-to-python": {
    route: "json-to-python",
    title: "JSON to Python | Formaty",
    description:
      "Generate Python dataclasses from JSON online. Free JSON to Python converter with nested types. Runs locally - no data leaves your browser.",
    h1: "JSON to Python Converter",
    content: `Typing JSON responses in Python - dataclasses, field names, nested types - is repetitive. A JSON to Python converter infers dataclasses from a sample payload so your code stays typed without hand-writing every class.

Nested objects become nested dataclasses and arrays become lists with the inferred element type, giving you clean, importable Python in one paste.

Use cases: typing API clients, building data pipelines, and documenting response shapes. Paste JSON, copy Python - everything runs in your browser.`,
    inputExample: '{"id":1,"email":"a@b.com","roles":["admin"]}',
    outputExample: "@dataclass\nclass Root:\n    id: int\n    email: str\n    roles: list[str]",
    useCases: [
      "Type Python API clients",
      "Build typed data pipelines",
      "Document response shapes",
      "Generate test fixtures",
    ],
    relatedTools: ["json-to-go", "json-to-typescript", "json-to-sql", "json-to-csv"],
  },
  "compare-ids": {
    route: "compare-ids",
    title: "Compare Two ID Lists | Formaty",
    description:
      "Compare two lists of database IDs online. Find common, missing, and extra IDs instantly. Free ID comparison tool with SQL export. Runs locally.",
    h1: "Compare Two ID Lists",
    content: `When debugging data across two databases, environments, or API responses, the first question is almost always: which IDs are missing on each side? Comparing ID lists by eye is slow and error-prone; a comparison tool does it instantly.

Paste the result of SELECT id FROM table_a on the left and SELECT id FROM table_b on the right. Formaty computes common IDs, IDs only in the first list, IDs only in the second list, and duplicates - then lets you copy the result as SQL IN, SQL NOT IN, or a PostgreSQL ARRAY.

Use cases: reconciling production vs staging, finding records missing from a sync, verifying data migrations, and comparing API response IDs. Everything runs in your browser; your IDs never leave your device.`,
    inputExample: "Left:\n1001\n1002\n1003\n1004\n\nRight:\n1002\n1003\n1005",
    outputExample: "Common: 1002, 1003\nOnly left: 1001, 1004\nOnly right: 1005",
    useCases: [
      "Reconcile production vs staging records",
      "Find records missing from a sync",
      "Verify data migrations",
      "Compare API response IDs",
    ],
    relatedTools: ["compare-lists", "sql-in-clause-generator", "find-duplicates-in-list"],
  },
  "find-duplicates-in-list": {
    route: "find-duplicates-in-list",
    title: "Find Duplicates in a List | Formaty",
    description:
      "Find duplicates in any list online. Paste values, see which items repeat and how often. Free duplicate finder with counts, sorting, and export. Local-first.",
    h1: "Find Duplicates in a List",
    content: `Duplicate rows and repeated IDs are a classic source of data bugs - double-counted records, duplicate keys at insert time, or repeated entries in exports. Finding them by scanning a long list is unreliable.

Paste any list - newline separated, comma separated, or a JSON array - and Formaty shows unique values, values that repeat, and exact occurrence counts. Deduplicate in one click, sort alphabetically or numerically, and export as SQL, JSON, CSV, or a Go slice.

Use cases: cleaning database exports, deduplicating ID lists before a bulk query, checking CSV dumps, and auditing log files. Processing is local; nothing is uploaded.`,
    inputExample: "user_1001\nuser_1002\nuser_1003\nuser_1002\nuser_1004\nuser_1005\nuser_1003\nuser_1006",
    outputExample: "Duplicates:\nuser_1002 × 2\nuser_1003 × 2",
    useCases: [
      "Clean database exports",
      "Deduplicate ID lists before queries",
      "Audit logs and CSV dumps",
      "Check for repeated keys",
    ],
    relatedTools: ["compare-lists", "compare-ids", "sql-in-clause-generator", "json-to-csv"],
  },
  "sql-values-generator": {
    route: "sql-values-generator",
    title: "SQL VALUES Generator | Formaty",
    description:
      "Generate SQL VALUES clauses from a list online. Paste IDs and copy INSERT-ready VALUES (...), (...). Free generator with quoting and chunking.",
    h1: "SQL VALUES Generator",
    content: `Inserting a pasted list into a database normally means writing VALUES rows by hand - quoting every string, escaping apostrophes, and chunking long lists. A SQL VALUES generator removes the busywork.

Paste newline-separated, comma-separated, or JSON-array values and get copy-ready VALUES rows with your chosen quoting. Works for strings, UUIDs, and numbers, and pairs with the list comparison tool to insert exactly the records that were missing.

Use cases: seeding tables from ID lists, inserting excluded records back, and building INSERT statements for fixtures. Generated locally in your browser.`,
    inputExample: "id-1\nid-2\nid-3",
    outputExample: "VALUES ('id-1'), ('id-2'), ('id-3')",
    useCases: [
      "Insert a list of IDs into a table",
      "Build INSERT fixtures from lists",
      "Re-insert missing records",
      "Chunk large value sets",
    ],
    relatedTools: ["sql-in-clause-generator", "compare-lists", "json-to-sql"],
  },
  "json-to-zod": {
    route: "json-to-zod",
    title: "JSON to Zod Schema | Formaty",
    description:
      "Generate Zod schemas from JSON online. Free JSON to Zod converter with nested objects and arrays. Copy validation code instantly. Runs in your browser.",
    h1: "JSON to Zod Schema Converter",
    content: `Zod is the standard runtime validation library for TypeScript, but writing schemas by hand - field types, optionality, nested objects - is tedious. A JSON to Zod converter infers the schema directly from a sample payload.

Paste a JSON sample and get a copy-ready Zod schema with z.object, z.array, and correct scalar types. Add it to your codebase and your API responses are validated with types that match your data.

Use cases: validating API responses at runtime, onboarding new endpoints, and keeping validation in sync with payloads. All conversion happens locally.`,
    inputExample: '{"id":1,"email":"a@b.com","roles":["admin"]}',
    outputExample: "z.object({\n  id: z.number(),\n  email: z.string(),\n  roles: z.array(z.string()),\n})",
    useCases: [
      "Validate API responses at runtime",
      "Generate Zod schemas from samples",
      "Keep validation in sync with payloads",
      "Onboard new endpoints",
    ],
    relatedTools: ["json-to-typescript", "json-to-pydantic", "json-schema-validator", "schema-generator"],
  },
  "json-to-java": {
    route: "json-to-java",
    title: "JSON to Java Class | Formaty",
    description:
      "Generate Java POJOs from JSON online. Free JSON to Java converter with nested classes and arrays. Copy-ready for Gson or Jackson. Runs locally.",
    h1: "JSON to Java Class Converter",
    content: `Consuming JSON in Java means writing POJOs by hand - private fields, getters, and types for every response shape. A JSON to Java converter infers the classes directly from a sample payload.

Nested objects become nested classes and arrays become Lists with the inferred element type, so the output is ready for Gson or Jackson deserialization.

Use cases: scaffolding REST clients, decoding webhook payloads, and documenting response shapes. Paste JSON, copy Java - everything runs in your browser.`,
    inputExample: '{"id":1,"email":"a@b.com","roles":["admin"]}',
    outputExample: "public class Root {\n  private int id;\n  private String email;\n  private List<String> roles;\n}",
    useCases: [
      "Scaffold Java REST clients",
      "Decode webhook payloads",
      "Prepare DTOs for Gson/Jackson",
      "Document response shapes",
    ],
    relatedTools: ["json-to-csharp", "json-to-go", "json-to-typescript", "json-to-sql"],
  },
  "json-to-csharp": {
    route: "json-to-csharp",
    title: "JSON to C# Class | Formaty",
    description:
      "Generate C# classes from JSON online. Free JSON to C# converter with nested classes and arrays. Copy-ready for System.Text.Json. Runs locally.",
    h1: "JSON to C# Class Converter",
    content: `Deserializing JSON in C# requires classes that match the payload - properties with correct types and names. A JSON to C# converter generates them from a sample, including nested objects and arrays.

The output works with System.Text.Json and Newtonsoft.Json, using [JsonPropertyName] attributes where naming differs.

Use cases: scaffolding API clients, building DTOs, and decoding third-party payloads. Paste JSON, copy C# - all local, no upload.`,
    inputExample: '{"id":1,"email":"a@b.com","roles":["admin"]}',
    outputExample: "public class Root {\n  public int Id { get; set; }\n  public string Email { get; set; }\n  public List<string> Roles { get; set; }\n}",
    useCases: [
      "Scaffold C# API clients",
      "Build DTOs for System.Text.Json",
      "Decode third-party payloads",
      "Document response shapes",
    ],
    relatedTools: ["json-to-java", "json-to-go", "json-to-typescript", "json-to-sql"],
  },
  "json-to-pydantic": {
    route: "json-to-pydantic",
    title: "JSON to Pydantic Model | Formaty",
    description:
      "Generate Pydantic models from JSON online. Free JSON to Pydantic converter with nested models and validation. Copy-ready Python. Runs locally.",
    h1: "JSON to Pydantic Model Converter",
    content: `Pydantic brings runtime validation to Python, but hand-writing models - fields, types, nested classes - for every API response is slow. A JSON to Pydantic converter infers the models from a sample payload.

Nested objects become nested Pydantic models and arrays become lists with the inferred element type, giving you validated, typed Python in one paste.

Use cases: typing FastAPI request/response models, validating external payloads, and building data pipelines. Paste JSON, copy Python - everything runs in your browser.`,
    inputExample: '{"id":1,"email":"a@b.com","roles":["admin"]}',
    outputExample: "class Root(BaseModel):\n    id: int\n    email: str\n    roles: list[str]",
    useCases: [
      "Type FastAPI models",
      "Validate external payloads",
      "Build typed data pipelines",
      "Generate test fixtures",
    ],
    relatedTools: ["json-to-python", "json-to-zod", "json-schema-validator", "json-to-typescript"],
  },
  "json-to-protobuf": {
    route: "json-to-protobuf",
    title: "JSON to Protobuf Message | Formaty",
    description:
      "Generate Protobuf message definitions from JSON online. Free JSON to proto converter with nested messages and repeated fields. Runs locally.",
    h1: "JSON to Protobuf Message Converter",
    content: `Defining .proto messages that match a JSON payload - field numbers, types, repeated fields - is meticulous work. A JSON to Protobuf converter drafts the message definitions from a sample.

Nested objects become nested messages and arrays become repeated fields, giving you a starting point you can refine and version in your schema registry.

Use cases: scaffolding gRPC schemas, converting REST payloads to protobuf, and documenting contracts. Paste JSON, copy .proto - all local.`,
    inputExample: '{"id":1,"email":"a@b.com","roles":["admin"]}',
    outputExample: "message Root {\n  int32 id = 1;\n  string email = 2;\n  repeated string roles = 3;\n}",
    useCases: [
      "Scaffold gRPC schemas",
      "Convert REST payloads to protobuf",
      "Document service contracts",
      "Prototype message definitions",
    ],
    relatedTools: ["json-to-go", "json-to-java", "json-to-typescript", "schema-generator"],
  },
  "json-schema-validator": {
    route: "json-schema-validator",
    title: "JSON Schema Validator | Formaty",
    description:
      "Validate JSON against a JSON Schema online. Paste your data and schema, see validation errors instantly. Free validator, runs locally in your browser.",
    h1: "JSON Schema Validator",
    content: `JSON Schema describes what valid data looks like - required fields, types, constraints. Validating payloads against a schema by hand is impossible at scale; a validator reports every error.

Paste your JSON data on the left and a JSON Schema (or YAML schema) in the validator dialog. Formaty reports which fields fail, with paths and error messages, all computed locally.

Use cases: verifying API contracts, checking config files against schemas, and testing schemas you generated from samples. No data leaves your device.`,
    inputExample: "Data: {\"name\": 123} | Schema: {\"type\":\"object\",\"properties\":{\"name\":{\"type\":\"string\"}}}",
    outputExample: "Invalid: /name must be string",
    useCases: [
      "Verify API contracts",
      "Check configs against schemas",
      "Test generated schemas",
      "Validate webhook payloads",
    ],
    relatedTools: ["schema-generator", "json-to-zod", "json-to-pydantic", "json-formatter"],
  },
  "json-flattener": {
    route: "json-flattener",
    title: "JSON Flattener | Formaty",
    description:
      "Flatten nested JSON online. Free JSON flattener with dot notation, plus unflatten. Perfect prep for CSV export. Runs locally in your browser.",
    h1: "JSON Flattener",
    content: `Nested JSON is hard to put in a spreadsheet or compare row-by-row. Flattening collapses nested objects into dot-notation keys - user.name, order.items.0.id - so every leaf becomes a column.

Flatten a JSON payload, then convert the result to CSV or filter it with a query. Unflatten reverses the process when you need the nested structure back.

Use cases: preparing API data for CSV export, building flat records for analysis, and simplifying nested configs. All processing is local.`,
    inputExample: '{"user":{"name":"A","age":30},"tags":["x","y"]}',
    outputExample: "user.name = A\nuser.age = 30\ntags.0 = x\ntags.1 = y",
    useCases: [
      "Prepare nested JSON for CSV",
      "Build flat records for analysis",
      "Compare nested configs",
      "Simplify payload structures",
    ],
    relatedTools: ["json-to-csv", "json-viewer", "jsonpath-tester", "json-formatter"],
  },
  "compare-csv": {
    route: "compare-csv",
    title: "Compare Two CSV Files | Formaty",
    description:
      "Compare two CSV files online. Select a key column and see common, missing, extra, and changed rows instantly. Free CSV comparison tool, runs locally.",
    h1: "Compare Two CSV Files",
    content: `Comparing CSV exports - before/after migrations, staging vs production dumps, or supplier vs internal data - is a daily chore for data work. Doing it in a spreadsheet is slow and error-prone.

Paste two CSVs that share a key column (like id). Formaty detects the columns automatically and compares by your chosen key: common rows, rows missing from each side, and rows that changed for the same key.

Use cases: reconciling database exports, diffing configuration exports, verifying ETL output, and finding records that were updated. Everything runs locally; your data is never uploaded.`,
    inputExample: "Left: id,name,score\n1,Alice,95\n2,Bob,87\n\nRight: id,name,score\n2,Bob,90\n3,Carol,80",
    outputExample: "Common keys: 2\nMissing from right: 1\nMissing from left: 3\nChanged: 2 (score 87 → 90)",
    useCases: [
      "Reconcile database exports",
      "Diff configuration exports",
      "Verify ETL output",
      "Find updated records",
    ],
    relatedTools: ["csv-column-compare", "compare-lists", "compare-ids", "json-to-csv"],
  },
  "csv-column-compare": {
    route: "csv-column-compare",
    title: "Compare Two CSV Columns | Formaty",
    description:
      "Compare values in two CSV columns online. Paste two CSVs, pick the key column, and see missing and extra values. Free column comparison tool.",
    h1: "Compare Two CSV Columns",
    content: `Often you don't need full row comparison - just one column, like a list of IDs or emails from two exports. A column comparison extracts the values and treats them as lists to compare.

Paste two CSVs, choose the key column, and Formaty shows values common to both, missing from each side, and duplicates - with SQL IN / NOT IN export for the result.

Use cases: comparing email lists, reconciling ID columns across exports, and checking that every expected value arrived. Runs entirely in your browser.`,
    inputExample: "Left: id,email\n1,a@x.com\n2,b@x.com\n\nRight: id,email\n2,b@x.com\n3,c@x.com",
    outputExample: "Common: b@x.com\nOnly left: a@x.com\nOnly right: c@x.com",
    useCases: [
      "Compare email or ID columns",
      "Reconcile export columns",
      "Check for missing values",
      "Generate SQL from column results",
    ],
    relatedTools: ["compare-csv", "compare-lists", "sql-in-clause-generator", "find-duplicates-in-list"],
  },
  "curl-to-fetch": {
    route: "curl-to-fetch",
    title: "cURL to Fetch Converter | Formaty",
    description:
      "Convert cURL commands to JavaScript fetch online. Paste a cURL command, get copy-ready fetch code with headers and body. Free converter, runs locally.",
    h1: "cURL to Fetch Converter",
    content: `Docs give you cURL; your code needs fetch. Translating headers, methods, and bodies by hand wastes time and introduces errors. A cURL to fetch converter does it in one paste.

The converter parses the cURL command - method, URL, headers, body, auth - and emits a copy-ready fetch() call with the same semantics, ready to paste into your code.

Use cases: porting API examples into JS code, building API clients from docs, and sharing reproducible requests. Conversion is local; executing the request is optional and explicit.`,
    inputExample: "curl -X POST https://api.example.com/users -H 'Content-Type: application/json' -d '{\"name\":\"A\"}'",
    outputExample: "fetch('https://api.example.com/users', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json' },\n  body: '{\"name\":\"A\"}'\n})",
    useCases: [
      "Port API examples into JS code",
      "Build API clients from docs",
      "Convert Postman cURL exports",
      "Share reproducible requests",
    ],
    relatedTools: ["curl-to-axios", "curl-to-python", "curl-to-go", "api-import"],
  },
  "curl-to-axios": {
    route: "curl-to-axios",
    title: "cURL to Axios Converter | Formaty",
    description:
      "Convert cURL commands to Axios requests online. Paste cURL, get copy-ready axios code with headers, params, and data. Free converter, runs locally.",
    h1: "cURL to Axios Converter",
    content: `Axios is the most common HTTP client in JavaScript, but translating a cURL command into axios({...}) by hand - headers, params, JSON data - is slow. A cURL to Axios converter handles it.

Paste any cURL command and get copy-ready axios code with the correct method, URL, headers, and data payload. Add the snippet to your project and run.

Use cases: converting API docs into axios calls, scaffolding HTTP modules, and keeping examples in sync with your client. All conversion is local.`,
    inputExample: "curl -X GET https://api.example.com/users?limit=10 -H 'Authorization: Bearer TOKEN'",
    outputExample: "axios.get('https://api.example.com/users', {\n  params: { limit: '10' },\n  headers: { Authorization: 'Bearer TOKEN' }\n})",
    useCases: [
      "Convert API docs to axios calls",
      "Scaffold HTTP modules",
      "Port cURL examples into apps",
      "Share reproducible requests",
    ],
    relatedTools: ["curl-to-fetch", "curl-to-python", "curl-to-go", "api-import"],
  },
  "curl-to-python": {
    route: "curl-to-python",
    title: "cURL to Python Converter | Formaty",
    description:
      "Convert cURL commands to Python requests online. Paste cURL, get copy-ready requests code with headers and data. Free converter, runs locally in your browser.",
    h1: "cURL to Python Converter",
    content: `Python scripts that call APIs usually start from a cURL example. Translating it into requests.get/post with headers and json payloads is repetitive - and easy to get wrong.

Paste a cURL command and get copy-ready Python using the requests library, with method, URL, headers, and data preserved. Drop it into a script and run.

Use cases: turning API docs into Python scripts, building data pipelines, and automating webhook calls. Conversion is local; execution is optional.`,
    inputExample: "curl -X POST https://api.example.com/users -H 'Content-Type: application/json' -d '{\"name\":\"A\"}'",
    outputExample: "requests.post('https://api.example.com/users',\n  headers={'Content-Type': 'application/json'},\n  json={'name': 'A'})",
    useCases: [
      "Turn API docs into Python scripts",
      "Build data pipelines",
      "Automate webhook calls",
      "Port cURL examples",
    ],
    relatedTools: ["curl-to-fetch", "curl-to-axios", "curl-to-go", "api-import"],
  },
  "curl-to-go": {
    route: "curl-to-go",
    title: "cURL to Go Converter | Formaty",
    description:
      "Convert cURL commands to Go http code online. Paste cURL, get copy-ready Go with the http package. Free converter, runs locally in your browser.",
    h1: "cURL to Go Converter",
    content: `Calling an API in Go means writing an http.NewRequest with the right method, headers, and body - tedious when you start from a cURL example. A cURL to Go converter generates it.

The output uses the standard library, preserving method, URL, headers, and body so the request behaves exactly like the original cURL command.

Use cases: building Go API clients, porting examples into services, and scaffolding HTTP calls. Conversion happens locally in your browser.`,
    inputExample: "curl -X GET https://api.example.com/users -H 'Authorization: Bearer TOKEN'",
    outputExample: "req, _ := http.NewRequest(\"GET\", \"https://api.example.com/users\", nil)\nreq.Header.Set(\"Authorization\", \"Bearer TOKEN\")",
    useCases: [
      "Build Go API clients",
      "Port examples into services",
      "Scaffold HTTP calls",
      "Share reproducible requests",
    ],
    relatedTools: ["curl-to-fetch", "curl-to-axios", "curl-to-python", "api-import"],
  },
};

export const ALL_TOOL_ROUTES: ToolRoute[] = Object.keys(TOOL_PAGES) as ToolRoute[];


export function getCanonicalUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Playground URL with optional tool preset for workspace preselection */
export function getPlayUrl(tool?: ToolRoute): string {
  return tool ? `/playground?tool=${tool}` : "/playground";
}

/** Tool presets for workspace - applied when user navigates from tool page to /playground */
export const TOOL_PRESETS: Record<
  ToolRoute,
  Partial<{
    viewMode: "raw" | "tree" | "graph" | "query" | "table";
    activeOperation: string;
    convertToFormat: "json" | "xml" | "yaml" | "toml" | "csv";
    inputFormatOverride: "json" | "xml" | "yaml" | "toml" | "csv" | "curl";
    outputLanguage: string;
    typeLanguage: string;
    input: string;
    diffLeftInput?: string;
    diffRightInput?: string;
    diffKind?: "document" | "list" | "single";
    schemaText?: string;
  }>
> = {
  "json-formatter": { viewMode: "raw", activeOperation: "beautify", input: '{"id":1,"name":"test"}' },
  "json-viewer": { viewMode: "tree", activeOperation: "format", input: '{"users":[{"id":1,"name":"Alice"}]}' },
  "json-diff": { activeOperation: "diff", viewMode: "raw", diffLeftInput: '{"a":1,"b":2}', diffRightInput: '{"a":2,"b":2,"c":3}' },
  "json-to-typescript": { activeOperation: "generateTypes", outputLanguage: "typescript", input: '{"id":1,"email":"a@b.com"}' },
  "jsonpath-tester": { viewMode: "query", activeOperation: "format", input: '{"store":{"book":[{"title":"A"}]}}' },
  "graph-viewer": { viewMode: "graph", activeOperation: "format", input: '{"a":{"b":1},"c":{"b":1}}' },
  "api-import": { inputFormatOverride: "curl", input: 'curl -X GET "https://api.github.com"' },
  "schema-generator": { activeOperation: "schema", viewMode: "raw", input: '{"id":1,"name":"test"}' },
  "json-to-xml": { convertToFormat: "xml", activeOperation: "format", input: '{"root":{"id":1}}' },
  "xml-to-json": { inputFormatOverride: "xml", convertToFormat: "json", input: '<?xml version="1.0"?><root><id>1</id></root>' },
  "json-to-yaml": { convertToFormat: "yaml", activeOperation: "format", input: '{"apiVersion":"v1","kind":"Pod"}' },
  "yaml-to-json": { inputFormatOverride: "yaml", convertToFormat: "json", input: "apiVersion: v1\nkind: Pod" },
  "json-to-toml": { convertToFormat: "toml", activeOperation: "format", input: '{"package":{"name":"formaty","version":"1.0.0"}}' },
  "toml-to-json": { inputFormatOverride: "toml", convertToFormat: "json", input: '[package]\nname = "formaty"\nversion = "1.0.0"' },
  "json-to-csv": { convertToFormat: "csv", activeOperation: "format", input: '[{"id":1,"name":"A"},{"id":2,"name":"B"}]' },
  "csv-to-json": { inputFormatOverride: "csv", convertToFormat: "json", input: "id,name\n1,Alice\n2,Bob" },
  "xml-formatter": { inputFormatOverride: "xml", activeOperation: "format", input: '<?xml version="1.0"?><root><id>1</id></root>' },
  "yaml-formatter": { inputFormatOverride: "yaml", activeOperation: "format", input: "apiVersion: v1\nkind: Pod" },
  "toml-formatter": { inputFormatOverride: "toml", activeOperation: "format", input: '[package]\nname="foo"' },
  "csv-formatter": { inputFormatOverride: "csv", activeOperation: "format", input: "id,name\n1,Alice\n2,Bob" },
  "compare-lists": {
    activeOperation: "diff",
    diffKind: "list",
    diffLeftInput: "id-1001\nid-1002\nid-1003\nid-1004\nid-1005",
    diffRightInput: "id-1002\nid-1003\nid-1005\nid-1006",
  },
  "sql-in-clause-generator": {
    activeOperation: "diff",
    diffKind: "list",
    diffLeftInput: "1001\n1002\n1003\n1004\n1005\n1006",
    diffRightInput: "",
  },
  "json-to-sql": {
    activeOperation: "generateTypes",
    typeLanguage: "sql",
    outputLanguage: "sql",
    input: '[{"id":1,"name":"Alice","active":true},{"id":2,"name":"Bob","active":false}]',
  },
  "json-to-go": {
    activeOperation: "generateTypes",
    typeLanguage: "go",
    outputLanguage: "go",
    input: '{"id":1,"email":"a@b.com","roles":["admin","editor"]}',
  },
  "json-to-python": {
    activeOperation: "generateTypes",
    typeLanguage: "python",
    outputLanguage: "python",
    input: '{"id":1,"email":"a@b.com","roles":["admin"]}',
  },
  "compare-ids": {
    activeOperation: "diff",
    diffKind: "list",
    diffLeftInput: "1001\n1002\n1003\n1004\n1005",
    diffRightInput: "1002\n1003\n1005\n1006\n1007",
  },
  "find-duplicates-in-list": {
    activeOperation: "diff",
    diffKind: "single",
    diffLeftInput: "user_1001\nuser_1002\nuser_1003\nuser_1002\nuser_1004\nuser_1005\nuser_1003\nuser_1006",
  },
  "sql-values-generator": {
    activeOperation: "diff",
    diffKind: "list",
    diffLeftInput: "id-1001\nid-1002\nid-1003\nid-1004\nid-1005",
    diffRightInput: "",
  },
  "json-to-zod": {
    activeOperation: "generateTypes",
    typeLanguage: "zod",
    outputLanguage: "zod",
    input: '{"id":1,"email":"a@b.com","roles":["admin","editor"]}',
  },
  "json-to-java": {
    activeOperation: "generateTypes",
    typeLanguage: "java",
    outputLanguage: "java",
    input: '{"id":1,"email":"a@b.com","roles":["admin"]}',
  },
  "json-to-csharp": {
    activeOperation: "generateTypes",
    typeLanguage: "csharp",
    outputLanguage: "csharp",
    input: '{"id":1,"email":"a@b.com","roles":["admin"]}',
  },
  "json-to-pydantic": {
    activeOperation: "generateTypes",
    typeLanguage: "pydantic",
    outputLanguage: "pydantic",
    input: '{"id":1,"email":"a@b.com","roles":["admin"]}',
  },
  "json-to-protobuf": {
    activeOperation: "generateTypes",
    typeLanguage: "protobuf",
    outputLanguage: "protobuf",
    input: '{"id":1,"email":"a@b.com","roles":["admin"]}',
  },
  "json-schema-validator": {
    activeOperation: "validate",
    viewMode: "raw",
    input: '{"name":123,"age":"old"}',
    schemaText: `{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer" }
  },
  "required": ["name"]
}`,
  },
  "json-flattener": {
    activeOperation: "flatten",
    viewMode: "raw",
    input: '{"user":{"name":"A","age":30},"tags":["x","y"]}',
  },
  "compare-csv": {
    activeOperation: "diff",
    diffKind: "list",
    diffLeftInput: "id,name,score\n1,Alice,95\n2,Bob,87",
    diffRightInput: "id,name,score\n2,Bob,90\n3,Carol,80",
  },
  "csv-column-compare": {
    activeOperation: "diff",
    diffKind: "list",
    diffLeftInput: "id,email\n1,a@x.com\n2,b@x.com",
    diffRightInput: "id,email\n2,b@x.com\n3,c@x.com",
  },
  "curl-to-fetch": {
    inputFormatOverride: "curl",
    input: 'curl -X POST "https://api.example.com/users" -H "Content-Type: application/json" -d \'{"name":"A"}\'',
  },
  "curl-to-axios": {
    inputFormatOverride: "curl",
    input: 'curl -X GET "https://api.example.com/users?limit=10" -H "Authorization: Bearer TOKEN"',
  },
  "curl-to-python": {
    inputFormatOverride: "curl",
    input: 'curl -X POST "https://api.example.com/users" -H "Content-Type: application/json" -d \'{"name":"A"}\'',
  },
  "curl-to-go": {
    inputFormatOverride: "curl",
    input: 'curl -X GET "https://api.example.com/users" -H "Authorization: Bearer TOKEN"',
  },
};

/**
 * Routes removed during tool deduplication. Each maps the old URL to the tool
 * page that now covers that workflow, so the removed URL still resolves (with a
 * canonical + redirect to the replacement) instead of 404ing.
 */
export const TOOL_REDIRECTS: Record<string, ToolRoute> = {
  // SQL NOT IN is the same list-to-SQL workflow as SQL IN - the generator covers
  // NOT IN (and ANY / VALUES) from one input.
  "sql-not-in-generator": "sql-in-clause-generator",
};
