import { NextRequest, NextResponse } from "next/server";
import { getObject } from "@/lib/r2";
import { parseMarkdown } from "@/lib/markdown";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;
  const path = `wiki/${slug.join("/")}.md`;
  const raw = await getObject(path);

  if (!raw) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = parseMarkdown(raw);
  const fm = parsed.frontmatter as Record<string, unknown>;
  return NextResponse.json({
    title: parsed.title,
    description: parsed.description,
    content: parsed.content,
    tags: parsed.tags,
    type: typeof fm.type === "string" ? fm.type : "entry",
    topics: Array.isArray(fm.topics) ? (fm.topics as string[]) : [],
    confidence: typeof fm.confidence === "string" ? fm.confidence : "",
    source: typeof fm.source === "string" ? fm.source : "",
  });
}
