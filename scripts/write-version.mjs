// Emits out/version.json mirroring the build id baked into the client bundle.
// Runs after `next build` so the static export ships a version the running
// app can fetch and compare. Reads the same id next.config.ts wrote to
// `.next/formaty-build-id`; falls back to a fresh timestamp if missing so
// the script is safe to run in isolation.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

let buildId = "";
try {
  buildId = readFileSync(join(process.cwd(), ".next", "formaty-build-id"), "utf8").trim();
} catch {
  /* file missing - run in isolation, compute fresh */
}
if (!buildId) buildId = `${Date.now()}`;

const version = process.env.npm_package_version ?? "0.0.0";
const outDir = join(process.cwd(), "out");

if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

writeFileSync(
  join(outDir, "version.json"),
  JSON.stringify({ id: buildId, v: version, t: Date.now() }),
  "utf8",
);
console.log(`wrote out/version.json (id=${buildId})`);
