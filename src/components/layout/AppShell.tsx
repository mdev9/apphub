"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

/**
 * The homepage reads as a landing page: no sidebar, and the AppHub logo moves
 * into the top bar (where breadcrumbs sit elsewhere). Every other route keeps
 * the fixed sidebar + breadcrumb header.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  if (isHome) {
    return (
      <div className="flex h-full flex-col">
        <Header brand />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="ml-[var(--sidebar-w)] flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-8 py-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
