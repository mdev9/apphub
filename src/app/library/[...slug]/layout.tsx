import type { Metadata } from "next";
import { getObject } from "@/lib/r2";
import { parseMarkdown } from "@/lib/markdown";
import { topicLabel } from "@/lib/topics";

// Per-entry share metadata (og:title / description). The matching
// opengraph-image.tsx renders the image; together they give each entry a
// specific link preview instead of the generic homepage one.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const raw = await getObject(`wiki/${slug.join("/")}.md`);

  const ogUrl = `/api/og/${slug.join("/")}`;
  const ogImage = { url: ogUrl, width: 1200, height: 630 };

  if (raw) {
    const p = parseMarkdown(raw);
    const fm = p.frontmatter as Record<string, unknown>;
    const desc = (typeof fm.claim === "string" && fm.claim) || p.description || "";
    return {
      title: `${p.title} — AppHub`,
      description: desc,
      openGraph: { title: p.title, description: desc, images: [ogImage] },
      twitter: { card: "summary_large_image", title: p.title, description: desc, images: [ogUrl] },
    };
  }

  // Topic (category) page.
  const label = topicLabel(slug[0] ?? "");
  return {
    title: `${label} — AppHub`,
    openGraph: { title: `${label} — AppHub growth entries`, images: [ogImage] },
    twitter: { card: "summary_large_image", title: `${label} — AppHub`, images: [ogUrl] },
  };
}

export default function EntryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
