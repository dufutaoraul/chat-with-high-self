'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'
import styles from './signin.module.css'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message)
      }

      // 登录成功，强制跳转到仪表板
      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error('登录失败:', error)
      setError(error.message || '登录失败，请检查您的邮箱和密码')
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
          <h1 className={styles.title}>欢迎回来</h1>
          <p className={styles.subtitle}>继续您的自我发现之旅</p>
        </div>

        <form onSubmit={handleSignIn} className={styles.form}>
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
              placeholder="请输入您的邮箱" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">
              密码
            </label>
            <input 
              id="password" 
              type="password" 
              className={styles.input}
              placeholder="请输入您的密码" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <div className={styles.forgotPassword}>
              <Link href="/reset-password" className={styles.forgotLink}>
                忘记密码？
              </Link>
            </div>
          </div>

          <button 
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录账号'}
          </button>

          <div className={styles.footer}>
            <Link href="/signup" className={styles.link}>
              还没有账号？立即注册
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}