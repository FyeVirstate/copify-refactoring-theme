/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => {
    return null;
  },
  // Disable ESLint during builds (we'll run it separately)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript build errors (we'll check separately)
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
