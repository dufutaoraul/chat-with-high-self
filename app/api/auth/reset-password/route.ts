import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: '请提供邮箱地址' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // 发送密码重置邮件 - 使用标准的auth/callback路径
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password/confirm`
    console.log('Password reset redirect URL:', redirectUrl)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    })

    if (error) {
      console.error('密码重置错误:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: '密码重置邮件已发送，请检查您的邮箱'
    })

  } catch (error) {
    console.error('密码重置API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
