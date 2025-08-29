'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'

interface ConversationPackage {
  id: string
  name: string
  conversations: number
  price: number
  description: string
  popular?: boolean
}

const conversationPackages: ConversationPackage[] = [
  {
    id: 'basic_100',
    name: '基础包',
    conversations: 100,
    price: 9.90,
    description: '100次对话，适合轻度使用'
  },
  {
    id: 'standard_500',
    name: '标准包',
    conversations: 500,
    price: 29.90,
    description: '500次对话，适合重度使用',
    popular: true
  }
]

export default function PaymentPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<ConversationPackage | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [conversations, setConversations] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/signin')
        return
      }

      setUser(user)
      
      // 获取用户对话余额
      const { data: conversationData } = await supabase
        .from('user_conversations')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (conversationData) {
        setConversations(conversationData)
      }
    } catch (error) {
      console.error('认证检查失败:', error)
      router.push('/signin')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (pkg: ConversationPackage) => {
    if (!user) {
      router.push('/signin')
      return
    }

    setSelectedPackage(pkg)
    setPaymentLoading(true)

    try {
      console.log('创建支付订单:', pkg)
      
      // 调用支付API创建订单
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType: pkg.id,
          userId: user.id
        })
      })

      const result = await response.json()

      if (result.success) {
        setPaymentUrl(result.paymentUrl)
        setShowPayment(true)
        console.log('支付URL生成成功:', result.paymentUrl)
      } else {
        console.error('创建支付订单失败:', result.message)
        alert('创建支付订单失败：' + result.message)
      }

    } catch (error) {
      console.error('支付处理失败:', error)
      alert('支付处理失败，请稍后重试')
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleDirectPayment = () => {
    if (paymentUrl) {
      // 直接跳转到支付页面
      window.location.href = paymentUrl
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        加载中...
      </div>
    )
  }

  if (showPayment && selectedPackage) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '40px',
          width: '100%',
          maxWidth: '500px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '24px', 
            marginBottom: '20px',
            fontWeight: '300'
          }}>
            💳 完成支付
          </h1>
          
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '30px'
          }}>
            <h3 style={{ color: 'white', marginBottom: '10px' }}>
              {selectedPackage.name}
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '10px' }}>
              {selectedPackage.description}
            </p>
            <div style={{ 
              color: '#4CAF50', 
              fontSize: '28px', 
              fontWeight: 'bold' 
            }}>
              ¥{selectedPackage.price}
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '30px',
            border: '2px dashed rgba(255, 255, 255, 0.3)'
          }}>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              marginBottom: '15px',
              fontSize: '16px'
            }}>
              点击下方按钮跳转到支付宝扫码支付
            </p>
            <div style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              • 支持支付宝扫码支付<br/>
              • 支付成功后自动到账<br/>
              • 安全可靠，即时生效
            </div>
          </div>

          <button
            onClick={handleDirectPayment}
            style={{
              width: '100%',
              padding: '15px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '15px'
            }}
          >
            🚀 立即支付 ¥{selectedPackage.price}
          </button>

          <button
            onClick={() => setShowPayment(false)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'transparent',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            返回选择套餐
          </button>

          <div style={{
            marginTop: '20px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            支付遇到问题？请联系客服
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        paddingTop: '50px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '32px', 
            marginBottom: '15px',
            fontWeight: '300'
          }}>
            💎 选择对话套餐
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '18px',
            margin: 0
          }}>
            继续您的内在探索之旅
          </p>
          
          {conversations && (
            <div style={{
              marginTop: '20px',
              padding: '15px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              display: 'inline-block'
            }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                当前剩余对话次数：
              </span>
              <span style={{ 
                color: '#4CAF50', 
                fontWeight: 'bold',
                fontSize: '18px',
                marginLeft: '10px'
              }}>
                {conversations.total_conversations - conversations.free_conversations_used - conversations.paid_conversations}
              </span>
            </div>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginBottom: '50px'
        }}>
          {conversationPackages.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                background: pkg.popular 
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '30px',
                border: pkg.popular 
                  ? '2px solid rgba(102, 126, 234, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                transition: 'transform 0.3s ease',
                cursor: 'pointer'
              }}
            >
              {pkg.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '5px 20px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  🔥 推荐
                </div>
              )}

              <div style={{ textAlign: 'center' }}>
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '24px', 
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  {pkg.name}
                </h3>
                
                <div style={{ 
                  color: '#4CAF50', 
                  fontSize: '36px', 
                  fontWeight: 'bold',
                  marginBottom: '10px'
                }}>
                  ¥{pkg.price}
                </div>
                
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  fontSize: '16px',
                  marginBottom: '20px',
                  lineHeight: '1.5'
                }}>
                  {pkg.description}
                </p>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '15px',
                  marginBottom: '25px'
                }}>
                  <div style={{ 
                    color: 'white', 
                    fontSize: '28px', 
                    fontWeight: 'bold',
                    marginBottom: '5px'
                  }}>
                    {pkg.conversations}
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '14px'
                  }}>
                    次对话
                  </div>
                </div>

                <button
                  onClick={() => handlePayment(pkg)}
                  disabled={paymentLoading}
                  style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: '10px',
                    border: 'none',
                    background: paymentLoading 
                      ? '#666' 
                      : pkg.popular 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: paymentLoading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {paymentLoading ? '处理中...' : '立即购买'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <p>• 支付成功后对话次数立即到账</p>
          <p>• 支持支付宝扫码支付，安全可靠</p>
          <p>• 对话次数永久有效，无过期时间</p>
        </div>
      </div>
    </div>
  )
}
