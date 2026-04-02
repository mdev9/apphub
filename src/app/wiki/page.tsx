"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface NavItem {
  title: string;
  slug: string;
  path: string;
  children?: NavItem[];
}

interface NavTree {
  wiki: NavItem[];
  articles: NavItem[];
}

interface PagePreview {
  title: string;
  description?: string;
  tags?: string[];
}

export default function WikiIndex() {
  const [nav, setNav] = useState<NavTree | null>(null);
  const [previews, setPreviews] = useState<Record<string, PagePreview>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wiki/nav")
      .then((r) => r.json())
      .then((tree: NavTree) => {
        setNav(tree);
        // Fetch previews for all pages
        const pages = tree.wiki.flatMap(
          (s) => s.children?.map((c) => c) ?? []
        );
        Promise.all(
          pages.map((p) =>
            fetch(`/api${p.path}`)
              .then((r) => (r.ok ? r.json() : null))
              .then((data) => {
                if (data) return { path: p.path, data };
                return null;
              })
              .catch(() => null)
          )
        ).then((results) => {
          const map: Record<string, PagePreview> = {};
          for (const r of results) {
            if (r) map[r.path] = r.data;
          }
          setPreviews(map);
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-surface rounded w-1/3" />
        <div className="h-5 bg-surface rounded w-2/3" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-surface rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!nav) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Knowledge Base</h1>
        <p className="text-muted">Could not load wiki content.</p>
      </div>
    );
  }

  const totalPages = nav.wiki.reduce(
    (sum, s) => sum + (s.children?.length ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted mt-1">
          {nav.wiki.length} categories, {totalPages} pages — AI-curated and
          continuously updated
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-8">
        {nav.wiki.map((section) => (
          <div key={section.slug}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <span className="text-xs text-muted font-mono bg-surface border border-border rounded px-1.5 py-0.5">
                {section.children?.length ?? 0}
              </span>
            </div>

            {section.children && section.children.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {section.children.map((page) => {
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
              <p className="text-sm text-muted pl-1">
                No pages yet in this category.
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
        <span className="text-sm text-muted">
          Content is automatically organized as new resources are added
        </span>
        <Link
          href="/admin/resources"
          className="text-xs font-medium text-accent hover:underline"
        >
          Add a resource
        </Link>
      </div>
    </div>
  );
}
