/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize images for Vercel
  images: {
    domains: ['verity-management-system.vercel.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Skip type checking and linting during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize for Vercel deployment
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
