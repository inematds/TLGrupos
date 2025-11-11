/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Necessário para Docker (standalone build)
  output: 'standalone',
}

module.exports = nextConfig
