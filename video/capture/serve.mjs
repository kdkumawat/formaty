// Static server for the app's `out/` export (same layout rules as scripts/gen-og.mjs).
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(fileURLToPath(new URL("../../out", import.meta.url)));

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".ttf": "font/ttf",
  ".wasm": "application/wasm",
};

export async function serveOut() {
  if (!existsSync(join(OUT, "index.html"))) {
    throw new Error("out/ not found — run `bun run build` in the repo root first.");
  }
  const server = createServer((req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (path.endsWith("/")) path += "index.html";
      let file = normalize(join(OUT, path));
      if (!file.startsWith(OUT)) throw new Error("traversal");
      if (!existsSync(file) || !extname(file)) {
        const withHtml = `${file}.html`;
        const withIndex = join(file, "index.html");
        if (existsSync(withHtml)) file = withHtml;
        else if (existsSync(withIndex)) file = withIndex;
      }
      if (!existsSync(file)) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
      res.end(readFileSync(file));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, close: () => new Promise((r) => server.close(r)) };
}
