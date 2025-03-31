/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Remove the experimental.serverActions line as it's now default
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oyjfhrqfufujmsnqevgr.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        path: false, // Add this line
      };
    }
    return config;
  },
}

module.exports = nextConfig
