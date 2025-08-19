import { useState, useEffect } from 'react'
import Head from 'next/head'
import DemoInterface from '../components/DemoInterface'
import ChatInterface from '../components/ChatInterface'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setDemoMode(true)
      setLoading(false)
      return
    }
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
      } else {
        setDemoMode(true)
      }
    } catch (error) {
      console.error('认证检查失败:', error)
      setDemoMode(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8fafc'
      }}>
        <div style={{
          textAlign: 'center',
          color: '#6b7280'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>加载中...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div>
      <Head>
        <title>与高我对话 - Token计费系统演示</title>
        <meta name="description" content="体验智能Token计费和支付系统" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <main>
        {demoMode ? <DemoInterface /> : <ChatInterface />}
      </main>
    </div>
  )
}

export default Home
