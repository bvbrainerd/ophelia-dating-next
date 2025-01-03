/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oyjfhrqfufujmsnqevgr.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: true,
    domains: [
      // ... existing domains
    ],
  },
};

export default nextConfig;
