import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable server components optimization
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https', 
        hostname: '*.supabase.in',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  webpack: (config) => {
    // Optimize for better performance
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-dropzone': require.resolve('react-dropzone'),
    };
    return config;
  },
  // Enable compression for better performance
  compress: true,
  // Optimize page loading
  poweredByHeader: false,
  // Enable static optimization
  trailingSlash: false,
  // Environment variables to expose to the client
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
