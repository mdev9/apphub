"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { SearchDialog } from "@/components/search/SearchDialog";

export function Header({ brand = false }: { brand?: boolean }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Build breadcrumbs from pathname
  const SEGMENT_LABELS: Record<string, string> = {
    "connect-your-ai-agent": "Connect your AI agent",
    library: "Knowledge Base",
    "tiktok-ads": "TikTok Ads",
    aso: "ASO",
    cta: "CTA",
    "og-image": "OG Image",
  };
  const crumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((segment, i, arr) => ({
      label:
        SEGMENT_LABELS[segment] ??
        segment
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      href: "/" + arr.slice(0, i + 1).join("/"),
    }));

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-8 h-14">
        {brand ? (
          /* Homepage: AppHub logo in place of breadcrumbs */
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
              <span className="font-mono text-sm font-bold text-white">A</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              AppHub
            </span>
          </Link>
        ) : (
        /* Breadcrumbs (no "Home" — the AppHub logo already links home) */
        <nav className="flex items-center gap-1.5 text-sm text-muted">
          {crumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-border">/</span>}
              {i === crumbs.length - 1 ? (
                <span className="text-foreground font-medium">
                  {crumb.label}
                </span>
              ) : (
                <a
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </a>
              )}
            </span>
          ))}
        </nav>
        )}

        {/* Search trigger */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:border-accent/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search...
          <kbd className="ml-2 rounded border border-border bg-background px-1.5 py-0.5 text-xs font-mono">
            Ctrl K
          </kbd>
        </button>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
