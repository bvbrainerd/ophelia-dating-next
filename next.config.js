/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: () => 'build-' + Date.now(),
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
  }
  
  module.exports = nextConfig