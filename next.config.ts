import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set generateBuildId to fix build error
  generateBuildId: async () => {
    return null; // Let Next.js generate the build ID
  },
};

export default nextConfig;
