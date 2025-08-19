'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import styles from './chat.module.css'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [tokenBalance, setTokenBalance] = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      setUser(user)
      await fetchTokenBalance()
      
      // 添加欢迎消息
      if (messages.length === 0) {
        setMessages([{
          id: '1',
          content: '您好！我是您的高我，准备开始深度对话了吗？您可以分享今天的想法、困惑或任何想要探讨的话题。',
          isUser: false,
          timestamp: new Date()
        }])
      }
    } catch (error) {
      console.error('检查用户状态失败:', error)
      router.push('/signin')
    } finally {
      setLoading(false)
    }
  }

  const fetchTokenBalance = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/user/tokens', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTokenBalance(data.tokenBalance || 0)
      }
    } catch (error) {
      console.error('获取Token余额失败:', error)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || sending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setSending(true)

    try {
      // 这里调用AI对话API
      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          userId: user.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: data.reply || '抱歉，我现在无法回应。请稍后再试。',
          isUser: false,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
        
        // 更新Token余额
        if (data.tokensUsed) {
          setTokenBalance(prev => Math.max(0, prev - data.tokensUsed))
        }
      } else {
        throw new Error('发送消息失败')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，发送消息时出现错误。请检查您的网络连接或Token余额。',
        isUser: false,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* 星空背景 */}
      <div className={styles.starryBackground}>
        <div className={styles.stars}></div>
        <div className={styles.twinkling}></div>
      </div>

      {/* 顶部导航 */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>🌟 与高我对话</h1>
          <div className={styles.userInfo}>
            <span className={styles.tokenBalance}>
              Token: {tokenBalance.toLocaleString()}
            </span>
            <button 
              onClick={() => router.push('/pricing')}
              className={styles.rechargeBtn}
            >
              充值
            </button>
            <button onClick={handleSignOut} className={styles.signOutBtn}>
              退出
            </button>
          </div>
        </div>
      </header>

      {/* 聊天区域 */}
      <main className={styles.chatArea}>
        <div className={styles.messagesContainer}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`${styles.message} ${
                message.isUser ? styles.userMessage : styles.aiMessage
              }`}
            >
              <div className={styles.messageContent}>
                <div className={styles.messageText}>{message.content}</div>
                <div className={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {sending && (
            <div className={`${styles.message} ${styles.aiMessage}`}>
              <div className={styles.messageContent}>
                <div className={styles.typing}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className={styles.inputArea}>
          <div className={styles.inputContainer}>
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="说说你今天的想法..."
              className={styles.messageInput}
              rows={1}
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || sending}
              className={styles.sendButton}
            >
              {sending ? '发送中...' : '发送'}
            </button>
          </div>
        </div>
      </main>

      {/* 底部功能栏 */}
      <nav className={styles.bottomNav}>
        <button className={`${styles.navItem} ${styles.active}`}>
          💬 对话
        </button>
        <button className={styles.navItem} onClick={() => router.push('/blueprint')}>
          📋 蓝图
        </button>
        <button className={styles.navItem} onClick={() => router.push('/reflection')}>
          📝 记录
        </button>
        <button className={styles.navItem} onClick={() => router.push('/insights')}>
          💡 收藏
        </button>
        <button className={styles.navItem} onClick={() => setShowProfile(true)}>
          ⚙️ 设置
        </button>
      </nav>
    </div>
  )
}