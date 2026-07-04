import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DATA_DIR = path.join(process.cwd(), "public", "data");
const remote = process.argv.includes("--remote");
const BUCKET = remote
  ? (process.env.R2_BUCKET ?? "living-paris-geojson")
  : (process.env.R2_PREVIEW_BUCKET ?? "living-paris-geojson-preview");

async function main() {
  const files = (await fs.readdir(DATA_DIR)).filter(
    (f) => f.endsWith(".geojson") || f === "manifest.json"
  );

  if (!files.length) {
    console.error("No GeoJSON files found. Run `npm run fetch-data` first.");
    process.exit(1);
  }

  console.log(`Uploading ${files.length} files to R2 bucket "${BUCKET}" (${remote ? "remote" : "local"})...`);

  for (const file of files) {
    const filePath = path.join(DATA_DIR, file);
    const args = [
      "wrangler",
      "r2",
      "object",
      "put",
      `${BUCKET}/${file}`,
      `--file=${filePath}`,
      ...(remote ? ["--remote"] : []),
    ];

    const result = spawnSync("npx", args, { stdio: "inherit" });
    if (result.status !== 0) {
      console.error(`Failed to upload ${file}`);
      process.exit(1);
    }
    console.log(`  ✓ ${file}`);
  }

  console.log("\nDone. R2 bucket is ready for the Cloudflare Worker.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
