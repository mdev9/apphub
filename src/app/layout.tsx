import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://apphub.marijn.fr"),
  title: "AppHub — Mobile App Growth Knowledge Base",
  description:
    "Data-driven knowledge base for building and scaling mobile apps. AI-curated resources on acquisition, monetization, retention, and growth.",
  openGraph: {
    title: "AppHub — Mobile App Growth Knowledge Base",
    description:
      "AI-curated resources on acquisition, monetization, retention, and growth. Data-driven. Skeptical. Actionable.",
    siteName: "AppHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AppHub — Mobile App Growth Knowledge Base",
    description:
      "AI-curated resources on acquisition, monetization, retention, and growth.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full">
        <AppShell>{children}</AppShell>
        <Analytics />
      </body>
    </html>
  );
}
