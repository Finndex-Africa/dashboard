const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const isDev = process.env.NODE_ENV !== 'production'

// Hosts the browser is allowed to talk to. Derived from config so that changing an
// env var can't silently leave the CSP pointing at the wrong origin.
const originOf = (value) => {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

const IMAGE_HOSTS = [
  'findafriq.nyc3.cdn.digitaloceanspaces.com',
  'findafriq.sfo3.digitaloceanspaces.com',
  'finndexafrica.nyc3.cdn.digitaloceanspaces.com',
  'finndexafrica.sfo3.digitaloceanspaces.com',
  'res.cloudinary.com',
  'images.unsplash.com',
]

const connectSrc = [
  "'self'",
  originOf(process.env.NEXT_PUBLIC_API_URL),
  originOf(process.env.NEXT_PUBLIC_WEBSITE_URL),
  // Stream Chat transport
  'https://chat.stream-io-api.com',
  'wss://chat.stream-io-api.com',
  'https://*.stream-io-api.com',
  'wss://*.stream-io-api.com',
  // Next.js dev server HMR
  isDev ? 'ws://localhost:*' : null,
].filter(Boolean)

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is required by Next.js' inline bootstrap script. 'unsafe-eval'
  // is dev-only (React Refresh); it is NOT present in production.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  // antd and Tailwind inject styles at runtime, so inline styles must be allowed.
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${IMAGE_HOSTS.map((h) => `https://${h}`).join(' ')}`,
  "font-src 'self' data:",
  `connect-src ${connectSrc.join(' ')}`,
  "media-src 'self' https://*.stream-io-api.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  isDev ? null : 'upgrade-insecure-requests',
].filter(Boolean).join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // HSTS is only meaningful over TLS; omitted in dev so localhost isn't pinned to https.
  ...(isDev
    ? []
    : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]),
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',

  // Don't advertise the framework/version to attackers.
  poweredByHeader: false,

  // Never ship browser source maps to production.
  productionBrowserSourceMaps: false,

  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  compiler: {
    // Strip debug logging from production builds; keep error/warn for real diagnostics.
    removeConsole: isDev ? false : { exclude: ['error', 'warn'] },
  },

  images: {
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({ protocol: 'https', hostname })),
    // Refuse to inline SVGs from remote hosts (SVG is a script-execution vector).
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
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

module.exports = withNextIntl(nextConfig)
