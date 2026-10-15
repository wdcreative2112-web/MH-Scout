import path from 'path';
import fs from 'fs';
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
    const lucideEsm = path.resolve(__dirname, 'node_modules/lucide-react/dist/esm/lucide-react.mjs');
    if (fs.existsSync(lucideEsm)) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'lucide-react$': lucideEsm,
      };
    }
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
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
