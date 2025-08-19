'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../utils/supabase/client'
import styles from './signup.module.css'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!agreedToTerms) {
      setError('请同意服务条款和隐私政策')
      return
    }

    if (password.length < 6) {
      setError('密码长度不能少于6个字符')
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        throw error
      }

      // 检查是否需要邮箱验证
      if (data?.user?.identities?.length === 0) {
        // 已注册但未确认邮箱
        setError('该邮箱已注册，请检查邮箱或直接登录')
        return
      }

      // 注册成功
      if (data.user) {
        // 重定向到成功页面或登录页面
        router.push('/signup-success')
      }
    } catch (error: any) {
      console.error('注册失败:', error)
      setError(error.message || '注册失败，请稍后再试')
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
          <h1 className={styles.title}>加入我们</h1>
          <p className={styles.subtitle}>开始您的自我发现之旅</p>
        </div>

        <form onSubmit={handleSignUp} className={styles.form}>
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
              placeholder="请设置您的密码" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
            <p className={styles.hint}>密码至少需要6个字符</p>
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                className={styles.checkbox}
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                required
              />
              <span className={styles.checkboxText}>
                我同意{' '}
                <a className={styles.link} href="#0">
                  服务条款
                </a>{' '}
                和{' '}
                <a className={styles.link} href="#0">
                  隐私政策
                </a>
              </span>
            </label>
          </div>

          <button 
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '注册中...' : '注册账号'}
          </button>

          <div className={styles.footer}>
            <Link href="/signin" className={styles.link}>
              已有账号？立即登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}