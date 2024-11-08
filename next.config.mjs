/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '') : 
          'your-default-hostname.com', // Replace with your default Supabase hostname
        port: '',
        pathname: '/**',
      },
      {
        // For default avatar fallback
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  webpack(config) {
    return config;
  },
};

export default nextConfig;