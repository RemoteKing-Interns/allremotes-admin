import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://allremotes.vercel.app/api/:path*",
      },
      {
        source: "/remotes/:path*",
        destination: "https://allremotes.vercel.app/remotes/:path*",
      }
    ];
  },
};

export default nextConfig;
