import type { NextConfig } from "next";

const apiOrigin =
  process.env.API_PROXY_ORIGIN ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://allremotes.vercel.app");

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: "/remotes/:path*",
        destination: "https://allremotes.vercel.app/remotes/:path*",
      }
    ];
  },
};

export default nextConfig;
