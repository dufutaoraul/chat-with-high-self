'use client'

import { useState } from 'react'
import { createClient } from '../../utils/supabase/client'

export default function TestReset() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const testReset = async () => {
    setLoading(true)
    setResult('测试中...')

    try {
      // 使用简化的重置方法
      const { data, error } = await supabase.auth.resetPasswordForEmail(email)

      setResult(`
简化重置测试结果:
- 邮箱: ${email}
- 域名: ${window.location.origin}
- 错误: ${error ? JSON.stringify(error, null, 2) : '无'}
- 数据: ${data ? JSON.stringify(data, null, 2) : '{}'}
- 状态: ${error ? '失败' : '成功'}
- 时间: ${new Date().toLocaleString()}
      `)
    } catch (err: any) {
      setResult(`异常: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', background: '#f5f5f5', minHeight: '100vh' }}>
      <h1>🔧 简化重置测试</h1>
      
      <div style={{ marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h2>测试密码重置</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="输入邮箱地址"
          style={{ 
            padding: '10px', 
            width: '300px', 
            marginRight: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        <button 
          onClick={testReset}
          disabled={loading || !email}
          style={{ 
            padding: '10px 20px',
            background: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '测试中...' : '发送重置邮件'}
        </button>
      </div>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h3>测试结果:</h3>
        <pre style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          border: '1px solid #e9ecef',
          borderRadius: '4px',
          whiteSpace: 'pre-wrap',
          fontSize: '12px',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {result || '等待测试...'}
        </pre>
      </div>

      <div style={{ marginTop: '20px', background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h3>🛠️ 检查列表:</h3>
        <ul style={{ lineHeight: '1.6' }}>
          <li>✅ Supabase连接正常</li>
          <li>❓ 邮件模板是否启用</li>
          <li>❓ Site URL是否正确设置</li>
          <li>❓ 邮件服务商是否拦截</li>
          <li>❓ 重定向URL是否匹配</li>
        </ul>
      </div>
    </div>
  )
}