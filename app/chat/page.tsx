'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'

interface ChatMessage {
  id: string
  message: string
  response: string
  created_at: string
  conversation_number: number
}

interface UserConversations {
  total_conversations: number
  free_conversations_used: number
  paid_conversations: number
  remaining_conversations: number
}

export default function ChatPage() {
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<UserConversations | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/signin')
        return
      }

      setUser(user)
      await fetchUserConversations(user.id)
      await fetchChatHistory(user.id)
    } catch (error) {
      console.error('认证检查失败:', error)
      router.push('/signin')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserConversations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_conversations')
        .select('total_conversations, free_conversations_used, paid_conversations')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.log('对话记录不存在，创建新记录...')
        // 如果没有记录，创建一个默认记录（100次免费对话）
        const { data: newRecord, error: insertError } = await supabase
          .from('user_conversations')
          .insert([
            { user_id: userId, total_conversations: 100, free_conversations_used: 0, paid_conversations: 0 }
          ])
          .select('total_conversations, free_conversations_used, paid_conversations')
          .single()

        if (!insertError) {
          setConversations({
            total_conversations: 100,
            free_conversations_used: 0,
            paid_conversations: 0,
            remaining_conversations: 100
          })
        } else {
          console.error('创建对话记录失败:', insertError)
          // 设置默认值，即使数据库操作失败
          setConversations({
            total_conversations: 100,
            free_conversations_used: 0,
            paid_conversations: 0,
            remaining_conversations: 100
          })
        }
      } else {
        const remaining = data.total_conversations - data.free_conversations_used - data.paid_conversations
        setConversations({
          ...data,
          remaining_conversations: remaining
        })
      }
    } catch (error) {
      console.error('对话数据获取失败:', error)
      // 设置默认值
      setConversations({
        total_conversations: 100,
        free_conversations_used: 0,
        paid_conversations: 0,
        remaining_conversations: 100
      })
    }
  }

  const fetchChatHistory = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, message, response, created_at, conversation_number')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (!error && data) {
        setChatHistory(data)
      }
    } catch (error) {
      console.error('聊天记录获取失败:', error)
      // 不影响主要功能，继续执行
    }
  }

  const handleSendMessage = async () => {
    if ((!message.trim() && !selectedImage) || chatLoading) return

    // 检查对话余额
    if (!conversations || conversations.remaining_conversations <= 0) {
      setShowPayment(true)
      return
    }

    setChatLoading(true)
    const userMessage = message.trim()
    setMessage('')

    // 处理图片上传
    let imageUrl = null
    if (selectedImage) {
      try {
        const fileName = `${user.id}/${Date.now()}-${selectedImage.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, selectedImage)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('chat-images')
            .getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      } catch (error) {
        console.error('图片上传失败:', error)
      }
      setSelectedImage(null)
    }

    // 添加用户消息到界面
    const tempMessage: ChatMessage = {
      id: 'temp-' + Date.now(),
      message: userMessage || '发送了一张图片',
      response: '高我正在思考中...',
      created_at: new Date().toISOString(),
      conversation_number: 0
    }
    setChatHistory(prev => [...prev, tempMessage])

    try {
      // 调用AI API
      const response = await fetch('/api/chat-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          imageUrl: imageUrl,
          userId: user.id
        })
      })

      const result = await response.json()

      if (result.success) {
        // 更新聊天记录
        const newMessage: ChatMessage = {
          id: result.messageId,
          message: userMessage || '发送了一张图片',
          response: result.response,
          created_at: new Date().toISOString(),
          conversation_number: result.conversationNumber
        }

        setChatHistory(prev => prev.map(msg =>
          msg.id === tempMessage.id ? newMessage : msg
        ))

        // 更新对话余额
        if (conversations) {
          setConversations(prev => prev ? {
            ...prev,
            free_conversations_used: prev.free_conversations_used + 1,
            remaining_conversations: prev.remaining_conversations - 1
          } : null)
        }
      } else {
        // 移除临时消息并显示错误
        setChatHistory(prev => prev.filter(msg => msg.id !== tempMessage.id))

        // 添加错误消息
        const errorMessage: ChatMessage = {
          id: 'error-' + Date.now(),
          message: userMessage || '发送了一张图片',
          response: '抱歉，AI服务暂时不可用。错误：' + result.message,
          created_at: new Date().toISOString(),
          conversation_number: 0
        }
        setChatHistory(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      setChatHistory(prev => prev.filter(msg => msg.id !== tempMessage.id))

      // 添加错误消息
      const errorMessage: ChatMessage = {
        id: 'error-' + Date.now(),
        message: userMessage || '发送了一张图片',
        response: '抱歉，网络连接出现问题，请稍后重试。',
        created_at: new Date().toISOString(),
        conversation_number: 0
      }
      setChatHistory(prev => [...prev, errorMessage])
    } finally {
      setChatLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        加载中...
      </div>
    )
  }

  if (showPayment) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          maxWidth: '500px',
          background: 'white',
          borderRadius: '15px',
          padding: '30px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>💰 Token余额不足</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            您的Token已用完，请充值后继续对话
          </p>
          
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>充值套餐</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div style={{ 
                padding: '20px', 
                border: '2px solid #667eea', 
                borderRadius: '10px',
                background: '#f8f9ff'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                  100 Token - ¥10
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                  约可对话20次
                </div>
              </div>
              <div style={{ 
                padding: '20px', 
                border: '2px solid #667eea', 
                borderRadius: '10px',
                background: '#f8f9ff'
              }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#667eea' }}>
                  500 Token - ¥45
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                  约可对话100次
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => setShowPayment(false)}
              style={{
                padding: '12px 24px',
                background: '#f5f5f5',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              返回聊天
            </button>
            <button
              onClick={() => router.push('/payment')}
              style={{
                padding: '12px 24px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              前往充值
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* 头部 */}
      <header style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>✨ 与高我对话</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '14px' }}>
            Token余额: <strong>{tokens?.balance || 0}</strong>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer'
            }}
          >
            控制台
          </button>
        </div>
      </header>

      {/* 聊天区域 */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {chatHistory.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            textAlign: 'center'
          }}>
            <div>
              <h2 style={{ marginBottom: '10px' }}>🌟 欢迎与高我对话</h2>
              <p style={{ opacity: 0.8 }}>请输入您的问题，开始深度对话</p>
              <p style={{ opacity: 0.6, fontSize: '14px', marginTop: '20px' }}>
                💡 提示：您有 {tokens?.balance || 0} 个免费Token可以使用
              </p>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }}>
            {chatHistory.map((chat) => (
              <div key={chat.id} style={{ marginBottom: '30px' }}>
                {/* 用户消息 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.9)',
                    padding: '12px 16px',
                    borderRadius: '18px 18px 4px 18px',
                    maxWidth: '70%',
                    color: '#333'
                  }}>
                    {chat.message}
                  </div>
                </div>
                
                {/* AI回复 */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start'
                }}>
                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)',
                    padding: '12px 16px',
                    borderRadius: '18px 18px 18px 4px',
                    maxWidth: '70%',
                    color: 'white',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {chat.response}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        padding: '20px',
        borderTop: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入您的问题..."
            disabled={chatLoading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '25px',
              border: 'none',
              background: 'rgba(255,255,255,0.9)',
              resize: 'none',
              minHeight: '50px',
              maxHeight: '120px',
              fontSize: '16px',
              outline: 'none'
            }}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={chatLoading || !message.trim()}
            style={{
              background: chatLoading ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              padding: '12px 24px',
              cursor: chatLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              minWidth: '80px'
            }}
          >
            {chatLoading ? '...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  )
}
