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
  // Explicitly disable static exports
  experimental: {
    serverActions: true
  },
  // Disable static exports
  trailingSlash: false,
  // Ensure proper handling of dynamic routes
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true
};

module.exports = nextConfig;