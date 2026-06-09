"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { topicLabel, primaryTopic } from "@/lib/topics";

interface CatalogEntry {
  title: string;
  description: string;
  type: string;
  topics: string[];
  claim: string;
  numbers: string[];
  confidence: string;
  source: string;
  path: string;
}

interface Catalog {
  count: number;
  topics: string[];
  entries: CatalogEntry[];
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  debated: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
};

export default function WikiIndex() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then(setCatalog)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Group entries by primary topic (one home per entry → covers the whole base).
  const groups = useMemo(() => {
    if (!catalog) return [];
    const q = query.trim().toLowerCase();
    const map = new Map<string, CatalogEntry[]>();
    for (const e of catalog.entries) {
      if (q) {
        const hay = (e.title + " " + e.description + " " + e.claim + " " + e.topics.join(" ")).toLowerCase();
        if (!hay.includes(q)) continue;
      }
      const t = primaryTopic(e.path);
      if (!map.has(t)) map.set(t, []);
      map.get(t)!.push(e);
    }
    return [...map.entries()]
      .map(([topic, entries]) => ({
        topic,
        entries: entries.sort((a, b) => a.title.localeCompare(b.title)),
      }))
      .sort((a, b) => b.entries.length - a.entries.length);
  }, [catalog, query]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-surface rounded w-1/3" />
        <div className="h-5 bg-surface rounded w-2/3" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-surface rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2">Knowledge Base</h1>
        <p className="text-muted">Could not load content.</p>
      </div>
    );
  }

  const shownCount = groups.reduce((s, g) => s + g.entries.length, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="text-muted mt-1">
          {catalog.count} bite-size, sourced growth entries across {catalog.topics.length} topics
        </p>
      </div>

      {/* Filter */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter entries by keyword, claim, or topic…"
        className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
      />

      {/* Topic jump chips */}
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <a
            key={g.topic}
            href={`#${g.topic}`}
            className="text-xs font-medium rounded-full border border-border bg-surface px-2.5 py-1 text-muted hover:text-accent hover:border-accent/40 transition-colors"
          >
            {topicLabel(g.topic)} <span className="text-muted/70">{g.entries.length}</span>
          </a>
        ))}
      </div>

      {query && (
        <p className="text-sm text-muted">
          {shownCount} {shownCount === 1 ? "entry" : "entries"} match “{query}”
        </p>
      )}

      {/* Topic sections */}
      <div className="space-y-10">
        {groups.map((g) => (
          <section key={g.topic} id={g.topic} className="scroll-mt-20">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-lg font-semibold">{topicLabel(g.topic)}</h2>
              <span className="text-xs text-muted font-mono bg-surface border border-border rounded px-1.5 py-0.5">
                {g.entries.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {g.entries.map((e) => (
                <Link
                  key={e.path}
                  href={e.path}
                  className="group rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent/30 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground group-hover:text-accent transition-colors leading-snug">
                      {e.title}
                    </h3>
                    {e.confidence && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          CONFIDENCE_STYLE[e.confidence] ?? "bg-surface text-muted"
                        }`}
                      >
                        {e.confidence}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted mt-1 line-clamp-2">
                    {e.description || e.claim}
                  </p>
                  {e.source && (
                    <p className="text-[11px] text-muted/70 mt-2 truncate">{e.source}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <div className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
        <span className="text-sm text-muted">
          Curated growth entries — grounded in real numbers and sources
        </span>
        <Link href="/developer" className="text-xs font-medium text-accent hover:underline">
          Use via API / skill
        </Link>
      </div>
    </div>
  );
}
