/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['oyjfhrqfufujmsnqevgr.supabase.co'],
    unoptimized: true
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  // Server configuration
  experimental: {
    serverActions: true,
  },
  // Build configuration
  distDir: '.next',
  // Disable static exports since we're using dynamic features
  trailingSlash: false,
  // Enable strict mode for better error catching
  reactStrictMode: true,
};

module.exports = nextConfig;