/** @type {import('next').NextConfig} */
const nextConfig = {
  // 移除过时的 appDir 配置，Next.js 14 默认支持 App Router
  trailingSlash: false,
  swcMinify: true,
  // 修复 Edge Runtime 兼容性问题
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  // 添加重定向规则，处理域名和密码重置
  async redirects() {
    return [
      // 处理不带www的域名访问（仅在生产环境）
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'dufutao.asia',
          },
        ],
        destination: 'https://www.dufutao.asia/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
