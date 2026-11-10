import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@react-pdf/renderer', 'canvas'],
};

export default nextConfig;
