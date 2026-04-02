"use client";

import { useState, useRef, useCallback } from "react";
import MiniSearch from "minisearch";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: "wiki" | "article";
  path: string;
}

interface SearchDoc {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string;
  type: "wiki" | "article";
  path: string;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const msRef = useRef<MiniSearch<SearchDoc> | null>(null);
  const loadingRef = useRef(false);

  const ensureIndex = useCallback(async () => {
    if (msRef.current || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/search");
      const docs: SearchDoc[] = await res.json();
      const ms = new MiniSearch<SearchDoc>({
        fields: ["title", "description", "content", "tags"],
        storeFields: ["title", "description", "type", "path"],
        searchOptions: {
          boost: { title: 3, tags: 2, description: 1.5 },
          fuzzy: 0.2,
          prefix: true,
        },
      });
      ms.addAll(docs);
      msRef.current = ms;
    } catch {
      // Search unavailable
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const search = useCallback(
    async (query: string) => {
      await ensureIndex();
      if (!msRef.current || !query.trim()) {
        setResults([]);
        return;
      }
      const hits = msRef.current.search(query);
      setResults(
        hits.slice(0, 10).map((hit) => ({
          id: hit.id,
          title: hit.title,
          description: hit.description,
          type: hit.type,
          path: hit.path,
        }))
      );
    },
    [ensureIndex]
  );

  return { results, search, loading };
}
