// 支付成功后的Token充值逻辑
import { createClient } from '@supabase/supabase-js'

// 用户数据库管理员客户端
const userAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 支付数据库管理员客户端
const paymentAdmin = createClient(
  process.env.NEXT_PUBLIC_PAYMENT_SUPABASE_URL!,
  process.env.PAYMENT_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * 支付成功后同步Token到用户账户
 * @param outTradeNo 订单号
 * @returns 同步结果
 */
export async function syncPaymentToTokens(outTradeNo: string) {
  try {
    // 1. 从支付数据库获取订单信息
    const { data: transaction, error: paymentError } = await paymentAdmin
      .from('zpay_transactions')
      .select('*')
      .eq('out_trade_no', outTradeNo)
      .eq('trade_status', 'SUCCESS')
      .single()

    if (paymentError || !transaction) {
      throw new Error(`订单不存在或未支付成功: ${outTradeNo}`)
    }

    // 2. 解析订单参数获取Token数量
    const param = transaction.param || {}
    const tokensToAdd = param.tokens || 0

    if (!tokensToAdd) {
      throw new Error(`订单 ${outTradeNo} 没有Token信息`)
    }

    // 3. 更新用户数据库中的Token余额
    const { data: currentProfile, error: getError } = await userAdmin
      .from('profiles')
      .select('token_balance')
      .eq('id', transaction.user_id)
      .single()

    if (getError) {
      // 用户可能不存在，创建用户档案
      const { error: createError } = await userAdmin
        .from('profiles')
        .insert({
          id: transaction.user_id,
          token_balance: tokensToAdd,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (createError) {
        throw new Error(`创建用户档案失败: ${createError.message}`)
      }
    } else {
      // 更新现有用户的Token余额
      const newBalance = (currentProfile.token_balance || 0) + tokensToAdd
      const { error: updateError } = await userAdmin
        .from('profiles')
        .update({ 
          token_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.user_id)

      if (updateError) {
        throw new Error(`更新Token余额失败: ${updateError.message}`)
      }
    }

    // 4. 标记订单为已同步（在支付数据库中添加同步标记）
    await paymentAdmin
      .from('zpay_transactions')
      .update({
        synced_at: new Date().toISOString(),
        sync_status: 'SUCCESS'
      })
      .eq('out_trade_no', outTradeNo)

    console.log(`✅ 订单 ${outTradeNo} 成功充值 ${tokensToAdd} Tokens`)
    
    return {
      success: true,
      tokensAdded: tokensToAdd,
      userId: transaction.user_id
    }

  } catch (error: any) {
    console.error(`❌ 订单 ${outTradeNo} 同步失败:`, error.message)
    
    // 记录同步失败状态
    await paymentAdmin
      .from('zpay_transactions')
      .update({
        sync_status: 'FAILED',
        sync_error: error.message,
        sync_attempted_at: new Date().toISOString()
      })
      .eq('out_trade_no', outTradeNo)

    return {
      success: false,
      error: error.message
    }
  }
}