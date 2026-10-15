import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'lucide-react$': path.resolve(__dirname, 'node_modules/lucide-react/dist/esm/lucide-react.mjs'),
    };
    return config;
  },
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
