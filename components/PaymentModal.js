import { useState } from 'react'
import styles from '../styles/PaymentModal.module.css'

export default function PaymentModal({ isOpen, onClose, userBalance, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState('basic')

  const packages = {
    basic: {
      name: '基础包',
      price: 9.9,
      tokens: 7.62,
      description: '约15万字对话内容'
    },
    standard: {
      name: '标准包', 
      price: 19.9,
      tokens: 15.31,
      description: '约30万字对话内容'
    },
    premium: {
      name: '高级包',
      price: 39.9, 
      tokens: 30.69,
      description: '约60万字对话内容'
    }
  }

  const handlePurchase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/checkout/providers/zpay/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId: `tokens_${selectedPackage}`,
          amount: packages[selectedPackage].price,
          tokens: packages[selectedPackage].tokens
        })
      })

      const data = await response.json()
      
      if (data.paymentUrl) {
        // 跳转到支付页面
        window.open(data.paymentUrl, '_blank')
        
        // 监听支付结果
        const checkPayment = setInterval(async () => {
          const statusResponse = await fetch(`/api/checkout/status/${data.orderId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
          const statusData = await statusResponse.json()
          
          if (statusData.status === 'completed') {
            clearInterval(checkPayment)
            onPaymentSuccess()
            onClose()
          }
        }, 3000)
        
        // 10分钟后停止检查
        setTimeout(() => clearInterval(checkPayment), 600000)
      }
    } catch (error) {
      console.error('支付失败:', error)
      alert('支付失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>余额不足，请充值</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.balanceInfo}>
          <p>当前余额: <span className={styles.balance}>¥{userBalance.toFixed(2)}</span></p>
          <p className={styles.tip}>选择充值套餐继续使用服务</p>
        </div>

        <div className={styles.packageGrid}>
          {Object.entries(packages).map(([key, pkg]) => (
            <div 
              key={key}
              className={`${styles.packageCard} ${selectedPackage === key ? styles.selected : ''}`}
              onClick={() => setSelectedPackage(key)}
            >
              <div className={styles.packageHeader}>
                <h3>{pkg.name}</h3>
                <div className={styles.price}>¥{pkg.price}</div>
              </div>
              <div className={styles.packageDetails}>
                <p className={styles.description}>{pkg.description}</p>
              </div>
              {selectedPackage === key && (
                <div className={styles.selectedIndicator}>✓</div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
            disabled={loading}
          >
            取消
          </button>
          <button 
            className={styles.payButton} 
            onClick={handlePurchase}
            disabled={loading}
          >
            {loading ? '处理中...' : `支付 ¥${packages[selectedPackage].price}`}
          </button>
        </div>
      </div>
    </div>
  )
}