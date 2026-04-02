import { NextRequest, NextResponse } from "next/server";
import { getJson, putJson, putObject } from "@/lib/r2";
import { parseMarkdown, hashContent } from "@/lib/markdown";
import {
  type ArticlesIndex,
  type ArticleMeta,
  rankArticles,
} from "@/lib/popularity";
import { ask, isAiEnabled, extractJson, SYSTEM_PROMPTS } from "@/lib/claude";
import slugify from "slugify";
import { buildSearchIndex } from "@/lib/search";
import { buildNavTree } from "@/lib/nav";
import { logAction } from "@/lib/history";

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get("sort") || "popular";
  const index = (await getJson<ArticlesIndex>("meta/articles-index.json")) ?? {};

  let slugs = Object.keys(index);

  if (sort === "popular") {
    slugs = rankArticles(index);
    await putJson("meta/articles-index.json", index); // save updated scores
  } else if (sort === "recent") {
    slugs.sort(
      (a, b) =>
        new Date(index[b].createdAt).getTime() -
        new Date(index[a].createdAt).getTime()
    );
  } else if (sort === "top-rated") {
    slugs.sort((a, b) => index[b].aiRating - index[a].aiRating);
  }

  const articles = slugs.map((slug) => ({
    slug,
    ...index[slug],
  }));

  return NextResponse.json(articles);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { content, question } = body as { content: string; question: string };

  const parsed = parseMarkdown(content);
  const slug = slugify(parsed.title, { lower: true, strict: true });
  const now = new Date().toISOString();

  // Get AI rating if available
  let aiRating = 7.0;
  if (isAiEnabled()) {
    try {
      const ratingRes = await ask({
        prompt: `Rate this article:\n\n${content}`,
        system: SYSTEM_PROMPTS.articleRating,
      });
      const ratingData = JSON.parse(extractJson(ratingRes.result));
      aiRating = ratingData.rating;
    } catch {
      // Use default rating
    }
  }

  // Add metadata to frontmatter if not present
  const fullContent = content.includes("---")
    ? content
    : `---\ntitle: "${parsed.title}"\ndescription: "${parsed.description || ""}"\ntags: [${(parsed.tags || []).map((t) => `"${t}"`).join(", ")}]\nauthor: "ai"\naiRating: ${aiRating}\ncreatedAt: "${now}"\nupdatedAt: "${now}"\nsourceHash: "${hashContent(content)}"\n---\n\n${parsed.content}`;

  // Save to R2
  await putObject(`articles/${slug}.md`, fullContent);

  // Update articles index
  const index =
    (await getJson<ArticlesIndex>("meta/articles-index.json")) ?? {};
  index[slug] = {
    title: parsed.title,
    description: parsed.description,
    createdAt: now,
    aiRating,
    tags: parsed.tags || [],
    views: [],
    popularityScore: 0.4 * (aiRating / 10), // Initial score based on AI rating only
  };
  await putJson("meta/articles-index.json", index);

  // Rebuild search index and nav in background
  Promise.all([buildSearchIndex(), buildNavTree()]).catch(() => {});

  // Log to history
  logAction({
    type: "article",
    title: parsed.title,
    summary: `Generated article from question: "${question}". AI rating: ${aiRating}/10.`,
    agentThoughts: [
      `**Question:** ${question}`,
      `**AI Rating:** ${aiRating}/10`,
      `**Tags:** ${(parsed.tags || []).join(", ")}`,
      `**Saved to:** \`articles/${slug}.md\``,
    ].join("\n\n"),
    diff: [
      {
        path: `articles/${slug}.md`,
        action: "create",
        before: null,
        after: fullContent,
      },
    ],
  }).catch(() => {});

  return NextResponse.json({ slug, aiRating });
}
