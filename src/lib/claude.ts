const PROXY_URL = process.env.CLAUDE_PROXY_URL || "http://localhost:9100";

// Cloudflare Access service token for authenticating with the remote proxy
const CF_ACCESS_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID || "";
const CF_ACCESS_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET || "";

export function isAiEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AI_ENABLED !== "false";
}

export function proxyHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": "x",
    "anthropic-version": "2023-06-01",
  };
  // Add Cloudflare Access headers if configured (remote proxy)
  if (CF_ACCESS_CLIENT_ID && CF_ACCESS_CLIENT_SECRET) {
    headers["CF-Access-Client-Id"] = CF_ACCESS_CLIENT_ID;
    headers["CF-Access-Client-Secret"] = CF_ACCESS_CLIENT_SECRET;
  }
  return headers;
}

interface AskOptions {
  prompt: string;
  system?: string;
  model?: string;
}

interface AskResponse {
  result: string;
  model: string;
}

export async function ask(options: AskOptions): Promise<AskResponse> {
  const model = options.model || "claude-sonnet-4-6";

  const body: Record<string, unknown> = {
    model,
    max_tokens: 8192,
    stream: true,
    messages: [{ role: "user", content: options.prompt }],
  };
  if (options.system) {
    body.system = options.system;
  }

  const res = await fetch(`${PROXY_URL}/v1/messages`, {
    method: "POST",
    headers: proxyHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude proxy error: ${err}`);
  }

  const text = await collectStreamText(res.body!);
  return { result: text, model };
}

async function collectStreamText(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      try {
        const event = JSON.parse(data);
        if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
          result += event.delta.text;
        }
      } catch {
        // skip
      }
    }
  }

  return result;
}

/** Extract JSON from a response that may be wrapped in ```json ... ```
 *  Also handles unescaped newlines inside JSON string values */
export function extractJson(text: string): string {
  let raw = text.trim();
  const fenced = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenced) raw = fenced[1].trim();

  // Try parsing directly first
  try {
    JSON.parse(raw);
    return raw;
  } catch {
    // Fix unescaped newlines inside JSON string values
    // Replace literal newlines inside strings with \n
    const fixed = raw.replace(/"(?:[^"\\]|\\.)*"/gs, (match) => {
      return match.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
    });
    try {
      JSON.parse(fixed);
      return fixed;
    } catch {
      // Last resort: extract fields manually for integration responses
      return raw;
    }
  }
}

export async function askStream(
  options: AskOptions
): Promise<ReadableStream<Uint8Array>> {
  const model = options.model || "claude-sonnet-4-6";

  const body: Record<string, unknown> = {
    model,
    max_tokens: 8192,
    stream: true,
    messages: [{ role: "user", content: options.prompt }],
  };
  if (options.system) {
    body.system = options.system;
  }

  const res = await fetch(`${PROXY_URL}/v1/messages`, {
    method: "POST",
    headers: proxyHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude proxy error: ${err}`);
  }

  return res.body!;
}

// --- System prompts ---

export const SYSTEM_PROMPTS = {
  articleGeneration: `You are an expert mobile app growth consultant and analyst. You write thorough, data-driven articles about building and scaling mobile apps for maximum revenue and growth.

Your writing style:
- Structured like a scientific essay: clear thesis, evidence-based arguments, actionable conclusions
- Skeptical and rational — always question conventional wisdom
- Back claims with data, case studies, or logical reasoning when possible
- Acknowledge trade-offs and nuance — no silver bullets
- Practical and actionable — readers should be able to apply your advice immediately

Format your response as a complete markdown article with YAML frontmatter:
---
title: "Article Title Here"
description: "One-line description"
tags: ["tag1", "tag2", "tag3"]
---

# Article Title

## Introduction
...

Use ## for major sections, ### for subsections. Include code examples, formulas, or frameworks where relevant. End with a clear "Key Takeaways" section.`,

  resourceValidation: `You are a content filter for a mobile app growth knowledge base. Your job is to determine if submitted content is relevant to building, growing, or monetizing mobile applications.

Relevant topics include: user acquisition, retention, monetization, ASO, analytics, A/B testing, push notifications, onboarding, churn prevention, subscription models, in-app purchases, ad monetization, app store optimization, growth hacking, product-market fit validation, mobile UX, performance optimization, and related topics.

Respond with ONLY a JSON object:
{"relevant": true/false, "reason": "brief explanation", "suggestedTags": ["tag1", "tag2"]}

Be VERY strict. Reject ALL of the following:
- Content that is not specifically about mobile app growth, monetization, or optimization
- Generic greetings, test messages, or gibberish (e.g., "hello", "test", "asdf")
- Content that is too short or vague to extract any actionable insight (minimum: a concrete data point, framework, or strategy)
- Generic marketing fluff without specific numbers, examples, or frameworks
- Spam or malicious content
- Content that merely names a topic without providing substance (e.g., "retention is important" with no specifics)

If in doubt, reject. The knowledge base must only contain high-quality, actionable content.`,

  resourcePlanning: `You are a knowledge base curator for a mobile app growth wiki. Given new information, decide WHERE and HOW to integrate it. Do NOT write the content yet — only plan.

If the content does not contain enough substance to write a quality wiki page (no concrete data, no frameworks, no actionable strategies), respond with:
{"action": "reject", "reason": "explanation of why this is insufficient"}

Otherwise respond with a JSON object:
{
  "action": "update" | "create",
  "path": "wiki/category/filename.md",
  "title": "Page Title",
  "description": "One-line description of the page",
  "tags": ["tag1", "tag2"],
  "reason": "Why this integration makes sense",
  "keyPoints": ["point 1 to cover", "point 2 to cover", "point 3 to cover"]
}

NEVER create placeholder pages. If the source material is insufficient, reject it.

Categories: acquisition, monetization, retention, analytics, optimization, validation, ux`,

  resourceContent: `You are a knowledge base writer for a mobile app growth wiki. Write a complete wiki page as markdown with YAML frontmatter.

Be thorough, data-driven, and skeptical. Include specific numbers, frameworks, and actionable advice from the source material. Organize logically with clear sections.

IMPORTANT: Output raw markdown directly. Do NOT wrap your response in \`\`\`markdown\`\`\` code fences.

Start your response with the --- frontmatter delimiter. Include a "source" field in frontmatter if a source URL is provided:
---
title: "Title"
description: "One-line description"
tags: ["tag1", "tag2"]
author: "ai"
source: "https://..."
---

# Title

Content here with ## sections...

At the end of the article, add a "## Source" section linking to the original source URL if one was provided.`,

  translation: `You are a professional translator specializing in technical content about mobile app development and growth. Translate the following content from English to French.

Rules:
- Preserve ALL markdown formatting, including frontmatter (but translate frontmatter values)
- Translate naturally — not word-for-word. Adapt idioms and technical terms appropriately
- Keep technical terms that are commonly used in English in the French tech community (e.g., "churn rate", "A/B testing", "onboarding")
- Maintain the same tone and level of expertise
- Preserve code blocks, URLs, and variable names as-is

Add a "lang: fr" field to the frontmatter.`,

  articleRating: `You are a critical reviewer of articles about mobile app growth and revenue optimization. Rate the following article on a scale of 1-10 based on:
- Accuracy and correctness of claims
- Depth of analysis
- Actionability of advice
- Quality of evidence and reasoning
- Completeness

Respond with ONLY a JSON object:
{"rating": 7.5, "reason": "brief explanation of the rating"}`,
};
