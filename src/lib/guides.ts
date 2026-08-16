import type { ToolRoute } from "@/lib/seo";

export interface GuideStep {
  heading: string;
  body: string;
  code?: { label: string; content: string };
}

export interface GuideFaq {
  q: string;
  a: string;
}

export interface GuideConfig {
  slug: string;
  /** Metadata title - the root template appends "| Formaty". */
  title: string;
  description: string;
  h1: string;
  /** The answer up front - what the workflow produces and when to use it. */
  intro: string;
  steps: GuideStep[];
  /** Primary tool the guide drives the user into. */
  toolRoute: ToolRoute;
  toolCta: string;
  relatedTools: ToolRoute[];
  relatedGuides: string[];
  faq: GuideFaq[];
}

export const GUIDES: GuideConfig[] = [
  {
    slug: "compare-database-records",
    title: "Compare Database Records Between Environments",
    description:
      "Learn how to compare database records between production and staging: export both ID sets, find common, missing, and extra records, and copy the result as SQL. Free and local-first.",
    h1: "How to Compare Database Records Between Two Environments",
    intro:
      "The fastest way to find which records differ between two databases is to compare their primary keys as lists. Export both ID columns, paste them into Formaty's list compare, and you instantly get common records, records only in one side, and duplicates - plus copy-ready SQL.",
    steps: [
      {
        heading: "Export the ID column from each database",
        body: "Run the same SELECT on each environment and copy the results. Any column works, but primary keys are the cleanest signal.",
        code: {
          label: "Production",
          content: "SELECT id FROM users;",
        },
      },
      {
        heading: "Paste both lists into Compare Lists",
        body: "Open Compare Lists, paste the production export on the left and staging on the right. Newline-separated, comma-separated, and JSON arrays are all accepted.",
        code: {
          label: "Production IDs",
          content: "1001\n1002\n1003\n1004\n1005",
        },
      },
      {
        heading: "Read the buckets",
        body: "Formaty computes Common, Only in left (missing from staging), Only in right (extra in staging), and duplicates. That's your reconciliation report in one glance.",
      },
      {
        heading: "Copy the result as SQL",
        body: "Use the copy-as menu to turn any bucket into SQL IN, SQL NOT IN, PostgreSQL ARRAY, JSON, or CSV - for example, all IDs missing from staging as a NOT IN clause.",
        code: {
          label: "Copy as SQL NOT IN",
          content: "id NOT IN ('1001', '1004')",
        },
      },
    ],
    toolRoute: "compare-lists",
    toolCta: "Try it - compare two ID lists online",
    relatedTools: ["compare-ids", "sql-not-in-generator", "sql-in-clause-generator", "find-duplicates-in-list"],
    relatedGuides: ["find-missing-ids-between-lists", "generate-sql-in-clause"],
    faq: [
      {
        q: "Can I compare thousands of IDs?",
        a: "Yes. Formaty compares large lists in a Web Worker - 50k+ IDs run in well under a second, entirely in your browser.",
      },
      {
        q: "Does this upload my database data?",
        a: "No. Comparison runs 100% locally. Your IDs never leave your device unless you explicitly use the Share feature.",
      },
      {
        q: "What if my exports are comma-separated?",
        a: "Compare Lists auto-detects commas, semicolons, pipes, whitespace, and JSON arrays, so you can paste raw query output as-is.",
      },
    ],
  },
  {
    slug: "find-missing-ids-between-lists",
    title: "Find Missing IDs Between Two Lists",
    description:
      "Find which IDs are present in one list but missing from another. A two-minute workflow with list compare that outputs SQL NOT IN for the missing records.",
    h1: "How to Find Missing IDs Between Two Lists",
    intro:
      "To find missing IDs, compare the two lists and read the 'only in left' bucket: those are the IDs that exist in the first export but not in the second. Formaty does this instantly and can copy the result as SQL.",
    steps: [
      {
        heading: "Put the complete list on the left",
        body: "The left input is the reference set. Any IDs that are in it but absent from the right side are reported as 'Only in left' - those are your missing IDs.",
        code: {
          label: "Reference list",
          content: "1001\n1002\n1003\n1004",
        },
      },
      {
        heading: "Paste the checked list on the right",
        body: "Paste the export you're auditing on the right side. It may be shorter, longer, or contain duplicates - all are handled.",
        code: {
          label: "Checked list",
          content: "1002\n1003\n1005",
        },
      },
      {
        heading: "Copy the missing IDs as SQL",
        body: "Select the 'Only in left' bucket and copy it as SQL NOT IN to exclude the missing records, or as JSON/CSV to hand to another tool.",
        code: {
          label: "Missing IDs as SQL",
          content: "id NOT IN ('1001', '1004')",
        },
      },
    ],
    toolRoute: "compare-lists",
    toolCta: "Find missing IDs now",
    relatedTools: ["compare-ids", "sql-not-in-generator", "compare-csv", "find-duplicates-in-list"],
    relatedGuides: ["compare-database-records", "generate-sql-in-clause"],
    faq: [
      {
        q: "What if my lists are strings, like UUIDs?",
        a: "UUIDs and any string values work the same way - comparison is exact and the SQL export quotes them correctly.",
      },
      {
        q: "Can I compare more than two lists?",
        a: "The compare tool works on two sides, but you can chain comparisons: compare list A vs B, then compare the result with list C.",
      },
    ],
  },
  {
    slug: "generate-sql-in-clause",
    title: "Generate a SQL IN Clause from a List of Values",
    description:
      "Turn a pasted list of IDs into a copy-ready SQL IN or NOT IN clause with correct quoting. Generate SQL from a list in seconds, locally in your browser.",
    h1: "How to Generate a SQL IN Clause from a List of Values",
    intro:
      "Paste any list of IDs - newline separated, comma separated, or a JSON array - and Formaty generates a copy-ready WHERE id IN (...) clause with your choice of quoting, in one click.",
    steps: [
      {
        heading: "Paste the values",
        body: "Drop in the raw list from your query result, spreadsheet, or JSON array. Quoting and delimiters are detected automatically.",
        code: {
          label: "Input list",
          content: "1001\n1002\n1003\n1004\n1005",
        },
      },
      {
        heading: "Choose the clause type",
        body: "Generate IN for inclusion, NOT IN for exclusion, or PostgreSQL ANY(ARRAY[...]) for very large lists that exceed parameter limits.",
        code: {
          label: "SQL IN output",
          content: "id IN ('1001', '1002', '1003', '1004', '1005')",
        },
      },
      {
        heading: "Copy and run",
        body: "Copy the clause into your query. Long lists can be split into chunks automatically to stay readable.",
      },
    ],
    toolRoute: "sql-in-clause-generator",
    toolCta: "Generate a SQL IN clause",
    relatedTools: ["sql-not-in-generator", "sql-values-generator", "compare-lists", "json-to-sql"],
    relatedGuides: ["find-missing-ids-between-lists", "compare-database-records"],
    faq: [
      {
        q: "Which quoting styles are supported?",
        a: "Single quotes, double quotes, or no quotes for numeric lists - choose the style that matches your database dialect.",
      },
      {
        q: "What about lists with thousands of values?",
        a: "Use the chunking option to split long lists into multiple IN clauses, or PostgreSQL ANY(ARRAY[...]) which handles large lists in a single expression.",
      },
    ],
  },
  {
    slug: "compare-api-responses",
    title: "Compare API Responses Before and After a Change",
    description:
      "Diff two API responses to see exactly what changed: added, removed, and modified fields. Side-by-side JSON diff, local-first and free.",
    h1: "How to Compare API Responses Before and After a Change",
    intro:
      "Paste the old response on the left and the new response on the right, and Formaty highlights every added, removed, and changed field. It's the fastest way to review a schema or payload change.",
    steps: [
      {
        heading: "Capture both responses",
        body: "Run the request before and after the change, or capture from different environments. Keep the raw bodies.",
        code: {
          label: "Before",
          content: '{"id":1,"name":"Alice","role":"admin"}',
        },
      },
      {
        heading: "Paste into JSON Diff",
        body: "Left side gets the before, right side the after. Formaty shows side-by-side (or inline) highlighting of every difference.",
        code: {
          label: "After",
          content: '{"id":1,"name":"Alice","roles":["admin","editor"]}',
        },
      },
      {
        heading: "Review the change set",
        body: "role became roles with an extra value - exactly the kind of breaking change a response diff is built to catch. Optionally compare order-insensitively for arrays.",
      },
    ],
    toolRoute: "json-diff",
    toolCta: "Diff two API responses",
    relatedTools: ["json-formatter", "json-viewer", "api-import", "jsonpath-tester"],
    relatedGuides: ["query-large-json", "compare-database-records"],
    faq: [
      {
        q: "Can I diff responses with reordered keys?",
        a: "Yes. Enable order-insensitive array comparison to ignore reordered items, and whitespace is ignored by default.",
      },
      {
        q: "Does the diff upload my payloads?",
        a: "No. Diffing runs entirely in your browser - the payloads never leave your device.",
      },
    ],
  },
  {
    slug: "convert-json-to-typescript",
    title: "Convert JSON to TypeScript Types",
    description:
      "Generate TypeScript interfaces from a JSON sample in seconds. Paste an API response and get copy-ready types with nested objects, arrays, and unions.",
    h1: "How to Convert JSON to TypeScript Types",
    intro:
      "Paste a sample API response and Formaty generates the matching TypeScript interface - nested objects become interfaces, arrays become typed arrays, and optionals are inferred. Copy the result straight into your codebase.",
    steps: [
      {
        heading: "Paste a realistic response",
        body: "The more representative the sample, the better the types. Include optional fields and edge values so they're not missed.",
        code: {
          label: "API response",
          content: '{"id":1,"email":"a@b.com","roles":["admin","editor"],"profile":{"bio":"dev","active":true}}',
        },
      },
      {
        heading: "Generate the interface",
        body: "Formaty infers scalar types, nested interfaces, and arrays. The same sample can also produce Zod, Pydantic, Go, Java, C#, and more from the Types menu.",
        code: {
          label: "Generated TypeScript",
          content: "interface Root {\n  id: number;\n  email: string;\n  roles: string[];\n  profile: Profile;\n}",
        },
      },
      {
        heading: "Copy into your project",
        body: "Use the output as the type for your API client or state model. Keep the sample in a test fixture so types stay in sync.",
      },
    ],
    toolRoute: "json-to-typescript",
    toolCta: "Convert JSON to TypeScript",
    relatedTools: ["json-to-zod", "json-to-go", "json-to-python", "schema-generator"],
    relatedGuides: ["convert-json-to-sql", "query-large-json"],
    faq: [
      {
        q: "Does it handle nested objects?",
        a: "Yes - nested objects become nested interfaces and arrays of objects become typed arrays of interfaces.",
      },
      {
        q: "Can I generate other languages from the same JSON?",
        a: "Yes. The Types menu also outputs Python, Pydantic, Go, Java, C#, Kotlin, Swift, Rust, Zod, Protobuf, and SQL from the same input.",
      },
    ],
  },
  {
    slug: "convert-json-to-sql",
    title: "Convert JSON to SQL (DDL and Seed Data)",
    description:
      "Generate CREATE TABLE and INSERT seed statements from a JSON sample. Turn an API response into database-ready SQL for PostgreSQL, MySQL, or SQLite.",
    h1: "How to Convert JSON to SQL",
    intro:
      "Paste a JSON array and Formaty generates the CREATE TABLE definition plus INSERT seed rows - with column types inferred and nested objects promoted to related tables with foreign keys.",
    steps: [
      {
        heading: "Paste a row-shaped JSON array",
        body: "An array of objects works best: each object becomes a row, and field types are inferred from the values.",
        code: {
          label: "JSON input",
          content: '[{"id":1,"name":"Alice","active":true},{"id":2,"name":"Bob","active":false}]',
        },
      },
      {
        heading: "Pick your dialect",
        body: "Choose PostgreSQL, MySQL, or SQLite in the settings, then generate. Types are mapped to the dialect's native column types.",
        code: {
          label: "Generated SQL",
          content: "CREATE TABLE users (id INT, name TEXT, active BOOLEAN);\nINSERT INTO users (id, name, active) VALUES (1, 'Alice', true);",
        },
      },
      {
        heading: "Seed your database",
        body: "Copy the DDL and INSERTs into your migration or seed script. Nested data is split into related tables with foreign keys instead of flattened.",
      },
    ],
    toolRoute: "json-to-sql",
    toolCta: "Convert JSON to SQL",
    relatedTools: ["json-to-typescript", "json-to-csv", "sql-in-clause-generator", "schema-generator"],
    relatedGuides: ["convert-json-to-typescript", "generate-sql-in-clause"],
    faq: [
      {
        q: "Which databases are supported?",
        a: "PostgreSQL, MySQL, and SQLite, with dialect-aware types and identifiers.",
      },
      {
        q: "Does Formaty upload my JSON?",
        a: "No. Everything runs locally in your browser - nothing is sent to a server.",
      },
      {
        q: "Can I generate seed data?",
        a: "Yes - the INSERT statements are seed data. Paste more rows to generate a larger seed set.",
      },
    ],
  },
  {
    slug: "query-large-json",
    title: "Query Large JSON with JSONPath and JMESPath",
    description:
      "Extract exactly the values you need from large JSON using JSONPath or JMESPath. Test queries live against your data, then copy the working expression.",
    h1: "How to Query Large JSON with JSONPath and JMESPath",
    intro:
      "Instead of scrolling through a huge response, write a JSONPath or JMESPath expression to extract only the values you need - then test it live against your data before putting it in code.",
    steps: [
      {
        heading: "Paste the JSON",
        body: "Paste the full response or document. The Query view works on any parsed JSON, so formatting isn't required first.",
      },
      {
        heading: "Write and test the expression",
        body: "Start simple - $.users[*].email - then refine with filters. Results render instantly as you type.",
        code: {
          label: "JSONPath",
          content: "$.users[*].email",
        },
      },
      {
        heading: "Use the working expression",
        body: "Once it returns what you expect, copy it into your code. The same expression works with jsonpath-plus or JMESPath libraries in any language.",
      },
    ],
    toolRoute: "jsonpath-tester",
    toolCta: "Query JSON with JSONPath",
    relatedTools: ["json-viewer", "json-flattener", "json-to-csv", "graph-viewer"],
    relatedGuides: ["compare-api-responses", "convert-json-to-typescript"],
    faq: [
      {
        q: "What's the difference between JSONPath and JMESPath?",
        a: "JSONPath uses $-rooted path syntax with filters; JMESPath is a more expression-oriented language with functions. Both are supported - pick whichever your stack already uses.",
      },
      {
        q: "Can it handle very large documents?",
        a: "Yes - parsing and querying run in a Web Worker, so large responses stay responsive while you iterate on the expression.",
      },
    ],
  },
];

export const GUIDE_ROUTES: string[] = GUIDES.map((g) => g.slug);

export function getGuideConfig(slug: string): GuideConfig | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
