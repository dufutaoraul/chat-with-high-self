'use client'

import { useState } from 'react'

export default function TestLinks() {
  const [testResults, setTestResults] = useState<any>({})

  // 模拟不同的重置链接格式
  const testResetLinks = [
    {
      name: 'Hash格式 (标准)',
      url: '/reset-password/confirm#access_token=test_token_123&refresh_token=test_refresh_456&type=recovery',
      description: 'Supabase标准格式，使用hash参数'
    },
    {
      name: 'Query格式',
      url: '/reset-password/confirm?access_token=test_token_123&refresh_token=test_refresh_456&type=recovery',
      description: '使用query参数的格式'
    },
    {
      name: '无token',
      url: '/reset-password/confirm',
      description: '没有任何token的链接'
    }
  ]

  const testUrlParsing = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`
    const urlObj = new URL(fullUrl)
    
    // 解析hash参数
    const hashParams = new URLSearchParams(urlObj.hash.substring(1))
    const hashTokens = {
      access_token: hashParams.get('access_token'),
      refresh_token: hashParams.get('refresh_token'),
      type: hashParams.get('type')
    }
    
    // 解析search参数
    const searchTokens = {
      access_token: urlObj.searchParams.get('access_token'),
      refresh_token: urlObj.searchParams.get('refresh_token'),
      type: urlObj.searchParams.get('type')
    }
    
    return {
      url: fullUrl,
      hash: urlObj.hash,
      search: urlObj.search,
      hashTokens,
      searchTokens,
      hasValidTokens: !!(hashTokens.access_token || searchTokens.access_token)
    }
  }

  const runAllTests = () => {
    const results = testResetLinks.map(link => ({
      ...link,
      parseResult: testUrlParsing(link.url)
    }))
    
    setTestResults({ linkTests: results })
  }

  const testCurrentUrl = () => {
    const currentResult = testUrlParsing(window.location.pathname + window.location.search + window.location.hash)
    setTestResults(prev => ({ ...prev, currentUrl: currentResult }))
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        🔧 密码重置链接测试
      </h1>
      
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ color: '#007bff', marginBottom: '20px' }}>测试操作</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <button 
            onClick={runAllTests}
            style={{ padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            测试所有链接格式
          </button>
          <button 
            onClick={testCurrentUrl}
            style={{ padding: '12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            测试当前URL
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ color: '#007bff', marginBottom: '20px' }}>测试链接</h2>
        
        {testResetLinks.map((link, index) => (
          <div key={index} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: 'white' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{link.name}</h4>
            <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>{link.description}</p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <code style={{ flex: 1, padding: '8px', backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '3px', fontSize: '12px' }}>
                {link.url}
              </code>
              <a 
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '3px', fontSize: '12px' }}
              >
                测试
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* 测试结果显示 */}
      {Object.keys(testResults).length > 0 && (
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
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff3cd' }}>
        <h2 style={{ color: '#856404', marginBottom: '20px' }}>📋 调试说明</h2>
        <ul style={{ color: '#856404', lineHeight: '1.6' }}>
          <li><strong>Hash格式</strong>: Supabase默认使用hash参数传递token (如 #access_token=xxx)</li>
          <li><strong>Query格式</strong>: 有些配置可能使用query参数 (如 ?access_token=xxx)</li>
          <li><strong>检查顺序</strong>: 应该先检查hash参数，再检查query参数</li>
          <li><strong>Session设置</strong>: 获取到token后需要调用 supabase.auth.setSession()</li>
          <li><strong>错误处理</strong>: 没有token或token无效时应显示友好错误信息</li>
        </ul>
      </div>

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
          <a href="/test-reset" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px', textAlign: 'center' }}>
            重置测试
          </a>
        </div>
      </div>
    </div>
  )
}
