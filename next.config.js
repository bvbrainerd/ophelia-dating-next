/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['oyjfhrqfufujmsnqevgr.supabase.co'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'oyjfhrqfufujmsnqevgr.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/avatars/**',
      },
    ],
  },
}

module.exports = nextConfig