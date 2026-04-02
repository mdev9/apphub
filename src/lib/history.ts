import { getJson, putJson, getObject } from "./r2";

export interface HistoryEntry {
  id: string;
  timestamp: string;
  type: "resource" | "article";
  title: string;
  summary: string;
  agentThoughts: string;
  diff: DiffEntry[];
}

export interface DiffEntry {
  path: string;
  action: "create" | "update" | "delete";
  before: string | null;
  after: string | null;
}

export async function logAction(
  entry: Omit<HistoryEntry, "id" | "timestamp">
): Promise<HistoryEntry> {
  const full: HistoryEntry = {
    ...entry,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: new Date().toISOString(),
  };

  const history = (await getJson<HistoryEntry[]>("meta/history.json")) ?? [];
  history.unshift(full); // newest first

  // Keep last 200 entries
  if (history.length > 200) history.length = 200;

  await putJson("meta/history.json", history);
  return full;
}

export async function getHistory(
  limit = 50,
  offset = 0
): Promise<{ entries: HistoryEntry[]; total: number }> {
  const history = (await getJson<HistoryEntry[]>("meta/history.json")) ?? [];
  return {
    entries: history.slice(offset, offset + limit),
    total: history.length,
  };
}

/** Capture the before-state of a file for diffing */
export async function captureBeforeState(
  path: string
): Promise<string | null> {
  return getObject(path);
}
