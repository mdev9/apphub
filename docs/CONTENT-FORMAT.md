# AppHub content format (v2 — entries + topics)

AppHub is **read-only on the web** and **skill-first**: the primary consumer is an AI assistant that gets triggered by a growth question, searches the base, and uses the results to reason about and fix a real app. Content must be **bite-size, atomic, and AI-ingestible** — a search must return a tight list of concrete claims (with numbers, confidence, source) that an LLM can act on without drowning.

## Two content types

### Entry (the atomic unit — the bulk of the base)
One self-contained insight: a lesson, tactic, benchmark, tool, or idea. A few hundred words max. Stored at `wiki/<primary-topic>/<id>.md`. Belongs to one *primary* topic (the folder) and any number of topics (frontmatter).

```markdown
---
title: "Hard paywall converts 4-5x better than freemium"
description: "One-line summary used in search results and topic lists."
type: lesson            # lesson | tactic | benchmark | tool | idea
topics: ["paywall", "onboarding", "monetization"]
claim: "A hard paywall (no free tier) yields ~4-5x the conversion of freemium."
numbers: ["2.1% freemium vs 10.7% hard paywall download-to-paid (RevenueCat median)"]
confidence: high        # high | medium | debated
source: "App Society call 2026-03-09"
author: "curated"
---

2–4 sentences: the insight, when it applies, and the counter-argument if it is debated.

**Apply when:** the concrete situation where this helps.
**Caveat:** the nuance, failure mode, or contradicting view.

Related: [[soft-paywall-tradeoffs]], [[trial-length-converts-1.7x]]
```

Rules:
- **Atomic:** one claim per entry. If a source paragraph has three ideas, it becomes three entries.
- **Numbers verbatim:** keep real figures, app names, and people's names exactly as the source stated them.
- **Confidence is honest:** `debated` when sources disagree (e.g. subscription vs one-time). The `source` field lets the AI weigh context (e.g. Marc Lou = indie one-time SaaS; App Society = subscription mobile).
- **No dead links:** a `[[related-id]]` must point to an entry that exists. No placeholder/stub entries — ever.

### Guide (rare long-form keepers)
A dense, multi-section reference that genuinely needs length (e.g. the RevenueCat SOSA 2026 benchmarks, the TikTok Ads playbook). Stored at `wiki/<primary-topic>/<slug>.md` with `type: guide`. Same frontmatter; longer body with `##` sections.

## Topics (navigation + grouping)
Topics are virtual: derived from the `topics` frontmatter array, not from folders alone. A topic page = a short primer + the list of entries tagged with it. Starter taxonomy:

`onboarding` · `paywall` · `pricing` · `monetization` · `tiktok-ads` · `meta-ads` · `attribution` · `aso` · `retention` · `creatives` · `organic` · `landing-page` · `copywriting` · `validation` · `benchmarks` · `tools` · `mindset`

## Sources
Every entry cites its origin in `source`:
- `App Society call YYYY-MM-DD` — the weekly French mastermind (see `~/apps/lessons/`).
- `Marc Lou newsletter` — generic indie SaaS / viral-product principles.
- `RevenueCat SOSA 2026` etc. — named reports.

## Search contract (what the skill relies on)
- Full entry content is indexed (entries are short).
- Indexed fields: `title`, `description`, `claim`, `numbers`, `topics`, `content` (boosted in that rough order).
- Query expansion via a synonym map (`src/lib/synonyms.ts`) so `activation`, `aha moment`, `first screen` all reach `onboarding`.
- Search results include a content snippet so the assistant gets signal before fetching the full page.
