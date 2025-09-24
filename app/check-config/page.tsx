'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase'

export default function CheckConfig() {
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkConfig = async () => {
      try {
        // 检查环境变量
        const envConfig = {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
          appUrl: process.env.NEXT_PUBLIC_APP_URL,
        }

        // 尝试获取当前会话信息
        const { data: session } = await supabase.auth.getSession()
        
        setConfig({
          environment: envConfig,
          session: session,
          currentUrl: window.location.origin,
          timestamp: new Date().toLocaleString()
        })
      } catch (error: any) {
        setConfig({ error: error?.message || 'Unknown error' })
      }
      setLoading(false)
    }

    checkConfig()
  }, [supabase])

  const testEmailConfirmation = async () => {
    try {
      // 测试注册但不提交
      const testEmail = 'test@example.com'
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'test123456'
        })
      })
      
      const result = await response.json()
      alert(`测试结果: ${JSON.stringify(result, null, 2)}`)
    } catch (error: any) {
      alert(`测试错误: ${error?.message || 'Unknown error'}`)
    }
  }

  if (loading) {
    return <div className="p-8">检查配置中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">配置检查</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">当前配置</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">配置检查清单</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded-full mr-3 ${config?.environment?.supabaseUrl ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Supabase URL: {config?.environment?.supabaseUrl || '未配置'}</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded-full mr-3 ${config?.environment?.siteUrl ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Site URL: {config?.environment?.siteUrl || '未配置'}</span>
            </div>
            <div className="flex items-center">
              <span className={`w-4 h-4 rounded-full mr-3 ${config?.currentUrl ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>当前访问地址: {config?.currentUrl || '未知'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">需要检查的Supabase设置</h2>
          <div className="space-y-2 text-sm">
            <p>1. <strong>Authentication → Settings → User Management</strong></p>
            <p className="ml-4">✅ Enable email confirmations (必须开启)</p>
            <p>2. <strong>Authentication → Settings → URL Configuration</strong></p>
            <p className="ml-4">✅ Site URL: https://www.dufutao.asia</p>
            <p className="ml-4">✅ Redirect URLs: https://www.dufutao.asia/auth/callback</p>
            <p>3. <strong>Authentication → Settings → Emails → Templates</strong></p>
            <p className="ml-4">✅ Confirm signup 模板已启用</p>
          </div>
          
          <button
            onClick={testEmailConfirmation}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            测试邮件发送
          </button>
        </div>
      </div>
    </div>
  )
}