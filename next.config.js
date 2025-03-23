/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['oyjfhrqfufujmsnqevgr.supabase.co'],
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr']
  }
};

module.exports = nextConfig;