import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        // Allow optimized images served from the thumbnail API (including dynamic id route)
        pathname: "/api/thumbnail/**",
      },
    ],
  },
};

export default nextConfig;
