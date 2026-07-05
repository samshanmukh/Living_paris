import type { NextConfig } from "next";

const apiUrl =
  process.env.API_URL ??
  "https://living-paris-api.living-paris.workers.dev";

/** Cloudflare Worker spatial API — not handled by Next.js route handlers. */
const workerApiRewrites = [
  "/api/datasets",
  "/api/layers/:path*",
  "/api/places",
  "/api/spatial/query",
  "/api/routes",
] as const;

const nextConfig: NextConfig = {
  async rewrites() {
    return workerApiRewrites.map((source) => ({
      source,
      destination: `${apiUrl}${source}`,
    }));
  },
};

export default nextConfig;
