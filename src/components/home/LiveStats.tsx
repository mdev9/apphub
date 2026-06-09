"use client";

import { useEffect, useState } from "react";

/** Hero pill — live entry/topic counts from the catalog so it never goes stale. */
export function LiveStats() {
  const [s, setS] = useState<{ count: number; topics: number } | null>(null);

  useEffect(() => {
    fetch("/api/catalog")
      .then((r) => r.json())
      .then((d) => setS({ count: d.count ?? 0, topics: (d.topics ?? []).length }))
      .catch(() => {});
  }, []);

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
      </span>
      {s
        ? `${s.count} sourced entries · ${s.topics} topics · skill-first`
        : "skill-first growth knowledge base"}
    </div>
  );
}
