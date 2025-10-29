/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: [
            '@opentelemetry/instrumentation',
            '@opentelemetry/api',
            '@sentry/node-core'
        ]
    },
  reactStrictMode: true,
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
    NEXT_PUBLIC_AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE || 'dashboard'
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