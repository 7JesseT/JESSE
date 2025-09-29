/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es'],
    localeDetection: true,
  },
}

export default nextConfig
