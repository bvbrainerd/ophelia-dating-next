/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your config options here
  reactStrictMode: true,
  images: {
    domains: [process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')].filter(Boolean),
  },
};

export default nextConfig;