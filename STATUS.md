# STATUS — apphub

- **Stage:** shipped/live (apphub.marijn.fr)
- **Type:** NOT a money app — internal tooling / knowledge-base asset (MIT, free, no accounts/billing)
- **Effort to next milestone:** ~1–2 hrs
- **What:** AI-curated mobile-app-growth knowledge base. Submit a resource (text/URL/YouTube) → AI validates + writes a wiki page; ask a question → streaming data-driven article. JSON API + a Claude skill (`~/.claude/skills/apphub`) that queries it. Next.js 16, Cloudflare R2, Anthropic via self-hosted proxy, hosted on Vercel.

## ▶ THE ONE NEXT ACTION
Finish the half-done public-submission refactor: create `src/app/resources/page.tsx` (move the deleted `admin/resources` page UI there), smoke-test the submit flow, then commit & push so `main`/production are consistent again. Right now local `main` is in a broken intermediate state (submission entry point 404s).

## What's working
Full pipeline (extract→validate→generate→save→reindex), live wiki (5 categories, ~12+ real pages), full-text search, streaming Q&A, agent JSON API, offline queue, graceful FS fallback. Proven in production (live content beyond seed data).

## Risks / notes
- **Treat as infrastructure, not a revenue line** — it makes other app-growth work better; don't put it in the money ranking.
- Hard dependency on your self-hosted Claude proxy (`cc.marijn.fr`) — live AI features break when that machine is offline (queue mitigates submissions, not `/ask`).
- The pending change makes submission **public** = abuse vector (no moderation gate, only IP rate-limiting). Consider keeping it gated.
- Live R2/CF credentials in `.env.local` (gitignored, but on disk).
