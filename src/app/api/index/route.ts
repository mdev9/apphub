import { NextResponse } from "next/server";
import { listObjects, getObject, getJson } from "@/lib/r2";
import { parseMarkdown } from "@/lib/markdown";
import { type ArticlesIndex } from "@/lib/popularity";

export async function GET() {
  const [wikiFiles, articleFiles, articlesIndex] = await Promise.all([
    listObjects("wiki/"),
    listObjects("articles/"),
    getJson<ArticlesIndex>("meta/articles-index.json"),
  ]);

  const wiki: {
    path: string;
    title: string;
    description?: string;
    tags?: string[];
    category: string;
    apiPath: string;
  }[] = [];

  for (const file of wikiFiles) {
    if (!file.key.endsWith(".md") || file.key === "wiki/index.md") continue;
    const raw = await getObject(file.key);
    if (!raw) continue;
    const parsed = parseMarkdown(raw);
    const parts = file.key.replace(/\.md$/, "").split("/");
    const category = parts[1] || "";
    const slug = parts.slice(1).join("/");
    wiki.push({
      path: file.key,
      title: parsed.title,
      description: parsed.description,
      tags: parsed.tags,
      category,
      apiPath: `/api/wiki/${slug}`,
    });
  }

  const articles: {
    slug: string;
    title: string;
    description?: string;
    tags: string[];
    aiRating: number;
    popularityScore: number;
    createdAt: string;
    apiPath: string;
  }[] = [];

  const index = articlesIndex ?? {};
  for (const [slug, meta] of Object.entries(index)) {
    articles.push({
      slug,
      title: meta.title,
      description: meta.description,
      tags: meta.tags,
      aiRating: meta.aiRating,
      popularityScore: meta.popularityScore,
      createdAt: meta.createdAt,
      apiPath: `/api/articles/${slug}`,
    });
  }

  return NextResponse.json({
    generated_at: new Date().toISOString(),
    wiki: {
      count: wiki.length,
      pages: wiki,
    },
    articles: {
      count: articles.length,
      entries: articles,
    },
  });
}
