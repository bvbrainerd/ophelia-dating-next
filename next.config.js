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
  // Disable static exports
  trailingSlash: false,
  distDir: '.next'
};

module.exports = nextConfig;