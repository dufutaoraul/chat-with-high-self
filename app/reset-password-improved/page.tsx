'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import styles from '../reset-password/reset-password.module.css'

export default function ImprovedResetPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const router = useRouter()
  
  // 使用支付数据库发送邮件（它有邮件配置）
  const paymentSupabase = createClient(
    process.env.NEXT_PUBLIC_PAYMENT_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_PAYMENT_SUPABASE_ANON_KEY!
  )

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    setDebugInfo('')

    try {
      // 获取当前域名和端口
      const origin = window.location.origin
      const redirectUrl = `${origin}/reset-password/confirm`
      
      console.log('重置密码请求信息:', {
        email,
        origin,
        redirectUrl,
        paymentDbUrl: process.env.NEXT_PUBLIC_PAYMENT_SUPABASE_URL
      })

      setDebugInfo(`
调试信息：
- 邮箱: ${email}
- 当前域名: ${origin}
- 重定向URL: ${redirectUrl}
- 使用数据库: ${process.env.NEXT_PUBLIC_PAYMENT_SUPABASE_URL}
      `)
      
      const { error, data } = await paymentSupabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      })
      
      console.log('重置密码API响应:', { error, data })

      if (error) {
        throw error
      }

      setEmailSent(true)
      setMessage(`重置密码的邮件已发送到 ${email}，请查收并按照邮件中的指示操作。`)
      
      // 更新调试信息
      setDebugInfo(debugInfo + `
- API响应: 成功
- 数据: ${JSON.stringify(data, null, 2)}
      `)
    } catch (error: any) {
      console.error('发送重置邮件失败:', error)
      
      // 更新调试信息
      setDebugInfo(debugInfo + `
- 错误类型: ${error.name || '未知'}
- 错误消息: ${error.message || '未知错误'}
- 错误详情: ${JSON.stringify(error, null, 2)}
      `)
      
      // 转换为中文错误信息
      let chineseMessage = '发送重置邮件失败，请重试'
      
      if (error.message?.includes('User not found')) {
        chineseMessage = '该邮箱地址未注册，请检查邮箱地址或先注册账号'
      } else if (error.message?.includes('Email rate limit exceeded')) {
        chineseMessage = '发送邮件过于频繁，请稍后再试'
      } else if (error.message?.includes('Invalid email')) {
        chineseMessage = '邮箱地址格式不正确'
      } else if (error.message?.includes('Email not confirmed')) {
        chineseMessage = '邮箱未验证，请先验证邮箱'
      } else if (error.message?.includes('unauthorized')) {
        chineseMessage = '无权限发送邮件，请检查配置'
      }
      
      setError(`${chineseMessage}（详细信息请查看下方调试信息）`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      {/* 星空背景动画 */}
      <div className={styles.backgroundAnimation}>
        <div className={styles.stars}></div>
        <div className={styles.twinkling}></div>
        <div className={styles.clouds}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>密码重置（改进版）</h1>
          <p className={styles.subtitle}>
            {emailSent ? '邮件已发送' : '输入您的邮箱地址，我们将发送重置密码的链接'}
          </p>
        </div>

        {!emailSent ? (
          <form onSubmit={handleResetPassword} className={styles.form}>
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}
            
            <div className={styles.inputGroup}>
              <label className={styles.label} htmlFor="email">
                邮箱地址
              </label>
              <input 
                id="email" 
                type="email" 
                className={styles.input}
                placeholder="请输入您的邮箱地址" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>

            <button 
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? '发送中...' : '发送重置邮件'}
            </button>

            <div className={styles.footer}>
              <Link href="/signin" className={styles.link}>
                返回登录
              </Link>
              <span className={styles.separator}>|</span>
              <Link href="/reset-password" className={styles.link}>
                使用原版本
              </Link>
            </div>
          </form>
        ) : (
          <div className={styles.successMessage}>
            {message && (
              <div className={styles.success}>
                {message}
              </div>
            )}
            
            <div className={styles.instructions}>
              <h3>接下来的步骤：</h3>
              <ol>
                <li>检查您的邮箱（包括垃圾邮件文件夹）</li>
                <li>点击邮件中的重置密码链接</li>
                <li>确认链接指向: <code>{window.location.origin}/reset-password/confirm</code></li>
                <li>设置新密码</li>
                <li>使用新密码登录</li>
              </ol>
            </div>

            <div className={styles.footer}>
              <Link href="/signin" className={styles.link}>
                返回登录
              </Link>
              <span className={styles.separator}>|</span>
              <button 
                onClick={() => {
                  setEmailSent(false)
                  setMessage(null)
                  setError(null)
                  setDebugInfo('')
                }}
                className={styles.resendLink}
              >
                重新发送邮件
              </button>
            </div>
          </div>
        )}

        {/* 调试信息 */}
        {debugInfo && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            <strong>调试信息：</strong>
            {debugInfo}
          </div>
        )}

        {/* 配置检查 */}
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#e8f4fd',
          border: '1px solid #b8daff',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <h4>🔧 配置检查清单：</h4>
          <ul>
            <li>✅ 使用支付数据库发送邮件: {process.env.NEXT_PUBLIC_PAYMENT_SUPABASE_URL}</li>
            <li>✅ redirectTo参数已配置</li>
            <li>⚠️  请确保在Supabase Dashboard中：
              <ul>
                <li>Site URL设置为您的实际域名</li>
                <li>Redirect URLs中添加了 <code>/reset-password/confirm</code></li>
                <li>邮件模板使用 <code>{`{{ .RedirectTo }}`}</code> 而不是 <code>{`{{ .SiteURL }}`}</code></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}