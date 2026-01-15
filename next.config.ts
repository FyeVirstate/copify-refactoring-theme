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
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Optimize images for faster loading
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images for 1 year
    minimumCacheTTL: 31536000,
  },
  
  // Enable compression
  compress: true,
  
  // Optimize for production
  reactStrictMode: true,
  
  // PoweredByHeader - remove X-Powered-By header for security
  poweredByHeader: false,
  
  // Experimental optimizations
  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: [
      '@tanstack/react-query',
      'lucide-react',
      'recharts',
      'date-fns',
      'framer-motion',
    ],
  },
  
  // Headers for better caching and security
  async headers() {
    return [
      {
        // Apply to all API routes
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
      {
        // Cache static assets
        source: '/:all*(svg|jpg|png|webp|avif|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
