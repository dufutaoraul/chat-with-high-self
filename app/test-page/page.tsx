'use client'

export default function TestPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ 
        textAlign: 'center', 
        color: 'white',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌟 与高我对话</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>探索内在智慧的旅程</p>
        <button 
          style={{
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid white',
            borderRadius: '50px',
            color: 'white',
            cursor: 'pointer'
          }}
          onClick={() => {
            window.location.href = '/signin'
          }}
        >
          ✨ 开始对话
        </button>
      </div>
    </div>
  )
}