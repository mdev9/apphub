import { NextRequest, NextResponse } from "next/server";
import { isAiEnabled, SYSTEM_PROMPTS } from "@/lib/claude";

export const maxDuration = 300;

const PROXY_URL = process.env.CLAUDE_PROXY_URL || "http://localhost:9100";

export async function POST(req: NextRequest) {
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

  // Call Anthropic API format via meridian proxy
  const proxyRes = await fetch(`${PROXY_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "x",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      stream: true,
      system: SYSTEM_PROMPTS.articleGeneration,
      messages: [
        {
          role: "user",
          content: `Write a comprehensive article answering this question about mobile app growth and optimization:\n\n"${question}"\n\nRemember to include YAML frontmatter with title, description, and tags.`,
        },
      ],
    }),
  });

  if (!proxyRes.ok) {
    const err = await proxyRes.text();
    return NextResponse.json(
      { detail: `Claude proxy error: ${err}` },
      { status: 502 }
    );
  }

  // Transform Anthropic SSE stream to our simpler format
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const reader = proxyRes.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
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
              // skip malformed events
            }
          }
        }
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
