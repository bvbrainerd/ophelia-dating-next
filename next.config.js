/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // domains: [
    //   'oyjfhrqfufujmsnqevgr.supabase.co',
    //   'localhost',
    //   'supabase.co'
    // ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oyjfhrqfufujmsnqevgr.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}

module.exports = nextConfig
