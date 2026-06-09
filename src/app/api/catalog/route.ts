import { NextRequest, NextResponse } from "next/server";
import { getCatalog } from "@/lib/search";

export const dynamic = "force-dynamic";

/**
 * Compact, machine-readable catalog of the WHOLE knowledge base.
 *
 * Served from a precomputed `meta/catalog.json` (built alongside the search
 * index) so this is a single fast read, not 269 per-request R2 fetches. The
 * corpus is small enough that an AI assistant can ingest this entire catalog in
 * one call and pick relevant entries by its own reasoning. Use `?topic=<name>`
 * to filter.
 */
export async function GET(req: NextRequest) {
  const topicFilter = req.nextUrl.searchParams.get("topic");
  const entries = await getCatalog();

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
