"use client";

import { useState, useEffect } from "react";

type Status = "idle" | "validating" | "integrating" | "success" | "error";

export default function ResourcesPage() {
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [queueCount, setQueueCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const aiEnabled = process.env.NEXT_PUBLIC_AI_ENABLED !== "false";

  // Check queue on load
  useEffect(() => {
    fetch("/api/queue")
      .then((r) => r.json())
      .then((d) => setQueueCount(d.pending + d.failed))
      .catch(() => {});
  }, []);

  async function processQueue() {
    setProcessing(true);
    try {
      const res = await fetch("/api/queue", { method: "POST" });
      const data = await res.json();
      setQueueCount(data.remaining || 0);
      if (data.processed > 0) {
        setStatus("success");
        setMessage(`Processed ${data.processed} queued item(s)`);
      }
    } catch {
    } finally {
      setProcessing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !url.trim()) return;

    const submittedContent = content.trim();
    const submittedUrl = url.trim();

    // Clear form immediately so user knows it was sent
    setContent("");
    setUrl("");
    setStatus("validating");
    setMessage("");

    try {
      setStatus("validating");
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: submittedContent,
          url: submittedUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.detail || "Failed to process resource");
        return;
      }

      if (data.queued) {
        setStatus("success");
        setMessage(data.message);
        return;
      }

      setStatus("success");
      setMessage(data.message || "Resource processed successfully");
    } catch {
      setStatus("error");
      setMessage("Failed to submit resource");
    }
  }

  if (!aiEnabled) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-2">AI Features Unavailable</h1>
        <p className="text-muted">
          Resource processing requires the Claude proxy running locally.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Resource</h1>
        <p className="text-muted mt-1">
          Submit content or URLs to be analyzed and integrated into the knowledge base
        </p>
      </div>

      {/* Queue banner */}
      {queueCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-amber-700 dark:text-amber-400">
              {queueCount} queued item{queueCount > 1 ? "s" : ""} waiting for proxy
            </span>
          </div>
          <button
            onClick={processQueue}
            disabled={processing}
            className="text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 rounded-md px-3 py-1 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50"
          >
            {processing ? "Processing..." : "Process now"}
          </button>
        </div>
      )}

      {/* Progress indicator */}
      {(status === "validating" || status === "integrating") && (
        <div className="rounded-lg border border-accent/20 bg-accent-light p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium text-accent">
                {status === "validating"
                  ? "Validating relevance..."
                  : "Integrating into knowledge base..."}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {status === "validating"
                  ? "AI is checking if this content is relevant to mobile app growth"
                  : "AI is deciding where to place this in the wiki"}
              </p>
            </div>
          </div>
          {/* Step indicators */}
          <div className="flex items-center gap-2 mt-3 ml-5">
            <div className={`h-1 flex-1 rounded-full ${status === "validating" ? "bg-accent animate-pulse" : "bg-accent"}`} />
            <div className={`h-1 flex-1 rounded-full ${status === "integrating" ? "bg-accent animate-pulse" : "bg-border"}`} />
          </div>
          <div className="flex justify-between mt-1 ml-5 text-[10px] text-muted">
            <span>Validate</span>
            <span>Integrate</span>
          </div>
        </div>
      )}

      {/* Success */}
      {status === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-4">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Resource integrated</p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-0.5">{message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30 p-4">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Submission failed</p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">{message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">URL (optional)</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=D_y4ZgBJtRg"
            disabled={status === "validating" || status === "integrating"}
            className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors disabled:opacity-50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste article content, notes, data, research findings, or any relevant information about mobile app growth..."
            disabled={status === "validating" || status === "integrating"}
            className="w-full rounded-xl border border-border bg-surface p-4 text-foreground placeholder:text-muted resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors text-sm disabled:opacity-50"
            rows={12}
          />
        </div>

        <button
          type="submit"
          disabled={status === "validating" || status === "integrating" || (!content.trim() && !url.trim())}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Resource
        </button>
      </form>

      {/* Guidelines */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-2">
        <h3 className="font-semibold text-sm">Submission guidelines</h3>
        <ul className="text-sm text-muted space-y-1 list-disc list-inside">
          <li>Content must be related to mobile app growth, monetization, or optimization</li>
          <li>Include data, case studies, or concrete examples when possible</li>
          <li>Irrelevant or spam submissions will be ignored</li>
        </ul>
      </div>
    </div>
  );
}
