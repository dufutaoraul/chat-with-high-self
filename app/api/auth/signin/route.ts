import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    // 创建响应对象
    let response = NextResponse.json({ success: true, message: '登录成功' })

    // 创建 Supabase 客户端
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // 使用 Supabase 进行登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      )
    }

    // 登录成功，返回用户信息
    return NextResponse.json({
      success: true,
      message: '登录成功',
      user: data.user,
      redirectTo: '/dashboard'
    })

  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json(
      { success: false, message: '登录失败，请重试' },
      { status: 500 }
    )
  }
}
