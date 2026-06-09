import { NextRequest, NextResponse } from "next/server";
import { getSearchIndex, createMiniSearch } from "@/lib/search";
import { expandQuery } from "@/lib/synonyms";

function snippet(content: string, max = 280): string {
  const clean = content.replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max).trimEnd() + "…" : clean;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");

  try {
    const docs = await getSearchIndex();

    // If no query, return the raw index (for client-side search)
    if (!q) {
      return NextResponse.json(docs);
    }

    const byId = new Map(docs.map((d) => [d.id, d]));
    const ms = createMiniSearch(docs);

    // Expand the query with domain synonyms before searching so "activation",
    // "aha moment", "first screen" all reach the onboarding content, etc.
    const expanded = expandQuery(q);

    const hits = ms.search(expanded);
    // Drop the weak tail: MiniSearch returns many low-score fuzzy/prefix matches
    // that pad results with noise. Keep hits within a fraction of the top score
    // (but always keep at least the top 5 so a thin query still returns something).
    const topScore = hits.length ? hits[0].score : 0;
    const filtered = hits.filter((h, i) => i < 5 || h.score >= topScore * 0.18);
    const results = filtered
      .slice(0, 20)
      .map((hit) => {
        const doc = byId.get(hit.id as string);
        return {
          id: hit.id,
          title: hit.title,
          description: hit.description,
          type: hit.type,
          path: hit.path,
          // A content snippet so the assistant gets signal before fetching the
          // full page — cuts an extra round-trip on obviously-relevant hits.
          snippet: doc ? snippet(doc.content) : "",
          score: hit.score,
        };
      });

    return NextResponse.json({
      query: q,
      expandedQuery: expanded === q ? undefined : expanded,
      count: results.length,
      results,
    });
  } catch {
    return NextResponse.json(q ? { query: q, count: 0, results: [] } : []);
  }
}
