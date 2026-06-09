# AppHub

A read-only, **skill-first** knowledge base for mobile-app & SaaS growth.

AppHub holds ~268 **bite-size, evidence-backed entries** — each a single claim with verbatim numbers, a confidence level, and its source — grouped by topic (onboarding, paywalls, pricing, retention, ads, ASO, attribution, …). It's exposed as a JSON API and a Claude Code skill so an **AI assistant pulls from it automatically** when you hit a growth problem, grounding its advice in real data instead of generic tips.

Live: **[apphub.marijn.fr](https://apphub.marijn.fr)**

## The skill is the product

The primary consumer isn't a human browsing — it's your AI assistant:

```
You ask your assistant a growth question
        │
        ▼
  GET /api/catalog      → ingest the whole catalog, reason over the claims
        │
        ▼
  GET /api/search?q=…   → synonym-expanded search for anything else
        │
        ▼
  GET /api/wiki/<cat>/<slug>   → read the entries that matter
        │
        ▼
  Read your app's real code (onboarding, paywall, pricing, …)
        │
        ▼
  Prioritized, cited fixes — each backed by a sourced entry
```

The web UI ([/library](https://apphub.marijn.fr/library)) is a clean way for humans to browse the same content; install instructions live at [/connect-your-ai-agent](https://apphub.marijn.fr/connect-your-ai-agent).

## Content model

Two types, both markdown with YAML frontmatter (full spec: [`docs/CONTENT-FORMAT.md`](docs/CONTENT-FORMAT.md)):

- **Entry** — one atomic insight. `claim`, `numbers`, `topics`, `confidence` (`high` / `medium` / `debated`), `source`. A few hundred words; `Apply when` / `Caveat`.
- **Guide** — the rare long-form keeper (e.g. the RevenueCat SOSA 2026 benchmarks).

Contradictions between sources are never silent — they're tagged `confidence: debated` with both sides in the caveat. Sources are cited explicitly (App Society calls, RevenueCat, Marc Lou, named guides).

### Where the content comes from
- **App Society** — a weekly French indie-app mastermind (12 calls distilled). Fed automatically: the `app-society-sync` skill turns each new call into entries and pushes them here.
- **Marc Lou** viral-product principles, **RevenueCat State of Subscription Apps 2026**, and a few sourced practitioner playbooks.

## API

All content is JSON. Start at `/api/catalog`.

```bash
GET /api/catalog                 # compact catalog of EVERY entry (read this first); ?topic=<name> to filter
GET /api/search?q=onboarding     # synonym-expanded + stemmed full-text search, with snippets
GET /api/wiki/<category>/<slug>  # read one entry (markdown + metadata)
GET /api/wiki/nav                # topic tree
GET /api/og/<category>/<slug>    # per-entry Open Graph image
GET /api/help                    # API overview + agent system prompt
```

`/api/catalog` is served from a precomputed `meta/catalog.json` (a single read — reading every entry per request times out on serverless at this size).

## Read-only

AppHub is read-only in production. The legacy submission / Q&A-generation endpoints (`/api/resources`, `/api/queue`, `/api/ask`, article creation) return **403** unless `ENABLE_WRITES=true`. Content is curated offline and deployed via the scripts below.

## Architecture

```
Next.js 16 (App Router) · Cloudflare R2 (storage) · Vercel (hosting)

src/
  app/
    library/            # browse all entries (one /api/catalog call) + entry/topic pages
    connect-your-ai-agent/  # skill install + API docs
    api/
      catalog/          # cached compact catalog
      search/           # MiniSearch + synonyms + stemming
      wiki/[...slug]/    # read an entry
      wiki/nav/          # topic tree
      og/[...slug]/      # per-entry OG image
      help/ index/       # API docs / full index
  lib/
    r2.ts               # storage (R2, or local ./data fallback)
    search.ts           # index + catalog builder
    nav.ts              # topic tree builder
    synonyms.ts         # query expansion
    topics.ts           # topic labels
    markdown.ts         # frontmatter parsing

Storage layout (R2 / ./data):
  wiki/<topic>/<id>.md       entries & guides
  wiki/<topic>/_meta.json    topic title/order
  meta/{catalog,search-index,nav-tree}.json   precomputed, rebuilt on deploy
```

The web route is `/library` but the storage prefix and data API stay `wiki/` / `/api/wiki` (`/wiki` + `/developer` 308-redirect to the new routes).

## Scripts

```bash
npx tsx scripts/push-entries.ts    # incremental: upsert data/_incoming/** to R2, rebuild from R2 (safe, never deletes)
npx tsx scripts/deploy-to-r2.ts    # full rebuild from local data/wiki/** (refuses if the mirror looks stale; --force to override)
npx tsx scripts/reindex-local.ts   # rebuild index/catalog/nav locally (./data)
npx tsx scripts/ls-bucket.ts       # inspect what's in the bucket (--keys, or pass a key to dump it)
```

## Local development

```bash
npm install
R2_ENDPOINT= NEXT_PUBLIC_AI_ENABLED=false npm run dev   # uses local ./data, no R2/AI
```

Set `R2_*` in `.env.local` to target the real bucket. The site is fully functional without AI — browse, search, and the API all work statically.

## License

MIT
