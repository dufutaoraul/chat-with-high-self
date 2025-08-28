'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './test-demo.module.css'

interface TestResult {
  status?: number
  data?: any
  error?: string
}

interface TestResults {
  chat?: TestResult
  payment?: TestResult
  tokens?: TestResult
}

export default function TestDemo() {
  const [testResults, setTestResults] = useState<TestResults>({})

  const testChatAPI = async () => {
    try {
      console.log('Testing chat API...')
      // 先检查用户是否已登录
      const authResponse = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include'
      })

      if (!authResponse.ok) {
        setTestResults(prev => ({
          ...prev,
          chat: { error: '用户未登录，请先登录后再测试' }
        }))
        return
      }

      const userData = await authResponse.json()

      const response = await fetch('/api/chat/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: '你好，这是一个测试消息',
          userId: userData.user?.id || 'test-user-id'
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

  const testPaymentAPI = async () => {
    try {
      console.log('Testing payment API...')
      // 先检查用户是否已登录
      const authResponse = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include'
      })

      if (!authResponse.ok) {
        setTestResults(prev => ({
          ...prev,
          payment: { error: '用户未登录，请先登录后再测试' }
        }))
        return
      }

      const userData = await authResponse.json()

      const response = await fetch('/api/checkout/providers/zpay/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: 10,
          userId: userData.user?.id || 'test-user-id',
          packageType: 'basic'
        })
      })

      const result = await response.json()
      setTestResults(prev => ({
        ...prev,
        payment: { status: response.status, data: result }
      }))
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        payment: { error: error instanceof Error ? error.message : String(error) }
      }))
    }
  }

  const testTokenAPI = async () => {
    try {
      console.log('Testing token API...')
      // 先检查用户是否已登录
      const authResponse = await fetch('/api/auth/user', {
        method: 'GET',
        credentials: 'include'
      })

      if (!authResponse.ok) {
        setTestResults(prev => ({
          ...prev,
          tokens: { error: '用户未登录，请先登录后再测试' }
        }))
        return
      }

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
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🧪 功能测试页面</h1>
        <p>测试核心功能而无需登录</p>
      </div>

      <div className={styles.testSection}>
        <h2>🔗 快速导航</h2>
        <div className={styles.linkGrid}>
          <Link href="/signin" className={styles.navLink}>
            🔐 登录页面
          </Link>
          <Link href="/signup" className={styles.navLink}>
            📝 注册页面
          </Link>
          <Link href="/chat" className={styles.navLink}>
            💬 聊天页面
          </Link>
          <Link href="/dashboard" className={styles.navLink}>
            📊 仪表板
          </Link>
          <Link href="/pricing" className={styles.navLink}>
            💰 定价页面
          </Link>
        </div>
      </div>

      <div className={styles.testSection}>
        <h2>🧪 API 测试</h2>
        <div className={styles.testGrid}>
          <div className={styles.testCard}>
            <h3>💬 聊天 API</h3>
            <button onClick={testChatAPI} className={styles.testButton}>
              测试聊天功能
            </button>
            {testResults.chat && (
              <pre className={styles.result}>
                {JSON.stringify(testResults.chat, null, 2)}
              </pre>
            )}
          </div>

          <div className={styles.testCard}>
            <h3>💳 支付 API</h3>
            <button onClick={testPaymentAPI} className={styles.testButton}>
              测试支付功能
            </button>
            {testResults.payment && (
              <pre className={styles.result}>
                {JSON.stringify(testResults.payment, null, 2)}
              </pre>
            )}
          </div>

          <div className={styles.testCard}>
            <h3>🪙 Token API</h3>
            <button onClick={testTokenAPI} className={styles.testButton}>
              测试Token功能
            </button>
            {testResults.tokens && (
              <pre className={styles.result}>
                {JSON.stringify(testResults.tokens, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      <div className={styles.testSection}>
        <h2>📋 调试信息</h2>
        <div className={styles.debugInfo}>
          <p><strong>当前环境:</strong> {process.env.NODE_ENV || 'development'}</p>
          <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}</p>
          <p><strong>App URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'Not configured'}</p>
        </div>
      </div>

      <div className={styles.footer}>
        <p>💡 提示：打开浏览器开发者工具查看详细日志</p>
      </div>
    </div>
  )
}
