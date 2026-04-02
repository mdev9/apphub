# AppHub

A data-driven knowledge base for building and scaling mobile apps. AI-curated resources on acquisition, monetization, retention, and growth.

An AI agent (Claude) analyzes submitted resources, forms skeptical opinions backed by data, and organizes everything into a structured wiki. When you ask a question, it writes a thorough, scientific-style article. Articles are ranked by a blend of time-weighted popularity and the AI's own quality rating.

## Features

- **Wiki** — Curated knowledge base organized by category (acquisition, monetization, retention, analytics, optimization)
- **Q&A** — Ask a question, get a streaming AI-generated article saved as a public page
- **Resource submission** — Paste text or URLs (including YouTube links with auto transcript extraction). AI validates relevance and integrates into the wiki
- **Search** — Full-text search across all content (Ctrl+K)
- **History** — Full audit log of agent actions with GitHub-style diffs
- **API** — JSON endpoints for AI agents and integrations

## Tech stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS v4** with typography plugin
- **Cloudflare R2** for storage (or local filesystem for development)
- **Claude** via local proxy for AI features

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
git clone https://github.com/mdev9/apphub.git
cd apphub
npm install
```

### Seed content

This populates the knowledge base with starter wiki pages:

```bash
npx tsx scripts/seed.ts
```

Without R2 configured, this seeds into `./data/` (local filesystem mode).

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### AI features (optional)

AI-powered features (Q&A, resource submission, translation) require a Claude proxy running on port 9100. Without it, the wiki, search, and articles still work — AI features gracefully show an "unavailable" message.

If you have the proxy set up:

```bash
# In ~/Documents/claude-proxy
docker compose up -d
```

## Storage

AppHub supports two storage backends:

### Local filesystem (default for development)

When `R2_ENDPOINT` is not set in `.env.local`, content is stored in `./data/`. No cloud account needed — just clone and run.

### Cloudflare R2 (production)

Set the following in `.env.local`:

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=apphub-content
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
```

Then seed R2:

```bash
npx tsx scripts/seed.ts
```

## API

All content is available through JSON endpoints. See the full docs at `/developer` or `/api/help`.

| Endpoint | Description |
|---|---|
| `GET /api/help` | API overview with agent system prompt |
| `GET /api/index` | Full site index (all pages + articles) |
| `GET /api/search?q=query` | Full-text search |
| `GET /api/wiki/nav` | Navigation tree |
| `GET /api/wiki/:cat/:slug` | Read a wiki page |
| `GET /api/articles?sort=popular` | List articles |
| `GET /api/articles/:slug` | Read an article |

## Project structure

```
src/
  app/
    page.tsx                    # Landing page
    wiki/                       # Wiki pages
    articles/                   # AI-generated articles
    ask/                        # Q&A page
    admin/resources/            # Resource submission
    history/                    # Agent action history
    developer/                  # API docs
    api/                        # API routes
  lib/
    r2.ts                       # Storage (R2 or local filesystem)
    claude.ts                   # AI proxy client + system prompts
    markdown.ts                 # Frontmatter parsing
    nav.ts                      # Navigation tree builder
    search.ts                   # Search index (MiniSearch)
    popularity.ts               # Time-weighted popularity ranking
    rate-limit.ts               # IP-based rate limiting
    history.ts                  # Action history logging
    url-extract.ts              # URL content extraction (YouTube + web)
  components/
    layout/                     # Sidebar, Header
    shared/                     # MarkdownRenderer, LanguageToggle
    search/                     # SearchDialog (Ctrl+K)
  hooks/
    useSearch.ts                # Client-side search
    useStreamingResponse.ts     # SSE consumer for streaming AI responses
scripts/
  seed.ts                       # Seed wiki content
```

## Contributing

1. Fork the repo
2. Clone and install: `npm install`
3. Seed local content: `npx tsx scripts/seed.ts`
4. Start dev server: `npm run dev`
5. Make your changes
6. Submit a PR

No cloud accounts needed for development — everything runs locally with the filesystem storage backend. AI features are optional; the wiki, search, and UI all work without the Claude proxy.

### Areas where contributions help

- New wiki content on mobile app growth topics
- UI improvements and accessibility
- Search improvements
- Performance optimization

## License

MIT
