"use client";

import { useEffect, useMemo, useState } from "react";

interface BucketObject {
  key: string;
  lastModified: string | null;
}

export default function BucketDebugPage() {
  const [objects, setObjects] = useState<BucketObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [contentLoading, setContentLoading] = useState(false);

  useEffect(() => {
    fetch("/api/debug/bucket")
      .then((r) => r.json())
      .then((d) => setObjects(d.objects ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? objects.filter((o) => o.key.toLowerCase().includes(q)) : objects;
  }, [objects, filter]);

  // Group by top-level prefix for headers.
  const groups = useMemo(() => {
    const map = new Map<string, BucketObject[]>();
    for (const o of filtered) {
      const top = o.key.split("/")[0];
      if (!map.has(top)) map.set(top, []);
      map.get(top)!.push(o);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  function open(key: string) {
    setSelected(key);
    setContentLoading(true);
    setContent("");
    fetch(`/api/debug/object?key=${encodeURIComponent(key)}`)
      .then((r) => r.text())
      .then(setContent)
      .catch((e) => setContent(`Error: ${(e as Error).message}`))
      .finally(() => setContentLoading(false));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bucket browser</h1>
        <p className="text-muted text-sm mt-1">
          Debug view of the R2 bucket — {objects.length} objects. Not linked in nav.
        </p>
      </div>

      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter keys (e.g. paywall, meta/, .json)…"
        className="w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none font-mono"
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* Key list */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          <div className="max-h-[70vh] overflow-y-auto p-2 text-sm">
            {loading ? (
              <div className="p-3 text-muted animate-pulse">Loading…</div>
            ) : (
              groups.map(([prefix, items]) => (
                <div key={prefix} className="mb-3">
                  <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    {prefix}/ <span className="font-mono">{items.length}</span>
                  </div>
                  {items.map((o) => (
                    <button
                      key={o.key}
                      onClick={() => open(o.key)}
                      className={`block w-full truncate rounded px-2 py-1 text-left font-mono text-xs transition-colors ${
                        selected === o.key
                          ? "bg-accent-light text-accent"
                          : "text-muted hover:bg-accent-light hover:text-foreground"
                      }`}
                      title={o.key}
                    >
                      {o.key.split("/").slice(1).join("/") || o.key}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Content viewer */}
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {selected ? (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
                <code className="text-xs font-mono text-foreground truncate">{selected}</code>
                <a
                  href={`/api/debug/object?key=${encodeURIComponent(selected)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-accent hover:underline flex-shrink-0"
                >
                  raw ↗
                </a>
              </div>
              {contentLoading ? (
                <div className="p-4 text-xs text-muted animate-pulse">Loading…</div>
              ) : (
                <pre className="max-h-[66vh] overflow-auto p-4 text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed">
                  {content}
                </pre>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-sm text-muted">
              Select an object to view its raw content.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
