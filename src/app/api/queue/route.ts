import { NextResponse } from "next/server";
import { getQueue, removeFromQueue, updateQueueItem, isProxyAvailable } from "@/lib/queue";
import { ask, extractJson, SYSTEM_PROMPTS } from "@/lib/claude";
import { putObject, getObject } from "@/lib/r2";
import { buildSearchIndex } from "@/lib/search";
import { buildNavTree } from "@/lib/nav";
import { logAction, captureBeforeState } from "@/lib/history";

export const maxDuration = 300;

// GET: return queue status
export async function GET() {
  const queue = await getQueue();
  return NextResponse.json({
    pending: queue.filter((i) => i.status === "pending").length,
    processing: queue.filter((i) => i.status === "processing").length,
    failed: queue.filter((i) => i.status === "failed").length,
    items: queue,
  });
}

// POST: process pending items
export async function POST() {
  if (!(await isProxyAvailable())) {
    return NextResponse.json(
      { detail: "Proxy still unavailable" },
      { status: 503 }
    );
  }

  const queue = await getQueue();
  const pending = queue.filter((i) => i.status === "pending" || i.status === "failed");

  if (pending.length === 0) {
    return NextResponse.json({ processed: 0, message: "Queue empty" });
  }

  let processed = 0;

  for (const item of pending) {
    await updateQueueItem(item.id, { status: "processing" });

    try {
      if (item.type === "resource") {
        await processResource(item.payload as { content: string; url?: string; suggestedTags?: string[] });
      }
      // article type can be added later

      await removeFromQueue(item.id);
      processed++;
    } catch (err) {
      await updateQueueItem(item.id, {
        status: "failed",
        error: (err as Error).message,
        retries: item.retries + 1,
      });
    }
  }

  return NextResponse.json({ processed, remaining: pending.length - processed });
}

async function processResource(payload: { content: string; url?: string; suggestedTags?: string[] }) {
  const { content: submittedContent, url, suggestedTags } = payload;

  // Plan
  const planRes = await ask({
    prompt: `Plan where to integrate this new information:\n\n${submittedContent}\n\nSuggested tags: ${(suggestedTags || []).join(", ")}`,
    system: SYSTEM_PROMPTS.resourcePlanning,
  });
  const plan = JSON.parse(extractJson(planRes.result));

  // Generate content
  const existing = plan.action === "update" ? await getObject(plan.path) : null;
  const sourceUrlLine = url ? `\nSource URL: ${url}` : "";
  const contentPrompt = existing
    ? `Update this existing wiki page with the new information below.\n\nExisting page:\n${existing}\n\nNew information to integrate:\n${submittedContent}${sourceUrlLine}\n\nKey points to cover: ${plan.keyPoints.join(", ")}`
    : `Write a wiki page about: ${plan.title}\n\nDescription: ${plan.description}\nTags: ${plan.tags.join(", ")}${sourceUrlLine}\n\nSource material:\n${submittedContent}\n\nKey points to cover: ${plan.keyPoints.join(", ")}`;

  const contentRes = await ask({
    prompt: contentPrompt,
    system: SYSTEM_PROMPTS.resourceContent,
  });

  let content = contentRes.result;
  const fenced = content.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/);
  if (fenced) content = fenced[1];

  const before = existing;
  await putObject(plan.path, content);

  Promise.all([buildSearchIndex(), buildNavTree()]).catch(() => {});

  logAction({
    type: "resource",
    title: plan.title,
    summary: `[from queue] ${plan.reason}`,
    agentThoughts: [
      `**Action:** ${plan.action} at \`${plan.path}\``,
      `**Reasoning:** ${plan.reason}`,
      `**Key points:** ${plan.keyPoints.join(", ")}`,
    ].join("\n\n"),
    diff: [
      {
        path: plan.path,
        action: (before ? "update" : "create") as "update" | "create",
        before,
        after: content,
      },
    ],
  }).catch(() => {});
}
