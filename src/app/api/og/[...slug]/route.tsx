import { ImageResponse } from "next/og";
import { getObject } from "@/lib/r2";
import { parseMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

const CONF: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: "high confidence", color: "#4ade80", bg: "rgba(74,222,128,0.12)" },
  medium: { label: "medium confidence", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  debated: { label: "debated", color: "#c084fc", bg: "rgba(192,132,252,0.12)" },
};

/**
 * Per-entry Open Graph image. Used via metadata (openGraph.images) because the
 * entry route is a catch-all and can't host an opengraph-image.tsx directly.
 * GET /api/og/<category>/<slug>
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await params;

  let title = "Growth Knowledge Base";
  let description = "Bite-size, sourced growth entries.";
  let confidence = "";
  let source = "";
  let topic = slug[0] ?? "";

  const raw = await getObject(`wiki/${slug.join("/")}.md`);
  if (raw) {
    const p = parseMarkdown(raw);
    const fm = p.frontmatter as Record<string, unknown>;
    title = p.title || title;
    description = (typeof fm.claim === "string" && fm.claim) || p.description || description;
    confidence = typeof fm.confidence === "string" ? fm.confidence : "";
    source = typeof fm.source === "string" ? fm.source : "";
    if (Array.isArray(fm.topics) && fm.topics[0]) topic = String(fm.topics[0]);
  }

  const conf = CONF[confidence];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0b1120 0%, #111a2e 55%, #0f172a 100%)",
          padding: "72px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "26px",
                fontWeight: 700,
              }}
            >
              A
            </div>
            <span style={{ color: "#e2e8f0", fontSize: "28px", fontWeight: 700 }}>AppHub</span>
          </div>
          {topic ? (
            <span
              style={{
                color: "#93b4ff",
                fontSize: "20px",
                background: "rgba(37,99,235,0.16)",
                border: "1px solid rgba(37,99,235,0.35)",
                borderRadius: "999px",
                padding: "8px 20px",
              }}
            >
              {topic}
            </span>
          ) : (
            <span />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              color: "#f8fafc",
              fontSize: title.length > 70 ? "52px" : "62px",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-1px",
              maxWidth: "1040px",
            }}
          >
            {title}
          </div>
          <div style={{ color: "#94a3b8", fontSize: "26px", lineHeight: 1.45, maxWidth: "980px", display: "flex" }}>
            {description.length > 160 ? description.slice(0, 157) + "…" : description}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {conf ? (
            <span
              style={{
                color: conf.color,
                background: conf.bg,
                border: `1px solid ${conf.color}55`,
                borderRadius: "999px",
                padding: "8px 18px",
                fontSize: "20px",
              }}
            >
              {conf.label}
            </span>
          ) : (
            <span />
          )}
          {source ? <span style={{ color: "#64748b", fontSize: "20px" }}>{source}</span> : <span />}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
