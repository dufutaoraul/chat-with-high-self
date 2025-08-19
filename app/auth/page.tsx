'use client'

import { useState, useEffect } from 'react'
import styles from './auth.module.css'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        alert('密码不匹配')
        setLoading(false)
        return
      }

      // 调用相应的API端点
      const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/signup'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          isLogin
        })
      })

      const data = await response.json()

      if (data.success) {
        // 保存用户信息到localStorage
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        localStorage.setItem('authToken', data.token)
        
        // 显示成功消息
        alert(data.message)
        
        // 跳转到主页
        window.location.href = '/'
      } else {
        alert(data.message || '认证失败，请重试')
      }
    } catch (error) {
      console.error('认证失败:', error)
      alert('网络错误，请检查连接后重试')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return <div className={styles.loading}>加载中...</div>
  }

  return (
    <div className={styles.authContainer}>
      {/* 背景动画 */}
      <div className={styles.backgroundAnimation}>
        <div className={styles.stars}></div>
        <div className={styles.twinkling}></div>
        <div className={styles.clouds}></div>
      </div>

      {/* 主要内容 */}
      <div className={styles.authWrapper}>
        <div className={styles.authCard}>
          {/* Logo和标题 */}
          <div className={styles.authHeader}>
            <div className={styles.logoContainer}>
              <div className={styles.logo}>
                <span className={styles.logoIcon}>🌟</span>
              </div>
              <div className={styles.logoRipple}></div>
            </div>
            <h1 className={styles.title}>与高我对话</h1>
            <h2 className={styles.subtitle}>
              {isLogin ? '欢迎回来' : '开启内在探索之旅'}
            </h2>
            <p className={styles.description}>
              {isLogin 
                ? '继续你的自我发现之旅，与内在智慧深度连接' 
                : '创建账户，开始与你的高我进行深度对话'
              }
            </p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.fieldLabel}>
                <span className={styles.labelIcon}>📧</span>
                邮箱地址
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="输入你的邮箱地址"
                  required
                  className={styles.input}
                  id="email"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.fieldLabel}>
                <span className={styles.labelIcon}>🔒</span>
                密码
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="输入你的密码"
                  required
                  className={styles.input}
                  id="password"
                />
              </div>
            </div>

            {!isLogin && (
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.fieldLabel}>
                  <span className={styles.labelIcon}>🔐</span>
                  确认密码
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="再次输入密码确认"
                    required
                    className={styles.input}
                    id="confirmPassword"
                  />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              <span className={styles.buttonContent}>
                {loading ? (
                  <>
                    <div className={styles.spinner}></div>
                    处理中...
                  </>
                ) : (
                  <>
                    <span className={styles.buttonIcon}>
                      {isLogin ? '🚀' : '✨'}
                    </span>
                    {isLogin ? '登录' : '开始探索'}
                  </>
                )}
              </span>
              <div className={styles.buttonRipple}></div>
            </button>
          </form>

          {/* 切换登录/注册 */}
          <div className={styles.authSwitch}>
            <p className={styles.switchText}>
              {isLogin ? '还没有账户？' : '已有账户？'}
            </p>
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className={styles.switchButton}
            >
              {isLogin ? '立即注册' : '立即登录'}
            </button>
          </div>

          {/* 注册福利 */}
          {!isLogin && (
            <div className={styles.benefits}>
              <h3 className={styles.benefitsTitle}>注册即享</h3>
              <div className={styles.benefitsList}>
                <div className={styles.benefitItem}>
                  <span className={styles.benefitIcon}>🎁</span>
                  <span className={styles.benefitText}>10,000 免费对话Token</span>
                </div>
                <div className={styles.benefitItem}>
                  <span className={styles.benefitIcon}>☁️</span>
                  <span className={styles.benefitText}>云端数据同步</span>
                </div>
                <div className={styles.benefitItem}>
                  <span className={styles.benefitIcon}>📊</span>
                  <span className={styles.benefitText}>个人成长追踪</span>
                </div>
                <div className={styles.benefitItem}>
                  <span className={styles.benefitIcon}>🔒</span>
                  <span className={styles.benefitText}>隐私安全保护</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 装饰元素 */}
        <div className={styles.decorativeElements}>
          <div className={styles.floatingElement} style={{top: '10%', left: '10%'}}>💫</div>
          <div className={styles.floatingElement} style={{top: '20%', right: '15%'}}>🌙</div>
          <div className={styles.floatingElement} style={{bottom: '30%', left: '5%'}}>⭐</div>
          <div className={styles.floatingElement} style={{bottom: '10%', right: '10%'}}>✨</div>
        </div>
      </div>
    </div>
  )
}