/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // Skip static page generation errors
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'finndexafrica.nyc3.cdn.digitaloceanspaces.com' },
      { protocol: 'https', hostname: 'finndexafrica.sfo3.digitaloceanspaces.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' }, // Legacy support for existing images
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ]
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE || 'dashboard',
    NEXT_PUBLIC_WEBSITE_URL: process.env.NEXT_PUBLIC_WEBSITE_URL,
  },

  // Resolve OpenTelemetry and instrumentation package conflicts
  experimental: {
    serverComponentsExternalPackages: [
      '@opentelemetry/instrumentation',
      '@opentelemetry/api',
      '@sentry/node-core'
    ]
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore problematic instrumentation packages on server
      config.externals = [
        ...config.externals,
        'import-in-the-middle',
        'require-in-the-middle'
      ]
    }
    return config
  }
}

module.exports = nextConfig
