'use client'

import { useState } from 'react'
import { createClient } from '../../utils/supabase/client'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testPasswordReset = async () => {
    setLoading(true)
    setResult('测试中...')

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      })

      setResult(`
测试结果：
- 错误: ${error ? JSON.stringify(error, null, 2) : '无'}
- 数据: ${data ? JSON.stringify(data, null, 2) : '无'}
- 状态: ${error ? '失败' : '成功'}
      `)
    } catch (err: any) {
      setResult(`异常: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const testEmailConfig = async () => {
    setLoading(true)
    setResult('检查邮件配置...')

    try {
      // 测试Supabase连接
      const { data, error } = await supabase.auth.getSession()
      
      setResult(`
Supabase连接测试：
- URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || '未配置'}
- 连接状态: ${error ? '失败' : '成功'}
- 错误: ${error ? JSON.stringify(error, null, 2) : '无'}
      `)
    } catch (err: any) {
      setResult(`Supabase连接异常: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>📧 邮件功能测试</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>1. 测试Supabase配置</h2>
        <button 
          onClick={testEmailConfig}
          disabled={loading}
          style={{ padding: '10px', marginRight: '10px' }}
        >
          测试配置
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>2. 测试密码重置邮件</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="输入测试邮箱"
          style={{ padding: '10px', width: '300px', marginRight: '10px' }}
        />
        <button 
          onClick={testPasswordReset}
          disabled={loading || !email}
          style={{ padding: '10px' }}
        >
          {loading ? '发送中...' : '发送测试邮件'}
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>测试结果：</h3>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          border: '1px solid #ddd',
          whiteSpace: 'pre-wrap',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {result || '等待测试...'}
        </pre>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <h3>💡 可能的问题和解决方案：</h3>
        <ul>
          <li><strong>邮件未收到</strong>: 检查垃圾邮件文件夹</li>
          <li><strong>配置错误</strong>: 检查Supabase项目设置</li>
          <li><strong>发送限制</strong>: Supabase可能有发送频率限制</li>
          <li><strong>邮件模板</strong>: 检查Supabase Dashboard中的邮件模板</li>
        </ul>
      </div>
    </div>
  )
}