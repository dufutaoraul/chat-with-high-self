'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import styles from './reset-password-confirm.module.css';

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState('正在验证重置链接...');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    console.log('=== 密码重置确认页面调试 ===');
    console.log('当前URL:', window.location.href);
    console.log('Hash参数:', window.location.hash);

    // 直接处理URL中的token参数
    const handlePasswordReset = async () => {
      try {
        // 检查URL hash中的参数
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('提取的参数:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type
        });

        if (accessToken && type === 'recovery') {
          // 使用token设置会话
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          });

          if (error) {
            console.error('会话设置错误:', error);
            setError('重置链接验证失败，请重新申请密码重置');
            setStatusMessage('');
          } else {
            console.log('会话设置成功');
            setIsReady(true);
            setStatusMessage('');
          }
        } else {
          // 检查是否已有有效会话
          const { data: { user }, error } = await supabase.auth.getUser();
          if (user) {
            setIsReady(true);
            setStatusMessage('');
          } else {
            setError('重置链接无效或已过期，请重新申请密码重置');
            setStatusMessage('');
          }
        }
      } catch (err) {
        console.error('处理重置链接时出错:', err);
        setError('处理重置链接时发生错误');
        setStatusMessage('');
      }
    };

    handlePasswordReset();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isReady) {
      setError('页面尚未准备好或链接无效');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(`密码更新失败: ${error.message}`);
      } else {
        setSuccess('密码已成功重置！正在跳转到登录页面...');
        // 清除URL中的敏感参数
        window.history.replaceState({}, document.title, window.location.pathname);
        // 3秒后跳转到登录页
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      console.error('重置密码时出错:', err);
      setError('重置密码时发生未知错误');
    } finally {
      setLoading(false);
    }
  };
  // 成功状态
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.starryBackground}>
          <div className={styles.stars}></div>
          <div className={styles.twinkling}></div>
          <div className={styles.clouds}></div>
        </div>

        <div className={styles.content}>
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.successTitle}>密码重置成功</h1>
            <p className={styles.successMessage}>{success}</p>
            <button
              onClick={() => router.push('/login')}
              className={styles.primaryButton}
            >
              立即登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 加载或错误状态
  if (!isReady) {
    return (
      <div className={styles.container}>
        <div className={styles.starryBackground}>
          <div className={styles.stars}></div>
          <div className={styles.twinkling}></div>
          <div className={styles.clouds}></div>
        </div>

        <div className={styles.content}>
          <div className={styles.card}>
            <h1 className={styles.title}>
              {error ? '验证失败' : statusMessage}
            </h1>
            {error && (
              <div className={styles.errorMessage}>
                <p>{error}</p>
                <button
                  onClick={() => router.push('/reset-password')}
                  className={styles.secondaryButton}
                >
                  重新申请重置
                </button>
              </div>
            )}
            {!error && (
              <div className={styles.loadingSpinner}></div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 密码重置表单
  return (
    <div className={styles.container}>
      <div className={styles.starryBackground}>
        <div className={styles.stars}></div>
        <div className={styles.twinkling}></div>
        <div className={styles.clouds}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          <h1 className={styles.title}>设置新密码</h1>
          <p className={styles.subtitle}>请输入您的新密码</p>

          <form onSubmit={handleSubmit} className={styles.form}>
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
                disabled={loading}
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
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading || !isReady}
            >
              {loading ? '重置中...' : '重置密码'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}