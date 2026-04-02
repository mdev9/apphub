# AppHub

An open knowledge base for mobile app growth, curated by an AI agent.

Submit a resource (article, YouTube video, notes) and an AI agent analyzes it, validates relevance, decides where it fits in the wiki, and writes a complete page. Ask a question and it generates a data-driven article. Everything is stored as markdown, browsable with search, and exposed through a JSON API.

## How it works

```
You submit a resource (text, URL, YouTube link)
        |
        v
   AI validates relevance
        |
        v
   AI plans: where does this go? what category? what key points?
        |
        v
   AI writes a full wiki page with frontmatter
        |
        v
   Saved to storage (R2 or local), search index rebuilt, sidebar updated
```

The agent is skeptical and data-driven. It rejects irrelevant submissions, forms its own opinions, and backs claims with evidence. When new information contradicts existing pages, it updates them.

### What the AI does

- **Validates** submitted content for relevance to mobile app growth
- **Plans** where new information should go (create new page or update existing)
- **Writes** complete wiki pages with structured markdown and YAML frontmatter
- **Rates** generated articles on a 1-10 quality scale
- **Extracts** content from URLs (web pages) and YouTube videos (transcript)
- **Queues** submissions when the proxy is offline and processes them later

### What happens without AI

The wiki, search, articles, and API all work. You just can't submit new resources, generate Q&A articles, or process the queue. The site is fully functional as a static knowledge base.

## Quick start

```bash
git clone https://github.com/mdev9/apphub.git
cd apphub
npm install
npx tsx scripts/seed.ts   # populate starter content
npm run dev               # http://localhost:3000
```

That's it. This runs with local filesystem storage (`./data/`) and no AI. Good enough to browse, search, and contribute to the UI.

## Full setup (with AI)

The AI features require a Claude-compatible proxy running on port 9100 that exposes the Anthropic Messages API (`POST /v1/messages`).

### 1. Claude proxy

AppHub calls `http://localhost:9100/v1/messages` with the standard Anthropic API format. Any proxy that accepts this works. We use [Meridian](https://github.com/rynfar/opencode-claude-max-proxy), which proxies Claude Code's authentication to expose an API endpoint.

```bash
# Clone and start the proxy (requires Claude Code installed and authenticated)
cd ~/Documents/claude-proxy
docker compose up -d

# Verify
curl http://localhost:9100/health
```

### 2. Cloud storage (optional, for production)

By default, content is stored in `./data/`. For production, use Cloudflare R2 (free tier: 10GB, 10M reads/month).

Create `.env.local`:

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=apphub-content
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
CLAUDE_PROXY_URL=http://localhost:9100
NEXT_PUBLIC_AI_ENABLED=true
```

Then seed R2: `npx tsx scripts/seed.ts`

If `R2_ENDPOINT` is not set, everything falls back to local filesystem automatically.

### 3. Run

```bash
npm run dev
```

| Page | What it does |
|---|---|
| `/` | Landing page |
| `/wiki` | Browse knowledge base by category |
| `/wiki/:category/:slug` | Read a wiki page |
| `/articles` | Browse AI-generated articles (ranked by popularity + AI rating) |
| `/ask` | Ask a question, get a streaming AI article |
| `/admin/resources` | Submit resources (text, URLs, YouTube) |
| `/history` | Agent action log with GitHub-style diffs |
| `/developer` | API docs, Claude Code skill installer |

## API

All content is available as JSON. See `/api/help` for the full agent-friendly documentation.

```bash
GET /api/help                        # API overview + agent system prompt
GET /api/index                       # Full site index
GET /api/search?q=churn              # Full-text search
GET /api/wiki/nav                    # Navigation tree
GET /api/wiki/retention/churn-prevention  # Read a wiki page
GET /api/articles?sort=popular       # List articles
GET /api/articles/:slug              # Read an article
GET /api/queue                       # Queue status
POST /api/queue                      # Process queued items
```

### Claude Code skill

AppHub ships as a Claude Code skill. Install it so Claude automatically pulls from the knowledge base when you ask about app growth:

```bash
mkdir -p ~/.claude/skills/apphub
# Then paste the skill content from /developer page
```

Or just copy the install prompt from the `/developer` page and paste it into Claude Code.

## Architecture

```
src/
  app/
    api/
      ask/          # Q&A streaming → Claude proxy → SSE to client
      articles/     # CRUD + view tracking + popularity ranking
      resources/    # Validate → plan → generate → save pipeline
      search/       # Server-side search (MiniSearch) + client index
      wiki/         # Read markdown from storage
      queue/        # Offline queue management
      help/         # Agent-friendly API docs
      index/        # Full site index
      history/      # Action audit log
  lib/
    r2.ts           # Storage abstraction (R2 or local filesystem)
    claude.ts       # Anthropic API client + system prompts
    queue.ts        # Offline queue (enqueue when proxy down)
    popularity.ts   # Time-weighted decay + AI rating scoring
    rate-limit.ts   # IP-based rate limiting (bypassed locally)
    url-extract.ts  # YouTube transcript + web content extraction
    history.ts      # Action logging with diffs
    search.ts       # MiniSearch index builder
    nav.ts          # Sidebar navigation tree from storage
    markdown.ts     # gray-matter frontmatter parsing
```

### Resource submission pipeline

```
POST /api/resources
  1. Extract URL content (YouTube transcript or web scrape)
  2. Check: proxy available? No → enqueue, return 200 with queued status
  3. AI call: validate relevance (small JSON response)
  4. AI call: plan integration (path, title, tags, key points)
  5. AI call: generate wiki page (plain markdown)
  6. Save to storage, rebuild search index + nav tree
  7. Log to history with before/after diff
```

### Popularity ranking

Articles are ranked by: `score = 0.6 * normalize(decayedViews) + 0.4 * (aiRating / 10)`

Views decay with a 7-day half-life. Recent high-quality content surfaces first.

## Contributing

```bash
git clone https://github.com/mdev9/apphub.git
cd apphub
npm install
npx tsx scripts/seed.ts
npm run dev
```

No cloud accounts needed. Everything runs locally. AI features are optional.

## License

MIT
