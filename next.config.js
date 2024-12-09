/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['oyjfhrqfufujmsnqevgr.supabase.co'],
  },
  experimental: {
    serverActions: {
      enabled: true
    }
  },
}

module.exports = nextConfig