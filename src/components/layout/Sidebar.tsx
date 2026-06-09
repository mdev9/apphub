"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { NavTree, NavItem } from "@/lib/nav";

const ICON_KB = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 6.5C10.5 5.5 8.5 5 6.5 5c-1 0-2 .12-2.5.3v12.4c.5-.18 1.5-.3 2.5-.3 2 0 4 .5 5.5 1.5m0-13.4c1.5-1 3.5-1.5 5.5-1.5 1 0 2 .12 2.5.3v12.4c-.5-.18-1.5-.3-2.5-.3-2 0-4 .5-5.5 1.5m0-13.4V19.9" />
);
const ICON_AGENT = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.5 3.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5zM17 13l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" />
);

export function Sidebar() {
  const pathname = usePathname();
  const [nav, setNav] = useState<NavTree | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    function fetchNav() {
      fetch("/api/wiki/nav")
        .then((r) => r.json())
        .then(setNav)
        .catch(() => {});
    }
    fetchNav();
    const interval = setInterval(fetchNav, 10_000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  // Auto-expand current section
  useEffect(() => {
    if (!pathname) return;
    const parts = pathname.split("/");
    if (parts[1] === "library" && parts[2]) {
      setExpanded((prev) => new Set(prev).add(parts[2]));
    }
  }, [pathname]);

  function toggleSection(slug: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  return (
    <aside className="fixed top-0 left-0 h-full w-[var(--sidebar-w)] border-r border-border bg-surface overflow-y-auto flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-sm font-mono">A</span>
          </div>
          <span className="font-semibold text-foreground text-lg tracking-tight">
            AppHub
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 text-sm">
        {/* Quick links. Ask + Articles are hidden for now (routes kept, to be
            re-added once improved). */}
        <div className="mb-6">
          <NavLink href="/library" label="Knowledge Base" icon={ICON_KB} active={pathname === "/library"} />
          <NavLink href="/connect-your-ai-agent" label="AI Agents" icon={ICON_AGENT} active={pathname === "/connect-your-ai-agent"} />
        </div>

        {/* Wiki sections */}
        <Link href="/library" className="block mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted hover:text-foreground transition-colors">
          Topics
        </Link>
        {nav?.wiki.map((section) => (
          <div key={section.slug} className="mb-1">
            <button
              onClick={() => toggleSection(section.slug)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left hover:bg-accent-light transition-colors"
            >
              <span className="font-medium text-foreground">{section.title}</span>
              <svg
                className={`w-4 h-4 text-muted transition-transform ${expanded.has(section.slug) ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {expanded.has(section.slug) && section.children && (
              <div className="ml-3 border-l border-border pl-2 mt-1">
                {section.children.map((page) => (
                  <Link
                    key={page.path}
                    href={page.path}
                    className={`block rounded-md px-2 py-1.5 transition-colors ${
                      pathname === page.path
                        ? "bg-accent-light text-accent font-medium"
                        : "text-muted hover:text-foreground hover:bg-accent-light"
                    }`}
                  >
                    {page.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Recent articles */}
        {nav?.articles && nav.articles.length > 0 && (
          <>
            <div className="mt-6 mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Recent Articles
            </div>
            {nav.articles.slice(0, 5).map((article) => (
              <Link
                key={article.path}
                href={article.path}
                className={`block rounded-md px-2 py-1.5 transition-colors text-sm ${
                  pathname === article.path
                    ? "bg-accent-light text-accent font-medium"
                    : "text-muted hover:text-foreground hover:bg-accent-light"
                }`}
              >
                {article.title}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border">
        <a
          href="https://github.com/mdev9/apphub"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          Contribute on GitHub
        </a>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 mb-0.5 transition-colors ${
        active
          ? "bg-accent-light text-accent font-medium"
          : "text-muted hover:text-foreground hover:bg-accent-light"
      }`}
    >
      <svg
        className={`h-[18px] w-[18px] flex-shrink-0 ${active ? "text-accent" : "text-muted"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        {icon}
      </svg>
      {label}
    </Link>
  );
}
