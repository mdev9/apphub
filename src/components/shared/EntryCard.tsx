import Link from "next/link";

export const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  debated: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
};

const CONFIDENCE_TITLE: Record<string, string> = {
  high: "High confidence — multi-call consensus or backed by data",
  medium: "Medium confidence — a single operator's tactic, not yet broadly confirmed",
  debated: "Debated — the sources disagree; both sides are in the entry's caveat",
};

export function ConfidenceBadge({ confidence }: { confidence?: string }) {
  if (!confidence) return null;
  return (
    <span
      title={CONFIDENCE_TITLE[confidence] ?? `${confidence} confidence`}
      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full flex-shrink-0 cursor-help ${
        CONFIDENCE_STYLE[confidence] ?? "bg-surface text-muted"
      }`}
    >
      {confidence}
    </span>
  );
}

export interface EntrySummary {
  title: string;
  description?: string;
  claim?: string;
  confidence?: string;
  source?: string;
  path: string;
}

export function EntryCard({ entry }: { entry: EntrySummary }) {
  return (
    <Link
      href={entry.path}
      className="group rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent/30 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-foreground group-hover:text-accent transition-colors leading-snug">
          {entry.title}
        </h3>
        <ConfidenceBadge confidence={entry.confidence} />
      </div>
      <p className="text-sm text-muted mt-1 line-clamp-2">
        {entry.description || entry.claim}
      </p>
      {entry.source && (
        <p className="text-[11px] text-muted/70 mt-2 truncate">{entry.source}</p>
      )}
    </Link>
  );
}
