"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { EntryCard, ConfidenceBadge, type EntrySummary } from "@/components/shared/EntryCard";
import { topicLabel, primaryTopic } from "@/lib/topics";

interface WikiData {
  title: string;
  description?: string;
  content: string;
  tags?: string[];
  confidence?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CatalogEntry extends EntrySummary {
  topics: string[];
}

type ViewMode = "loading" | "page" | "category" | "not-found";

function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </Link>
  );
}

function BackToWiki() {
  return (
    <div className="mb-4">
      <BackLink href="/library" label="Knowledge Base" />
    </div>
  );
}

export default function WikiPage() {
  const params = useParams();
  const slug = (params.slug as string[])?.join("/") ?? "";
  const [mode, setMode] = useState<ViewMode>("loading");
  const [data, setData] = useState<WikiData | null>(null);
  const [catalog, setCatalog] = useState<CatalogEntry[] | null>(null);

  // Load the catalog once — powers [[wiki-links]] resolution and category views.
  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((c: { entries?: CatalogEntry[] }) => setCatalog(c.entries ?? []))
      .catch(() => setCatalog([]));
  }, []);

  useEffect(() => {
    setMode("loading");
    fetch(`/api/wiki/${slug}`)
      .then((r) => {
        if (r.ok) return r.json();
        throw new Error("not-a-page");
      })
      .then((d: WikiData) => {
        setData(d);
        setMode("page");
      })
      .catch(() => setMode("category")); // single-segment slug → treat as a topic
  }, [slug]);

  const linkMap = useMemo(() => {
    const m: Record<string, { path: string; title: string }> = {};
    for (const e of catalog ?? []) {
      const id = e.path.split("/").pop();
      if (id) m[id] = { path: e.path, title: e.title };
    }
    return m;
  }, [catalog]);

  const categoryEntries = useMemo(
    () => (catalog ?? []).filter((e) => primaryTopic(e.path) === slug),
    [catalog, slug]
  );

  if (mode === "loading" || (mode === "category" && catalog === null)) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-surface rounded w-1/3" />
        <div className="h-4 bg-surface rounded w-2/3" />
        <div className="h-64 bg-surface rounded" />
      </div>
    );
  }

  // Category view (a topic page)
  if (mode === "category") {
    if (categoryEntries.length === 0) {
      return (
        <div>
          <BackToWiki />
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold mb-2">Nothing here</h1>
            <p className="text-muted">No entries under &ldquo;{slug}&rdquo;.</p>
          </div>
        </div>
      );
    }
    return (
      <div>
        <BackToWiki />
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{topicLabel(slug)}</h1>
            <span className="text-xs text-muted font-mono bg-surface border border-border rounded px-1.5 py-0.5">
              {categoryEntries.length}
            </span>
          </div>
          <p className="text-muted mt-1">{categoryEntries.length} entries in this topic</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[...categoryEntries]
            .sort((a, b) => a.title.localeCompare(b.title))
            .map((e) => (
              <EntryCard key={e.path} entry={e} />
            ))}
        </div>
      </div>
    );
  }

  if (mode === "not-found" || !data) {
    return (
      <div>
        <BackToWiki />
        <div className="text-center py-20">
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-muted">The entry &ldquo;{slug}&rdquo; doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  // Entry view
  const entryTopic = slug.split("/")[0];
  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <BackLink href="/library" label="Knowledge Base" />
        {entryTopic && <BackLink href={`/library/${entryTopic}`} label={topicLabel(entryTopic)} />}
      </div>
      <div className="mb-8">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{data.title}</h1>
          <div className="mt-1.5">
            <ConfidenceBadge confidence={data.confidence} />
          </div>
        </div>
        {data.description && <p className="text-muted text-lg mt-2">{data.description}</p>}
        {data.source && <p className="text-xs text-muted/80 mt-2 font-mono">{data.source}</p>}
        {data.createdAt && (
          <p className="text-[11px] text-muted/60 mt-1">
            Added {data.createdAt}
            {data.updatedAt && data.updatedAt !== data.createdAt ? ` · Updated ${data.updatedAt}` : ""}
          </p>
        )}
        {data.tags && data.tags.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
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
      <MarkdownRenderer content={resolveWikiLinks(data.content, linkMap)} />
    </div>
  );
}

// Turn `[[entry-id]]` cross-references into real markdown links (using the
// catalog's id→path+title map). Unknown ids fall back to de-kebabed plain text.
function resolveWikiLinks(
  content: string,
  map: Record<string, { path: string; title: string }>
): string {
  return content.replace(/\[\[([a-z0-9-]+)\]\]/g, (_m, id: string) => {
    const hit = map[id];
    return hit ? `[${hit.title}](${hit.path})` : id.replace(/-/g, " ");
  });
}
