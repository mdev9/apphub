"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearch } from "@/hooks/useSearch";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, search, loading } = useSearch();

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      search(q);
    },
    [search]
  );

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 search-backdrop" onClick={onClose}>
      <div
        className="mx-auto mt-[15vh] w-full max-w-xl rounded-xl border border-border bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <svg className="w-5 h-5 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search knowledge base..."
            className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted text-sm"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 text-xs font-mono text-muted">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              Loading search index...
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {!loading && !query && (
            <div className="px-4 py-8 text-center text-sm text-muted">
              Type to search across wiki and articles
            </div>
          )}
          {results.map((result) => (
            <a
              key={result.id}
              href={result.path}
              onClick={onClose}
              className="flex flex-col gap-0.5 rounded-lg px-3 py-2.5 hover:bg-accent-light transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                    result.type === "wiki"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                  }`}
                >
                  {result.type}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {result.title}
                </span>
              </div>
              {result.description && (
                <span className="text-xs text-muted ml-[52px]">
                  {result.description}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
