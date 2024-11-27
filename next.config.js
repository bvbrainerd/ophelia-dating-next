/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'raw.githubusercontent.com',
      process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '') : 
        'your-default-hostname.com'
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    skipTypechecking: true,
    forceSwcTransforms: true,
  }
};

module.exports = nextConfig;