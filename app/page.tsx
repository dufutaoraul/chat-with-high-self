'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../utils/supabase/client'
import styles from './page.module.css'
import './starry-background.css'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error('检查用户状态失败:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const handleStartChat = () => {
    // 直接使用已经检查过的用户状态，避免重复检查造成闪烁
    if (user) {
      // 已登录用户直接进入聊天界面
      router.push('/chat')
    } else {
      // 未登录用户跳转到登录页面
      router.push('/signin')
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>加载中...</p>
      </div>
    )
  }

  // 所有用户都看到星空首页
  return (
    <div className={styles.appContainer}>
      {/* 新的炫酷星空背景 */}
      <div className="starry-container">
        <div className="deep-space"></div>
        <div className="stars-large"></div>
        <div className="stars-medium"></div>
        <div className="stars-small"></div>
        <div className="nebula-effect"></div>
        <div className="shooting-stars">
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
          <div className="shooting-star"></div>
        </div>
      </div>
      
      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.logoContainer}>
            <div className={styles.logo}>
              <div className={styles.logoGlow}></div>
              <div className={styles.logoRing1}></div>
              <div className={styles.logoRing2}></div>
              <div className={styles.logoRing3}></div>
              <div className={styles.logoCore}>🌟</div>
            </div>
          </div>
          
          <h1 className={styles.title}>与高我对话</h1>
          <h2 className={styles.subtitle}>探索内在智慧的旅程</h2>
          <p className={styles.description}>
            通过深度对话，发现你内在的智慧与力量。<br />
            规划人生蓝图，记录成长轨迹，收藏珍贵洞察。
          </p>
          
          <div className={styles.authButtons}>
            <button 
              className={styles.authButton}
              onClick={handleStartChat}
            >
              <span className={styles.buttonIcon}>✨</span>
              {user ? '进入对话' : '开始对话'}
            </button>
            {user && (
              <div className={styles.userWelcome}>
                欢迎回来，{user.email}
              </div>
            )}
          </div>
          
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>💬</span>
              深度对话
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📋</span>
              人生蓝图
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📝</span>
              反思记录
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>💡</span>
              洞察收藏
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
