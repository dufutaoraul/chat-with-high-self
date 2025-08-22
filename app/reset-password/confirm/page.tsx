'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase/client'
import styles from '../reset-password.module.css'

function ResetPasswordConfirmContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 检查URL中是否有访问令牌
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    
    if (!accessToken) {
      setError('重置链接无效或已过期，请重新申请密码重置')
    }
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 验证密码
    if (password.length < 6) {
      setError('密码长度至少为6位')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      setSuccess(true)
      
      // 3秒后跳转到登录页面
      setTimeout(() => {
        router.push('/signin')
      }, 3000)
    } catch (error: any) {
      console.error('重置密码失败:', error)
      
      let chineseMessage = '重置密码失败，请重试'
      
      if (error.message.includes('New password should be different')) {
        chineseMessage = '新密码不能与旧密码相同'
      } else if (error.message.includes('Password should be at least')) {
        chineseMessage = '密码长度至少为6位'
      } else if (error.message.includes('Invalid or expired')) {
        chineseMessage = '重置链接无效或已过期，请重新申请密码重置'
      }
      
      setError(chineseMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.backgroundAnimation}>
          <div className={styles.stars}></div>
          <div className={styles.twinkling}></div>
          <div className={styles.clouds}></div>
        </div>

        <div className={styles.content}>
          <div className={styles.header}>
            <h1 className={styles.title}>密码重置成功</h1>
            <p className={styles.subtitle}>您的密码已成功重置</p>
          </div>

          <div className={styles.success}>
            密码重置成功！正在跳转到登录页面...
          </div>

          <div className={styles.footer}>
            <button 
              onClick={() => router.push('/signin')}
              className={styles.submitButton}
            >
              立即登录
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.backgroundAnimation}>
        <div className={styles.stars}></div>
        <div className={styles.twinkling}></div>
        <div className={styles.clouds}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>设置新密码</h1>
          <p className={styles.subtitle}>请输入您的新密码</p>
        </div>

        <form onSubmit={handleResetPassword} className={styles.form}>
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="password">
              新密码
            </label>
            <input 
              id="password" 
              type="password" 
              className={styles.input}
              placeholder="请输入新密码（至少6位）" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              minLength={6}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="confirmPassword">
              确认新密码
            </label>
            <input 
              id="confirmPassword" 
              type="password" 
              className={styles.input}
              placeholder="请再次输入新密码" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
              minLength={6}
            />
          </div>

          <button 
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? '重置中...' : '重置密码'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordConfirm() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.backgroundAnimation}>
          <div className={styles.stars}></div>
          <div className={styles.twinkling}></div>
          <div className={styles.clouds}></div>
        </div>
        <div className={styles.content}>
          <div className={styles.header}>
            <h1 className={styles.title}>加载中...</h1>
            <p className={styles.subtitle}>正在准备密码重置页面</p>
          </div>
        </div>
      </div>
    }>
      <ResetPasswordConfirmContent />
    </Suspense>
  )
}