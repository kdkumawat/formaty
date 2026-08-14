import type { UtilTab } from "@/lib/utils/devtools";
import { TOOL_PAGES } from "@/lib/seo";

export interface UtilPageConfig {
  /** URL slug, e.g. "base64-encoder". */
  route: string;
  /** Utils workspace tab opened by the playground deep link. */
  util: UtilTab;
  title: string;
  description: string;
  h1: string;
  content: string;
  inputExample: string;
  outputExample: string;
  useCases: string[];
  /** Routes into either TOOL_PAGES or UTIL_PAGES. */
  relatedTools: string[];
}

export const UTIL_PAGES: Record<string, UtilPageConfig> = {
  "uuid-generator": {
    route: "uuid-generator",
    util: "uuid",
    title: "UUID Generator | Formaty",
    description:
      "Generate UUIDs instantly - v4, v1, v7 and v5. Free online UUID generator with batch copy. Runs locally in your browser, no upload.",
    h1: "UUID Generator",
    content: `UUIDs are the standard for database keys, trace IDs, and API identifiers. Hand-rolling them is error-prone and slow. A UUID generator produces standards-compliant identifiers with one click.

Formaty generates v4 (random), v1 (time-based), v7 (timestamp + random, RFC 9562) and v5 (SHA-1 of namespace + name). Generate one or a batch, then copy each card individually - perfect for seeding test fixtures or filling database rows.

Use cases: seeding test data, generating trace IDs, creating idempotency keys, and producing stable namespace-based identifiers. Everything runs locally in your browser.`,
    inputExample: "v4 · v1 · v7 · v5",
    outputExample: "a1b2c3d4-5678-4e90-ab12-cdef34567890",
    useCases: [
      "Seed test fixtures and database rows",
      "Generate trace and correlation IDs",
      "Create idempotency keys for APIs",
      "Stable v5 UUIDs from namespaces",
    ],
    relatedTools: ["base64-encoder", "password-generator", "sha-hash-generator", "text-stats"],
  },
  "base64-encoder": {
    route: "base64-encoder",
    util: "base64",
    title: "Base64 Encoder & Decoder | Formaty",
    description:
      "Encode or decode Base64 instantly. Free online Base64 encoder and decoder with Unicode support. Runs locally, nothing is uploaded.",
    h1: "Base64 Encoder & Decoder",
    content: `Base64 encoding is everywhere: API auth headers, JWT segments, data URIs, and config secrets. Encoding or decoding by hand is tedious and easy to get wrong with Unicode.

Paste text to encode it to Base64, or paste Base64 to decode it back. Unicode-safe encoding handles emoji and non-Latin text correctly. Decoding validates input and reports errors clearly.

Use cases: decoding JWT segments, preparing Authorization headers, inspecting data URIs, and converting config values. All processing happens in your browser.`,
    inputExample: "Hello, Formaty!",
    outputExample: "SGVsbG8sIEZvcm1hdHkh",
    useCases: [
      "Decode JWT header and payload segments",
      "Build Basic auth headers",
      "Inspect data URIs and inline images",
      "Encode config values for transfer",
    ],
    relatedTools: ["jwt-decoder", "url-encoder-decoder", "hex-converter", "html-encoder"],
  },
  "jwt-decoder": {
    route: "jwt-decoder",
    util: "jwt",
    title: "JWT Decoder | Formaty",
    description:
      "Decode JWTs instantly. Free online JWT decoder that parses header and payload as readable JSON. Fully local - tokens never leave your browser.",
    h1: "JWT Decoder",
    content: `JWTs carry signed claims in a compact, opaque string. Debugging them means base64-decoding segments and pretty-printing JSON - exactly what this tool automates.

Paste any JWT and get the header and payload decoded as formatted JSON, plus the raw signature. Great for inspecting access tokens, verifying claim shapes, and understanding what an identity provider actually sent.

Use cases: debugging auth flows, inspecting access and refresh tokens, checking claim names, and auditing token expiry. Tokens are processed locally and never uploaded.`,
    inputExample: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkZvcm1hdHkiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    outputExample: '{\n  "alg": "HS256",\n  "typ": "JWT"\n}\n{\n  "sub": "1234567890",\n  "name": "Formaty",\n  "iat": 1516239022\n}',
    useCases: [
      "Debug OAuth and JWT auth flows",
      "Inspect access and refresh tokens",
      "Verify claim names and expiry",
      "Understand IdP-issued tokens",
    ],
    relatedTools: ["base64-encoder", "unix-timestamp-converter", "sha-hash-generator", "url-parser"],
  },
  "sha-hash-generator": {
    route: "sha-hash-generator",
    util: "hash",
    title: "SHA-256 & SHA-1 Hash Generator | Formaty",
    description:
      "Hash text instantly with SHA-256 or SHA-1. Free online hash generator using WebCrypto. Runs in your browser - text never leaves your device.",
    h1: "SHA-256 & SHA-1 Hash Generator",
    content: `Hashing is the backbone of integrity checks, password verification, and content addressing. This tool computes SHA-256 and SHA-1 digests from any text using the browser's native WebCrypto API.

Paste text and get the hex digest instantly. Useful for verifying downloads, checking config consistency, and understanding how content-addressed systems derive their keys.

Use cases: verifying checksums, fingerprinting payloads, comparing config versions, and teaching or debugging hash-based systems. Cryptographic operations run entirely on-device.`,
    inputExample: "formaty local-first toolkit",
    outputExample: "SHA-256 hex digest (64 chars)",
    useCases: [
      "Verify download checksums",
      "Fingerprint API payloads",
      "Compare config versions",
      "Debug content-addressed systems",
    ],
    relatedTools: ["uuid-generator", "base64-encoder", "password-generator", "json-string-escape"],
  },
  "password-generator": {
    route: "password-generator",
    util: "password",
    title: "Password Generator | Formaty",
    description:
      "Generate strong random passwords instantly. Free password generator with length and character-set controls. Created locally in your browser.",
    h1: "Password Generator",
    content: `Weak passwords are the most common security hole. A strong password generator creates high-entropy credentials with the exact mix of character sets you need.

Choose length (4-128) and toggle lowercase, uppercase, digits, and symbols. Generate batches and copy cards individually. Entropy is scored so you know how strong each password is before you use it.

Use cases: creating test credentials, seeding user fixtures, generating API keys, and replacing reused passwords. Generation happens locally - nothing is sent anywhere.`,
    inputExample: "Length 16 · Lower + Upper + Digits + Symbols",
    outputExample: "K9#mQ2!vL8@pZ4$xW",
    useCases: [
      "Create strong account credentials",
      "Generate test and staging passwords",
      "Produce API keys and secrets",
      "Replace weak reused passwords",
    ],
    relatedTools: ["uuid-generator", "lorem-ipsum-generator", "sha-hash-generator", "base64-encoder"],
  },
  "url-encoder-decoder": {
    route: "url-encoder-decoder",
    util: "url",
    title: "URL Encoder / Decoder | Formaty",
    description:
      "Encode or decode URL components instantly. Free online URL percent-encoder and decoder. Fully local, no data leaves your browser.",
    h1: "URL Encoder / Decoder",
    content: `URLs can only contain a safe character set; everything else must be percent-encoded. Building query strings or parsing encoded values by hand is fiddly.

Paste text to percent-encode it, or paste an encoded string to decode it back. Handles spaces, Unicode, and reserved characters correctly, including plus-sign decoding.

Use cases: building query strings, decoding API responses, preparing redirect URLs, and debugging encoded form data. Runs entirely in your browser.`,
    inputExample: "https://formaty.dev/playground?q=hello world&x=1",
    outputExample: "https%3A%2F%2Fformaty.dev%2Fplayground%3Fq%3Dhello%20world%26x%3D1",
    useCases: [
      "Build query strings safely",
      "Decode API and form responses",
      "Prepare redirect and share URLs",
      "Debug percent-encoded data",
    ],
    relatedTools: ["url-parser", "base64-encoder", "json-string-escape", "html-encoder"],
  },
  "text-case-converter": {
    route: "text-case-converter",
    util: "case",
    title: "Text Case Converter | Formaty",
    description:
      "Convert text case instantly - camelCase, PascalCase, snake_case, kebab-case, and more. Free online case converter, runs locally.",
    h1: "Text Case Converter",
    content: `Naming conventions differ across languages and codebases: camelCase in JavaScript, snake_case in Python, kebab-case in URLs. Converting by hand is slow and inconsistent.

Paste any text and convert to camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, Title Case, slug, upper, lower, reverse, or trimmed. The splitter handles camelCase and mixed separators correctly.

Use cases: renaming variables across languages, generating file slugs, normalizing database column names, and cleaning imports or datasets. All conversion is local.`,
    inputExample: "hello_world formatyAPI",
    outputExample: "camelCase: helloWorldFormatyApi · snake_case: hello_world_formaty_api",
    useCases: [
      "Convert variables between languages",
      "Generate URL and file slugs",
      "Normalize column and field names",
      "Clean up mixed-case datasets",
    ],
    relatedTools: ["text-stats", "json-string-escape", "lorem-ipsum-generator", "regex-tester"],
  },
  "regex-tester": {
    route: "regex-tester",
    util: "regex",
    title: "Regex Tester | Formaty",
    description:
      "Test regular expressions live. Free online regex tester with match highlighting and group capture. Runs in your browser.",
    h1: "Regex Tester",
    content: `Regular expressions are powerful but hard to get right the first time. A live tester shows every match, group, and index so you can iterate quickly.

Write a pattern, choose flags, paste test text, and see matches listed with capture groups. Great for validating input formats, extracting fields, and learning regex behavior.

Use cases: validating email and phone formats, extracting IDs from logs, building search patterns, and debugging group captures. Everything runs locally.`,
    inputExample: "Pattern: \\bquick\\b · Text: The quick brown fox. The fox is quick.",
    outputExample: "2 matches · 'quick' at index 4 and index 31",
    useCases: [
      "Validate input formats",
      "Extract fields from logs",
      "Build and test search patterns",
      "Debug capture groups",
    ],
    relatedTools: ["text-case-converter", "text-stats", "json-string-escape", "html-encoder"],
  },
  "json-string-escape": {
    route: "json-string-escape",
    util: "escape",
    title: "JSON String Escape / Unescape | Formaty",
    description:
      "Escape or unescape JSON strings instantly. Free online JSON string escape tool with newlines, quotes, and tabs. Runs locally.",
    h1: "JSON String Escape / Unescape",
    content: `Embedding text inside JSON strings requires escaping quotes, newlines, and control characters. Doing it by hand produces bugs and invalid JSON.

Paste text to escape it into a JSON string literal, or paste an escaped string to unescape it back. Perfect for generating JSON test fixtures, embedding snippets, and debugging serialized data.

Use cases: building JSON fixtures, embedding multi-line text, debugging serialized payloads, and preparing strings for logs. Processing is entirely client-side.`,
    inputExample: 'Line 1\nLine 2\t"quoted"',
    outputExample: '"Line 1\\nLine 2\\t\\"quoted\\""',
    useCases: [
      "Build JSON test fixtures",
      "Embed multi-line text in JSON",
      "Debug serialized payloads",
      "Prepare strings for logs",
    ],
    relatedTools: ["base64-encoder", "html-encoder", "text-case-converter", "text-stats"],
  },
  "html-encoder": {
    route: "html-encoder",
    util: "html",
    title: "HTML Encoder / Decoder | Formaty",
    description:
      "Encode or decode HTML entities instantly. Free online HTML entity encoder and decoder. Fully local, nothing uploaded.",
    h1: "HTML Encoder / Decoder",
    content: `Displaying user content safely in HTML requires encoding <, >, &, quotes, and apostrophes as entities. This tool does it in one click.

Paste text to encode it for safe HTML display, or paste entity-encoded text to decode it back to readable characters. Handy for escaping template output and inspecting markup.

Use cases: escaping user-generated content, building email templates, debugging entity-encoded feeds, and preparing markup for docs. All processing is local.`,
    inputExample: '<div class="x">A & B</div>',
    outputExample: "&lt;div class=&quot;x&quot;&gt;A &amp; B&lt;/div&gt;",
    useCases: [
      "Escape user-generated content",
      "Build email and template markup",
      "Debug entity-encoded feeds",
      "Prepare markup for documentation",
    ],
    relatedTools: ["json-string-escape", "base64-encoder", "url-encoder-decoder", "regex-tester"],
  },
  "unix-timestamp-converter": {
    route: "unix-timestamp-converter",
    util: "time",
    title: "Unix Timestamp Converter | Formaty",
    description:
      "Convert Unix timestamps to dates and back instantly. Free online timestamp converter for seconds and milliseconds. Runs locally.",
    h1: "Unix Timestamp Converter",
    content: `Unix timestamps power logs, APIs, and databases - but reading 1710000000 as a human date is painful. Convert it and reverse it in one place.

Paste a Unix timestamp (seconds or milliseconds, auto-detected) to get the ISO date, or paste an ISO date to get both seconds and milliseconds. Includes live "now" values for quick reference.

Use cases: reading API and log timestamps, debugging expiry values, scheduling tests, and comparing timezones. Runs entirely in your browser.`,
    inputExample: "1710000000",
    outputExample: "2024-03-09T16:00:00.000Z (UTC)",
    useCases: [
      "Read API and log timestamps",
      "Debug token expiry values",
      "Convert dates for scripting",
      "Normalize timezone data",
    ],
    relatedTools: ["jwt-decoder", "cron-expression-explainer", "text-stats", "url-parser"],
  },
  "hex-converter": {
    route: "hex-converter",
    util: "hex",
    title: "Hex Encoder / Decoder | Formaty",
    description:
      "Encode text to hex or decode hex to text instantly. Free online hexadecimal converter with 0x prefix support. Runs locally.",
    h1: "Hex Encoder / Decoder",
    content: `Hexadecimal is used for hashes, memory dumps, color codes, and low-level formats. Converting text to hex or back is a common scripting chore.

Paste text to get its hex representation, or paste hex (with or without 0x prefix and whitespace) to decode it back. Validates input and reports malformed hex clearly.

Use cases: inspecting binary data, building low-level test fixtures, working with color and device codes, and debugging protocol payloads. Processing is local.`,
    inputExample: "Formaty",
    outputExample: "466f726d617479",
    useCases: [
      "Inspect binary and protocol data",
      "Build low-level test fixtures",
      "Work with device and color codes",
      "Debug encoded payloads",
    ],
    relatedTools: ["base64-encoder", "number-base-converter", "color-converter", "sha-hash-generator"],
  },
  "number-base-converter": {
    route: "number-base-converter",
    util: "number",
    title: "Number Base Converter | Formaty",
    description:
      "Convert between decimal, hex, binary, and octal instantly. Free online number base converter with prefix support. Runs locally.",
    h1: "Number Base Converter",
    content: `Binary, octal, decimal, and hex all appear in configs, masks, and low-level code. Converting between them by hand invites mistakes.

Enter any integer - plain, or prefixed with 0x (hex), 0b (binary), or 0o (octal) - and get all four representations at once.

Use cases: decoding config masks, reading network and permission values, writing firmware constants, and checking binary math. Everything runs in your browser.`,
    inputExample: "255 (or 0xff, 0b11111111)",
    outputExample: "decimal: 255 · hex: 0xff · binary: 0b11111111 · octal: 0o377",
    useCases: [
      "Decode config and permission masks",
      "Read network and low-level values",
      "Write firmware constants",
      "Double-check binary math",
    ],
    relatedTools: ["hex-converter", "color-converter", "text-stats", "regex-tester"],
  },
  "url-parser": {
    route: "url-parser",
    util: "urlparse",
    title: "URL Parser | Formaty",
    description:
      "Parse any URL into protocol, host, path, query parameters, and more. Free online URL parser. Runs locally in your browser.",
    h1: "URL Parser",
    content: `Debugging a URL means splitting it into protocol, host, port, path, query, and hash - and then decoding each query parameter. This tool does all of it at once.

Paste any URL and get a clean breakdown: protocol, username, password, hostname, port, pathname, search, hash, and every query parameter as key-value pairs.

Use cases: debugging redirects, inspecting API call URLs, parsing OAuth callback URLs, and documenting link structures. Parsing happens entirely on-device.`,
    inputExample: "https://user:pass@formaty.dev:443/playground?tool=json&tab=2#section",
    outputExample: "protocol https · hostname formaty.dev · path /playground · params: tool=json, tab=2",
    useCases: [
      "Debug redirects and callbacks",
      "Inspect API request URLs",
      "Parse OAuth callback URLs",
      "Document link structures",
    ],
    relatedTools: ["url-encoder-decoder", "jwt-decoder", "unix-timestamp-converter", "regex-tester"],
  },
  "color-converter": {
    route: "color-converter",
    util: "color",
    title: "Color Converter | Formaty",
    description:
      "Convert between HEX, RGB, HSL, and CMYK instantly. Free online color converter with CSS color name support. Runs locally.",
    h1: "Color Converter",
    content: `Colors live in many notations: #6d6df4 hex in code, rgb() in CSS, hsl() in design tools, cmyk() in print. Converting between them by hand is tedious.

Paste any color - hex with 3, 6, or 8 digits, rgb()/rgba(), hsl()/hsla(), cmyk(), or a CSS color name - and get every representation plus a live preview swatch.

Use cases: porting design tokens to code, matching print colors to screen, building theme palettes, and debugging CSS values. All conversion is local.`,
    inputExample: "#6d6df4",
    outputExample: "rgb(109, 109, 244) · hsl(240 90% 69%) · cmyk(...) · preview swatch",
    useCases: [
      "Port design tokens to code",
      "Match print colors to screen",
      "Build theme palettes",
      "Debug CSS color values",
    ],
    relatedTools: ["hex-converter", "number-base-converter", "text-case-converter", "lorem-ipsum-generator"],
  },
  "cron-expression-explainer": {
    route: "cron-expression-explainer",
    util: "cron",
    title: "Cron Expression Explainer | Formaty",
    description:
      "Decode cron expressions into plain English instantly. Free online cron explainer for 5 and 6 field expressions. Runs locally.",
    h1: "Cron Expression Explainer",
    content: `Cron expressions like */15 * * * * control scheduled jobs everywhere - CI pipelines, backups, cron daemons. Reading them correctly matters.

Paste a 5 or 6 field cron expression and get a plain-English description of exactly when it runs: every minute, on day 15 of the month, at 03:00, and so on.

Use cases: reviewing CI and backup schedules, documenting cron jobs, teaching cron syntax, and validating expressions before deployment. Parsing is local.`,
    inputExample: "*/15 * * * *",
    outputExample: "Runs every 15 minutes.",
    useCases: [
      "Review CI and backup schedules",
      "Document cron jobs for teams",
      "Validate expressions pre-deploy",
      "Teach and learn cron syntax",
    ],
    relatedTools: ["unix-timestamp-converter", "text-stats", "text-case-converter", "regex-tester"],
  },
  "lorem-ipsum-generator": {
    route: "lorem-ipsum-generator",
    util: "lorem",
    title: "Lorem Ipsum Generator | Formaty",
    description:
      "Generate lorem ipsum placeholder text instantly - words, sentences, or paragraphs. Free online dummy text generator. Runs locally.",
    h1: "Lorem Ipsum Generator",
    content: `Placeholder text is part of every design and mockup. Generating it by hand - or pasting from random websites - wastes time.

Generate exactly the number of words, sentences, or paragraphs you need with one click. Also generates random lines of alphanumeric, hex, or numeric characters for fixture data.

Use cases: filling design mockups, seeding test content, generating dummy log lines, and building demo data. Generation happens in your browser.`,
    inputExample: "Count 3 · Paragraphs",
    outputExample: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    useCases: [
      "Fill design mockups",
      "Seed test content",
      "Generate dummy log lines",
      "Build demo datasets",
    ],
    relatedTools: ["text-stats", "password-generator", "uuid-generator", "text-case-converter"],
  },
  "text-stats": {
    route: "text-stats",
    util: "stats",
    title: "Text Stats | Formaty",
    description:
      "Count lines, words, characters, and bytes instantly. Free online text statistics tool with whitespace-excluded counts. Runs locally.",
    h1: "Text Stats",
    content: `Knowing the size and shape of text matters for API limits, log budgets, and content requirements. Counting manually is slow and error-prone.

Paste any text and get lines, words, characters, characters without spaces, and exact byte size - all updated as you type.

Use cases: checking API rate and size limits, estimating log volume, meeting content length requirements, and auditing payload sizes. Counting is local.`,
    inputExample: "Formaty is a local-first data toolkit.\nFormat · Convert · Compare · Utils",
    outputExample: "lines: 2 · words: 12 · characters: 65 · bytes: 65",
    useCases: [
      "Check API size limits",
      "Estimate log and storage volume",
      "Meet content length requirements",
      "Audit payload sizes",
    ],
    relatedTools: ["text-case-converter", "regex-tester", "lorem-ipsum-generator", "json-string-escape"],
  },
};

export const UTIL_ROUTES: string[] = Object.keys(UTIL_PAGES);

export function getUtilConfig(route: string): UtilPageConfig | undefined {
  return UTIL_PAGES[route];
}

/** Resolve any page route (tool or util) to a display config, for related links. */
export function getPageConfigByRoute(route: string): { h1: string } | undefined {
  if (route in TOOL_PAGES) return TOOL_PAGES[route as keyof typeof TOOL_PAGES];
  if (route in UTIL_PAGES) return UTIL_PAGES[route];
  return undefined;
}
