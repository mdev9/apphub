import { buildSearchIndex } from "../src/lib/search";
import { buildNavTree } from "../src/lib/nav";

(async () => {
  const docs = await buildSearchIndex();
  const nav = await buildNavTree();
  console.log(`✓ index rebuilt: ${docs.length} docs; nav: ${nav.wiki.length} topics`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
