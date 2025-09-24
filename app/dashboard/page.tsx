'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      setUser(user)
      await fetchTokenInfo()
    } catch (error) {
      console.error('检查用户状态失败:', error)
      router.push('/signin')
    } finally {
      setLoading(false)
    }
  }

  const fetchTokenInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/user/tokens', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTokenInfo(data)
      }
    } catch (error) {
      console.error('获取Token信息失败:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 py-4">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-white text-xl font-semibold">与高我对话 - 控制台</h1>
          <div className="flex items-center gap-4 text-white">
            <span>欢迎，{user?.email}</span>
            <button 
              onClick={handleSignOut} 
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg border border-white/30 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Token 余额卡片 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">💰 Token 余额</h2>
            </div>
            <div className="p-6">
              {tokenInfo ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">付费Token:</span>
                    <span className="font-semibold text-lg">{tokenInfo.tokenBalance?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">免费试用剩余:</span>
                    <span className="font-semibold text-lg">{tokenInfo.freeTokensRemaining || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">免费试用已用:</span>
                    <span className="font-semibold text-lg">{tokenInfo.freeTokensUsed || 0} / {tokenInfo.freeTokensLimit || 100}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">加载中...</p>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t">
              <Link 
                href="/pricing" 
                className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-2 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors"
              >
                充值Token
              </Link>
            </div>
          </div>

          {/* 快速操作卡片 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">🚀 快速操作</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <Link 
                  href="/chat" 
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
                >
                  <span className="text-2xl">💬</span>
                  <span className="text-sm font-medium">开始对话</span>
                </Link>
                <Link 
                  href="/pricing" 
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
                >
                  <span className="text-2xl">💳</span>
                  <span className="text-sm font-medium">购买套餐</span>
                </Link>
                <button 
                  onClick={fetchTokenInfo}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
                >
                  <span className="text-2xl">🔄</span>
                  <span className="text-sm font-medium">刷新余额</span>
                </button>
                <Link 
                  href="/profile" 
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
                >
                  <span className="text-2xl">👤</span>
                  <span className="text-sm font-medium">个人资料</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 系统状态卡片 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">📊 系统状态</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">认证状态:</span>
                  <span className="text-green-600 font-semibold">✅ 已登录</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">支付系统:</span>
                  <span className="text-green-600 font-semibold">✅ 正常</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">数据库:</span>
                  <span className="text-green-600 font-semibold">✅ 连接正常</span>
                </div>
              </div>
            </div>
          </div>

          {/* 使用说明卡片 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden md:col-span-2 lg:col-span-3">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">📖 使用说明</h2>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="mb-3"><strong className="text-purple-600">🎁 免费试用:</strong> 新用户可免费使用价值1元的Token（约100个Token）</p>
                  <p className="mb-3"><strong className="text-purple-600">💰 Token消耗:</strong> 每次对话根据内容长度消耗Token，平均每次对话消耗10-50个Token</p>
                </div>
                <div>
                  <p className="mb-3"><strong className="text-purple-600">🛒 购买套餐:</strong> Token用完后可购买充值套餐或订阅服务</p>
                  <p className="mb-3"><strong className="text-purple-600">🔄 自动扣费:</strong> 优先使用免费Token，用完后自动使用付费Token</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}