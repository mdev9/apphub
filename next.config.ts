import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@aws-sdk/client-s3"],
  // Keep old shared links working after the route renames.
  async redirects() {
    return [
      { source: "/wiki", destination: "/library", permanent: true },
      { source: "/wiki/:path*", destination: "/library/:path*", permanent: true },
      { source: "/developer", destination: "/connect-your-ai-agent", permanent: true },
    ];
  },
};

export default nextConfig;
