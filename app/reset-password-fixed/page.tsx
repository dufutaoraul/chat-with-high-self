'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import styles from '../reset-password/reset-password.module.css'

export default function ResetPasswordFixed() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  
  // 强制使用有邮件配置的数据库
  const supabase = createClient(
    'https://tarluhsejlzqmwfiwxkb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcmx1aHNlamx6cW13Zml3eGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MzY5MzIsImV4cCI6MjA3MTAxMjkzMn0.gX4qEBpmPKQ2abUfm7jlrFVwP5zLBiXTkG563Gc8EHc'
  )

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      console.log('强制使用邮件数据库发送重置邮件到:', email)
      console.log('数据库URL:', 'https://tarluhsejlzqmwfiwxkb.supabase.co')
      
      // 不指定redirectTo，使用Supabase默认配置
      const { error, data } = await supabase.auth.resetPasswordForEmail(email)
      
      console.log('重置密码结果:', { error, data })

      if (error) {
        throw error
      }

      setEmailSent(true)
      setMessage('重置密码的邮件已发送到您的邮箱，请查收并按照邮件中的指示操作。')
    } catch (error: any) {
      console.error('发送重置邮件失败:', error)
      
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
      <div className={styles.backgroundAnimation}>
        <div className={styles.stars}></div>
        <div className={styles.twinkling}></div>
        <div className={styles.clouds}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>重置密码（修复版）</h1>
          <p className={styles.subtitle}>
            {emailSent ? '邮件已发送' : '强制使用有邮件配置的数据库'}
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

        <div style={{ marginTop: '20px', padding: '10px', background: '#f0f8ff', borderRadius: '5px', fontSize: '12px' }}>
          <strong>调试信息：</strong>
          <br />数据库：tarluhsejlzqmwfiwxkb.supabase.co (有邮件配置)
        </div>
      </div>
    </div>
  )
}