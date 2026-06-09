import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="space-y-5">
        <h1 className="text-4xl font-bold tracking-tight">AppHub</h1>
        <p className="text-lg text-muted max-w-2xl leading-relaxed">
          A skill-first knowledge base for mobile-app & SaaS growth — bite-size,
          sourced entries on onboarding, paywalls, pricing, retention,
          acquisition, ASO, and attribution. Your AI assistant pulls from it to
          ground advice in real numbers instead of generic tips.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/wiki"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Browse the Knowledge Base
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/developer"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent/40"
          >
            Connect the skill
          </Link>
        </div>
      </section>

      {/* Getting started */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Getting started</h2>
        <div className="space-y-3">
          <Step number={1} title="Connect the skill or API" href="/developer">
            Install the Claude Code skill (or use the JSON API) so your AI
            assistant pulls from AppHub automatically the moment you hit a growth
            problem.
          </Step>
          <Step number={2} title="Browse the knowledge base" href="/wiki">
            269 sourced entries across 31 topics — each a single claim with real
            numbers, a confidence level, and where it came from.
          </Step>
          <Step number={3} title="Get grounded, cited advice" href="/wiki">
            Ask your assistant about your app; it compares your onboarding,
            paywall, or pricing against what works and cites the entries it used.
          </Step>
        </div>
      </section>
    </div>
  );
}

function Step({
  number,
  title,
  href,
  children,
}: {
  number: number;
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent/30 hover:shadow-sm"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm group-hover:bg-accent group-hover:text-white transition-colors">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground group-hover:text-accent transition-colors">
          {title}
        </div>
        <p className="text-sm text-muted mt-0.5 leading-relaxed">{children}</p>
      </div>
      <svg
        className="w-5 h-5 text-muted group-hover:text-accent transition-colors flex-shrink-0 mt-1"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
