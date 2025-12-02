import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        // Allow optimized images served from the thumbnail API (including dynamic id route)
        pathname: "/api/thumbnail/**",
      },
      {
        // Allow user-uploaded avatars from the public/avatars directory
        pathname: "/avatars/**",
      },
      {
        // Allow user-uploaded profile headers from the public/headers directory
        pathname: "/headers/**",
      },
    ],
  },
};

export default nextConfig;
