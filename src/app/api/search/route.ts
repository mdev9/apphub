import { NextRequest, NextResponse } from "next/server";
import { getSearchIndex, createMiniSearch } from "@/lib/search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");

  try {
    const docs = await getSearchIndex();

    // If no query, return the raw index (for client-side search)
    if (!q) {
      return NextResponse.json(docs);
    }

    // Server-side search
    const ms = createMiniSearch(docs);
    const results = ms.search(q).slice(0, 20).map((hit) => ({
      id: hit.id,
      title: hit.title,
      description: hit.description,
      type: hit.type,
      path: hit.path,
      score: hit.score,
    }));

    return NextResponse.json({
      query: q,
      count: results.length,
      results,
    });
  } catch {
    return NextResponse.json(q ? { query: q, count: 0, results: [] } : []);
  }
}
