import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '无效的用户令牌' }, { status: 401 })
    }

    // 获取用户Token余额 - 使用新的user_tokens表
    let { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('balance, total_purchased, total_used')
      .eq('user_id', user.id)
      .single()

    if (tokenError) {
      console.log('Token记录不存在，创建新记录...')
      // 如果用户Token记录不存在，创建一个默认记录
      const { data: newTokenData, error: createError } = await supabase
        .from('user_tokens')
        .insert({
          user_id: user.id,
          balance: 10, // 免费赠送10个Token
          total_purchased: 0,
          total_used: 0
        })
        .select('balance, total_purchased, total_used')
        .single()

      if (createError) {
        console.error('创建Token记录失败:', createError)
        // 即使创建失败，也返回默认值
        return NextResponse.json({
          tokenBalance: 10,
          freeTokensUsed: 0,
          freeTokensLimit: 10,
          freeTokensRemaining: 10
        })
      }

      tokenData = newTokenData
    }

    // 计算免费Token使用情况（前10个Token为免费）
    const freeTokensLimit = 10
    const totalUsed = tokenData?.total_used || 0
    const freeTokensUsed = Math.min(totalUsed, freeTokensLimit)
    const freeTokensRemaining = Math.max(0, freeTokensLimit - freeTokensUsed)

    return NextResponse.json({
      tokenBalance: tokenData?.balance || 0,
      freeTokensUsed,
      freeTokensLimit,
      freeTokensRemaining,
      totalPurchased: tokenData?.total_purchased || 0,
      totalUsed: tokenData?.total_used || 0
    })

  } catch (error) {
    console.error('获取Token信息错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '无效的用户令牌' }, { status: 401 })
    }

    const { tokensUsed } = await request.json()

    if (!tokensUsed || tokensUsed <= 0) {
      return NextResponse.json({ error: '无效的Token消耗量' }, { status: 400 })
    }

    // 获取用户当前Token状态
    const { data: tokenData, error: getError } = await supabase
      .from('user_tokens')
      .select('balance, total_used')
      .eq('user_id', user.id)
      .single()

    if (getError || !tokenData) {
      return NextResponse.json({ error: '获取用户Token信息失败' }, { status: 500 })
    }

    const currentBalance = tokenData.balance || 0
    const currentTotalUsed = tokenData.total_used || 0

    // 检查余额是否足够
    if (currentBalance < tokensUsed) {
      return NextResponse.json({
        error: 'Token余额不足',
        required: tokensUsed,
        available: currentBalance,
        needPayment: true
      }, { status: 402 })
    }

    // 更新用户Token状态
    const newBalance = currentBalance - tokensUsed
    const newTotalUsed = currentTotalUsed + tokensUsed

    const { error: updateError } = await supabase
      .from('user_tokens')
      .update({
        balance: newBalance,
        total_used: newTotalUsed,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('更新Token余额失败:', updateError)
      return NextResponse.json({ error: '更新Token余额失败' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tokensUsed,
      newBalance,
      newTotalUsed
    })

  } catch (error) {
    console.error('消耗Token错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}