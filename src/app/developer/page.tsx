"use client";

import { useState, useEffect, useCallback } from "react";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/help",
    description: "API overview with agent prompt and endpoint documentation",
    example: null,
  },
  {
    method: "GET",
    path: "/api/index",
    description: "Full site index — all wiki pages and articles with metadata",
    example: null,
  },
  {
    method: "GET",
    path: "/api/search?q=churn",
    description: "Server-side full-text search with fuzzy matching",
    example: "churn",
  },
  {
    method: "GET",
    path: "/api/wiki/nav",
    description: "Navigation tree with categories and pages",
    example: null,
  },
  {
    method: "GET",
    path: "/api/wiki/retention/churn-prevention",
    description: "Read a specific wiki page (markdown content + metadata)",
    example: null,
  },
  {
    method: "GET",
    path: "/api/articles?sort=popular",
    description: "List articles sorted by popularity, recency, or AI rating",
    example: null,
  },
  {
    method: "GET",
    path: "/api/articles/:slug",
    description: "Read a single article with AI rating and view tracking",
    example: null,
  },
];

export default function DeveloperPage() {
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [agentPrompt, setAgentPrompt] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState("http://localhost:3000");

  useEffect(() => {
    setBaseUrl(window.location.origin);
    fetch("/api/help")
      .then((r) => r.json())
      .then((d) => {
        setAgentPrompt(d.agent_prompt);
        setBaseUrl(d.base_url);
      })
      .catch(() => {});
  }, []);

  const installPrompt = `Create a Claude Code skill at ~/.claude/skills/apphub/SKILL.md with this content:

---
name: apphub
description: Search the AppHub mobile app growth knowledge base for data-driven strategies on acquisition, monetization, retention, ASO, and scaling
---

TRIGGER: When the user asks about mobile app growth, monetization, user acquisition, retention, churn, ASO, app store optimization, subscription pricing, or any topic related to building and scaling mobile apps.

Search AppHub for relevant knowledge:

1. First, search for the topic:
   Fetch ${baseUrl}/api/search?q={relevant keywords from the user's question}

2. Read the top results:
   For each relevant result, fetch ${baseUrl}/api{result.path} to get the full content.

3. Synthesize the information from AppHub with your own knowledge to give the user a comprehensive answer. Always cite which AppHub pages you pulled from.

If no relevant results are found, answer from your own knowledge and mention that AppHub doesn't have content on this topic yet.`;

  async function tryEndpoint(path: string) {
    setActiveEndpoint(path);
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch(path);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (e) {
      setResponse(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API</h1>
        <p className="text-muted mt-1">
          Use these endpoints to integrate AppHub with AI agents, scripts, or other tools
        </p>
      </div>

      {/* Claude Code Skill */}
      <CopyableSection
        title="Claude Code Skill"
        description="Paste this into Claude Code to install AppHub as a skill"
        content={installPrompt}
        copyText={installPrompt}
      />

      {/* Agent prompt */}
      <CopyableSection
        title="Agent System Prompt"
        description="Give this to an AI agent so it can autonomously browse and use AppHub"
        content={agentPrompt || "Loading..."}
        copyText={agentPrompt}
      />

      {/* Endpoints */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Endpoints</h2>
        <div className="space-y-2">
          {ENDPOINTS.map((ep) => (
            <div
              key={ep.path}
              className="rounded-lg border border-border bg-surface overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded flex-shrink-0">
                  {ep.method}
                </span>
                <code className="text-sm font-mono text-foreground flex-1 truncate">
                  {ep.path}
                </code>
                <button
                  onClick={() => tryEndpoint(ep.path)}
                  className="text-xs font-medium text-accent hover:underline flex-shrink-0"
                >
                  Try it
                </button>
              </div>
              <div className="px-4 pb-3">
                <p className="text-xs text-muted">{ep.description}</p>
              </div>

              {activeEndpoint === ep.path && (
                <div className="border-t border-border">
                  {loading ? (
                    <div className="p-4 text-xs text-muted animate-pulse">
                      Loading...
                    </div>
                  ) : (
                    <pre className="p-4 text-xs font-mono text-foreground bg-background overflow-x-auto max-h-80 overflow-y-auto">
                      {response}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-all ${
        copied
          ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/40 dark:text-green-400"
          : "border-border bg-background text-muted hover:text-foreground hover:border-accent/30"
      }`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function CopyableSection({
  title,
  description,
  content,
  copyText,
}: {
  title: string;
  description: string;
  content: string;
  copyText: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-accent-light/30">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted mt-0.5">{description}</p>
        </div>
        <CopyButton text={copyText} />
      </div>
      <div className="p-4">
        <pre className="text-xs font-mono text-foreground bg-background rounded-lg border border-border p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
}
