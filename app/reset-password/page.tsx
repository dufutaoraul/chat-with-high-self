'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '../../utils/supabase/client'

export default function ResetPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      setMessage('重置密码的邮件已发送到您的邮箱，请查收。')
    } catch (error: any) {
      console.error('发送重置邮件失败:', error)
      setError('发送重置邮件失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center p-5">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              重置密码
            </h1>
            <p className="text-white/70">
              {emailSent ? '邮件已发送' : '输入您的邮箱地址'}
            </p>
          </div>

          {!emailSent ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-white/90 text-sm font-medium mb-2">
                  邮箱地址
                </label>
                <input 
                  type="email" 
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入您的邮箱地址" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 transition-all"
                disabled={loading}
              >
                {loading ? '发送中...' : '发送重置邮件'}
              </button>

              <div className="text-center">
                <Link href="/signin" className="text-blue-400 hover:text-blue-300 text-sm">
                  返回登录
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center">
              {message && (
                <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-3 rounded-lg text-sm mb-6">
                  {message}
                </div>
              )}
              
              <div className="text-center">
                <Link href="/signin" className="text-blue-400 hover:text-blue-300 text-sm">
                  返回登录
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}