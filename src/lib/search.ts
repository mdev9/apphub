import MiniSearch from "minisearch";
import { listObjects, getObject, putJson, getJson } from "./r2";
import { parseMarkdown } from "./markdown";

export interface SearchDoc {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string;
  type: "wiki" | "article";
  path: string;
}

export async function buildSearchIndex(): Promise<SearchDoc[]> {
  const [wikiFiles, articleFiles] = await Promise.all([
    listObjects("wiki/"),
    listObjects("articles/"),
  ]);

  const docs: SearchDoc[] = [];

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

    docs.push({
      id: file.key,
      title: parsed.title,
      description: parsed.description || "",
      content: parsed.content.slice(0, 1000), // Index first 1000 chars
      tags: (parsed.tags || []).join(" "),
      type: file.type,
      path,
    });
  }

  await putJson("meta/search-index.json", docs);
  return docs;
}

export async function getSearchIndex(): Promise<SearchDoc[]> {
  const cached = await getJson<SearchDoc[]>("meta/search-index.json");
  if (cached) return cached;
  return buildSearchIndex();
}

export function createMiniSearch(docs: SearchDoc[]): MiniSearch<SearchDoc> {
  const ms = new MiniSearch<SearchDoc>({
    fields: ["title", "description", "content", "tags"],
    storeFields: ["title", "description", "type", "path"],
    searchOptions: {
      boost: { title: 3, tags: 2, description: 1.5 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  ms.addAll(docs);
  return ms;
}
