import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('=== SIGNUP API DEBUG ===')
    console.log('Email:', email)
    console.log('Password length:', password?.length || 0)

    if (!email || !password) {
      console.log('Missing email or password')
      return NextResponse.json(
        { success: false, message: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: '密码长度至少为6位' },
        { status: 400 }
      )
    }

    // 创建响应对象
    let response = NextResponse.json({ success: true, message: '注册成功' })

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

    // 使用 Supabase 进行注册
    console.log('Attempting Supabase signup...')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      }
    })

    console.log('Supabase signup result:', {
      hasUser: !!data?.user,
      hasSession: !!data?.session,
      error: error?.message || 'No error'
    })

    if (error) {
      console.log('Signup error details:', error)
      // 将英文错误信息转换为中文
      let chineseMessage = '注册失败，请重试'

      if (error.message.includes('User already registered')) {
        chineseMessage = '该邮箱已被注册，请使用其他邮箱或直接登录'
      } else if (error.message.includes('Password should be at least')) {
        chineseMessage = '密码长度至少为6位'
      } else if (error.message.includes('Invalid email')) {
        chineseMessage = '邮箱格式不正确'
      } else if (error.message.includes('signup is disabled')) {
        chineseMessage = '注册功能暂时关闭，请联系管理员'
      }

      return NextResponse.json(
        { success: false, message: chineseMessage },
        { status: 400 }
      )
    }

    // 注册成功
    console.log('Signup successful')
    const successResponse = {
      success: true,
      message: data.user?.email_confirmed_at ? '注册成功！' : '注册成功！请检查您的邮箱并点击验证链接',
      user: data.user,
      needsEmailConfirmation: !data.user?.email_confirmed_at
    }
    console.log('Success response:', successResponse)
    return NextResponse.json(successResponse)

  } catch (error) {
    console.error('注册错误:', error)
    return NextResponse.json(
      { success: false, message: '注册失败，请重试' },
      { status: 500 }
    )
  }
}
