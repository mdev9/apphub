import Link from "next/link";
import { LiveStats } from "@/components/home/LiveStats";

export default function Home() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="space-y-6 pt-4">
        <LiveStats />

        <h1 className="text-5xl font-bold tracking-tight leading-[1.05]">
          The growth knowledge base
          <br />
          <span className="bg-gradient-to-r from-[#2563eb] to-[#7c9dff] bg-clip-text text-transparent dark:from-[#3b82f6] dark:to-[#93b4ff]">
            your AI reads for you.
          </span>
        </h1>

        <p className="text-lg text-muted max-w-2xl leading-relaxed">
          Bite-size, evidence-backed entries on onboarding, paywalls, pricing,
          retention, ads, ASO, and attribution. Your assistant pulls from it to
          ground advice in real numbers — not generic tips.
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 hover:shadow"
          >
            Browse the Knowledge Base
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/connect-your-ai-agent"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/40"
          >
            Connect your AI agent
          </Link>
        </div>
      </section>

      {/* Demo: what the skill actually does */}
      <section>
        <SkillDemo />
      </section>

      {/* How it works */}
      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
          <p className="text-muted mt-1">Connect once. Then your assistant just knows.</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <HowStep
            n={1}
            title="Connect once"
            href="/connect-your-ai-agent"
            body="Install the Claude Code skill or point any agent at the JSON API."
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 10V3L4 14h7v7l9-11h-7z" />
            }
          />
          <HowStep
            n={2}
            title="It pulls automatically"
            href="/library"
            body="Hit a growth question — your assistant reads the catalog, searches, and fetches the entries that matter. No prompting required."
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            }
          />
          <HowStep
            n={3}
            title="Cited, grounded fixes"
            href="/library"
            body="It compares your real app against what works and returns prioritized changes — each backed by a sourced entry."
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            }
          />
        </div>
      </section>
    </div>
  );
}

/* A faux terminal showing the skill in action — the value prop, made tangible. */
function SkillDemo() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#0b1120] shadow-lg dark:bg-[#0a0f1a]">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-xs text-slate-400">your AI assistant + AppHub skill</span>
      </div>
      <div className="space-y-4 p-5 font-mono text-[13px] leading-relaxed">
        <div className="text-slate-300">
          <span className="select-none text-accent">you ❯ </span>
          my subscription app&apos;s onboarding doesn&apos;t convert — few start a trial. what do I do?
        </div>
        <div className="text-slate-500">
          <span className="select-none text-[#28c840]">apphub ❯ </span>
          ingesting catalog · searching “onboarding”, “activation”, “first screen” · reading 4 entries…
        </div>
        <div className="space-y-1.5 rounded-lg border border-white/10 bg-white/[0.03] p-3.5 text-slate-300">
          <Line badge="high" topic="onboarding">
            96–97% drop-off on page 1 is a copywriting / first-impression problem — not the algo or price.
          </Line>
          <Line badge="high" topic="onboarding">
            Two contextual in-app quests lifted trial-to-paid from ~19% → 31%.
          </Line>
          <Line badge="debated" topic="paywall">
            Hard paywall converts ~4–5× freemium (RevenueCat) — both sides noted.
          </Line>
        </div>
        <div className="text-slate-300">
          <span className="select-none text-[#28c840]">apphub ❯ </span>
          your first screen sells the solution before the problem. fix:&nbsp;
          <span className="text-slate-400">
            lead with the pain, add one highlighted action, defer the trial ask…
          </span>
          <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-slate-400" />
        </div>
      </div>
    </div>
  );
}

function Line({
  badge,
  topic,
  children,
}: {
  badge: string;
  topic: string;
  children: React.ReactNode;
}) {
  const tone =
    badge === "high"
      ? "text-[#28c840] border-[#28c840]/30"
      : badge === "debated"
        ? "text-[#c08cff] border-[#c08cff]/30"
        : "text-[#febc2e] border-[#febc2e]/30";
  return (
    <div className="flex items-start gap-2">
      <span className="text-slate-600 select-none">•</span>
      <span className="flex-1">
        {children}
        <span className={`ml-2 rounded-full border px-1.5 py-0.5 text-[10px] ${tone}`}>{badge}</span>
        <span className="ml-1.5 text-[10px] text-slate-600">{topic}</span>
      </span>
    </div>
  );
}

function HowStep({
  n,
  title,
  body,
  href,
  icon,
}: {
  n: number;
  title: string;
  body: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
    >
      {/* top accent that reveals on hover */}
      <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-accent to-[#7c9dff] opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-white">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {icon}
          </svg>
        </span>
        <span className="bg-gradient-to-br from-[#2563eb] to-[#9db8ff] bg-clip-text font-mono text-3xl font-bold leading-none text-transparent opacity-40">
          {n}
        </span>
      </div>
      <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-muted leading-relaxed">{body}</p>
    </Link>
  );
}
