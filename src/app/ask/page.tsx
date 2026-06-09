"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const { text, loading, phase, error, done, stream, reset } = useStreamingResponse();
  const router = useRouter();
  const aiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED !== "false";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const result = await stream(question);

    if (result) {
      // Save the article
      try {
        const res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: result, question }),
        });
        if (res.ok) {
          const { slug } = await res.json();
          // Navigate after a short delay so user sees the completed article
          setTimeout(() => router.push(`/articles/${slug}`), 1500);
        }
      } catch {
        // Article saved locally even if R2 fails
      }
    }
  }

  if (!aiEnabled) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-accent-light mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">AI Features Unavailable</h1>
        <p className="text-muted max-w-md mx-auto">
          AI-powered Q&A is available when running locally with the Claude proxy.
          Browse existing articles and wiki content instead.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ask a Question</h1>
        <p className="text-muted mt-1">
          Get an in-depth, data-driven article answering your mobile app growth question
        </p>
      </div>

      {/* Question form */}
      {!text && !loading && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., How do I reduce churn on my subscription app? What are the best monetization strategies for a free-to-play game?"
            className="w-full rounded-xl border border-border bg-surface p-4 text-foreground placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            rows={4}
          />
          <div className="text-xs text-muted leading-relaxed">
            Articles generated here are published publicly for everyone to read.
            For personal questions, use the{" "}
            <a href="/connect-your-ai-agent" className="text-accent hover:underline">Claude Code skill</a>{" "}
            or the{" "}
            <a href="/connect-your-ai-agent" className="text-accent hover:underline">API</a> instead.
          </div>
          <button
            type="submit"
            disabled={!question.trim()}
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Article
          </button>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-4">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <button
            onClick={reset}
            className="mt-2 text-sm text-red-600 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Streaming response */}
      {(text || loading) && (
        <div className="relative">
          {loading && (
            <div className="sticky top-16 z-10 bg-accent-light border border-accent/20 rounded-lg px-4 py-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-sm text-accent font-medium">
                  {phase === "researching"
                    ? "Researching..."
                    : "Writing article..."}
                </span>
              </div>
              {phase === "researching" && (
                <p className="text-xs text-accent/70 mt-1 ml-4">
                  Searching AppHub knowledge base, analyzing existing content, gathering data and frameworks
                </p>
              )}
              {/* Phase steps */}
              <div className="flex items-center gap-2 mt-2 ml-4">
                <div className={`h-1 flex-1 rounded-full ${phase === "researching" ? "bg-accent animate-pulse" : "bg-accent"}`} />
                <div className={`h-1 flex-1 rounded-full ${phase === "writing" ? "bg-accent animate-pulse" : phase === "researching" ? "bg-border" : "bg-accent"}`} />
              </div>
              <div className="flex justify-between mt-1 ml-4 text-[10px] text-accent/60">
                <span>Research</span>
                <span>Write</span>
              </div>
            </div>
          )}
          {done && (
            <div className="sticky top-16 z-10 flex items-center gap-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2 mb-4">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                Article saved! Redirecting...
              </span>
            </div>
          )}
          <MarkdownRenderer content={text} />
        </div>
      )}

      {/* Example questions */}
      {!text && !loading && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Example questions
          </h3>
          {[
            "How do I validate my app idea for market demand?",
            "What are the most effective strategies to reduce churn?",
            "How should I price my subscription app?",
            "What metrics matter most for a mobile app in the first year?",
            "How do I optimize my App Store listing for organic growth?",
          ].map((q) => (
            <button
              key={q}
              onClick={() => setQuestion(q)}
              className="block w-full text-left rounded-lg border border-border bg-surface px-4 py-3 text-sm text-muted hover:text-foreground hover:border-accent/30 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
