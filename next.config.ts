import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/api/thumbnail",
        // Allow any thumbnail request identified by an id query param
        search: "id=**",
      },
    ],
  },
};

export default nextConfig;
