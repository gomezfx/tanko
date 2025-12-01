import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: "/api/thumbnail",
        search: "**",
      },
    ],
  },
};

export default nextConfig;
