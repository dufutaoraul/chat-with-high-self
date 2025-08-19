import { useState, useEffect } from 'react'
import PaymentModal from './PaymentModal'
import styles from '../styles/ChatInterface.module.css'

export default function ChatInterface() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState(null)
  const [userBalance, setUserBalance] = useState(0)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    checkAuth()
    fetchUserBalance()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/signin'
      return
    }
    
    // 验证token并获取用户信息
    try {
      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem('token')
        window.location.href = '/signin'
      }
    } catch (error) {
      console.error('认证检查失败:', error)
      window.location.href = '/auth.html'
    }
  }

  const fetchUserBalance = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const response = await fetch('/api/user/tokens', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUserBalance(data.balance)
      }
    } catch (error) {
      console.error('获取余额失败:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return

    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/auth.html'
      return
    }

    setLoading(true)
    const userMessage = inputMessage.trim()
    setInputMessage('')

    // 添加用户消息到界面
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          conversationId
        })
      })

      const data = await response.json()

      if (response.status === 402) {
        // 余额不足，显示支付弹窗
        setShowPaymentModal(true)
        // 移除刚添加的用户消息
        setMessages(prev => prev.slice(0, -1))
        setInputMessage(userMessage) // 恢复输入框内容
      } else if (response.ok) {
        // 成功响应
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        setConversationId(data.conversationId)
        setUserBalance(data.remainingBalance)
      } else {
        // 其他错误
        console.error('对话失败:', data.error)
        alert(data.error || '对话失败，请重试')
        // 移除刚添加的用户消息
        setMessages(prev => prev.slice(0, -1))
        setInputMessage(userMessage) // 恢复输入框内容
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      alert('网络错误，请检查连接后重试')
      // 移除刚添加的用户消息
      setMessages(prev => prev.slice(0, -1))
      setInputMessage(userMessage) // 恢复输入框内容
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handlePaymentSuccess = () => {
    fetchUserBalance()
    // 支付成功后可以重新发送消息
    if (inputMessage.trim()) {
      sendMessage()
    }
  }

  return (
    <div className={styles.chatContainer}>
      {/* 余额显示 */}
      <div className={styles.balanceBar}>
        <div className={styles.balanceInfo}>
          <span className={styles.balanceLabel}>余额:</span>
          <span className={styles.balanceAmount}>¥{userBalance.toFixed(2)}</span>
          {userBalance < 1 && (
            <span className={styles.lowBalanceWarning}>余额较低</span>
          )}
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
      </div>

      {/* 支付弹窗 */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        userBalance={userBalance}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  )
}