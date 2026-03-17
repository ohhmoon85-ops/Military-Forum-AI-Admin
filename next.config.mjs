/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ── 보안 헤더 ─────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://api.anthropic.com https://vercel.com https://*.vercel-blob.com https://*.public.blob.vercel-storage.com",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // ── 이미지 최적화 ──────────────────────────────────────────────────────────
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // ── pdf-parse webpack 설정 ─────────────────────────────────────────────────
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'canvas', 'jsdom']
    }
    return config
  },

  // ── 서버 전용 외부 패키지 ──────────────────────────────────────────────────
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'mammoth'],
  },
}

export default nextConfig
