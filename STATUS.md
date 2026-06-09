# STATUS — apphub

- **Stage:** shipped/live (apphub.marijn.fr) — rebuilt 2026-06-09 as a read-only, skill-first growth KB
- **Type:** NOT a money app — internal tooling / knowledge-base asset (MIT, free, no accounts/billing). Don't put it in the money ranking.
- **Effort to next milestone:** ~1–2 hrs (optional)
- **What:** AI-curated mobile-app & SaaS **growth** knowledge base of ~268 bite-size, sourced "entries" (atomic claim + verbatim numbers + confidence + source), grouped by topic. The **skill is the product**: an AI assistant hits a growth problem → pulls `/api/catalog` + `/api/search` → reads entries → compares against the user's real app code → gives cited fixes. Next.js 16, Cloudflare R2, Vercel.

## ▶ THE ONE NEXT ACTION
Optional/lower-priority now that the rebuild + web pass are done: **fill the content gaps** the cold re-test flagged — referral/virality loops, lifecycle/email, churn analysis, non-TikTok paid (Meta/Google are thin). Then, when you want them back, **rebuild `/ask` + `/articles`** (hidden from nav, routes kept) as read-only RAG over the entries and re-enable writes (`ENABLE_WRITES`).

## What's working
- **Content:** ~268 entries across 31 topics on R2 — App Society (12 calls) + Marc Lou principles + RevenueCat SOSA 2026 + a sourced YouTube/Google playbook. Cold re-tested **9/10**; zero dead links / placeholders / duplicates; contradictions flagged via `confidence: debated` + caveats. (Removed the unsourced TikTok "lazy scaling" guide — it contradicted App Society and had no provenance.)
- **Web (read-only):** routes `/library` (browse all entries from one `/api/catalog` call, topic-grouped, filterable; topic + entry pages share one `EntryCard`) and `/connect-your-ai-agent` (Skill + API sections, terminal-style blocks). Landing-style homepage: sidebar collapses on `/`, logo in the top bar, live counts, faux-terminal demo, animated "How it works". `[[wiki-links]]` render as real links. Per-entry **OG images** via `/api/og/[...slug]` + entry-layout metadata. `/wiki` + `/developer` 308-redirect to the new routes.
- **API (skill-first):** `/api/catalog` (cached `meta/catalog.json`), `/api/search` (synonyms + stemming + snippets + cutoff), `/api/wiki/<cat>/<slug>`, `/api/wiki/nav`, `/api/help`. All write/AI POST routes return 403 unless `ENABLE_WRITES=true`.
- **Skill:** `~/.claude/skills/apphub` catalog-first. **Pipeline:** `app-society-sync` Step 5 feeds each new weekly call into AppHub and redeploys.
- Format spec: `docs/CONTENT-FORMAT.md`. Deploy content: `npx tsx scripts/deploy-to-r2.ts`. Inspect bucket: `npx tsx scripts/ls-bucket.ts`. Local mirror in `./data` (gitignored).

## Risks / notes
- **Treat as infrastructure, not a revenue line.**
- `/api/catalog` + `/api/index` must stay backed by precomputed JSON — reading all entries per request times out on serverless at this size.
- Security: writes are off by default (`ENABLE_WRITES`); the `/api/resources` + `/api/queue` + `/api/ask` POST routes still exist but 403. In Vercel, mark `R2_*` / `CF_ACCESS_CLIENT_SECRET` as **Sensitive** (untick Development first); rotate keys if ever exposed.
- Live R2/CF creds in `.env.local` (gitignored, on disk). `/ask` (when revived) depends on the self-hosted Claude proxy.
- Heavily TikTok/subscription-mobile weighted (the App Society core) — broaden sources for a general-purpose growth base.
