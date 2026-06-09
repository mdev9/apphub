import { buildSearchIndex } from "../src/lib/search";
buildSearchIndex().then((d) => console.log(`✓ index rebuilt: ${d.length} docs`)).catch((e) => { console.error(e); process.exit(1); });
