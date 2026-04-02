"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ArticleEntry {
  slug: string;
  title: string;
  description?: string;
  tags: string[];
  aiRating: number;
  popularityScore: number;
  createdAt: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"popular" | "recent" | "top-rated">(
    "popular"
  );

  useEffect(() => {
    fetch(`/api/articles?sort=${sort}`)
      .then((r) => r.json())
      .then(setArticles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sort]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted mt-1">
            AI-generated articles ranked by popularity and quality
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
          {(["popular", "recent", "top-rated"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                sort === s
                  ? "bg-accent text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {s === "top-rated" ? "Top Rated" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <p className="text-lg mb-2">No articles yet</p>
          <p className="text-sm">
            <Link href="/ask" className="text-accent hover:underline">
              Ask a question
            </Link>{" "}
            to generate the first article.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article }: { article: ArticleEntry }) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="block rounded-xl border border-border bg-surface p-5 transition-all hover:border-accent/30 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground mb-1 truncate">
            {article.title}
          </h2>
          {article.description && (
            <p className="text-sm text-muted line-clamp-2">
              {article.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3">
            {article.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent-light text-accent"
              >
                {tag}
              </span>
            ))}
            <span className="text-xs text-muted">
              {new Date(article.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div
            className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${
              article.aiRating >= 8
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : article.aiRating >= 6
                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            }`}
          >
            {article.aiRating.toFixed(1)}
          </div>
          <span className="text-xs text-muted">AI Rating</span>
        </div>
      </div>
    </Link>
  );
}
