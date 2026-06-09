import { listObjects, getObject, getJson, putJson } from "./r2";
import { parseMarkdown } from "./markdown";

export interface NavItem {
  title: string;
  slug: string;
  path: string;
  children?: NavItem[];
  order?: number;
}

export interface NavTree {
  wiki: NavItem[];
  articles: NavItem[];
}

interface MetaFile {
  title: string;
  order?: number;
}

export async function buildNavTree(): Promise<NavTree> {
  const [wikiFiles, articleFiles] = await Promise.all([
    listObjects("wiki/"),
    listObjects("articles/"),
  ]);

  // Build wiki nav from directory structure
  const categories = new Map<string, { meta?: MetaFile; pages: NavItem[] }>();

  for (const file of wikiFiles) {
    const parts = file.key.split("/");
    // wiki/index.md → skip (handled as landing)
    if (parts.length === 2 && parts[1] === "index.md") continue;

    if (parts.length === 3 && parts[2] === "_meta.json") {
      const meta = await getJson<MetaFile>(file.key);
      const cat = parts[1];
      if (!categories.has(cat)) categories.set(cat, { pages: [] });
      categories.get(cat)!.meta = meta ?? undefined;
    } else if (parts.length === 3 && parts[2].endsWith(".md")) {
      const cat = parts[1];
      const slug = parts[2].replace(/\.md$/, "");
      if (!categories.has(cat)) categories.set(cat, { pages: [] });
      // Use the entry's real frontmatter title (not the kebab slug).
      const raw = await getObject(file.key);
      const title = raw
        ? parseMarkdown(raw).title
        : slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      categories.get(cat)!.pages.push({
        title,
        slug,
        path: `/library/${cat}/${slug}`,
      });
    }
  }

  const wiki: NavItem[] = [];
  for (const [cat, data] of categories) {
    wiki.push({
      title: data.meta?.title || cat.charAt(0).toUpperCase() + cat.slice(1),
      slug: cat,
      path: `/library/${cat}`,
      children: data.pages.sort((a, b) => a.title.localeCompare(b.title)),
      order: data.meta?.order,
    });
  }
  wiki.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

  // Build articles nav
  const articles: NavItem[] = articleFiles
    .filter((f) => f.key.endsWith(".md"))
    .map((f) => {
      const slug = f.key.replace("articles/", "").replace(".md", "");
      return {
        title: slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        slug,
        path: `/articles/${slug}`,
      };
    });

  const tree: NavTree = { wiki, articles };

  // Cache it
  await putJson("meta/nav-tree.json", tree);
  return tree;
}

export async function getNavTree(): Promise<NavTree> {
  const cached = await getJson<NavTree>("meta/nav-tree.json");
  if (cached) return cached;
  return buildNavTree();
}
