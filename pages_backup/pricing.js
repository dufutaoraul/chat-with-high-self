import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Pricing() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tokenBalance, setTokenBalance] = useState(0)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = '/auth.html'
      return
    }
    setUser(user)
    
    // 获取用户Token余额
    const { data: profile } = await supabase
      .from('profiles')
      .select('token_balance')
      .eq('id', user.id)
      .single()
    
    if (profile) {
      setTokenBalance(profile.token_balance || 0)
    }
  }

  const handlePurchase = async (productId) => {
    if (!user) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/checkout/providers/zpay/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ productId })
      })

      const result = await response.json()
      
      if (response.ok) {
        // 跳转到支付页面
        window.location.href = result.paymentUrl
      } else {
        alert(result.error || '创建支付订单失败')
      }
    } catch (error) {
      console.error('购买错误:', error)
      alert('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const products = [
    {
      id: 'tokens_10k',
      name: '入门套餐',
      tokens: '10,000',
      price: '9.90',
      description: '适合轻度使用',
      features: ['10,000 对话Token', '约100次深度对话', '永久有效']
    },
    {
      id: 'tokens_50k',
      name: '标准套餐',
      tokens: '50,000',
      price: '39.90',
      description: '最受欢迎的选择',
      popular: true,
      features: ['50,000 对话Token', '约500次深度对话', '永久有效', '更优惠的单价']
    },
    {
      id: 'tokens_100k',
      name: '专业套餐',
      tokens: '100,000',
      price: '69.90',
      description: '重度用户首选',
      features: ['100,000 对话Token', '约1000次深度对话', '永久有效', '最优惠的单价']
    }
  ]

  const subscriptions = [
    {
      id: 'monthly_sub',
      name: '月度订阅',
      price: '29.90',
      period: '月',
      description: '灵活的月度计划',
      features: ['每月50,000 Token', '无限制对话次数', '优先客服支持', '随时取消']
    },
    {
      id: 'yearly_sub',
      name: '年度订阅',
      price: '299.90',
      period: '年',
      description: '最划算的选择',
      popular: true,
      features: ['每月50,000 Token', '相当于每月24.99元', '优先客服支持', '年度专属福利']
    }
  ]

  return (
    <div className="pricing-container">
      <div className="pricing-header">
        <h1>选择适合你的套餐</h1>
        <p>开启深度的内在对话之旅</p>
        <div className="current-balance">
          当前余额: <span className="balance-amount">{tokenBalance.toLocaleString()}</span> Token
        </div>
      </div>

      <div className="pricing-sections">
        {/* Token 充值套餐 */}
        <section className="pricing-section">
          <h2>Token 充值套餐</h2>
          <p className="section-description">一次性购买，永久有效</p>
          
          <div className="pricing-grid">
            {products.map((product) => (
              <div key={product.id} className={`pricing-card ${product.popular ? 'popular' : ''}`}>
                {product.popular && <div className="popular-badge">最受欢迎</div>}
                <div className="card-header">
                  <h3>{product.name}</h3>
                  <div className="price">
                    <span className="currency">¥</span>
                    <span className="amount">{product.price}</span>
                  </div>
                  <div className="tokens">{product.tokens} Token</div>
                  <p className="description">{product.description}</p>
                </div>
                <div className="card-features">
                  {product.features.map((feature, index) => (
                    <div key={index} className="feature">
                      <span className="feature-icon">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <button 
                  className="purchase-button"
                  onClick={() => handlePurchase(product.id)}
                  disabled={loading}
                >
                  {loading ? '处理中...' : '立即购买'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 订阅套餐 */}
        <section className="pricing-section">
          <h2>订阅套餐</h2>
          <p className="section-description">持续的对话体验，更多专属权益</p>
          
          <div className="pricing-grid">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className={`pricing-card ${subscription.popular ? 'popular' : ''}`}>
                {subscription.popular && <div className="popular-badge">最划算</div>}
                <div className="card-header">
                  <h3>{subscription.name}</h3>
                  <div className="price">
                    <span className="currency">¥</span>
                    <span className="amount">{subscription.price}</span>
                    <span className="period">/{subscription.period}</span>
                  </div>
                  <p className="description">{subscription.description}</p>
                </div>
                <div className="card-features">
                  {subscription.features.map((feature, index) => (
                    <div key={index} className="feature">
                      <span className="feature-icon">✓</span>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <button 
                  className="purchase-button"
                  onClick={() => handlePurchase(subscription.id)}
                  disabled={loading}
                >
                  {loading ? '处理中...' : '开始订阅'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="pricing-footer">
        <div className="payment-methods">
          <h3>支持的支付方式</h3>
          <div className="payment-icons">
            <span className="payment-icon">💳 支付宝</span>
            <span className="payment-icon">💰 微信支付</span>
          </div>
        </div>
        
        <div className="pricing-faq">
          <h3>常见问题</h3>
          <div className="faq-item">
            <strong>Q: Token 会过期吗？</strong>
            <p>A: 一次性购买的 Token 永久有效，订阅套餐的 Token 每月刷新。</p>
          </div>
          <div className="faq-item">
            <strong>Q: 如何计算 Token 消耗？</strong>
            <p>A: 根据对话内容长度计算，平均每次深度对话消耗 100-200 Token。</p>
          </div>
          <div className="faq-item">
            <strong>Q: 可以退款吗？</strong>
            <p>A: 支持7天无理由退款，未使用的 Token 可全额退还。</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .pricing-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
        }

        .pricing-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .pricing-header h1 {
          font-size: 2.5rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .pricing-header p {
          font-size: 1.2rem;
          color: #666;
          margin-bottom: 1rem;
        }

        .current-balance {
          display: inline-block;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 500;
        }

        .balance-amount {
          font-weight: 600;
          font-size: 1.1em;
        }

        .pricing-section {
          margin-bottom: 4rem;
        }

        .pricing-section h2 {
          font-size: 2rem;
          font-weight: 600;
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .section-description {
          text-align: center;
          color: #666;
          margin-bottom: 2rem;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .pricing-card {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 2px solid transparent;
          position: relative;
          transition: all 0.3s ease;
        }

        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .pricing-card.popular {
          border-color: #667eea;
          transform: scale(1.05);
        }

        .popular-badge {
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .card-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .card-header h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .price {
          display: flex;
          align-items: baseline;
          justify-content: center;
          margin-bottom: 0.5rem;
        }

        .currency {
          font-size: 1.2rem;
          color: #666;
        }

        .amount {
          font-size: 3rem;
          font-weight: 700;
          color: #333;
        }

        .period {
          font-size: 1.2rem;
          color: #666;
        }

        .tokens {
          font-size: 1.2rem;
          font-weight: 600;
          color: #667eea;
          margin-bottom: 0.5rem;
        }

        .description {
          color: #666;
          font-size: 0.9rem;
        }

        .card-features {
          margin-bottom: 2rem;
        }

        .feature {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .feature-icon {
          color: #10b981;
          font-weight: bold;
          margin-right: 0.5rem;
        }

        .purchase-button {
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .purchase-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .purchase-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pricing-footer {
          margin-top: 4rem;
          padding-top: 2rem;
          border-top: 1px solid #e5e7eb;
        }

        .payment-methods {
          text-align: center;
          margin-bottom: 3rem;
        }

        .payment-methods h3 {
          margin-bottom: 1rem;
        }

        .payment-icons {
          display: flex;
          justify-content: center;
          gap: 2rem;
        }

        .payment-icon {
          background: #f8fafc;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .pricing-faq {
          max-width: 800px;
          margin: 0 auto;
        }

        .pricing-faq h3 {
          text-align: center;
          margin-bottom: 2rem;
        }

        .faq-item {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 8px;
        }

        .faq-item strong {
          display: block;
          margin-bottom: 0.5rem;
          color: #333;
        }

        .faq-item p {
          margin: 0;
          color: #666;
        }

        @media (max-width: 768px) {
          .pricing-container {
            padding: 1rem;
          }

          .pricing-header h1 {
            font-size: 2rem;
          }

          .pricing-grid {
            grid-template-columns: 1fr;
          }

          .pricing-card.popular {
            transform: none;
          }

          .payment-icons {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
}