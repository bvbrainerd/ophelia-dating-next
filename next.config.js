/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['oyjfhrqfufujmsnqevgr.supabase.co'],
    unoptimized: true
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  // Configure for standalone server
  output: 'standalone',
  // Enable server components
  serverComponents: true,
  // Disable static optimization
  staticOptimization: false,
  // Configure trailing slash
  trailingSlash: false
};

module.exports = nextConfig;