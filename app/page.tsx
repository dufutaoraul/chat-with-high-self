import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="stars-background">
      {/* 导航栏 */}
      <nav className="glass-card border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white text-glow">
                ✨ ChatWithHighSelf
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/signin" className="btn-secondary">
                登录
              </Link>
              <Link href="/signup" className="btn-primary">
                注册
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="floating">
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 text-glow">
                与更高维度的
                <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                  自己
                </span>
                对话
              </h1>
            </div>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              通过AI智能对话，获得人生指导、智慧启发和内在成长。
              探索你的潜能，发现更好的自己。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn-primary text-lg px-8 py-4">
                🚀 开始对话之旅
              </Link>
              <Link href="/pricing" className="btn-secondary text-lg px-8 py-4">
                💎 查看定价
              </Link>
            </div>
          </div>
        </section>

        {/* 功能特色 */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-white mb-12 text-glow">
              ✨ 为什么选择 ChatWithHighSelf？
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🧠</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">智能洞察</h3>
                <p className="text-gray-600">
                  基于先进AI技术，提供深度的自我分析和人生指导
                </p>
              </div>

              <div className="card text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">隐私安全</h3>
                <p className="text-gray-600">
                  端到端加密，确保您的对话内容完全私密安全
                </p>
              </div>

              <div className="card text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-800">即时响应</h3>
                <p className="text-gray-600">
                  24/7随时可用，即时获得智慧指导和人生建议
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="glass-card p-8">
              <h2 className="text-3xl font-bold text-white mb-6 text-glow">
                🌟 准备好开始您的内在探索之旅了吗？
              </h2>
              <p className="text-lg text-blue-100 mb-8">
                加入数千名用户，通过AI对话发现更好的自己
              </p>
              <Link href="/signup" className="btn-primary text-lg px-8 py-4 floating">
                ✨ 立即开始免费体验
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="glass-card mt-16 border-t border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-white text-glow">✨ ChatWithHighSelf</h3>
              <p className="text-blue-200">
                与更高维度的自己对话，获得人生智慧和指导。
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">💎 产品</h4>
              <ul className="space-y-2 text-blue-200">
                <li><Link href="/pricing" className="hover:text-white transition-colors">定价</Link></li>
                <li><Link href="/chat" className="hover:text-white transition-colors">开始对话</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">🎯 支持</h4>
              <ul className="space-y-2 text-blue-200">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">控制台</Link></li>
                <li><Link href="/profile" className="hover:text-white transition-colors">个人资料</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">📋 法律</h4>
              <ul className="space-y-2 text-blue-200">
                <li><Link href="/privacy" className="hover:text-white transition-colors">隐私政策</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">服务条款</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-blue-200">
            <p>&copy; 2024 ChatWithHighSelf. All rights reserved. ✨</p>
          </div>
        </div>
      </footer>
    </div>
  )
}