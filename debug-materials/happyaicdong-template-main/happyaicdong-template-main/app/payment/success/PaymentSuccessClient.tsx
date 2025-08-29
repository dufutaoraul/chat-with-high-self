'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function PaymentSuccessClient() {
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();
  const supabase = createClient();

  // First check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('User not authenticated, redirecting to login');
        if (orderId) {
          router.push(`/signin?redirect=/payment/success?orderId=${orderId}`);
        } else {
          router.push('/signin?redirect=/');
        }
        return;
      }
      
      setIsAuthenticated(true);
    };
    
    checkAuth();
  }, [orderId, router, supabase]);

  // Then fetch transaction data if user is authenticated
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!isAuthenticated) return;
      
      if (!orderId) {
        setError('支付订单ID不存在');
        setLoading(false);
        return;
      }

      try {
        // Get current session again just to be safe
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('您的登录会话已过期，请重新登录');
          setLoading(false);
          return;
        }

        // 获取交易信息
        const { data, error } = await supabase
          .from('zpay_transactions')
          .select('*')
          .eq('out_trade_no', orderId)
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          setError('未找到交易记录');
        } else {
          setTransaction(data);
          
          // If transaction is pending, poll for updates
          if (data.status === 'pending') {
            const intervalId = setInterval(async () => {
              const { data: refreshedData, error: refreshError } = await supabase
                .from('zpay_transactions')
                .select('*')
                .eq('out_trade_no', orderId)
                .eq('user_id', session.user.id)
                .single();
                
              if (!refreshError && refreshedData && refreshedData.status === 'success') {
                setTransaction(refreshedData);
                clearInterval(intervalId);
              }
            }, 5000); // Check every 5 seconds
            
            // Clean up interval
            return () => clearInterval(intervalId);
          }
        }
      } catch (error: any) {
        console.error('获取交易信息失败:', error);
        setError(error.message || '获取交易信息失败');
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [isAuthenticated, orderId, supabase]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="pt-32 pb-12 md:pt-40 md:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          {loading ? (
            <div className="text-center">
              <h1 className="h2 mb-4">正在处理您的支付...</h1>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center">
              <h1 className="h2 mb-4">支付处理出错</h1>
              <p className="text-lg text-gray-600 mb-8">{error}</p>
              <Link 
                href="/" 
                className="btn text-white bg-blue-600 hover:bg-blue-700"
              >
                返回购买页面
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <h1 className="h2 mb-4">
                {transaction?.status === 'success' ? '支付成功！' : '支付处理中'}
              </h1>
              
              {transaction?.status === 'success' ? (
                <>
                  <p className="text-lg text-gray-600 mb-8">
                    感谢您的购买！您的订单已成功处理。
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg mb-8">
                    <h3 className="font-semibold text-lg mb-2">订单详情</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div>
                        <p className="text-sm text-gray-500">产品</p>
                        <p>{transaction.metadata?.product_name || '未知产品'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">金额</p>
                        <p>¥{parseFloat(transaction.amount).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">订单号</p>
                        <p>{transaction.out_trade_no}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">日期</p>
                        <p>{new Date(transaction.created_at).toLocaleDateString()}</p>
                      </div>
                      {transaction.is_subscription && (
                        <>
                          <div>
                            <p className="text-sm text-gray-500">订阅类型</p>
                            <p>
                              {transaction.metadata?.subscription_period === 'yearly' 
                                ? '年付订阅' 
                                : '月付订阅'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">有效期至</p>
                            <p>{new Date(transaction.subscription_end).toLocaleDateString()}</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
                    <Link 
                      href="/dashboard" 
                      className="btn text-white bg-blue-600 hover:bg-blue-700"
                    >
                      进入控制台
                    </Link>
                    <Link 
                      href="/" 
                      className="btn text-gray-600 bg-gray-100 hover:bg-gray-200"
                    >
                      返回购买页面
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-lg text-gray-600 mb-8">
                    您的支付正在处理中，请稍后查看订单状态。
                  </p>
                  <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
                    <Link 
                      href="/dashboard" 
                      className="btn text-white bg-blue-600 hover:bg-blue-700"
                    >
                      进入控制台
                    </Link>
                    <Link 
                      href="/" 
                      className="btn text-gray-600 bg-gray-100 hover:bg-gray-200"
                    >
                      返回购买页面
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 