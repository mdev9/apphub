/**
 * Deploy the local data/wiki/** content to the LIVE Cloudflare R2 bucket and
 * rebuild the search index there.
 *
 * Loads .env.local (so R2_* are set → storage targets R2, NOT local ./data).
 * Steps:
 *   1. List existing `wiki/` keys in R2, delete them (clean slate — removes the
 *      old seed pages, the duplicate SOSA page, the placeholder, etc.).
 *   2. Upload every local data/wiki/** file (entries, guides, _meta.json).
 *   3. Rebuild meta/search-index.json on R2 via buildSearchIndex().
 *
 * Does NOT touch `articles/` or unrelated keys.
 *
 *   npx tsx scripts/deploy-to-r2.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
  if (!process.env.R2_ENDPOINT) {
    throw new Error("R2_ENDPOINT not set — refusing to run (would write to local ./data, not R2).");
  }
  // Import AFTER env is loaded so r2.ts initializes in R2 mode.
  const { listObjects, putObject, deleteObject } = await import("../src/lib/r2");
  const { buildSearchIndex } = await import("../src/lib/search");

  // 1. Delete existing wiki/ content on R2.
  const existing = (await listObjects("wiki/")).map((o) => o.key);
  console.log(`Deleting ${existing.length} existing wiki/ objects on R2…`);
  for (const key of existing) await deleteObject(key);

  // 2. Upload local data/wiki/** .
  const LOCAL = path.resolve(process.cwd(), "data");
  const files: string[] = [];
  (function walk(d: string) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else files.push(full);
    }
  })(path.join(LOCAL, "wiki"));

  let uploaded = 0;
  for (const full of files) {
    const key = path.relative(LOCAL, full).split(path.sep).join("/");
    const body = fs.readFileSync(full, "utf-8");
    const ct = key.endsWith(".json") ? "application/json" : "text/markdown";
    await putObject(key, body, ct);
    uploaded++;
  }
  console.log(`Uploaded ${uploaded} wiki objects to R2.`);

  // 3. Rebuild the search index on R2.
  const docs = await buildSearchIndex();
  console.log(`✓ Rebuilt search index on R2: ${docs.length} docs.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
