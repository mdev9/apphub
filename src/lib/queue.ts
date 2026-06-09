import { getJson, putJson, getObject, putObject } from "./r2";
import { ask, extractJson, SYSTEM_PROMPTS } from "./claude";
import { buildSearchIndex } from "./search";
import { buildNavTree } from "./nav";
import { logAction } from "./history";

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

// --- Auto-drain: call this from any API route to process queue opportunistically ---

let draining = false;
let lastDrainCheck = 0;
const DRAIN_INTERVAL = 60_000; // check at most once per minute

export function tryDrainQueue(): void {
  const now = Date.now();
  if (draining || now - lastDrainCheck < DRAIN_INTERVAL) return;
  lastDrainCheck = now;

  // Fire and forget — don't block the request
  drainQueue().catch(() => {});
}

async function drainQueue(): Promise<void> {
  draining = true;
  try {
    if (!(await isProxyAvailable())) return;

    const queue = await getQueue();
    const pending = queue.filter((i) => i.status === "pending" || i.status === "failed");
    if (pending.length === 0) return;

    for (const item of pending) {
      await updateQueueItem(item.id, { status: "processing" });
      try {
        if (item.type === "resource") {
          await processQueuedResource(item.payload as { content: string; url?: string; suggestedTags?: string[] });
        }
        await removeFromQueue(item.id);
      } catch {
        await updateQueueItem(item.id, {
          status: "failed",
          retries: item.retries + 1,
        });
      }
    }
  } finally {
    draining = false;
  }
}

async function processQueuedResource(payload: { content: string; url?: string; suggestedTags?: string[] }) {
  const { content: submittedContent, url, suggestedTags } = payload;

  const planRes = await ask({
    prompt: `Plan where to integrate this new information:\n\n${submittedContent}\n\nSuggested tags: ${(suggestedTags || []).join(", ")}`,
    system: SYSTEM_PROMPTS.resourcePlanning,
  });
  const plan = JSON.parse(extractJson(planRes.result));

  const existing = plan.action === "update" ? await getObject(plan.path) : null;
  const sourceUrlLine = url ? `\nSource URL: ${url}` : "";
  const contentPrompt = existing
    ? `Update this existing wiki page with the new information below.\n\nExisting page:\n${existing}\n\nNew information to integrate:\n${submittedContent}${sourceUrlLine}\n\nKey points to cover: ${plan.keyPoints.join(", ")}`
    : `Write a wiki page about: ${plan.title}\n\nDescription: ${plan.description}\nTags: ${plan.tags.join(", ")}${sourceUrlLine}\n\nSource material:\n${submittedContent}\n\nKey points to cover: ${plan.keyPoints.join(", ")}`;

  const contentRes = await ask({ prompt: contentPrompt, system: SYSTEM_PROMPTS.resourceContent });
  let content = contentRes.result;
  const fenced = content.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/);
  if (fenced) content = fenced[1];

  await putObject(plan.path, content);
  Promise.all([buildSearchIndex(), buildNavTree()]).catch(() => {});

  logAction({
    type: "resource",
    title: plan.title,
    summary: `[from queue] ${plan.reason}`,
    agentThoughts: `**Action:** ${plan.action} at \`${plan.path}\`\n\n**Reasoning:** ${plan.reason}`,
    diff: [{ path: plan.path, action: (existing ? "update" : "create") as "update" | "create", before: existing, after: content }],
  }).catch(() => {});
}
