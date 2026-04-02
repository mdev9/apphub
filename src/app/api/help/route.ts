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
    agent_prompt: `You are interacting with AppHub, a mobile app growth knowledge base hosted at ${BASE_URL}. Use the endpoints below to search, browse, and read content. All responses are JSON. Content is markdown. Prefix all paths with ${BASE_URL}.

Available actions:
- GET ${BASE_URL}/api/help — This help document (start here)
- GET ${BASE_URL}/api/index — Full site index: all wiki pages and articles with metadata
- GET ${BASE_URL}/api/search?q=<query> — Full-text search across all content
- GET ${BASE_URL}/api/wiki/nav — Navigation tree (categories and pages)
- GET ${BASE_URL}/api/wiki/<category>/<slug> — Read a wiki page (returns title, description, content as markdown, tags)
- GET ${BASE_URL}/api/articles?sort=popular|recent|top-rated — List all articles with popularity scores and AI ratings
- GET ${BASE_URL}/api/articles/<slug> — Read a single article

Tips:
- Start with /api/index to understand what content is available
- Use /api/search?q= for specific topics (supports fuzzy matching)
- Wiki pages are curated reference material; articles are AI-generated deep-dives on specific questions
- Content quality is indicated by aiRating (1-10 scale, set by the AI curator)
- Articles are ranked by a blend of time-weighted popularity and AI quality rating`,
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
