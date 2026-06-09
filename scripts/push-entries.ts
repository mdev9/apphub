/**
 * Incremental, safe upsert of entries to the LIVE R2 bucket.
 *
 * Unlike deploy-to-r2.ts (which deletes wiki/ and re-uploads the whole local
 * mirror — fine for a full rebuild), this ONLY adds/overwrites the entries you
 * staged in `data/_incoming/` and never deletes anything. It then rebuilds the
 * search index + catalog + nav FROM R2, so the derived JSON reflects the full
 * live base regardless of what's in the local mirror.
 *
 * Use for the weekly App Society sync (add new + update existing entries):
 *   1. write new/updated entries to  data/_incoming/<topic>/<id>.md
 *   2. npx tsx scripts/push-entries.ts
 *
 * Staged files are mirrored into data/wiki/ and the staging dir is cleared.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
  if (!process.env.R2_ENDPOINT) throw new Error("R2_ENDPOINT not set — refusing to run.");
  const { putObject } = await import("../src/lib/r2");
  const { buildSearchIndex } = await import("../src/lib/search");
  const { buildNavTree } = await import("../src/lib/nav");

  const ROOT = process.cwd();
  const INCOMING = path.join(ROOT, "data", "_incoming");
  if (!fs.existsSync(INCOMING)) {
    console.log("No data/_incoming/ — nothing to push.");
    return;
  }

  // Collect staged .md files (data/_incoming/<topic>/<id>.md).
  const files: string[] = [];
  (function walk(d: string) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith(".md")) files.push(full);
    }
  })(INCOMING);

  if (files.length === 0) {
    console.log("data/_incoming/ has no .md files — nothing to push.");
    return;
  }

  // Upsert each to R2 (wiki/<rel>) and mirror into data/wiki/.
  for (const full of files) {
    const rel = path.relative(INCOMING, full).split(path.sep).join("/"); // <topic>/<id>.md
    const key = `wiki/${rel}`;
    const body = fs.readFileSync(full, "utf-8");
    await putObject(key, body, "text/markdown");

    const mirror = path.join(ROOT, "data", "wiki", rel);
    fs.mkdirSync(path.dirname(mirror), { recursive: true });
    fs.writeFileSync(mirror, body, "utf-8");
    console.log(`  upsert ${key}`);
  }

  // Rebuild derived JSON FROM R2 (sees the full live base, not just the mirror).
  const docs = await buildSearchIndex();
  const nav = await buildNavTree();
  console.log(`\n✓ upserted ${files.length} entries; rebuilt index (${docs.length} docs) + nav (${nav.wiki.length} topics) on R2.`);

  // Clear staging.
  fs.rmSync(INCOMING, { recursive: true, force: true });
  console.log("cleared data/_incoming/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
