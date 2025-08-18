/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // This is required for Sentry to work correctly.
  // It ensures source maps are uploaded for error monitoring.
  sentry: {
    hideSourceMaps: true,
  },
};

module.exports = nextConfig;
