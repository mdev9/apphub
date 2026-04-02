export interface ViewEntry {
  ts: number;
  count: number;
}

export interface ArticleMeta {
  title: string;
  description?: string;
  createdAt: string;
  aiRating: number;
  tags: string[];
  views: ViewEntry[];
  popularityScore: number;
}

export type ArticlesIndex = Record<string, ArticleMeta>;

const HALF_LIFE_DAYS = 7;
const LAMBDA = Math.LN2 / (HALF_LIFE_DAYS * 24 * 60 * 60);

export function computeDecayedViews(views: ViewEntry[], now?: number): number {
  const nowSec = (now ?? Date.now()) / 1000;
  let total = 0;
  for (const v of views) {
    total += v.count * Math.exp(-LAMBDA * (nowSec - v.ts));
  }
  return total;
}

export function computePopularity(
  decayedViews: number,
  maxDecayedViews: number,
  aiRating: number
): number {
  const normalizedViews =
    maxDecayedViews > 0 ? decayedViews / maxDecayedViews : 0;
  return 0.6 * normalizedViews + 0.4 * (aiRating / 10);
}

export function recordView(article: ArticleMeta): ArticleMeta {
  const now = Math.floor(Date.now() / 1000);
  const hourBucket = now - (now % 3600);
  const lastView = article.views[article.views.length - 1];

  if (lastView && lastView.ts === hourBucket) {
    lastView.count++;
  } else {
    article.views.push({ ts: hourBucket, count: 1 });
  }

  return article;
}

export function rankArticles(index: ArticlesIndex): string[] {
  const now = Date.now();
  const entries = Object.entries(index);

  // Compute decayed views for all
  const decayed = entries.map(([slug, meta]) => ({
    slug,
    decayedViews: computeDecayedViews(meta.views, now),
    aiRating: meta.aiRating,
  }));

  const maxDecayed = Math.max(...decayed.map((d) => d.decayedViews), 1);

  // Update popularity scores and sort
  for (const d of decayed) {
    index[d.slug].popularityScore = computePopularity(
      d.decayedViews,
      maxDecayed,
      d.aiRating
    );
  }

  return decayed
    .sort(
      (a, b) =>
        index[b.slug].popularityScore - index[a.slug].popularityScore
    )
    .map((d) => d.slug);
}
