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
  return NextResponse.json({
    title: parsed.title,
    description: parsed.description,
    content: parsed.content,
    tags: parsed.tags,
  });
}
