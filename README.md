# formaty

**Format · Convert · Compare · Utils** — a local-first data toolkit for JSON, XML, YAML, TOML, and CSV.

## Features

- **Multi-format support**: JSON, XML, YAML, TOML, CSV, cURL — paste, import, or convert (loose JSON with single quotes accepted when possible)
- **Transform**: Format, minify, flatten, unflatten, validate, schema, type generation
- **Compare**: Document text/JSON diff and list/set compare (SQL `IN` export)
- **Utils**: UUID (copy per id), Base64, JWT, SHA hash, time, URL, case, hex, number bases, JSON escape, HTML entities, password, text stats — each tool has sample input and independent state
- **Views**: Raw, tree, graph, JSONPath/JMESPath query, table (array-of-objects sample included)
- **Type generation**: TypeScript, Zod, Java, C#, Python, Pydantic, Go, Protobuf, Kotlin, Swift, Rust, SQL
- **Local-first**: Processing in your browser; Share is the only optional upload (with confirm)
- **Share & export**: Share link, copy, copy-as encodings, download
- **Command palette**: `Ctrl+K` / `⌘K` for every action

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

- [Feature Guide](docs/guide.md) — detailed guide to all features
- [Live app](https://formaty.pages.dev)

## Tech Stack

- Next.js 16, React 19, Tailwind CSS v4, shadcn/ui (Radix UI)
- Monaco Editor, ReactFlow, jsoncrack
