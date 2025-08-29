'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'

interface TestResults {
  auth?: any
  chat?: any
  payment?: any
  tokens?: any
  database?: any
}

export default function DebugCenter() {
  const [testResults, setTestResults] = useState<TestResults>({})
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('test123456')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createClient()

  // 检查环境变量
  const checkEnvironment = () => {
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV || 'development',
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured',
      APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'Not configured',
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      currentURL: typeof window !== 'undefined' ? window.location.origin : 'Server side'
    }
    
    setTestResults(prev => ({ ...prev, environment: envInfo }))
  }

  // 测试数据库连接
  const testDatabaseConnection = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from('profiles').select('count').limit(1)
      
      if (error) {
        setTestResults(prev => ({ 
          ...prev, 
          database: { 
            status: 'error', 
            message: error.message,
            details: error
          } 
        }))
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          database: { 
            status: 'success', 
            message: '数据库连接正常',
            data 
          } 
        }))
      }
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        database: { 
          status: 'error', 
          message: error instanceof Error ? error.message : String(error) 
        } 
      }))
    } finally {
      setIsLoading(false)
    }
  }

  // 快速注册测试用户
  const quickSignUp = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const result = await response.json()
      setTestResults(prev => ({ 
        ...prev, 
        auth: { 
          type: 'signup',
          status: response.status,
          ...result 
        } 
      }))
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        auth: { 
          type: 'signup',
          error: error instanceof Error ? error.message : String(error) 
        } 
      }))
    } finally {
      setIsLoading(false)
    }
  }

  // 快速登录
  const quickSignIn = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const result = await response.json()
      setTestResults(prev => ({ 
        ...prev, 
        auth: { 
          type: 'signin',
          status: response.status,
          ...result 
        } 
      }))
      
      if (result.success) {
        setIsLoggedIn(true)
        setUserInfo(result.user)
      }
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        auth: { 
          type: 'signin',
          error: error instanceof Error ? error.message : String(error) 
        } 
      }))
    } finally {
      setIsLoading(false)
    }
  }

  // 测试密码重置
  const testPasswordReset = async () => {
    try {
      setIsLoading(true)
      console.log('=== PASSWORD RESET TEST ===')
      console.log('Testing email:', email)
      console.log('Current APP_URL:', process.env.NEXT_PUBLIC_APP_URL)

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const result = await response.json()
      console.log('Password reset response:', result)

      setTestResults(prev => ({
        ...prev,
        passwordReset: {
          status: response.status,
          timestamp: new Date().toISOString(),
          requestEmail: email,
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
          ...result
        }
      }))
    } catch (error) {
      console.error('Password reset test error:', error)
      setTestResults(prev => ({
        ...prev,
        passwordReset: {
          error: error instanceof Error ? error.message : String(error)
        }
      }))
    } finally {
      setIsLoading(false)
    }
  }

  // 测试URL解析
  const testUrlParsing = () => {
    const testUrls = [
      'http://localhost:3005/reset-password/confirm#access_token=test&refresh_token=test',
      'http://localhost:3005/auth/callback?code=test',
      'http://localhost:3005/reset-password/confirm?access_token=test&refresh_token=test'
    ]

    const results = testUrls.map(url => {
      const urlObj = new URL(url)
      const hashParams = new URLSearchParams(urlObj.hash.substring(1))
      const searchParams = urlObj.searchParams

      return {
        url,
        hash: urlObj.hash,
        search: urlObj.search,
        hashParams: Object.fromEntries(hashParams.entries()),
        searchParams: Object.fromEntries(searchParams.entries())
      }
    })

    setTestResults(prev => ({
      ...prev,
      urlParsing: results
    }))
  }

  // 检查登录状态
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true)
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error) {
        setTestResults(prev => ({ 
          ...prev, 
          authStatus: { error: error.message } 
        }))
        setIsLoggedIn(false)
      } else if (user) {
        setTestResults(prev => ({ 
          ...prev, 
          authStatus: { success: '用户已登录', user } 
        }))
        setIsLoggedIn(true)
        setUserInfo(user)
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          authStatus: { info: '用户未登录' } 
        }))
        setIsLoggedIn(false)
      }
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        authStatus: { error: error instanceof Error ? error.message : String(error) } 
      }))
    } finally {
      setIsLoading(false)
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
      setIsLoading(true)
      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: '你好，这是一个测试消息' })
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
    } finally {
      setIsLoading(false)
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
      setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }

  // 运行所有测试
  const runAllTests = async () => {
    checkEnvironment()
    await testDatabaseConnection()
    await checkAuthStatus()
  }

  useEffect(() => {
    checkEnvironment()
  }, [])

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        🔧 调试诊断中心
      </h1>
      
      {isLoading && (
        <div style={{ 
          position: 'fixed', 
          top: '20px', 
          right: '20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          padding: '10px 20px', 
          borderRadius: '5px',
          zIndex: 1000
        }}>
          测试中...
        </div>
      )}

      {/* 快速操作区 */}
      <div style={{ marginBottom: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ color: '#007bff', marginBottom: '20px' }}>⚡ 快速操作</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            <label>测试邮箱: </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>测试密码: </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px', width: '200px' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          <button onClick={runAllTests} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            运行所有测试
          </button>
          <button onClick={quickSignUp} style={{ padding: '10px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            测试注册
          </button>
          <button onClick={quickSignIn} style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            测试登录
          </button>
          <button onClick={testPasswordReset} style={{ padding: '10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            测试密码重置
          </button>
          <button onClick={testUrlParsing} style={{ padding: '10px', backgroundColor: '#e83e8c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            测试URL解析
          </button>
          <button onClick={checkAuthStatus} style={{ padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            检查登录状态
          </button>
        </div>
        
        {isLoggedIn && (
          <div style={{ padding: '10px', backgroundColor: '#d4edda', borderRadius: '5px', marginBottom: '10px' }}>
            ✅ 已登录用户: {userInfo?.email}
          </div>
        )}
      </div>

      {/* 测试结果显示区 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {Object.entries(testResults).map(([key, result]) => (
          <div key={key} style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
            <h3 style={{ color: '#333', marginBottom: '15px', textTransform: 'capitalize' }}>
              {key === 'authStatus' ? '🔐 登录状态' :
               key === 'environment' ? '🌍 环境信息' :
               key === 'database' ? '🗄️ 数据库连接' :
               key === 'passwordReset' ? '🔑 密码重置' :
               key === 'auth' ? '👤 认证测试' :
               key === 'chat' ? '💬 聊天API' :
               key === 'tokens' ? '🪙 Token API' : key}
            </h3>
            <pre style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '5px', 
              border: '1px solid #e9ecef', 
              fontSize: '12px', 
              overflow: 'auto', 
              maxHeight: '300px',
              whiteSpace: 'pre-wrap'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      {/* API测试区 */}
      {isLoggedIn && (
        <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h2 style={{ color: '#007bff', marginBottom: '20px' }}>🧪 API功能测试</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <button onClick={testChatAPI} style={{ padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              测试聊天功能
            </button>
            <button onClick={testTokenAPI} style={{ padding: '12px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              测试Token功能
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
