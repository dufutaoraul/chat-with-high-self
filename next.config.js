/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // 确保只使用App Router
  trailingSlash: false,
  // 优化构建
  swcMinify: true,
}

module.exports = nextConfig