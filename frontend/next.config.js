/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: process.env.NODE_ENV === 'production',
  swcMinify: true,
  images: {
    domains: ['www.laquiniela247.mx'],
    unoptimized: false
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'La Quiniela 247',
    NEXT_PUBLIC_APP_VERSION: '1.0.0'
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/login',
        permanent: false
      }
    ];
  },
  experimental: {
    optimizeCss: true
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

module.exports = nextConfig;