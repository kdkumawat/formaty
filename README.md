# Formaty

**The Developer Data Workspace** - format, convert, compare, reconcile, query, and generate code, schemas, and SQL from structured data - locally, offline, and without signup.

[![Website](https://img.shields.io/badge/website-formaty.dev-6d6df4)](https://formaty.dev)
[![No sign-up](https://img.shields.io/badge/no%20sign--up-true-34d399)]()
[![100% local](https://img.shields.io/badge/100%25%20local-in%20your%20browser-4f8ff7)]()
[![Next.js](https://img.shields.io/badge/Next.js-16-black)]()
[![GitHub repo](https://img.shields.io/badge/GitHub-kdkumawat%2Fformaty-6d6df4)](https://github.com/kdkumawat/formaty)
[![GitHub stars](https://img.shields.io/github/stars/kdkumawat/formaty?color=6d6df4)](https://github.com/kdkumawat/formaty)
[![Sponsor](https://img.shields.io/badge/sponsor-GitHub%20Sponsors-ea4aaa)](https://github.com/sponsors/kdkumawat)

Everything runs **in your browser** - no accounts, no uploads, no installs. Paste some data and Formaty can probably do what you need with it.

## What you can do

**DATA → FORMAT → INSPECT → QUERY → TRANSFORM → COMPARE → RECONCILE → GENERATE → SHARE**

- **Format & validate** JSON, XML, YAML, TOML, CSV - beautify, minify, and live-validate as you type
- **Convert** between formats in one click: JSON ↔ XML, JSON ↔ YAML, JSON ↔ TOML, JSON ↔ CSV, and more
- **Compare data, not just text**:
  - **List compare** - common / only-left / only-right / union / symmetric difference / duplicates, with SQL `IN` / `NOT IN` / `VALUES` / PostgreSQL ARRAY exports
  - **Single list** - dedupe, counts, frequency, sort, normalize, and export
  - **CSV column compare** - pick a key column, find common / missing / changed rows and duplicate IDs
  - **Document diff** - JSON, XML, YAML, TOML side-by-side or inline, optional order-insensitive array comparison
- **Database debugging** - paste two ID result sets, understand missing/extra/common/duplicate records, copy SQL
- **Query** with JSONPath and JMESPath; explore raw / tree (with `⌘F` search) / graph / table views
- **Import & execute cURL** - inspect status, headers, size, and timing; generate fetch / Axios / Python / Go code from the request
- **Generate** from data:
  - **SQL** - dialect-aware `CREATE TABLE` + `INSERT` for PostgreSQL, MySQL, SQLite
  - **Types** - TypeScript, Zod, Java, C#, Python, Pydantic, Go, Protobuf, Kotlin, Swift, Rust
  - **Schemas** - JSON Schema, OpenAPI 3.1, schema validation
  - **Tables** - Markdown & HTML table exports from any tabular view
- **File input** - drag & drop JSON / CSV / YAML / XML / TXT (or compare two files at once) - never uploaded
- **18+ developer utils**: UUID, Base64, JWT decoder, SHA hashing, password generator, URL encode/parse, case conversion, regex tester, hex, time, lorem, text stats and more
- **Keyboard-first**: every action reachable from the keyboard (press `?` in the app)
- **Share exact state** via optional links - tool, input, output, view, query, compare sides, settings; or embed a tool with `?embed=1`
- **Works offline** after the first visit; multi-tab workspace with per-tab state

## Try it

| | |
|---|---|
| Playground | https://formaty.dev/playground |
| Tools | https://formaty.dev/json-formatter, /compare-lists, /sql-in-clause-generator, /json-to-sql, /json-to-typescript, /jsonpath-tester, … (40+ SEO tool pages) |
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
- `bun run test` - unit tests
- `bun run lint` - lint
- `bun scripts/gen-og.mjs` - regenerate `og.png` + PNG favicons from SVG sources

## Documentation

- [Feature Guide](docs/guide.md) - detailed guide to all features
- [Launch checklist](docs/launch-checklist.md) - how to launch and distribute Formaty

## Tech Stack

- Next.js 16, React 19, Tailwind CSS v4, shadcn/ui (Radix UI)
- Monaco Editor, ReactFlow
- Web Workers for heavy processing - data never leaves the device

## Support

If Formaty saves you time, the best ways to help are:

- ⭐ **Star the repo** on [GitHub](https://github.com/kdkumawat/formaty) - it helps others discover the project
- 💖 **Sponsor** the project on [GitHub Sponsors](https://github.com/sponsors/kdkumawat) or [Buy Me a Coffee](https://www.buymeacoffee.com/kdkumawat)
- 🐛 **Open an issue** for bugs or feature ideas
- 🤝 **Contribute** - the codebase is MIT-licensed and pull requests are welcome

## License

MIT - free to use, modify, and build on. Contributions welcome.
