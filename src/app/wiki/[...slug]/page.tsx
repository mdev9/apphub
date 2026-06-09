"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

interface WikiData {
  title: string;
  description?: string;
  content: string;
  tags?: string[];
}

interface NavItem {
  title: string;
  slug: string;
  path: string;
  children?: NavItem[];
}

interface PagePreview {
  title: string;
  description?: string;
  tags?: string[];
}

type ViewMode = "loading" | "page" | "category" | "not-found";

export default function WikiPage() {
  const params = useParams();
  const slug = (params.slug as string[])?.join("/") ?? "";
  const [mode, setMode] = useState<ViewMode>("loading");

  // Page state
  const [data, setData] = useState<WikiData | null>(null);

  // Category state
  const [category, setCategory] = useState<NavItem | null>(null);
  const [previews, setPreviews] = useState<Record<string, PagePreview>>({});

  useEffect(() => {
    setMode("loading");

    // Try fetching as a page first
    fetch(`/api/wiki/${slug}`)
      .then((r) => {
        if (r.ok) return r.json();
        throw new Error("not-a-page");
      })
      .then((d: WikiData) => {
        setData(d);
        setMode("page");
      })
      .catch(() => {
        // Not a page — try as a category
        fetch("/api/wiki/nav")
          .then((r) => r.json())
          .then((nav) => {
            const cat = nav.wiki.find(
              (s: NavItem) => s.slug === slug || s.path === `/wiki/${slug}`
            );
            if (cat) {
              setCategory(cat);
              setMode("category");
              // Fetch previews for child pages
              if (cat.children) {
                Promise.all(
                  cat.children.map((c: NavItem) =>
                    fetch(`/api${c.path}`)
                      .then((r) => (r.ok ? r.json() : null))
                      .then((data) => (data ? { path: c.path, data } : null))
                      .catch(() => null)
                  )
                ).then((results) => {
                  const map: Record<string, PagePreview> = {};
                  for (const r of results) {
                    if (r) map[r.path] = r.data;
                  }
                  setPreviews(map);
                });
              }
            } else {
              setMode("not-found");
            }
          })
          .catch(() => setMode("not-found"));
      });
  }, [slug]);

  if (mode === "loading") {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-surface rounded w-1/3" />
        <div className="h-4 bg-surface rounded w-2/3" />
        <div className="h-4 bg-surface rounded w-1/2" />
        <div className="h-64 bg-surface rounded" />
      </div>
    );
  }

  if (mode === "not-found") {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="text-muted">
          The wiki page &ldquo;{slug}&rdquo; doesn&apos;t exist yet.
        </p>
      </div>
    );
  }

  if (mode === "category" && category) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {category.title}
          </h1>
          <p className="text-muted mt-1">
            {category.children?.length ?? 0} pages in this category
          </p>
        </div>

        {category.children && category.children.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {category.children.map((page) => {
              const preview = previews[page.path];
              return (
                <Link
                  key={page.path}
                  href={page.path}
                  className="group rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent/30 hover:shadow-sm"
                >
                  <h3 className="font-medium text-foreground group-hover:text-accent transition-colors">
                    {preview?.title ?? page.title}
                  </h3>
                  {preview?.description && (
                    <p className="text-sm text-muted mt-1 line-clamp-2">
                      {preview.description}
                    </p>
                  )}
                  {preview?.tags && preview.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {preview.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-accent-light text-accent"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted">
            No pages in this category yet.
          </p>
        )}

        <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
          <span className="text-sm text-muted">
            Curated growth entries — grounded in real numbers and sources
          </span>
          <Link
            href="/developer"
            className="text-xs font-medium text-accent hover:underline"
          >
            Use via API / skill
          </Link>
        </div>
      </div>
    );
  }

  // Page view
  if (!data) return null;

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
          {data.tags && data.tags.length > 0 && (
            <div className="flex gap-2 mt-3">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-mono px-2 py-0.5 rounded-full bg-accent-light text-accent"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <MarkdownRenderer content={data.content} />
    </div>
  );
}
