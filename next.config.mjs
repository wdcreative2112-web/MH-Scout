/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@prisma/client',
    'bcryptjs',
    '@neondatabase/serverless',
    '@prisma/adapter-neon',
    'postgres-array',
    'ws',
  ],
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
