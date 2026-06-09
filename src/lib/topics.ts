// Display labels for topic slugs (frontmatter topics / folder names).
// Falls back to Title Case for anything not listed.
const LABELS: Record<string, string> = {
  "tiktok-ads": "TikTok Ads",
  "meta-ads": "Meta Ads",
  "aso": "ASO",
  "cta": "CTA",
  "og-image": "OG Image",
  "ai": "AI",
  "paid-ads": "Paid Ads",
  "landing-page": "Landing Page",
  "product-strategy": "Product Strategy",
  "social-proof": "Social Proof",
  "push-notifications": "Push Notifications",
};

export function topicLabel(slug: string): string {
  return (
    LABELS[slug] ??
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

// Primary topic = the folder segment of a /wiki/<topic>/<slug> path.
export function primaryTopic(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[1] ?? "misc";
}
