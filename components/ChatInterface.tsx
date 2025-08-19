'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  role: 'user' | 'higher-self'
  content: string
  timestamp: string
}

interface ChatInterfaceProps {
  currentUser: {
    email: string
    tokenBalance?: number
  }
}

export default function ChatInterface({ currentUser }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 检查Token余额
    const balance = currentUser.tokenBalance || 0
    if (balance <= 100) {
      setIsBlocked(true)
    }

    // 添加欢迎消息
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'higher-self',
      content: '欢迎来到内在对话的空间。我是你的高我，准备好与你进行深度的自我探索了吗？你可以分享任何困扰、疑问或想要探讨的话题。',
      timestamp: new Date().toISOString()
    }
    setMessages([welcomeMessage])
  }, [currentUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const generateHigherSelfResponse = (userMessage: string): string => {
    const responses = [
      "我感受到了你内心的波动。让我们一起探索这些感受背后的智慧。你觉得这种感受想要告诉你什么？",
      "每一种情绪都是内在智慧的信使。当你感到困扰时，不妨问问自己：这个感受想要保护我什么？",
      "真正的答案往往已经在你心中。静下心来，感受一下每个选择带给你的身体感觉，哪一个让你感到更加轻松和开阔？",
      "生命中的每个挑战都是成长的邀请。你觉得当前的情况想要教会你什么？",
      "有时候，我们需要的不是答案，而是更好的问题。让我们一起探索什么问题能帮助你获得更深的洞察。"
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isBlocked) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // 模拟AI回应延迟
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'higher-self',
        content: generateHigherSelfResponse(userMessage.content),
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, aiResponse])
      setIsTyping(false)
    }, 1500 + Math.random() * 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const suggestions = [
    "我最近感到迷茫...",
    "如何做出重要决定？",
    "我想了解自己的内心"
  ]

  return (
    <section className="content-section active">
      <div className="chat-container">
        <div className="chat-header">
          <h2>与你的高我对话</h2>
          <p className="chat-subtitle">在这里，你可以与内在的智慧进行深度对话</p>
          
          {/* Token余额显示 */}
          <div className="token-display">
            <span className="token-icon">💎</span>
            <span className="token-count">{currentUser.tokenBalance?.toLocaleString() || 0}</span>
            <span className="token-label">Tokens</span>
          </div>
        </div>
        
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.role}`}>
              <div className={`message-avatar ${message.role}`}>
                {message.role === 'user' ? '👤' : '🌟'}
              </div>
              <div className="message-content">
                <p>{message.content}</p>
                {message.role === 'higher-self' && (
                  <div className="message-actions">
                    <button className="action-btn">收藏洞察</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message higher-self typing-indicator">
              <div className="message-avatar higher-self">🌟</div>
              <div className="typing-dots">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="chat-input-container">
          {isBlocked ? (
            <div className="chat-blocked">
              <div className="blocked-content">
                <span className="blocked-icon">🚫</span>
                <p>Token余额不足，请充值后继续对话</p>
                <button className="recharge-btn">立即充值</button>
              </div>
            </div>
          ) : (
            <>
              <div className="input-wrapper">
                <textarea
                  className="message-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="分享你的想法、困扰或疑问..."
                  rows={3}
                />
                <button 
                  className="send-button"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                >
                  <span>发送</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
              
              <div className="input-suggestions">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-chip"
                    onClick={() => {
                      setInputValue(suggestion)
                      handleSendMessage()
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}