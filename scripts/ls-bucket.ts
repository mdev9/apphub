/**
 * Inspect what's in the live R2 bucket — a debugging helper.
 *
 *   npx tsx scripts/ls-bucket.ts                # summary: counts by prefix + wiki entries per topic
 *   npx tsx scripts/ls-bucket.ts --keys         # also print every object key
 *   npx tsx scripts/ls-bucket.ts wiki/paywall/hard-paywall-beats-freemium-5x.md   # dump one object's content
 *
 * Loads .env.local so it targets the live R2 bucket (not local ./data).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  if (!process.env.R2_ENDPOINT) throw new Error("R2_ENDPOINT not set (would read local ./data).");
  const { listObjects, getObject } = await import("../src/lib/r2");

  const arg = process.argv[2];

  // Dump a single object's content.
  if (arg && arg !== "--keys") {
    const body = await getObject(arg);
    console.log(body ?? `(no object at "${arg}")`);
    return;
  }

  const all = await listObjects("");
  console.log(`\n${all.length} objects in bucket "${process.env.R2_BUCKET_NAME || "apphub-content"}"\n`);

  // Count by top-level prefix.
  const byPrefix = new Map<string, number>();
  for (const o of all) {
    const top = o.key.split("/")[0];
    byPrefix.set(top, (byPrefix.get(top) ?? 0) + 1);
  }
  console.log("by prefix:");
  for (const [p, n] of [...byPrefix].sort()) console.log(`  ${p}/  ${n}`);

  // Wiki entries per topic.
  const byTopic = new Map<string, number>();
  for (const o of all) {
    const parts = o.key.split("/");
    if (parts[0] === "wiki" && parts.length === 3 && parts[2].endsWith(".md")) {
      byTopic.set(parts[1], (byTopic.get(parts[1]) ?? 0) + 1);
    }
  }
  const entryTotal = [...byTopic.values()].reduce((a, b) => a + b, 0);
  console.log(`\nwiki entries by topic (${entryTotal} total, ${byTopic.size} topics):`);
  for (const [t, n] of [...byTopic].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${t}`);

  if (arg === "--keys") {
    console.log("\nall keys:");
    for (const o of all.map((x) => x.key).sort()) console.log(`  ${o}`);
  } else {
    console.log(`\n(run with --keys to list every object, or pass a key to dump its content)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
