'use client'

import { useState } from 'react'
import { createClient } from '../../utils/supabase/client'

export default function TestAuthFlow() {
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('test123456')
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  // 测试注册流程
  const testSignUp = async () => {
    setLoading(true)
    try {
      console.log('=== TESTING SIGNUP ===')
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      })

      setResults(prev => ({
        ...prev,
        signup: {
          success: !error,
          data,
          error: error?.message,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        signup: { error: err.message, timestamp: new Date().toISOString() }
      }))
    } finally {
      setLoading(false)
    }
  }

  // 测试登录流程
  const testSignIn = async () => {
    setLoading(true)
    try {
      console.log('=== TESTING SIGNIN ===')
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      setResults(prev => ({
        ...prev,
        signin: {
          success: !error,
          data,
          error: error?.message,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        signin: { error: err.message, timestamp: new Date().toISOString() }
      }))
    } finally {
      setLoading(false)
    }
  }

  // 测试密码重置流程
  const testPasswordReset = async () => {
    setLoading(true)
    try {
      console.log('=== TESTING PASSWORD RESET ===')
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password/confirm`,
      })

      setResults(prev => ({
        ...prev,
        passwordReset: {
          success: !error,
          data,
          error: error?.message,
          redirectUrl: `${window.location.origin}/auth/callback?next=/reset-password/confirm`,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        passwordReset: { error: err.message, timestamp: new Date().toISOString() }
      }))
    } finally {
      setLoading(false)
    }
  }

  // 检查当前认证状态
  const checkAuthStatus = async () => {
    setLoading(true)
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()

      setResults(prev => ({
        ...prev,
        authStatus: {
          user,
          session,
          error: error?.message,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (err: any) {
      setResults(prev => ({
        ...prev,
        authStatus: { error: err.message, timestamp: new Date().toISOString() }
      }))
    } finally {
      setLoading(false)
    }
  }

  // 清除所有结果
  const clearResults = () => {
    setResults({})
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        🔧 认证流程测试
      </h1>
      
      {/* 输入区域 */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ color: '#007bff', marginBottom: '20px' }}>测试参数</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>邮箱:</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>密码:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        </div>
      </div>

      {/* 测试按钮 */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ color: '#007bff', marginBottom: '20px' }}>测试操作</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <button 
            onClick={testSignUp}
            disabled={loading}
            style={{ padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            测试注册
          </button>
          <button 
            onClick={testSignIn}
            disabled={loading}
            style={{ padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            测试登录
          </button>
          <button 
            onClick={testPasswordReset}
            disabled={loading}
            style={{ padding: '12px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            测试密码重置
          </button>
          <button 
            onClick={checkAuthStatus}
            disabled={loading}
            style={{ padding: '12px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            检查认证状态
          </button>
          <button 
            onClick={clearResults}
            style={{ padding: '12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            清除结果
          </button>
        </div>
        
        {loading && (
          <div style={{ textAlign: 'center', color: '#007bff', fontWeight: 'bold' }}>
            测试中...
          </div>
        )}
      </div>

      {/* 测试结果 */}
      {Object.keys(results).length > 0 && (
        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: 'white' }}>
          <h2 style={{ color: '#333', marginBottom: '20px' }}>测试结果</h2>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '5px', 
            border: '1px solid #e9ecef', 
            fontSize: '12px', 
            overflow: 'auto', 
            maxHeight: '500px',
            whiteSpace: 'pre-wrap'
          }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}

      {/* 说明文档 */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff3cd' }}>
        <h2 style={{ color: '#856404', marginBottom: '20px' }}>📋 测试说明</h2>
        <ul style={{ color: '#856404', lineHeight: '1.6' }}>
          <li><strong>注册流程</strong>: 使用Supabase标准注册，重定向到 /auth/callback</li>
          <li><strong>登录流程</strong>: 直接密码登录，无需邮件确认</li>
          <li><strong>密码重置</strong>: 发送重置邮件，链接指向 /auth/callback?next=/reset-password/confirm</li>
          <li><strong>认证状态</strong>: 检查当前用户和会话状态</li>
          <li><strong>重要</strong>: 密码重置邮件中的链接会先经过 /auth/callback 处理，然后重定向到确认页面</li>
        </ul>
      </div>

      {/* 相关链接 */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#d1ecf1' }}>
        <h2 style={{ color: '#0c5460', marginBottom: '20px' }}>🔗 相关链接</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <a href="/debug-center" style={{ padding: '10px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
            调试中心
          </a>
          <a href="/reset-password" style={{ padding: '10px', backgroundColor: '#ffc107', color: 'black', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
            密码重置请求
          </a>
          <a href="/reset-password/confirm" style={{ padding: '10px', backgroundColor: '#dc3545', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
            密码重置确认
          </a>
          <a href="/auth/callback" style={{ padding: '10px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
            认证回调
          </a>
        </div>
      </div>
    </div>
  )
}
