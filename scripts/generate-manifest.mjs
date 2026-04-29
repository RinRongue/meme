import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const picturesDir = path.join(root, "pictures");
const outputFile = path.join(root, "meme-manifest.json");
const imageExts = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".bmp"]);

const entries = await readdir(picturesDir, { withFileTypes: true });
const images = entries
  .filter((entry) => entry.isFile() && imageExts.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => ({
    name: entry.name,
    path: `pictures/${entry.name}`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN", { numeric: true, sensitivity: "base" }));

await writeFile(outputFile, `${JSON.stringify({ generatedAt: new Date().toISOString(), images }, null, 2)}\n`, "utf8");
console.log(`Generated ${images.length} images in ${path.relative(root, outputFile)}`);
