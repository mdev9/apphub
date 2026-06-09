import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">AppHub</h1>
        <p className="text-lg text-muted max-w-2xl leading-relaxed">
          A data-driven knowledge base for building and scaling mobile apps.
          AI-curated resources on acquisition, monetization, retention, and
          growth — skeptical, rational, and backed by evidence.
        </p>
      </section>

      {/* Quick actions */}
      <section className="grid gap-4 sm:grid-cols-3">
        <ActionCard
          href="/wiki"
          title="Knowledge Base"
          description="Browse curated wiki pages on mobile app growth strategies"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          }
        />
        <ActionCard
          href="/ask"
          title="Ask a Question"
          description="Get an AI-generated, in-depth article answering your question"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          }
        />
        <ActionCard
          href="/articles"
          title="Browse Articles"
          description="Explore AI-generated articles ranked by popularity and quality"
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
            />
          }
        />
      </section>

      {/* Getting started */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Try it yourself</h2>
        <div className="space-y-3">
          <Step number={1} title="Read an article" href="/wiki">
            Browse the knowledge base — each page is a structured breakdown with real data, frameworks, and actionable advice.
          </Step>
          <Step number={2} title="Ask a question" href="/ask">
            The AI searches the knowledge base and answers from the curated entries — grounded in real numbers and sources.
          </Step>
          <Step number={3} title="Connect your tools" href="/developer">
            Install the Claude Code skill or use the API so your AI assistant pulls from AppHub automatically when you hit a growth problem.
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

function ActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-surface p-5 transition-all hover:border-accent/30 hover:shadow-sm"
    >
      <div className="mb-3 w-10 h-10 rounded-lg bg-accent-light flex items-center justify-center">
        <svg
          className="w-5 h-5 text-accent"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {icon}
        </svg>
      </div>
      <h3 className="font-semibold text-foreground mb-1 group-hover:text-accent transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </Link>
  );
}
