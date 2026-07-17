import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow Next.js Image to serve local /public files with no remote domains needed.
    // Investor avatars are downloaded to public/investors/ at build time.
    unoptimized: false,
    localPatterns: [
      {
        pathname: "/investors/**",
      },
    ],
  },
};

export default nextConfig;
