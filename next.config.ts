import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set generateBuildId to fix build error
  generateBuildId: async () => {
    return null; // Let Next.js generate the build ID
  },
  // Include themes folder in Vercel serverless function bundle
  outputFileTracingIncludes: {
    '/api/ai/liquid-preview': ['./themes/**/*'],
    '/api/ai/section-preview': ['./themes/**/*'],
    '/api/shopify/[...path]': ['./themes/**/*'],
  },
};

export default nextConfig;
