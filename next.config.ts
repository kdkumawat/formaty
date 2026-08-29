import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

/** Per-build identifier baked into the client bundle and written to
 *  `out/version.json` by `scripts/write-version.mjs` so the running app can
 *  poll for new deploys. Falls back to a timestamp when not in a git repo. */
function computeBuildId(): string {
  let sha = "nogit";
  try {
    sha = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    /* not a git checkout (CI artifact, snapshot) - keep fallback */
  }
  return `${sha}-${Date.now()}`;
}

const BUILD_ID = computeBuildId();
process.env.NEXT_PUBLIC_BUILD_ID = BUILD_ID;
// Shared file so the postbuild script (separate Node process) reads the
// exact same id - we cannot rely on env-var inheritance through Bun.
try {
  mkdirSync(join(process.cwd(), ".next"), { recursive: true });
  writeFileSync(join(process.cwd(), ".next", "formaty-build-id"), BUILD_ID, "utf8");
} catch {
  /* best effort - script falls back to its own computation if missing */
}

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["jsoncrack-react"],
  generateBuildId: () => BUILD_ID,
  env: {
    FORMATY_API_URL: process.env.FORMATY_API_URL,
    SITE_URL: process.env.SITE_URL,
    NEXT_PUBLIC_GA_MASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MASUREMENT_ID,
    NEXT_PUBLIC_BUILD_ID: BUILD_ID,
  },
  turbopack: {},
};

export default nextConfig;
