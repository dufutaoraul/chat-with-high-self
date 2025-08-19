import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, isLogin } = await request.json()
    
    // 模拟用户认证
    const user = {
      id: Date.now().toString(),
      email,
      tokenBalance: 10000, // 1万免费token
      createdAt: new Date().toISOString(),
      name: email.split('@')[0] // 从邮箱提取用户名
    }
    
    return NextResponse.json({
      success: true,
      user,
      message: isLogin ? '登录成功' : '注册成功',
      token: 'demo_token_' + Date.now() // 演示token
    })
  } catch (error) {
    console.error('认证错误:', error)
    return NextResponse.json(
      { success: false, message: '认证失败，请重试' },
      { status: 500 }
    )
  }
}
