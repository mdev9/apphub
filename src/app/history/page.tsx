"use client";

import { useEffect, useState } from "react";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

interface DiffEntry {
  path: string;
  action: "create" | "update" | "delete";
  before: string | null;
  after: string | null;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  type: "resource" | "article" | "translation";
  title: string;
  summary: string;
  agentThoughts: string;
  diff: DiffEntry[];
}

const TYPE_STYLES = {
  resource: {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    label: "Resource",
  },
  article: {
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300",
    label: "Article",
  },
  translation: {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "Translation",
  },
};

const ACTION_STYLES = {
  create: { bg: "bg-green-600", label: "NEW" },
  update: { bg: "bg-amber-600", label: "MOD" },
  delete: { bg: "bg-red-600", label: "DEL" },
};

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDiff, setExpandedDiff] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries);
        setTotal(d.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function toggleEntry(id: string) {
    setExpandedId(expandedId === id ? null : id);
    setExpandedDiff(null);
  }

  function toggleDiff(key: string) {
    setExpandedDiff(expandedDiff === key ? null : key);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-surface rounded w-1/3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-surface rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted mt-1">
          Agent actions, thoughts, and changes — {total} total entries
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20 text-muted">
          <p className="text-lg mb-2">No history yet</p>
          <p className="text-sm">
            Actions will appear here as the AI agent processes resources,
            generates articles, and translates content.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const style = TYPE_STYLES[entry.type];
            const isExpanded = expandedId === entry.id;

            return (
              <div
                key={entry.id}
                className="rounded-xl border border-border bg-surface overflow-hidden"
              >
                {/* Header row */}
                <button
                  onClick={() => toggleEntry(entry.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent-light/50 transition-colors"
                >
                  {/* Expand arrow */}
                  <svg
                    className={`w-4 h-4 text-muted flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>

                  {/* Type badge */}
                  <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${style.bg} ${style.text} flex-shrink-0`}>
                    {style.label}
                  </span>

                  {/* Title + summary */}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate block">
                      {entry.title}
                    </span>
                    <span className="text-xs text-muted truncate block">
                      {entry.summary}
                    </span>
                  </div>

                  {/* Diff badges */}
                  <div className="flex gap-1 flex-shrink-0">
                    {entry.diff.map((d, i) => {
                      const ds = ACTION_STYLES[d.action];
                      return (
                        <span
                          key={i}
                          className={`text-[10px] font-mono font-bold text-white px-1.5 py-0.5 rounded ${ds.bg}`}
                        >
                          {ds.label}
                        </span>
                      );
                    })}
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-muted flex-shrink-0 font-mono">
                    {formatTime(entry.timestamp)}
                  </span>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border">
                    {/* Agent thoughts */}
                    <div className="px-4 py-3 bg-accent-light/30">
                      <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                        Agent Thoughts
                      </div>
                      <div className="text-sm">
                        <MarkdownRenderer content={entry.agentThoughts} className="!max-w-none prose-sm" />
                      </div>
                    </div>

                    {/* Diffs */}
                    {entry.diff.length > 0 && (
                      <div className="px-4 py-3">
                        <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                          Changes
                        </div>
                        <div className="space-y-2">
                          {entry.diff.map((d, i) => {
                            const diffKey = `${entry.id}-${i}`;
                            const isDiffExpanded = expandedDiff === diffKey;
                            const ds = ACTION_STYLES[d.action];

                            return (
                              <div key={i} className="rounded-lg border border-border overflow-hidden">
                                <button
                                  onClick={() => toggleDiff(diffKey)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface transition-colors bg-background"
                                >
                                  <span className={`text-[10px] font-mono font-bold text-white px-1.5 py-0.5 rounded ${ds.bg}`}>
                                    {ds.label}
                                  </span>
                                  <code className="text-xs text-foreground font-mono flex-1 truncate">
                                    {d.path}
                                  </code>
                                  <svg
                                    className={`w-3 h-3 text-muted transition-transform ${isDiffExpanded ? "rotate-90" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>

                                {isDiffExpanded && (
                                  <div className="border-t border-border">
                                    <DiffView before={d.before} after={d.after} action={d.action} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DiffView({
  before,
  after,
  action,
}: {
  before: string | null;
  after: string | null;
  action: "create" | "update" | "delete";
}) {
  if (action === "create" && after) {
    return (
      <div className="overflow-x-auto">
        <pre className="text-xs font-mono p-3 leading-relaxed">
          {after.split("\n").map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none text-green-500 w-6 flex-shrink-0 text-right mr-2 opacity-70">+</span>
              <span className="text-green-700 dark:text-green-400">{line || " "}</span>
            </div>
          ))}
        </pre>
      </div>
    );
  }

  if (action === "delete" && before) {
    return (
      <div className="overflow-x-auto">
        <pre className="text-xs font-mono p-3 leading-relaxed">
          {before.split("\n").map((line, i) => (
            <div key={i} className="flex">
              <span className="select-none text-red-500 w-6 flex-shrink-0 text-right mr-2 opacity-70">-</span>
              <span className="text-red-700 dark:text-red-400">{line || " "}</span>
            </div>
          ))}
        </pre>
      </div>
    );
  }

  if (action === "update" && before && after) {
    const beforeLines = before.split("\n");
    const afterLines = after.split("\n");
    const diff = computeSimpleDiff(beforeLines, afterLines);

    return (
      <div className="overflow-x-auto">
        <pre className="text-xs font-mono p-3 leading-relaxed">
          {diff.map((line, i) => (
            <div key={i} className="flex">
              <span
                className={`select-none w-6 flex-shrink-0 text-right mr-2 opacity-70 ${
                  line.type === "add"
                    ? "text-green-500"
                    : line.type === "remove"
                      ? "text-red-500"
                      : "text-muted"
                }`}
              >
                {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
              </span>
              <span
                className={
                  line.type === "add"
                    ? "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
                    : line.type === "remove"
                      ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30"
                      : "text-foreground"
                }
              >
                {line.text || " "}
              </span>
            </div>
          ))}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-3 text-xs text-muted">No diff available</div>
  );
}

interface DiffLine {
  type: "add" | "remove" | "same";
  text: string;
}

function computeSimpleDiff(before: string[], after: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  const beforeSet = new Set(before);
  const afterSet = new Set(after);

  // LCS-based diff is complex — use a simple line-by-line approach
  const maxLen = Math.max(before.length, after.length);
  let bi = 0;
  let ai = 0;

  while (bi < before.length || ai < after.length) {
    if (bi < before.length && ai < after.length && before[bi] === after[ai]) {
      result.push({ type: "same", text: before[bi] });
      bi++;
      ai++;
    } else if (bi < before.length && !afterSet.has(before[bi])) {
      result.push({ type: "remove", text: before[bi] });
      bi++;
    } else if (ai < after.length && !beforeSet.has(after[ai])) {
      result.push({ type: "add", text: after[ai] });
      ai++;
    } else {
      // Lines exist in both but at different positions — show as change
      if (bi < before.length) {
        result.push({ type: "remove", text: before[bi] });
        bi++;
      }
      if (ai < after.length) {
        result.push({ type: "add", text: after[ai] });
        ai++;
      }
    }

    // Safety: prevent infinite loops
    if (result.length > maxLen * 3) break;
  }

  return result;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return d.toLocaleDateString();
}
