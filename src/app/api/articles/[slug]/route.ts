import { NextRequest, NextResponse } from "next/server";
import { getObject, getJson, putJson } from "@/lib/r2";
import { parseMarkdown } from "@/lib/markdown";
import { type ArticlesIndex, recordView } from "@/lib/popularity";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const raw = await getObject(`articles/${slug}.md`);

  if (!raw) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = parseMarkdown(raw);

  // Record view
  const index =
    (await getJson<ArticlesIndex>("meta/articles-index.json")) ?? {};
  if (index[slug]) {
    recordView(index[slug]);
    putJson("meta/articles-index.json", index).catch(() => {});
  }

  return NextResponse.json({
    title: parsed.title,
    description: parsed.description,
    content: parsed.content,
    tags: parsed.tags,
    aiRating: parsed.aiRating,
    createdAt: parsed.createdAt,
  });
}
