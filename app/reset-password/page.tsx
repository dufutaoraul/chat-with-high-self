'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'
import styles from './reset-password.module.css'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      setMessage('重置密码的邮件已发送到您的邮箱，请查收并按照邮件中的指示操作。')
    } catch (error: any) {
      console.error('发送重置邮件失败:', error)
      
      // 转换为中文错误信息
      let chineseMessage = '发送重置邮件失败，请重试'
      
      if (error.message.includes('User not found')) {
        chineseMessage = '该邮箱地址未注册，请检查邮箱地址或先注册账号'
      } else if (error.message.includes('Email rate limit exceeded')) {
        chineseMessage = '发送邮件过于频繁，请稍后再试'
      } else if (error.message.includes('Invalid email')) {
        chineseMessage = '邮箱地址格式不正确'
      }
      
      setError(chineseMessage)
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
          <h1 className={styles.title}>重置密码</h1>
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
                }}
                className={styles.resendLink}
              >
                重新发送邮件
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}