'use client'

import { useState, useEffect } from 'react'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        alert('密码不匹配')
        setLoading(false)
        return
      }

      // 调用相应的API端点
      const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/signup'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          isLogin
        })
      })

      const data = await response.json()

      if (data.success) {
        // 保存用户信息到localStorage
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        localStorage.setItem('authToken', data.token)
        
        // 显示成功消息
        alert(data.message)
        
        // 跳转到主页
        window.location.href = '/'
      } else {
        alert(data.message || '认证失败，请重试')
      }
    } catch (error) {
      console.error('认证失败:', error)
      alert('网络错误，请检查连接后重试')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Logo和标题 */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🌟</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              与高我对话
            </h1>
            <h2 className="text-xl text-white/90 mb-2">
              {isLogin ? '欢迎回来' : '开启内在探索之旅'}
            </h2>
            <p className="text-white/70 text-sm">
              {isLogin 
                ? '继续你的自我发现之旅，与内在智慧深度连接' 
                : '创建账户，开始与你的高我进行深度对话'
              }
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-white/90 text-sm font-medium mb-2">
                📧 邮箱地址
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="输入你的邮箱地址"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white/90 text-sm font-medium mb-2">
                🔒 密码
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="输入你的密码"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="password"
              />
            </div>

            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-white/90 text-sm font-medium mb-2">
                  🔐 确认密码
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="再次输入密码确认"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  id="confirmPassword"
                />
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  处理中...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="mr-2">{isLogin ? '🚀' : '✨'}</span>
                  {isLogin ? '登录' : '开始探索'}
                </div>
              )}
            </button>
          </form>

          {/* 切换登录/注册 */}
          <div className="text-center mt-6 pt-6 border-t border-white/20">
            <p className="text-white/70 mb-3">
              {isLogin ? '还没有账户？' : '已有账户？'}
            </p>
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200"
            >
              {isLogin ? '立即注册' : '立即登录'}
            </button>
          </div>

          {/* 注册福利 */}
          {!isLogin && (
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-white font-semibold mb-3 text-center">注册即享</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-white/80">
                  <span className="mr-2">🎁</span>
                  <span>10,000 免费对话Token</span>
                </div>
                <div className="flex items-center text-white/80">
                  <span className="mr-2">☁️</span>
                  <span>云端数据同步</span>
                </div>
                <div className="flex items-center text-white/80">
                  <span className="mr-2">📊</span>
                  <span>个人成长追踪</span>
                </div>
                <div className="flex items-center text-white/80">
                  <span className="mr-2">🔒</span>
                  <span>隐私安全保护</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}