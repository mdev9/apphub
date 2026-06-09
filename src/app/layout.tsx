import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
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
        <div className="flex h-full">
          <Sidebar />
          <div className="flex flex-1 flex-col min-w-0 ml-[var(--sidebar-w)]">
            <Header />
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-4xl px-8 py-10">{children}</div>
            </main>
          </div>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
