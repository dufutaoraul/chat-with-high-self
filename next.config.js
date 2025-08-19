/** @type {import('next').NextConfig} */
const nextConfig = {
  // 移除过时的 appDir 配置，Next.js 14 默认支持 App Router
  trailingSlash: false,
  swcMinify: true,
  // 修复 Edge Runtime 兼容性问题
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  }
}

module.exports = nextConfig
