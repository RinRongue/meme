import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const imageExts = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg", ".bmp"]);

const targetArg = process.argv[2] ?? "pictures";
const targetDir = path.resolve(root, targetArg);

async function walkImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walkImages(fullPath));
      continue;
    }

    if (entry.isFile() && imageExts.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);

    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

const images = await walkImages(targetDir);
const byHash = new Map();

for (const imagePath of images) {
  const hash = await sha256File(imagePath);
  const relativePath = path.relative(root, imagePath).replaceAll(path.sep, "/");
  const matches = byHash.get(hash) ?? [];

  matches.push(relativePath);
  byHash.set(hash, matches);
}

const duplicateGroups = [...byHash.entries()]
  .filter(([, files]) => files.length > 1)
  .sort(([, aFiles], [, bFiles]) => aFiles[0].localeCompare(bFiles[0], "zh-Hans-CN", { numeric: true, sensitivity: "base" }));

if (duplicateGroups.length === 0) {
  console.log(`No duplicate images found in ${path.relative(root, targetDir) || "."}. Checked ${images.length} image(s).`);
  process.exit(0);
}

console.log(`Found ${duplicateGroups.length} duplicate group(s) in ${path.relative(root, targetDir) || "."}:`);

for (const [hash, files] of duplicateGroups) {
  console.log("");
  console.log(`SHA-256: ${hash}`);

  for (const file of files.sort((a, b) => a.localeCompare(b, "zh-Hans-CN", { numeric: true, sensitivity: "base" }))) {
    console.log(`- ${file}`);
  }
}
