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
  // Build configuration
  distDir: '.next',
  reactStrictMode: true,
};

module.exports = nextConfig;