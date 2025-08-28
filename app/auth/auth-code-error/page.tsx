'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from '../auth.module.css'

export default function AuthCodeError() {
  const [errorDetails, setErrorDetails] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    // 从URL参数中获取错误详情
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    const errorDescription = urlParams.get('error_description')
    
    if (error || errorDescription) {
      setErrorDetails(errorDescription || error || '未知错误')
    }
  }, [])

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
          <h1 className={styles.title}>认证失败</h1>
          <p className={styles.subtitle}>邮件链接验证遇到问题</p>
        </div>

        <div className={styles.errorBox}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>可能的原因：</h3>
          <ul className={styles.errorList}>
            <li>邮件链接已过期（链接有效期为1小时）</li>
            <li>邮件链接已被使用过</li>
            <li>邮件链接格式不正确</li>
            <li>网络连接问题</li>
          </ul>
          
          {errorDetails && (
            <div className={styles.errorDetails}>
              <strong>错误详情：</strong> {errorDetails}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <h3>解决方案：</h3>
          <div className={styles.actionButtons}>
            <Link href="/reset-password" className={styles.actionButton}>
              重新申请密码重置
            </Link>
            <Link href="/signup" className={styles.actionButton}>
              重新发送验证邮件
            </Link>
            <Link href="/signin" className={styles.actionButton}>
              返回登录页面
            </Link>
          </div>
        </div>

        <div className={styles.helpSection}>
          <h4>仍然有问题？</h4>
          <p>请确保：</p>
          <ul>
            <li>使用最新收到的邮件中的链接</li>
            <li>在收到邮件后1小时内点击链接</li>
            <li>检查邮件是否在垃圾邮件文件夹中</li>
            <li>尝试在不同的浏览器中打开链接</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
