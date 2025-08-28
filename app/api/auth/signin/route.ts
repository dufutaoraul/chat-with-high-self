import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('=== LOGIN API DEBUG ===')
    console.log('Email:', email)
    console.log('Password length:', password?.length || 0)

    if (!email || !password) {
      console.log('Missing email or password')
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
    console.log('Attempting Supabase login...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log('Supabase login result:', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message || 'No error'
    })

    if (error) {
      console.log('Login error details:', error)
      // 将英文错误信息转换为中文
      let chineseMessage = '登录失败，请重试'
      
      if (error.message.includes('Invalid login credentials')) {
        chineseMessage = '邮箱或密码错误，请检查后重试'
      } else if (error.message.includes('Email not confirmed')) {
        chineseMessage = '请先验证您的邮箱地址'
      } else if (error.message.includes('Too many requests')) {
        chineseMessage = '登录尝试过于频繁，请稍后再试'
      } else if (error.message.includes('User not found')) {
        chineseMessage = '用户不存在，请检查邮箱地址'
      }
      
      return NextResponse.json(
        { success: false, message: chineseMessage },
        { status: 400 }
      )
    }

    // 登录成功，返回用户信息
    console.log('Login successful, returning success response')
    const successResponse = {
      success: true,
      message: '登录成功',
      user: data.user,
      redirectTo: '/dashboard'
    }
    console.log('Success response:', successResponse)
    return NextResponse.json(successResponse)

  } catch (error) {
    console.error('登录错误:', error)
    return NextResponse.json(
      { success: false, message: '登录失败，请重试' },
      { status: 500 }
    )
  }
}
