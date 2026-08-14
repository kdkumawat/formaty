# Formaty

**Format · Convert · Compare · Utils** - a free, local-first data toolkit for JSON, XML, YAML, TOML, and CSV.

[![Website](https://img.shields.io/badge/website-formaty.dev-6d6df4)](https://formaty.dev)
[![No sign-up](https://img.shields.io/badge/no%20sign--up-true-34d399)]()
[![100% local](https://img.shields.io/badge/100%25%20local-in%20your%20browser-4f8ff7)]()
[![Next.js](https://img.shields.io/badge/Next.js-16-black)]()

Everything runs **in your browser** - no accounts, no uploads, no installs. Paste data, format/convert/compare/query it, and copy the result.

## What you can do

- **Format & validate** JSON, XML, YAML, TOML, CSV - beautify, minify, and live-validate as you type
- **Convert** between formats in one click: JSON ↔ XML, JSON ↔ YAML, JSON ↔ CSV, and more
- **Compare** documents side by side, or diff lists with SQL `IN` export
- **Query** with JSONPath and JMESPath, explore tree/graph/table views
- **Import cURL** and inspect the live API response
- **Generate** JSON Schema and typed models for TypeScript, Python, Go, Rust, Java, C#, Kotlin, Swift, SQL, Protobuf
- **18+ developer utils**: UUID, Base64, JWT decoder, SHA hashing, password generator, URL encode/parse, case conversion, regex tester, hex, color, cron, lorem, text stats and more
- **Keyboard-first**: every action reachable from the keyboard (press `?` in the app)
- **Works offline** after the first visit, and **shares exact state** via optional links

## Try it

| | |
|---|---|
| Playground | https://formaty.dev/playground |
| Tools | https://formaty.dev/json-formatter, /json-viewer, /json-diff, /json-to-typescript, /jsonpath-tester, … |
| Utils | https://formaty.dev/utils/uuid-generator, /utils/base64-encoder, /utils/jwt-decoder, … |
| Docs | https://formaty.dev/docs |

## Getting Started

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

> This project uses [Bun](https://bun.sh) as its package manager (`bun install` / `bun run`). Lockfile: `bun.lock`.

## Scripts

- `bun run dev` - development server
- `bun run build` - static export to `out/`
- `bun scripts/gen-og.mjs` - regenerate `og.png` + PNG favicons from SVG sources

## Documentation

- [Feature Guide](docs/guide.md) - detailed guide to all features
- [Launch checklist](docs/launch-checklist.md) - how to launch and distribute Formaty

## Tech Stack

- Next.js 16, React 19, Tailwind CSS v4, shadcn/ui (Radix UI)
- Monaco Editor, ReactFlow
- Web Workers for heavy processing - data never leaves the device

## License

MIT - free to use, modify, and build on. Contributions welcome.
