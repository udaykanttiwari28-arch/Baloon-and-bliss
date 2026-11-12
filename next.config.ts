import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@react-pdf/renderer', 'canvas'],
  // pdfkit loads its built-in fonts via a dynamic `#standard-fonts/*` import
  // that Vercel's file tracing can't follow, so ship them explicitly.
  outputFileTracingIncludes: {
    '/api/admin/invoices/[id]/pdf': [
      './node_modules/pdfkit/js/standard-fonts/**/*',
      './node_modules/pdfkit/js/data/**/*',
    ],
  },
};

export default nextConfig;
