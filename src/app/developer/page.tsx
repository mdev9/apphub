"use client";

import { useState, useEffect, useCallback } from "react";

const ENDPOINTS = [
  {
    method: "GET",
    path: "/api/catalog",
    description:
      "Compact catalog of EVERY entry (title, claim, numbers, topics, confidence, source). Read this whole list first, then fetch the entries you need. Add ?topic=<name> to filter.",
    example: null,
  },
  {
    method: "GET",
    path: "/api/search?q=onboarding",
    description:
      "Full-text search with synonym expansion + stemming. Returns title, description, a content snippet, and path.",
    example: "onboarding",
  },
  {
    method: "GET",
    path: "/api/wiki/onboarding/onboarding-page-one-drop-off",
    description: "Read a single entry — markdown content + metadata.",
    example: null,
  },
  {
    method: "GET",
    path: "/api/wiki/nav",
    description: "Navigation tree — topics and their entries.",
    example: null,
  },
  {
    method: "GET",
    path: "/api/help",
    description: "API overview + agent system prompt.",
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
description: Pull from the AppHub growth knowledge base to ground advice on a real growth problem. Triggers on onboarding, conversion, paywalls, pricing, retention/churn, user acquisition (TikTok/Meta/Google ads, creatives), ASO, attribution, monetization, landing pages, copywriting, validation, or scaling an app — especially when advising on one of the user's own apps.
---

AppHub (${baseUrl}) is a read-only, curated knowledge base of bite-size, evidence-backed growth entries. You are its main consumer: when the user hits a growth problem, ground your reasoning in it instead of generic advice, and cite the entries you used.

Workflow:
1. Ingest the catalog first — GET ${baseUrl}/api/catalog — and reason over the claims to shortlist relevant entries (the corpus is small enough to read whole). Filter with ?topic=<name> when it maps cleanly.
2. Search to catch anything else — GET ${baseUrl}/api/search?q=<query> (synonym-expanded; returns snippets). Try 2-3 phrasings.
3. Read the entries that matter — GET ${baseUrl}/api/wiki/<category>/<slug> (the catalog apiPath). Respect the confidence field: 'debated' entries present two sides — surface the trade-off. Weigh the source for context.
4. Compare against the user's actual app: read the relevant real code/content (onboarding flow, paywall, landing copy, pricing), compare it to what AppHub says works, and give concrete, prioritized fixes — each backed by the entry it came from (cite title + path).

If the base has nothing on the topic, say so and answer from your own knowledge.`;

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
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Connect your AI agent</h1>
        <p className="text-muted mt-1">
          Install AppHub as a skill, or call the JSON API directly, so your assistant
          grounds growth advice in the knowledge base instead of generic tips.
        </p>
      </div>

      {/* Skill section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Skill</h2>
        <CopyableSection
          title="Claude Code Skill"
          description="Paste this into Claude Code to install AppHub as a skill"
          content={installPrompt}
          copyText={installPrompt}
        />
      </section>

      {/* API section */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">API</h2>
        <CopyableSection
          title="Agent System Prompt"
          description="Give this to any AI agent so it can autonomously browse and use AppHub"
          content={agentPrompt || "Loading..."}
          copyText={agentPrompt}
        />
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted">Endpoints</h3>
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
      </section>
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
