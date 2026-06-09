import { NextRequest, NextResponse } from "next/server";

function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const BASE_URL = getBaseUrl(req);
  return NextResponse.json({
    name: "AppHub API",
    description:
      "A data-driven knowledge base for building and scaling mobile apps. AI-curated resources on acquisition, monetization, retention, and growth.",
    version: "1.0.0",
    agent_prompt: `You are interacting with AppHub, a read-only growth knowledge base hosted at ${BASE_URL}. It holds bite-size, sourced entries on onboarding, paywalls, pricing, retention, acquisition, creatives, ASO, attribution, and more. Use it to ground growth advice in real numbers instead of generic tips, and cite the entries you used. All responses are JSON; entry content is markdown. Prefix all paths with ${BASE_URL}.

Workflow:
1. Ingest the catalog first — GET ${BASE_URL}/api/catalog — and reason over the claims to shortlist relevant entries (the corpus is small enough to read whole). Filter with ?topic=<name> when it maps cleanly.
2. Search for anything else — GET ${BASE_URL}/api/search?q=<query> — synonym-expanded full-text search; returns title, description, a snippet, and path.
3. Read the entries that matter — GET ${BASE_URL}/api/wiki/<category>/<slug> (the catalog's apiPath). Each has a claim, evidence, an "Apply when" and a "Caveat". Respect the 'confidence' field: 'debated' entries present two sides — surface the trade-off. Weigh 'source' for context.
4. Compare against the user's actual app and give concrete, prioritized fixes, each citing the entry (title + path) it came from.

Other endpoints: GET ${BASE_URL}/api/wiki/nav (topic tree). If the base has nothing on a topic, say so and answer from your own knowledge.`,
    endpoints: {
      help: {
        method: "GET",
        path: "/api/help",
        description: "This document. Returns API overview, agent prompt, and endpoint list.",
      },
      index: {
        method: "GET",
        path: "/api/index",
        description: "Full site index with all wiki pages and articles, including metadata.",
      },
      search: {
        method: "GET",
        path: "/api/search?q=<query>",
        description:
          "Search across all content. Returns matched documents with title, description, type, and path. Supports fuzzy matching and prefix search.",
      },
      wiki_nav: {
        method: "GET",
        path: "/api/wiki/nav",
        description: "Navigation tree. Returns wiki categories with child pages, and recent articles.",
      },
      wiki_page: {
        method: "GET",
        path: "/api/wiki/:category/:slug",
        description: "Read a wiki page. Returns title, description, content (markdown), and tags.",
        example: "/api/wiki/retention/churn-prevention",
      },
      articles_list: {
        method: "GET",
        path: "/api/articles?sort=popular|recent|top-rated",
        description:
          "List all articles sorted by popularity (default), recency, or AI rating. Returns slug, title, description, tags, aiRating, popularityScore, createdAt.",
      },
      article: {
        method: "GET",
        path: "/api/articles/:slug",
        description: "Read a single article. Returns title, description, content (markdown), tags, aiRating, createdAt. Also records a view.",
        example: "/api/articles/how-to-reduce-churn",
      },
    },
    base_url: BASE_URL,
  });
}
