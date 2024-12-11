/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oyjfhrqfufujmsnqevgr.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    unoptimized: true
  },
}

module.exports = nextConfig