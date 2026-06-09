import { NextRequest, NextResponse } from "next/server";
import { ask, isAiEnabled, SYSTEM_PROMPTS, proxyHeaders as getProxyHeaders } from "@/lib/claude";
import { isProxyAvailable } from "@/lib/queue";
import { getSearchIndex, createMiniSearch } from "@/lib/search";
import { getObject } from "@/lib/r2";
import { writesBlocked } from "@/lib/writes";

export const maxDuration = 300;

const PROXY_URL = process.env.CLAUDE_PROXY_URL || "http://localhost:9100";

// Research phase: gather AppHub knowledge + ask AI to find gaps
async function research(question: string): Promise<string> {
  const sections: string[] = [];

  // 1. Search AppHub for relevant existing content
  try {
    const docs = await getSearchIndex();
    const ms = createMiniSearch(docs);
    const results = ms.search(question).slice(0, 5);

    if (results.length > 0) {
      sections.push("## Existing AppHub Knowledge\n");
      for (const hit of results) {
        const doc = docs.find((d) => d.id === hit.id);
        if (!doc) continue;
        const raw = await getObject(doc.id);
        if (!raw) continue;
        // Include the full page content for the AI to synthesize
        sections.push(`### ${doc.title} (${doc.type}: ${doc.path})\n${raw}\n`);
      }
    }
  } catch {
    // Search unavailable, continue without
  }

  // 2. Ask AI to do deep research and identify what else is needed
  try {
    const researchRes = await ask({
      prompt: `You are researching this question: "${question}"

${sections.length > 0 ? `Here is what our knowledge base already contains on this topic:\n\n${sections.join("\n")}\n\n` : "Our knowledge base has no existing content on this topic.\n\n"}

Do deep research on this question. Think step by step:
1. What do we already know from the AppHub knowledge base above?
2. What critical gaps exist? What data, frameworks, case studies, or counterarguments are missing?
3. From your own training knowledge, what are the most important additional insights, data points, industry benchmarks, and real-world examples that should be included?
4. What are the contrarian or non-obvious takes on this topic that most people miss?
5. Are there any common misconceptions you should address?

Compile ALL your research findings as detailed notes. Include specific numbers, named companies, frameworks, and citations where possible. Be thorough — this research will be used to write a definitive article.`,
      system: "You are a thorough research analyst specializing in mobile app growth. Compile detailed research notes. Be specific — include numbers, company names, and frameworks. Do not write the article yet, just compile research.",
    });
    sections.push("\n## Additional Research\n" + researchRes.result);
  } catch {
    // Research step failed, continue with what we have
  }

  return sections.join("\n");
}

export async function POST(req: NextRequest) {
  const blocked = writesBlocked();
  if (blocked) return blocked;
  if (!isAiEnabled()) {
    return NextResponse.json(
      { detail: "AI features are not available in production" },
      { status: 503 }
    );
  }

  const { question } = await req.json();

  if (!question?.trim()) {
    return NextResponse.json(
      { detail: "Question is required" },
      { status: 400 }
    );
  }

  if (!(await isProxyAvailable())) {
    return NextResponse.json(
      { detail: "Claude proxy is offline. Please try again later." },
      { status: 503 }
    );
  }

  // Phase 1: Research (non-streaming)
  // Send a "researching" event first so the UI can show status
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        // Signal research phase
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "status", status: "researching" })}\n\n`
          )
        );

        const researchNotes = await research(question);

        // Signal writing phase
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "status", status: "writing" })}\n\n`
          )
        );

        // Phase 2: Generate article with full research context (streaming)
        const proxyRes = await fetch(`${PROXY_URL}/v1/messages`, {
          method: "POST",
          headers: getProxyHeaders(),
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 16384,
            stream: true,
            system: SYSTEM_PROMPTS.articleGeneration,
            messages: [
              {
                role: "user",
                content: `Write a comprehensive, definitive article answering this question:\n\n"${question}"\n\nHere is your research:\n\n${researchNotes}\n\nUsing ALL of the above research, write the best possible article. Synthesize the AppHub knowledge base content with the additional research. Where sources conflict, analyze why and give your own reasoned opinion. Include specific numbers, frameworks, and actionable advice. Do not just summarize — add your own analysis and connections between ideas.\n\nRemember to include YAML frontmatter with title, description, and tags. Do NOT wrap in markdown fences.`,
              },
            ],
          }),
        });

        if (!proxyRes.ok) {
          const err = await proxyRes.text();
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: `Proxy error: ${err}` })}\n\n`
            )
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }

        // Stream the article
        const reader = proxyRes.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);
              if (
                event.type === "content_block_delta" &&
                event.delta?.type === "text_delta"
              ) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text", text: event.delta.text })}\n\n`
                  )
                );
              }
            } catch {
              // skip
            }
          }
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "error", error: (err as Error).message })}\n\n`
          )
        );
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
