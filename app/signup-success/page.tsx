'use client'

import Link from 'next/link'
import styles from './signup-success.module.css'

export default function SignUpSuccess() {
  return (
    <div className={styles.container}>
      {/* 星空背景动画 */}
      <div className={styles.backgroundAnimation}>
        <div className={styles.stars}></div>
        <div className={styles.twinkling}></div>
        <div className={styles.clouds}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.successIcon}>
          <span className={styles.checkmark}>✓</span>
        </div>
        
        <h1 className={styles.title}>注册成功！</h1>
        <p className={styles.message}>
          我们已向您的邮箱发送了验证邮件，请查收并点击验证链接完成账号激活。
        </p>
        
        <div className={styles.actions}>
          <Link href="/signin" className={styles.button}>
            前往登录
          </Link>
          <Link href="/" className={styles.secondaryButton}>
            返回首页
          </Link>
        </div>
      </div>
    </div>
  )
}