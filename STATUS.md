# STATUS — apphub

- **Stage:** shipped/live (apphub.marijn.fr) — rebuilt 2026-06-09 as a read-only, skill-first growth KB
- **Type:** NOT a money app — internal tooling / knowledge-base asset (MIT, free, no accounts/billing). Don't put it in the money ranking.
- **Effort to next milestone:** ~2–3 hrs
- **What:** AI-curated mobile-app & SaaS **growth** knowledge base of ~269 bite-size, sourced "entries" (atomic claim + verbatim numbers + confidence + source), grouped by topic. The **skill is the product**: an AI assistant hits a growth problem → pulls `/api/catalog` + `/api/search` → reads entries → compares against the user's real app code → gives cited fixes. Next.js 16, Cloudflare R2, hosted on Vercel.

## ▶ THE ONE NEXT ACTION
Polish the read-only **web UI** to match the new content model: topic-based browse (the sidebar still uses raw category folders), render `Related: [[id]]` links as real links on entry pages, and simplify `/ask` to a read-only RAG answer over the entries (it still carries the old article-generation/queue path). Lower priority: fill the content gaps the cold re-test flagged — referral/virality loops, lifecycle/email, churn analysis, non-TikTok paid (Meta/Google are thin).

## What's working
- **Content:** ~269 entries across 31 topics on R2 — curated from 12 App Society calls + Marc Lou's viral-product principles + RevenueCat SOSA 2026 + practitioner case studies. Cold re-tested **9/10** as an AI-consumable source; zero dead links / placeholders / duplicates; contradictions flagged via `confidence: debated` + cross-referenced caveats.
- **API (skill-first):** `/api/catalog` (compact whole-base dump, served from cached `meta/catalog.json`), `/api/search` (synonym expansion + stemming + snippets + weak-tail cutoff), `/api/wiki/<cat>/<slug>`, `/api/wiki/nav`, `/api/help`.
- **Skill:** `~/.claude/skills/apphub` rewritten catalog-first (catalog → search → fetch → read the app's code → cited gaps + fixes).
- **Pipeline:** `app-society-sync` skill now has a Step 5 that feeds each new weekly call into AppHub and redeploys.
- Format spec: `docs/CONTENT-FORMAT.md`. Deploy: `npx tsx scripts/deploy-to-r2.ts` (re-uploads `data/wiki/**` + rebuilds index & catalog on R2). Local mirror lives in `./data` (gitignored).

## Risks / notes
- **Treat as infrastructure, not a revenue line** — it makes other app-growth work better.
- `/api/catalog` and `/api/index` must stay backed by precomputed JSON — reading all entries per request times out on serverless at this size.
- Submission is removed from the UI (read-only), but the `/api/resources` + `/api/queue` backend routes still exist unused — remove in the web-polish pass.
- Live R2/CF credentials in `.env.local` (gitignored, on disk). AI features (`/ask`) depend on the self-hosted Claude proxy.
- Heavily TikTok/subscription-mobile weighted (that's the App Society core) — broaden sources for a general-purpose growth base.
