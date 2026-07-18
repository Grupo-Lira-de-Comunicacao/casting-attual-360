/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.2.121'],
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
