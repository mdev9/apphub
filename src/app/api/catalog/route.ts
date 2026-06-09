import { NextRequest, NextResponse } from "next/server";
import { listObjects, getObject } from "@/lib/r2";
import { parseMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

interface CatalogEntry {
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

/**
 * Compact, machine-readable catalog of the WHOLE knowledge base.
 *
 * The corpus is small (a few hundred bite-size entries), so an AI assistant can
 * ingest this entire catalog in one call and pick relevant entries by its own
 * reasoning — more reliable than keyword ranking for natural-language problems.
 * Each record is just the frontmatter signal (title, claim, topics, numbers,
 * confidence, source) plus the path to fetch the full entry.
 */
export async function GET(req: NextRequest) {
  const topicFilter = req.nextUrl.searchParams.get("topic");
  const files = (await listObjects("wiki/")).filter((f) => f.key.endsWith(".md"));

  const entries: CatalogEntry[] = [];
  for (const file of files) {
    const raw = await getObject(file.key);
    if (!raw) continue;
    const parsed = parseMarkdown(raw);
    const fm = parsed.frontmatter as Record<string, unknown>;
    const slug = file.key.replace(/^wiki\//, "").replace(/\.md$/, "");

    entries.push({
      title: parsed.title,
      description: parsed.description || "",
      type: typeof fm.type === "string" ? fm.type : "entry",
      topics: Array.isArray(fm.topics) ? (fm.topics as string[]) : [],
      claim: typeof fm.claim === "string" ? fm.claim : "",
      numbers: Array.isArray(fm.numbers) ? (fm.numbers as string[]) : [],
      confidence: typeof fm.confidence === "string" ? fm.confidence : "",
      source: typeof fm.source === "string" ? fm.source : "",
      path: `/wiki/${slug}`,
      apiPath: `/api/wiki/${slug}`,
    });
  }

  // Topic list reflects the full catalog (so callers can discover filters).
  const topics = [...new Set(entries.flatMap((e) => e.topics))].sort();

  const filtered = topicFilter
    ? entries.filter((e) => e.topics.includes(topicFilter))
    : entries;

  return NextResponse.json({
    description:
      "Full compact catalog of AppHub entries. Read this whole list, then fetch the full content of relevant entries via their apiPath. Use ?topic=<name> to filter to one topic.",
    count: filtered.length,
    topics,
    entries: filtered,
  });
}
