import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../utils/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization')

    if (!authorization) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 })
    }

    // 获取用户Token余额 - 先尝试profiles表，如果失败则尝试user_profiles表
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('token_balance, free_tokens_used')
      .eq('id', user.id)
      .single()

    // 如果profiles表不存在，尝试user_profiles表
    if (profileError) {
      const { data: userProfile, error: userProfileError } = await supabaseAdmin
        .from('user_profiles')
        .select('token_balance, free_tokens_used')
        .eq('user_id', user.id)
        .single()
      
      if (!userProfileError) {
        profile = userProfile
        profileError = null
      }
    }

    if (profileError) {
      // 如果用户档案不存在，创建一个（优先使用profiles表）
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          token_balance: 0,
          free_tokens_used: 0,
          free_tokens_limit: 100 // 1元免费试用，约100个Token
        })
        .select('token_balance, free_tokens_used')
        .single()

      // 如果profiles表创建失败，尝试user_profiles表
      if (createError) {
        const { data: newUserProfile, error: createUserError } = await supabaseAdmin
          .from('user_profiles')
          .insert({
            user_id: user.id,
            token_balance: 0,
            free_tokens_used: 0,
            free_tokens_limit: 100
          })
          .select('token_balance, free_tokens_used')
          .single()

        if (createUserError) {
          return NextResponse.json({ error: '创建用户档案失败' }, { status: 500 })
        }

        return NextResponse.json({
          tokenBalance: newUserProfile.token_balance || 0,
          freeTokensUsed: newUserProfile.free_tokens_used || 0,
          freeTokensLimit: 100,
          freeTokensRemaining: 100 - (newUserProfile.free_tokens_used || 0)
        })
      }

      if (createError) {
        return NextResponse.json({ error: '创建用户档案失败' }, { status: 500 })
      }

      return NextResponse.json({
        tokenBalance: newProfile.token_balance || 0,
        freeTokensUsed: newProfile.free_tokens_used || 0,
        freeTokensLimit: 100,
        freeTokensRemaining: 100 - (newProfile.free_tokens_used || 0)
      })
    }

    const freeTokensLimit = 100 // 1元免费试用
    const freeTokensUsed = profile?.free_tokens_used || 0
    const freeTokensRemaining = Math.max(0, freeTokensLimit - freeTokensUsed)

    return NextResponse.json({
      tokenBalance: profile?.token_balance || 0,
      freeTokensUsed,
      freeTokensLimit,
      freeTokensRemaining
    })

  } catch (error) {
    console.error('获取Token信息错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tokensUsed } = await request.json()
    const authorization = request.headers.get('authorization')

    if (!authorization) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    if (!tokensUsed || tokensUsed <= 0) {
      return NextResponse.json({ error: '无效的Token消耗量' }, { status: 400 })
    }

    const token = authorization.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 })
    }

    // 获取用户当前Token状态
    const { data: profile, error: getError } = await supabaseAdmin
      .from('profiles')
      .select('token_balance, free_tokens_used')
      .eq('id', user.id)
      .single()

    if (getError || !profile) {
      return NextResponse.json({ error: '获取用户档案失败' }, { status: 500 })
    }

    const freeTokensLimit = 100
    const currentFreeUsed = profile.free_tokens_used || 0
    const currentBalance = profile.token_balance || 0
    const freeTokensRemaining = Math.max(0, freeTokensLimit - currentFreeUsed)

    let newFreeUsed = currentFreeUsed
    let newBalance = currentBalance
    let usedFromFree = 0
    let usedFromPaid = 0

    // 优先使用免费Token
    if (freeTokensRemaining > 0) {
      usedFromFree = Math.min(tokensUsed, freeTokensRemaining)
      newFreeUsed = currentFreeUsed + usedFromFree
    }

    // 剩余部分使用付费Token
    const remainingToUse = tokensUsed - usedFromFree
    if (remainingToUse > 0) {
      if (currentBalance < remainingToUse) {
        return NextResponse.json({ 
          error: 'Token余额不足',
          required: remainingToUse,
          available: currentBalance,
          needPayment: true
        }, { status: 402 })
      }
      usedFromPaid = remainingToUse
      newBalance = currentBalance - remainingToUse
    }

    // 更新用户Token状态
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        token_balance: newBalance,
        free_tokens_used: newFreeUsed,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: '更新Token余额失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tokensUsed,
      usedFromFree,
      usedFromPaid,
      newBalance,
      newFreeUsed,
      freeTokensRemaining: Math.max(0, freeTokensLimit - newFreeUsed)
    })

  } catch (error) {
    console.error('消耗Token错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}