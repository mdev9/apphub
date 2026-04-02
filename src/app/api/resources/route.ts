import { NextRequest, NextResponse } from "next/server";
import { ask, isAiEnabled, extractJson, SYSTEM_PROMPTS } from "@/lib/claude";
import { isBlocked, isRateLimited, addStrike } from "@/lib/rate-limit";
import { putObject, getObject } from "@/lib/r2";
import { buildSearchIndex } from "@/lib/search";
import { buildNavTree } from "@/lib/nav";
import { logAction, captureBeforeState } from "@/lib/history";
import { extractUrlContent } from "@/lib/url-extract";

export const maxDuration = 300; // 5 minutes

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  if (!isAiEnabled()) {
    return NextResponse.json(
      { detail: "Resource processing requires AI (local mode only)" },
      { status: 503 }
    );
  }

  const ip = getClientIp(req);

  if (await isBlocked(ip)) {
    return NextResponse.json(
      { detail: "Too many invalid submissions" },
      { status: 403 }
    );
  }

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { detail: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  const { content, url } = await req.json();

  if (!content?.trim() && !url?.trim()) {
    return NextResponse.json(
      { detail: "Content or URL is required" },
      { status: 400 }
    );
  }

  // Extract content from URL if provided
  let urlContent = "";
  let urlSource = "";
  if (url) {
    const extracted = await extractUrlContent(url);
    if (extracted) {
      urlContent = extracted.content;
      urlSource = extracted.source === "youtube" ? "YouTube transcript" : "Web page";
    }
  }

  const submittedContent = [
    url ? `URL: ${url}` : "",
    urlSource ? `Source: ${urlSource}` : "",
    urlContent ? `\nExtracted content:\n${urlContent}` : "",
    content ? `\nUser-provided notes:\n${content}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  if (!submittedContent.trim()) {
    return NextResponse.json(
      { detail: "Could not extract content from URL and no text provided" },
      { status: 400 }
    );
  }

  // Step 1: Validate relevance
  let validation: { relevant: boolean; reason: string; suggestedTags: string[] };
  try {
    const res = await ask({
      prompt: `Evaluate this submitted content:\n\n${submittedContent}`,
      system: SYSTEM_PROMPTS.resourceValidation,
    });
    validation = JSON.parse(extractJson(res.result));
  } catch {
    return NextResponse.json(
      { detail: "Failed to validate resource" },
      { status: 502 }
    );
  }

  if (!validation.relevant) {
    await addStrike(ip);

    logAction({
      type: "resource",
      title: "Resource rejected",
      summary: `Rejected submission: ${validation.reason}`,
      agentThoughts: `Validation result: ${JSON.stringify(validation)}.\n\nSubmitted content (truncated): ${submittedContent.slice(0, 300)}`,
      diff: [],
    }).catch(() => {});

    return NextResponse.json(
      { detail: `Resource rejected: ${validation.reason}` },
      { status: 422 }
    );
  }

  // Step 2: Plan where to integrate (small JSON response — fast)
  let plan: { action: string; path: string; title: string; description: string; tags: string[]; reason: string; keyPoints: string[] };
  try {
    const res = await ask({
      prompt: `Plan where to integrate this new information:\n\n${submittedContent}\n\nSuggested tags: ${validation.suggestedTags.join(", ")}`,
      system: SYSTEM_PROMPTS.resourcePlanning,
    });
    plan = JSON.parse(extractJson(res.result));
  } catch (err) {
    console.error("[resources] Planning error:", (err as Error).message);
    return NextResponse.json(
      { detail: `Failed to plan integration: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  // Step 3: Generate the actual content (plain markdown — no JSON wrapping)
  try {
    const existing = plan.action === "update" ? await getObject(plan.path) : null;

    const sourceUrlLine = url ? `\nSource URL: ${url}` : "";
    const contentPrompt = existing
      ? `Update this existing wiki page with the new information below.\n\nExisting page:\n${existing}\n\nNew information to integrate:\n${submittedContent}${sourceUrlLine}\n\nKey points to cover: ${plan.keyPoints.join(", ")}`
      : `Write a wiki page about: ${plan.title}\n\nDescription: ${plan.description}\nTags: ${plan.tags.join(", ")}${sourceUrlLine}\n\nSource material:\n${submittedContent}\n\nKey points to cover: ${plan.keyPoints.join(", ")}`;

    const res = await ask({
      prompt: contentPrompt,
      system: SYSTEM_PROMPTS.resourceContent,
    });

    // Strip ```markdown ``` wrapper if the AI added one
    let content = res.result;
    const fenced = content.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/);
    if (fenced) content = fenced[1];

    // Capture before state for diff
    const before = existing;

    await putObject(plan.path, content);

    // Rebuild indexes
    Promise.all([buildSearchIndex(), buildNavTree()]).catch(() => {});

    // Log to history
    logAction({
      type: "resource",
      title: plan.title,
      summary: plan.reason,
      agentThoughts: [
        `**Validation:** Relevant — ${validation.reason}`,
        `**Tags:** ${validation.suggestedTags.join(", ")}`,
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

    return NextResponse.json({
      message: `Resource integrated: ${plan.reason}`,
      path: plan.path,
      action: plan.action,
    });
  } catch (err) {
    console.error("[resources] Content generation error:", (err as Error).message);
    return NextResponse.json(
      { detail: `Failed to generate content: ${(err as Error).message}` },
      { status: 502 }
    );
  }
}
