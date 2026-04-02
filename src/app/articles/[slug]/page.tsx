"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

interface ArticleData {
  title: string;
  description?: string;
  content: string;
  tags?: string[];
  aiRating?: number;
  createdAt?: string;
}

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<ArticleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Article not found");
        return r.json();
      })
      .then((d: ArticleData) => {
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-surface rounded w-1/3" />
        <div className="h-4 bg-surface rounded w-2/3" />
        <div className="h-64 bg-surface rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Article not found</h1>
        <p className="text-muted">This article doesn&apos;t exist.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {data.title}
          </h1>
          {data.description && (
            <p className="text-muted text-lg">{data.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            {data.tags?.map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent-light text-accent"
              >
                {tag}
              </span>
            ))}
            {data.aiRating && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                AI Rating: {data.aiRating.toFixed(1)}
              </span>
            )}
            {data.createdAt && (
              <span className="text-xs text-muted">
                {new Date(data.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
      <MarkdownRenderer content={data.content} />
    </div>
  );
}
