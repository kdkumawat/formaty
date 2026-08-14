// Regenerates public/og.png and PNG favicons from the source SVGs.
// Usage: bun scripts/gen-og.mjs
import sharp from "sharp";

async function convert(src, dest, width, height) {
  await sharp(`public/${src}`)
    .resize(width, height)
    .png()
    .toFile(`public/${dest}`);
  console.log(`generated ${dest}`);
}

await convert("og.svg", "og.png", 1200, 630);
await convert("../src/app/icon.svg", "icon-192.png", 192, 192);
await convert("../src/app/icon.svg", "icon-512.png", 512, 512);
await convert("../src/app/icon.svg", "apple-touch-icon.png", 180, 180);
