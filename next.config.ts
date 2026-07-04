import type { NextConfig } from "next";

const apiUrl =
  process.env.API_URL ??
  "https://living-paris-api.living-paris.workers.dev";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
