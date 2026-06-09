import MiniSearch from "minisearch";
import { listObjects, getObject, putJson, getJson } from "./r2";
import { parseMarkdown } from "./markdown";

export interface SearchDoc {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string;
  topics: string;
  claim: string;
  numbers: string;
  type: "wiki" | "article";
  path: string;
}

export async function buildSearchIndex(): Promise<SearchDoc[]> {
  const [wikiFiles, articleFiles] = await Promise.all([
    listObjects("wiki/"),
    listObjects("articles/"),
  ]);

  const docs: SearchDoc[] = [];
  const catalog: CatalogEntry[] = [];

  const allFiles = [
    ...wikiFiles
      .filter((f) => f.key.endsWith(".md"))
      .map((f) => ({ ...f, type: "wiki" as const })),
    ...articleFiles
      .filter((f) => f.key.endsWith(".md"))
      .map((f) => ({ ...f, type: "article" as const })),
  ];

  for (const file of allFiles) {
    const raw = await getObject(file.key);
    if (!raw) continue;
    const parsed = parseMarkdown(raw);
    const slug = file.key
      .replace(/^(wiki|articles)\//, "")
      .replace(/\.md$/, "");
    const path =
      file.type === "wiki" ? `/wiki/${slug}` : `/articles/${slug}`;

    const fm = parsed.frontmatter as Record<string, unknown>;
    const topics = Array.isArray(fm.topics) ? (fm.topics as string[]) : [];
    const numbers = Array.isArray(fm.numbers) ? (fm.numbers as string[]) : [];
    const claim = typeof fm.claim === "string" ? fm.claim : "";

    docs.push({
      id: file.key,
      title: parsed.title,
      description: parsed.description || "",
      // Entries are short; index the full body. (Guides are longer but still
      // small enough that full-text indexing is cheap and worth the recall.)
      content: parsed.content,
      tags: (parsed.tags || []).join(" "),
      topics: topics.join(" "),
      claim,
      numbers: numbers.join(" "),
      type: file.type,
      path,
    });

    // Compact catalog record (wiki only) — precomputed so /api/catalog can serve
    // a single cached file instead of reading every entry from R2 per request.
    if (file.type === "wiki") {
      catalog.push({
        title: parsed.title,
        description: parsed.description || "",
        type: typeof fm.type === "string" ? fm.type : "entry",
        topics,
        claim,
        numbers,
        confidence: typeof fm.confidence === "string" ? fm.confidence : "",
        source: typeof fm.source === "string" ? fm.source : "",
        path: `/wiki/${slug}`,
        apiPath: `/api/wiki/${slug}`,
      });
    }
  }

  await putJson("meta/search-index.json", docs);
  await putJson("meta/catalog.json", catalog);
  return docs;
}

export interface CatalogEntry {
  title: string;
  description: string;
  type: string;
  topics: string[];
  claim: string;
  numbers: string[];
  confidence: string;
  source: string;
  path: string;
  apiPath: string;
}

export async function getCatalog(): Promise<CatalogEntry[]> {
  const cached = await getJson<CatalogEntry[]>("meta/catalog.json");
  if (cached) return cached;
  await buildSearchIndex(); // builds catalog.json as a side effect
  return (await getJson<CatalogEntry[]>("meta/catalog.json")) ?? [];
}

export async function getSearchIndex(): Promise<SearchDoc[]> {
  const cached = await getJson<SearchDoc[]>("meta/search-index.json");
  if (cached) return cached;
  return buildSearchIndex();
}

// Conservative English stemmer: lowercases and strips the most common inflections
// (plurals, -ing, -ed) so "activation"/"activate", "cancellations"/"cancel",
// "convert"/"converting" collapse to a shared stem. Applied at both index and
// query time by MiniSearch. Kept deliberately light to avoid over-stemming —
// domain synonyms are handled separately in synonyms.ts / the search route.
export function stemTerm(term: string): string {
  let t = term.toLowerCase().replace(/[^a-z0-9+]/g, "");
  if (t.length <= 4) return t;
  if (t.endsWith("ization")) return t.slice(0, -7) + "ize";
  if (t.endsWith("ations")) return t.slice(0, -6) + "ate";
  if (t.endsWith("ation")) return t.slice(0, -5) + "ate";
  if (t.endsWith("ing") && t.length > 6) return t.slice(0, -3);
  if (t.endsWith("ed") && t.length > 5) return t.slice(0, -2);
  if (t.endsWith("es") && t.length > 5) return t.slice(0, -2);
  if (t.endsWith("s") && !t.endsWith("ss") && t.length > 4) return t.slice(0, -1);
  return t;
}

export function createMiniSearch(docs: SearchDoc[]): MiniSearch<SearchDoc> {
  const ms = new MiniSearch<SearchDoc>({
    fields: ["title", "claim", "numbers", "topics", "description", "content", "tags"],
    storeFields: ["title", "description", "type", "path"],
    processTerm: (term) => {
      const stemmed = stemTerm(term);
      return stemmed.length >= 2 ? stemmed : null;
    },
    searchOptions: {
      boost: { title: 3, claim: 2.5, topics: 2, tags: 2, numbers: 1.8, description: 1.5 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  ms.addAll(docs);
  return ms;
}
