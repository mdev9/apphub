import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AppHub — Mobile App Growth Knowledge Base";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0b1120 0%, #1e293b 50%, #0f172a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "32px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            A
          </div>
          <span style={{ color: "#e2e8f0", fontSize: "36px", fontWeight: 700, letterSpacing: "-0.5px" }}>
            AppHub
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            color: "#f8fafc",
            fontSize: "56px",
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-1px",
            marginBottom: "24px",
            maxWidth: "800px",
          }}
        >
          Mobile App Growth Knowledge Base
        </div>

        {/* Description */}
        <div
          style={{
            color: "#94a3b8",
            fontSize: "24px",
            lineHeight: 1.5,
            maxWidth: "700px",
          }}
        >
          AI-curated resources on acquisition, monetization, retention, and growth. Data-driven. Skeptical. Actionable.
        </div>

        {/* Tags */}
        <div style={{ display: "flex", gap: "12px", marginTop: "40px" }}>
          {["Acquisition", "Monetization", "Retention", "Analytics", "ASO"].map(
            (tag) => (
              <div
                key={tag}
                style={{
                  background: "rgba(37, 99, 235, 0.15)",
                  border: "1px solid rgba(37, 99, 235, 0.3)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: "#60a5fa",
                  fontSize: "16px",
                  fontWeight: 500,
                }}
              >
                {tag}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
