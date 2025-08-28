import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      )
    }

    // 获取用户详细信息
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('获取用户资料失败:', profileError)
      // 即使获取资料失败，也返回基本用户信息
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        }
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        profile: profile
      }
    })

  } catch (error) {
    console.error('获取用户信息失败:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
