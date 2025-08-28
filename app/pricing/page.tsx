'use client'

import { createClient } from '../../utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './starry-pricing.module.css'

// Token包类型定义
interface TokenPackage {
    id: string;
    name: string;
    price: number;
    tokens: number;
    textChars: string;
    images: number;
    description: string;
}

// Token包数据（基于Gemini 2.5 Pro真实成本计算）
const tokenPackages: TokenPackage[] = [
    {
        id: 'starter_pack',
        name: '💫 入门包',
        price: 9.9,
        tokens: 280000,
        textChars: '18万字',
        images: 280,
        description: '适合尝鲜用户'
    },
    {
        id: 'standard_pack', 
        name: '⭐ 标准包',
        price: 39.9,
        tokens: 1200000,
        textChars: '80万字',
        images: 1200,
        description: '性价比之选'
    },
    {
        id: 'premium_pack',
        name: '🌟 豪华包', 
        price: 99.9,
        tokens: 3200000,
        textChars: '213万字',
        images: 3200,
        description: '重度用户首选'
    }
];

export default function PricingPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loadingPackageId, setLoadingPackageId] = useState<string | null>(null);

    const handlePurchase = async (tokenPackage: TokenPackage) => {
        setLoadingPackageId(tokenPackage.id);

        // 检查用户登录状态
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            router.push('/signin');
            return;
        }

        try {
            // 直接跳转到支付系统
            const paymentUrl = `https://payment.dufutao.asia?` + new URLSearchParams({
                productId: tokenPackage.id,
                name: `${tokenPackage.name} - ${tokenPackage.tokens.toLocaleString()} Tokens`,
                price: tokenPackage.price.toString(),
                tokens: tokenPackage.tokens.toString(),
                userId: user.id
            }).toString();

            window.location.href = paymentUrl;
        } catch (error) {
            console.error('支付错误:', error);
            alert('发生未知错误，请稍后再试。');
        } finally {
            setLoadingPackageId(null);
        }
    };

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
                    <h1 className={styles.title}>🌟 Token充值</h1>
                    <p className={styles.subtitle}>
                        继续您的智慧对话之旅
                    </p>
                </div>

                <div className={styles.packagesGrid}>
                    {tokenPackages.map((pkg, index) => (
                        <div 
                            key={pkg.id} 
                            className={`${styles.packageCard} ${index === 1 ? styles.recommended : ''}`}
                        >
                            {index === 1 && (
                                <div className={styles.recommendedBadge}>
                                    推荐
                                </div>
                            )}
                            
                            <div className={styles.packageHeader}>
                                <h3 className={styles.packageName}>{pkg.name}</h3>
                                <div className={styles.packagePrice}>
                                    <span className={styles.currency}>¥</span>
                                    <span className={styles.amount}>{pkg.price}</span>
                                </div>
                            </div>

                            <div className={styles.packageContent}>
                                <div className={styles.tokenAmount}>
                                    {pkg.tokens.toLocaleString()} Tokens
                                </div>
                                
                                <ul className={styles.featureList}>
                                    <li>约{pkg.textChars}对话内容</li>
                                    <li>或约{pkg.images}张图片识别</li>
                                    <li>或混合使用</li>
                                    <li>{pkg.description}</li>
                                </ul>
                            </div>

                            <button
                                onClick={() => handlePurchase(pkg)}
                                disabled={loadingPackageId === pkg.id}
                                className={styles.purchaseBtn}
                            >
                                {loadingPackageId === pkg.id ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        处理中...
                                    </>
                                ) : (
                                    '立即购买'
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                <div className={styles.features}>
                    <h3 className={styles.featuresTitle}>✨ 功能说明</h3>
                    <div className={styles.featuresGrid}>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>💬</span>
                            <div>
                                <h4>智能对话</h4>
                                <p>支持深度文字对话交流</p>
                            </div>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>🖼️</span>
                            <div>
                                <h4>图片识别</h4>
                                <p>AI图像理解与分析</p>
                            </div>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>🧠</span>
                            <div>
                                <h4>Gemini 2.0 Flash</h4>
                                <p>Google最新的高速AI模型</p>
                            </div>
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>⏰</span>
                            <div>
                                <h4>Token永不过期</h4>
                                <p>购买后可随时使用</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.footer}>
                    <p className={styles.disclaimer}>
                        ⚠️ 虚拟商品，一经售出概不退款
                    </p>
                    <p className={styles.footerNote}>
                        安全支付 | 即时到账 | 24小时客服
                    </p>
                </div>
            </div>
        </div>
    )
}