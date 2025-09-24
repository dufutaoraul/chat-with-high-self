'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface PlanInfo {
  id: string
  name: string
  price: number
  features: string[]
}

const plans: Record<string, PlanInfo> = {
  pro: {
    id: 'pro',
    name: '专业版',
    price: 29,
    features: [
      '无限对话次数',
      '高级AI模型',
      '无限对话历史',
      '个性化建议',
      '优先客服支持'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: '企业版',
    price: 99,
    features: [
      '专业版所有功能',
      '团队管理功能',
      '数据分析报告',
      'API接入支持',
      '专属客服经理'
    ]
  }
}

function PaymentPageContent() {
  const [selectedPlan, setSelectedPlan] = useState<PlanInfo | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('wechat')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // 检查用户登录状态
    const userData = localStorage.getItem('user')
    if (!userData) {
      router.push('/signin')
      return
    }
    setUser(JSON.parse(userData))

    // 获取选择的计划
    const planId = searchParams.get('plan')
    if (planId && plans[planId]) {
      setSelectedPlan(plans[planId])
    } else {
      setSelectedPlan(plans.pro) // 默认专业版
    }
  }, [router, searchParams])

  const handlePayment = async () => {
    if (!selectedPlan || !user) return

    setLoading(true)
    try {
      const session = localStorage.getItem('session')
      const sessionData = session ? JSON.parse(session) : null

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData?.access_token || ''}`
        },
        body: JSON.stringify({
          plan_id: selectedPlan.id,
          payment_method: paymentMethod,
          amount: selectedPlan.price
        })
      })

      const data = await response.json()

      if (response.ok) {
        // 模拟支付成功
        alert('支付成功！感谢您的订阅。')
        router.push('/chat')
      } else {
        throw new Error(data.error || '支付失败')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('支付失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (!selectedPlan || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>正在加载...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              ChatWithHighSelf
            </Link>
            <div className="text-sm text-gray-600">
              欢迎，{user.user_metadata?.full_name || user.email}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              完成订阅
            </h1>
            <p className="text-gray-600">
              您即将订阅 {selectedPlan.name}，开启更深度的对话体验
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 订单详情 */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">订单详情</h2>
              
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{selectedPlan.name}</span>
                  <span className="text-2xl font-bold text-purple-600">
                    ¥{selectedPlan.price}/月
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <h3 className="font-medium text-gray-900">包含功能：</h3>
                <ul className="space-y-1">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>总计</span>
                  <span className="text-purple-600">¥{selectedPlan.price}</span>
                </div>
              </div>
            </div>

            {/* 支付方式 */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">选择支付方式</h2>
              
              <div className="space-y-3 mb-6">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="wechat"
                    checked={paymentMethod === 'wechat'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-500 rounded mr-3 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">微</span>
                    </div>
                    <span>微信支付</span>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="alipay"
                    checked={paymentMethod === 'alipay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded mr-3 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">支</span>
                    </div>
                    <span>支付宝</span>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-500 rounded mr-3 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">卡</span>
                    </div>
                    <span>银行卡</span>
                  </div>
                </label>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '处理中...' : `支付 ¥${selectedPlan.price}`}
              </button>

              <div className="mt-4 text-xs text-gray-500 text-center">
                <p>点击支付即表示您同意我们的</p>
                <p>
                  <Link href="/terms" className="text-purple-600 hover:text-purple-500">服务条款</Link>
                  {' '}和{' '}
                  <Link href="/privacy" className="text-purple-600 hover:text-purple-500">隐私政策</Link>
                </p>
              </div>
            </div>
          </div>

          {/* 安全提示 */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-medium text-blue-900 mb-1">安全保障</h3>
                <p className="text-sm text-blue-700">
                  我们使用银行级别的加密技术保护您的支付信息，支持7天无理由退款。
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>正在加载...</p>
        </div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  )
}