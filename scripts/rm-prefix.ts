/**
 * Delete every object under a prefix in the live R2 bucket. Debug/cleanup tool.
 *
 *   npx tsx scripts/rm-prefix.ts translations/      # preview (dry run)
 *   npx tsx scripts/rm-prefix.ts translations/ --yes # actually delete
 *
 * Refuses the dangerous bare prefixes "wiki/" and "" to avoid nuking content.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const prefix = process.argv[2];
  const confirm = process.argv.includes("--yes");
  if (!prefix) throw new Error("usage: rm-prefix.ts <prefix> [--yes]");
  if (prefix === "" || prefix === "wiki/" || prefix === "/")
    throw new Error(`refusing to delete protected prefix "${prefix}"`);
  if (!process.env.R2_ENDPOINT) throw new Error("R2_ENDPOINT not set.");

  const { listObjects, deleteObject } = await import("../src/lib/r2");
  const keys = (await listObjects(prefix)).map((o) => o.key);
  console.log(`${keys.length} objects under "${prefix}":`);
  for (const k of keys) console.log(`  ${k}`);

  if (!confirm) {
    console.log(`\n(dry run — re-run with --yes to delete)`);
    return;
  }
  for (const k of keys) await deleteObject(k);
  console.log(`\n✓ deleted ${keys.length} objects.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
