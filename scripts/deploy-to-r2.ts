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
  const { buildNavTree } = await import("../src/lib/nav");

  // 1. Gather local data/wiki/** first.
  const LOCAL = path.resolve(process.cwd(), "data");
  const files: string[] = [];
  (function walk(d: string) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else files.push(full);
    }
  })(path.join(LOCAL, "wiki"));

  const localMd = files.filter((f) => f.endsWith(".md")).length;
  const existing = (await listObjects("wiki/")).map((o) => o.key);
  const existingMd = existing.filter((k) => k.endsWith(".md")).length;

  // Safety: this is a destructive full rebuild. If the local mirror has far fewer
  // entries than R2, it's probably stale/incomplete — refuse so we don't nuke the
  // live base. (Use scripts/push-entries.ts for incremental updates.)
  const force = process.argv.includes("--force");
  if (!force && existingMd > 0 && localMd < existingMd * 0.8) {
    throw new Error(
      `Refusing: local mirror has ${localMd} entries but R2 has ${existingMd}. ` +
        `Local looks stale — re-pull the base, use push-entries.ts for incremental updates, or pass --force.`
    );
  }

  // 2. Delete existing wiki/ content, then re-upload.
  console.log(`Deleting ${existing.length} existing wiki/ objects on R2…`);
  for (const key of existing) await deleteObject(key);

  let uploaded = 0;
  for (const full of files) {
    const key = path.relative(LOCAL, full).split(path.sep).join("/");
    const body = fs.readFileSync(full, "utf-8");
    const ct = key.endsWith(".json") ? "application/json" : "text/markdown";
    await putObject(key, body, ct);
    uploaded++;
  }
  console.log(`Uploaded ${uploaded} wiki objects to R2.`);

  // 3. Rebuild the search index + catalog on R2, then the nav tree.
  const docs = await buildSearchIndex();
  const nav = await buildNavTree();
  console.log(`✓ Rebuilt search index (${docs.length} docs) + nav (${nav.wiki.length} topics) on R2.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
