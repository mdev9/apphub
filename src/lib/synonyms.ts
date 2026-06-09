// Synonym/alias groups for query expansion.
//
// The search index uses literal token matching (MiniSearch). Growth vocabulary
// is full of equivalent terms ("activation" == "onboarding" == "aha moment"),
// so a raw query for one term misses pages that use another. Before searching,
// we expand the query with every term in any group it touches.

const GROUPS: string[][] = [
  ["onboarding", "activation", "aha moment", "first run", "first session", "first screen", "welcome screen", "setup flow", "signup flow"],
  ["paywall", "hard paywall", "soft paywall", "purchase screen", "subscription gate", "upsell screen"],
  ["conversion", "convert", "conversion rate", "cvr", "free to paid", "trial to paid"],
  ["trial", "free trial", "trial length", "trial conversion"],
  ["churn", "retention", "retain", "drop off", "dropoff", "attrition", "cancellations", "win-back", "winback"],
  ["cpt", "cost per trial"],
  ["cpi", "cost per install", "install cost"],
  ["cac", "customer acquisition cost", "acquisition cost"],
  ["ltv", "lifetime value"],
  ["roas", "return on ad spend"],
  ["aso", "app store optimization", "keywords", "store listing", "screenshots", "app store page"],
  ["creatives", "ad creative", "ads", "ugc", "video ad", "carousel", "hook", "thumbnail"],
  ["tiktok ads", "tiktok", "smart+", "spark ads", "tiktok paid"],
  ["meta ads", "facebook ads", "instagram ads"],
  ["attribution", "skan", "skadnetwork", "mmp", "tenjin", "appsflyer", "adjust", "tracking", "att", "deep funnel"],
  ["pricing", "price", "popcorn pricing", "tiers", "pricing page", "annual", "weekly", "monthly"],
  ["copywriting", "copy", "headline", "messaging", "value proposition", "value prop", "landing copy"],
  ["hero", "hero section", "above the fold", "first impression"],
  ["og image", "open graph", "social preview", "link preview"],
  ["cta", "call to action", "button"],
  ["landing page", "website", "marketing site", "homepage"],
  ["validation", "product market fit", "pmf", "validate", "idea validation", "demand"],
  ["social proof", "testimonials", "reviews", "proof"],
  ["push notifications", "push", "notification permission", "permission prompt", "opt-in"],
  ["benchmarks", "benchmark", "industry average", "median"],
  ["organic", "organic growth", "virality", "viral", "word of mouth"],
  ["tools", "tool", "stack", "saas tool"],
  ["mindset", "strategy", "discipline", "ship", "build in public"],
];

// Build a lookup from each term -> the set of all sibling terms in its groups.
const EXPANSION = new Map<string, Set<string>>();
for (const group of GROUPS) {
  for (const term of group) {
    const set = EXPANSION.get(term) ?? new Set<string>();
    for (const sib of group) set.add(sib);
    EXPANSION.set(term, set);
  }
}

/**
 * Expand a user query with synonyms. Matches both single tokens and multi-word
 * phrases that appear anywhere in the query. Returns the original query plus any
 * synonym terms appended (deduped).
 */
export function expandQuery(query: string): string {
  const q = query.toLowerCase();
  const extras = new Set<string>();

  for (const [term, siblings] of EXPANSION) {
    if (q.includes(term)) {
      for (const sib of siblings) extras.add(sib);
    }
  }

  if (extras.size === 0) return query;
  return `${query} ${[...extras].join(" ")}`;
}
