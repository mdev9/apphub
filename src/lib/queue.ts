import { getJson, putJson } from "./r2";

export interface QueueItem {
  id: string;
  createdAt: string;
  type: "resource" | "article";
  payload: Record<string, unknown>;
  status: "pending" | "processing" | "failed";
  error?: string;
  retries: number;
}

const QUEUE_KEY = "meta/queue.json";

export async function enqueue(
  type: QueueItem["type"],
  payload: Record<string, unknown>
): Promise<QueueItem> {
  const item: QueueItem = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    type,
    payload,
    status: "pending",
    retries: 0,
  };

  const queue = (await getJson<QueueItem[]>(QUEUE_KEY)) ?? [];
  queue.push(item);
  await putJson(QUEUE_KEY, queue);
  return item;
}

export async function getQueue(): Promise<QueueItem[]> {
  return (await getJson<QueueItem[]>(QUEUE_KEY)) ?? [];
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = (await getJson<QueueItem[]>(QUEUE_KEY)) ?? [];
  const filtered = queue.filter((item) => item.id !== id);
  await putJson(QUEUE_KEY, filtered);
}

export async function updateQueueItem(
  id: string,
  update: Partial<QueueItem>
): Promise<void> {
  const queue = (await getJson<QueueItem[]>(QUEUE_KEY)) ?? [];
  const item = queue.find((i) => i.id === id);
  if (item) {
    Object.assign(item, update);
    await putJson(QUEUE_KEY, queue);
  }
}

export async function isProxyAvailable(): Promise<boolean> {
  const proxyUrl = process.env.CLAUDE_PROXY_URL || "http://localhost:9100";
  const cfId = process.env.CF_ACCESS_CLIENT_ID || "";
  const cfSecret = process.env.CF_ACCESS_CLIENT_SECRET || "";
  const headers: Record<string, string> = {};
  if (cfId && cfSecret) {
    headers["CF-Access-Client-Id"] = cfId;
    headers["CF-Access-Client-Secret"] = cfSecret;
  }
  try {
    const res = await fetch(`${proxyUrl}/health`, {
      headers,
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
