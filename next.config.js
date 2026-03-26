/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Optimize images from shared assets
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'opengateways.com',
      },
      {
        protocol: 'https',
        hostname: '*.opengateways.com',
      },
    ],
  },
  
  // Server external packages for better-sqlite3
  serverExternalPackages: ['better-sqlite3'],
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.opengateways.com',
  },

  // Prevent Nginx from caching optimized images and product image assets
  async headers() {
    return [
      {
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/api/assets/images/products/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
