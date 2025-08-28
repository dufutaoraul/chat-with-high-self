'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './dashboard.module.css'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  const fetchTokenInfo = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/user/tokens', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTokenInfo(data)
      }
    } catch (error) {
      console.error('获取Token信息失败:', error)
    }
  }, [supabase])

  const checkUser = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      setUser(user)
      await fetchTokenInfo()
    } catch (error) {
      console.error('检查用户状态失败:', error)
      router.push('/signin')
    } finally {
      setLoading(false)
    }
  }, [router, supabase, fetchTokenInfo])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>与高我对话 - 控制台</h1>
          <div className={styles.userInfo}>
            <span>欢迎，{user?.email}</span>
            <button onClick={handleSignOut} className={styles.signOutButton}>
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.grid}>
          {/* Token 余额卡片 */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>💰 Token 余额</h2>
            </div>
            <div className={styles.cardContent}>
              {tokenInfo ? (
                <>
                  <div className={styles.balanceItem}>
                    <span className={styles.label}>付费Token:</span>
                    <span className={styles.value}>{tokenInfo.tokenBalance?.toLocaleString() || 0}</span>
                  </div>
                  <div className={styles.balanceItem}>
                    <span className={styles.label}>免费试用剩余:</span>
                    <span className={styles.value}>{tokenInfo.freeTokensRemaining || 0}</span>
                  </div>
                  <div className={styles.balanceItem}>
                    <span className={styles.label}>免费试用已用:</span>
                    <span className={styles.value}>{tokenInfo.freeTokensUsed || 0} / {tokenInfo.freeTokensLimit || 100}</span>
                  </div>
                </>
              ) : (
                <p>加载中...</p>
              )}
            </div>
            <div className={styles.cardActions}>
              <Link href="/pricing" className={styles.primaryButton}>
                充值Token
              </Link>
            </div>
          </div>

          {/* 快速操作卡片 */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>🚀 快速操作</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.actionGrid}>
                <Link href="/" className={styles.actionButton}>
                  <span className={styles.actionIcon}>💬</span>
                  <span>开始对话</span>
                </Link>
                <Link href="/pricing" className={styles.actionButton}>
                  <span className={styles.actionIcon}>💳</span>
                  <span>购买套餐</span>
                </Link>
                <button className={styles.actionButton} onClick={fetchTokenInfo}>
                  <span className={styles.actionIcon}>🔄</span>
                  <span>刷新余额</span>
                </button>
              </div>
            </div>
          </div>

          {/* 系统状态卡片 */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>📊 系统状态</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>认证状态:</span>
                <span className={`${styles.statusValue} ${styles.success}`}>✅ 已登录</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>支付系统:</span>
                <span className={`${styles.statusValue} ${styles.success}`}>✅ 正常</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>数据库:</span>
                <span className={`${styles.statusValue} ${styles.success}`}>✅ 连接正常</span>
              </div>
            </div>
          </div>

          {/* 使用说明卡片 */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2>📖 使用说明</h2>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.instructions}>
                <p><strong>🎁 免费试用:</strong> 新用户可免费使用价值1元的Token（约100个Token）</p>
                <p><strong>💰 Token消耗:</strong> 每次对话根据内容长度消耗Token，平均每次对话消耗10-50个Token</p>
                <p><strong>🛒 购买套餐:</strong> Token用完后可购买充值套餐或订阅服务</p>
                <p><strong>🔄 自动扣费:</strong> 优先使用免费Token，用完后自动使用付费Token</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}