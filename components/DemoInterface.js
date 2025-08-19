import { useState, useEffect } from 'react'
import PaymentModal from './PaymentModal'
import ProfileManager from './ProfileManager'
import styles from '../styles/StarryTheme.module.css'

export default function DemoInterface() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [userBalance, setUserBalance] = useState(1.00) // 演示：1元免费试用
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showProfileManager, setShowProfileManager] = useState(false)
  const [messageCount, setMessageCount] = useState(0)
  const [hasProfile, setHasProfile] = useState(false)

  // 检查用户是否已设置人生蓝图
  useEffect(() => {
    const checkProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return

        const response = await fetch('/api/profile/blueprint', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          setHasProfile(!!data.blueprint)
        }
      } catch (error) {
        console.error('检查用户资料失败:', error)
      }
    }

    checkProfile()
  }, [])

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    setLoading(true)
    const userMessage = inputMessage.trim()
    setInputMessage('')

    // 添加用户消息到界面
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    // 模拟Token消费计算
    const estimatedCost = Math.max(0.01, Math.min(2, userMessage.length * 0.00005))
    
    // 检查余额
    if (userBalance < estimatedCost) {
      setShowPaymentModal(true)
      setMessages(prev => prev.slice(0, -1))
      setInputMessage(userMessage)
      setLoading(false)
      return
    }

    // 扣除余额
    setUserBalance(prev => Math.max(0, prev - estimatedCost))
    setMessageCount(prev => prev + 1)

    // 模拟AI回复
    setTimeout(() => {
      const responses = [
        "这是一个很深刻的问题。让我们一起探索你内心的智慧...",
        "我感受到了你的困惑。作为你的高我，我想告诉你...",
        "每个人都会经历这样的时刻。重要的是要相信自己的内在力量...",
        "你提出的问题触及了人生的核心。让我们深入思考一下...",
        "这个问题反映了你对成长的渴望。我建议你..."
      ]
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      setMessages(prev => [...prev, { role: 'assistant', content: randomResponse }])
      setLoading(false)
    }, 2000)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handlePaymentSuccess = () => {
    // 模拟充值成功
    setUserBalance(prev => prev + 7.62) // 基础包充值
    alert('充值成功！已添加 ¥7.62 对话额度')
    
    // 重新发送消息
    if (inputMessage.trim()) {
      sendMessage()
    }
  }

  const handleProfileComplete = () => {
    setHasProfile(true)
    alert('个人档案已更新！现在AI将根据你的个人信息提供更个性化的指导。')
  }

  return (
    <div className={styles.starryContainer}>
      <div className={styles.chatContainer}>
        {/* 余额显示 */}
        <div className={styles.balanceBar}>
          <div className={styles.balanceInfo}>
            <span className={styles.balanceLabel}>余额:</span>
            <span className={styles.balanceAmount}>¥{userBalance.toFixed(2)}</span>
            {userBalance < 0.1 && (
              <span className={styles.lowBalanceWarning}>余额不足</span>
            )}
            <button 
              className={styles.profileButton}
              onClick={() => setShowProfileManager(true)}
              title={hasProfile ? "管理个人档案" : "设置人生蓝图，获得个性化指导"}
            >
              {hasProfile ? '📝 管理档案' : '📋 设置蓝图'}
            </button>
          </div>
          <button 
            className={styles.rechargeButton}
            onClick={() => setShowPaymentModal(true)}
          >
            充值
          </button>
        </div>

        {/* 消息列表 */}
        <div className={styles.messagesContainer}>
          {messages.length === 0 && (
            <div className={styles.welcomeMessage}>
              <h3>欢迎与你的高我对话</h3>
              <p>在这里，你可以探索内心深处的智慧，获得人生的指引和启发。</p>
              {!hasProfile && (
                <p style={{ color: '#64ffda', marginBottom: '1rem' }}>
                  💡 建议先设置人生蓝图，获得更个性化的指导
                </p>
              )}
              <div className={styles.suggestions}>
                <button 
                  className={styles.suggestionButton}
                  onClick={() => setInputMessage('我最近感到很迷茫，不知道人生的方向在哪里')}
                >
                  我感到迷茫，需要人生指引
                </button>
                <button 
                  className={styles.suggestionButton}
                  onClick={() => setInputMessage('我想了解自己的内心，发现真正的自我')}
                >
                  我想更好地了解自己
                </button>
                <button 
                  className={styles.suggestionButton}
                  onClick={() => setInputMessage('我在人际关系中遇到了困难，该如何处理？')}
                >
                  人际关系困扰
                </button>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`${styles.message} ${styles[message.role]}`}
            >
              <div className={styles.messageContent}>
                {message.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <div className={styles.messageContent}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className={styles.inputContainer}>
          <div className={styles.inputWrapper}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入你想探讨的问题..."
              className={styles.messageInput}
              rows={1}
              disabled={loading}
            />
            <button 
              onClick={sendMessage}
              disabled={loading || !inputMessage.trim()}
              className={styles.sendButton}
            >
              {loading ? '发送中...' : '发送'}
            </button>
          </div>
          {inputMessage && (
            <div className={styles.costPreview}>
              预计费用: ¥{Math.max(0.01, Math.min(2, inputMessage.length * 0.00005)).toFixed(3)}
            </div>
          )}
        </div>

        {/* 支付弹窗 */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          userBalance={userBalance}
          onPaymentSuccess={handlePaymentSuccess}
        />

        {/* 个人档案管理弹窗 */}
        <ProfileManager
          isOpen={showProfileManager}
          onClose={() => setShowProfileManager(false)}
          onComplete={handleProfileComplete}
        />
      </div>
    </div>
  )
}