'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../utils/supabase/client'

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setMessage('验证失败，请重试')
          return
        }

        if (data.session) {
          setStatus('success')
          setMessage('邮箱验证成功！正在跳转...')
          
          // 延迟跳转到个人资料页面
          setTimeout(() => {
            router.push('/profile')
          }, 2000)
        } else {
          setStatus('error')
          setMessage('验证失败，请检查验证链接是否有效')
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        setStatus('error')
        setMessage('处理验证时出现错误')
      }
    }

    handleAuthCallback()
  }, [supabase, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            邮箱验证
          </h2>
          
          {status === 'loading' && (
            <div className="mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">正在验证您的邮箱...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="mt-4">
              <div className="text-green-600 text-4xl mb-2">✓</div>
              <p className="text-sm text-green-600">{message}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="mt-4">
              <div className="text-red-600 text-4xl mb-2">✗</div>
              <p className="text-sm text-red-600">{message}</p>
              <button
                onClick={() => router.push('/signin')}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                返回登录
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}