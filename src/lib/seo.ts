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
  "json-to-csv": ["json to csv", "convert json to csv", "json csv converter"],
  "csv-to-json": ["csv to json", "convert csv to json", "csv json converter"],
  "xml-formatter": ["xml formatter", "format xml online", "xml beautifier"],
  "yaml-formatter": ["yaml formatter", "format yaml online", "yaml beautifier"],
  "toml-formatter": ["toml formatter", "format toml online"],
  "csv-formatter": ["csv formatter", "format csv online"],
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
  | "json-to-csv"
  | "csv-to-json"
  | "xml-formatter"
  | "yaml-formatter"
  | "toml-formatter"
  | "csv-formatter";

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
    content: `JSON is the standard for API responses and config files. Raw JSON from APIs often arrives minified or poorly formatted—hard to read and debug. A JSON formatter beautifies and indents your data so you can inspect structure, spot errors, and understand nested objects quickly.

Formatting messy JSON improves readability. Indentation helps trace nested objects and arrays. Syntax highlighting makes keys, values, and types stand out. Validation catches trailing commas, missing quotes, and invalid structures before your code runs.

Use cases: debugging API responses, inspecting webhook payloads, cleaning up config files, preparing JSON for documentation. Paste your data, get formatted output in one click. No signup, no server round-trip—everything runs locally in your browser.`,
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
    content: `Large JSON blobs are hard to navigate as raw text. A JSON viewer renders your data as a hierarchical tree—expand and collapse nodes, drill into nested objects, and find values quickly.

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
    content: `Comparing JSON manually is error-prone. A JSON diff tool highlights differences between two versions—added, removed, and changed keys and values.

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

Paste a JSON sample—API response, config, webhook payload—and get TypeScript definitions. Supports optional properties, unions, and nested structures. Also outputs Python, Go, Java, and more.

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
    content: `Testing APIs often starts with a cURL command from docs or Postman. An API import tool lets you paste cURL, execute the request, and inspect the response—formatted, validated, queryable.

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

Paste one or more samples—API responses, configs—and get a JSON Schema. Use it for validation, documentation, or code generation.

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
};

export const ALL_TOOL_ROUTES: ToolRoute[] = Object.keys(TOOL_PAGES) as ToolRoute[];

export function getToolConfig(route: ToolRoute): ToolPageConfig {
  return TOOL_PAGES[route];
}

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
  "json-to-csv": { convertToFormat: "csv", activeOperation: "format", input: '[{"id":1,"name":"A"},{"id":2,"name":"B"}]' },
  "csv-to-json": { inputFormatOverride: "csv", convertToFormat: "json", input: "id,name\n1,Alice\n2,Bob" },
  "xml-formatter": { inputFormatOverride: "xml", activeOperation: "format", input: '<?xml version="1.0"?><root><id>1</id></root>' },
  "yaml-formatter": { inputFormatOverride: "yaml", activeOperation: "format", input: "apiVersion: v1\nkind: Pod" },
  "toml-formatter": { inputFormatOverride: "toml", activeOperation: "format", input: '[package]\nname="foo"' },
  "csv-formatter": { inputFormatOverride: "csv", activeOperation: "format", input: "id,name\n1,Alice\n2,Bob" },
};
