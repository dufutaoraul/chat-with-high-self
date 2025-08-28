'use client'

import { useState } from 'react'
import { createClient } from '../../utils/supabase/client'
// 内联样式，不需要外部CSS文件

interface TestResults {
  auth?: any
  chat?: any
  payment?: any
  tokens?: any
}

export default function QuickTest() {
  const [testResults, setTestResults] = useState<TestResults>({})
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('test123456')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)

  const supabase = createClient()

  // 快速注册测试用户
  const quickSignUp = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      })

      if (error) {
        setTestResults(prev => ({ 
          ...prev, 
          auth: { error: error.message } 
        }))
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          auth: { success: '注册成功！请检查邮箱验证邮件', data } 
        }))
      }
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        auth: { error: error instanceof Error ? error.message : String(error) } 
      }))
    }
  }

  // 快速登录
  const quickSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (error) {
        setTestResults(prev => ({ 
          ...prev, 
          auth: { error: error.message } 
        }))
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          auth: { success: '登录成功！', data } 
        }))
        setIsLoggedIn(true)
        setUserInfo(data.user)
      }
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        auth: { error: error instanceof Error ? error.message : String(error) } 
      }))
    }
  }

  // 检查登录状态
  const checkAuthStatus = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        setTestResults(prev => ({ 
          ...prev, 
          auth: { error: error.message } 
        }))
        setIsLoggedIn(false)
      } else if (user) {
        setTestResults(prev => ({ 
          ...prev, 
          auth: { success: '用户已登录', user } 
        }))
        setIsLoggedIn(true)
        setUserInfo(user)
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          auth: { info: '用户未登录' } 
        }))
        setIsLoggedIn(false)
      }
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        auth: { error: error instanceof Error ? error.message : String(error) } 
      }))
    }
  }

  // 测试聊天API
  const testChatAPI = async () => {
    if (!isLoggedIn) {
      setTestResults(prev => ({ 
        ...prev, 
        chat: { error: '请先登录' } 
      }))
      return
    }

    try {
      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: '你好，这是一个测试消息',
        })
      })
      
      const result = await response.json()
      setTestResults(prev => ({
        ...prev,
        chat: { status: response.status, data: result }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        chat: { error: error instanceof Error ? error.message : String(error) }
      }))
    }
  }

  // 测试Token API
  const testTokenAPI = async () => {
    if (!isLoggedIn) {
      setTestResults(prev => ({ 
        ...prev, 
        tokens: { error: '请先登录' } 
      }))
      return
    }

    try {
      const response = await fetch('/api/user/tokens', {
        method: 'GET',
        credentials: 'include'
      })
      
      const result = await response.json()
      setTestResults(prev => ({
        ...prev,
        tokens: { status: response.status, data: result }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        tokens: { error: error instanceof Error ? error.message : String(error) }
      }))
    }
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>🚀 快速测试页面</h1>

      {/* 认证测试 */}
      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ color: '#007bff', marginBottom: '20px' }}>🔐 用户认证测试</h2>
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>邮箱: </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>密码: </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <button onClick={quickSignUp} style={{ padding: '12px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>
            快速注册
          </button>
          <button onClick={quickSignIn} style={{ padding: '12px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>
            快速登录
          </button>
          <button onClick={checkAuthStatus} style={{ padding: '12px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>
            检查登录状态
          </button>
        </div>
        
        {isLoggedIn && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px' }}>
            ✅ 已登录用户: {userInfo?.email}
          </div>
        )}
        
        {testResults.auth && (
          <pre style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', border: '1px solid #e9ecef', fontSize: '12px', overflow: 'auto', maxHeight: '300px' }}>
            {JSON.stringify(testResults.auth, null, 2)}
          </pre>
        )}
      </div>

      {/* API测试 */}
      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ color: '#007bff', marginBottom: '20px' }}>🧪 API 测试</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
            <h3 style={{ color: '#28a745', marginBottom: '15px' }}>💬 聊天 API</h3>
            <button onClick={testChatAPI} style={{ padding: '12px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', width: '100%', marginBottom: '15px' }}>
              测试聊天功能
            </button>
            {testResults.chat && (
              <pre style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', border: '1px solid #e9ecef', fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(testResults.chat, null, 2)}
              </pre>
            )}
          </div>

          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
            <h3 style={{ color: '#ffc107', marginBottom: '15px' }}>🪙 Token API</h3>
            <button onClick={testTokenAPI} style={{ padding: '12px 20px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '14px', width: '100%', marginBottom: '15px' }}>
              测试Token功能
            </button>
            {testResults.tokens && (
              <pre style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', border: '1px solid #e9ecef', fontSize: '12px', overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(testResults.tokens, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* 调试信息 */}
      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ color: '#007bff', marginBottom: '20px' }}>📋 调试信息</h2>
        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', border: '1px solid #e9ecef' }}>
          <p style={{ margin: '5px 0' }}><strong>当前环境:</strong> {process.env.NODE_ENV || 'development'}</p>
          <p style={{ margin: '5px 0' }}><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}</p>
          <p style={{ margin: '5px 0' }}><strong>App URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'Not configured'}</p>
          <p style={{ margin: '5px 0' }}><strong>登录状态:</strong> {isLoggedIn ? '已登录' : '未登录'}</p>
        </div>
      </div>
    </div>
  )
}
