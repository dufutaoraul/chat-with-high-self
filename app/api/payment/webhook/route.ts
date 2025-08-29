import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/client'
import crypto from 'crypto'

// 验证ZPay签名
function verifySign(params: Record<string, any>, key: string): boolean {
  const { sign, sign_type, ...otherParams } = params
  
  if (!sign || sign_type !== 'MD5') {
    return false
  }

  // 过滤空值
  const filteredParams: Record<string, string> = {}
  for (const [k, v] of Object.entries(otherParams)) {
    if (v !== null && v !== undefined && v !== '') {
      filteredParams[k] = String(v)
    }
  }

  // 按键名排序
  const sortedKeys = Object.keys(filteredParams).sort()
  
  // 拼接字符串
  const paramStr = sortedKeys.map(k => `${k}=${filteredParams[k]}`).join('&')
  
  // 加上密钥并MD5加密
  const signStr = paramStr + key
  const calculatedSign = crypto.createHash('md5').update(signStr).digest('hex')
  
  return calculatedSign === sign
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const params: Record<string, string> = {}
    
    // 提取所有参数
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    console.log('=== 支付回调 ===')
    console.log('回调参数:', params)

    const {
      pid,
      name,
      money,
      out_trade_no,
      trade_no,
      trade_status,
      type,
      sign,
      sign_type
    } = params

    // 验证必要参数
    if (!pid || !out_trade_no || !trade_status || !sign) {
      console.error('缺少必要参数')
      return new Response('Missing required parameters', { status: 400 })
    }

    // 验证商户ID
    if (pid !== process.env.ZPAY_PID) {
      console.error('商户ID不匹配')
      return new Response('Invalid merchant ID', { status: 400 })
    }

    // 验证签名
    const zpayKey = process.env.ZPAY_KEY
    if (!zpayKey) {
      console.error('ZPay密钥未配置')
      return new Response('Payment configuration error', { status: 500 })
    }

    if (!verifySign(params, zpayKey)) {
      console.error('签名验证失败')
      return new Response('Invalid signature', { status: 400 })
    }

    // 创建Supabase客户端
    const supabase = createClient()

    // 查找订单
    const { data: orderData, error: orderError } = await supabase
      .from('zpay_transactions')
      .select('*')
      .eq('out_trade_no', out_trade_no)
      .single()

    if (orderError || !orderData) {
      console.error('订单不存在:', out_trade_no)
      return new Response('Order not found', { status: 404 })
    }

    // 检查订单是否已经处理过
    if (orderData.status === 'completed') {
      console.log('订单已处理过:', out_trade_no)
      return new Response('success')
    }

    // 验证金额
    const orderAmount = parseFloat(orderData.amount.toString())
    const paidAmount = parseFloat(money)
    if (Math.abs(orderAmount - paidAmount) > 0.01) {
      console.error('金额不匹配:', { orderAmount, paidAmount })
      return new Response('Amount mismatch', { status: 400 })
    }

    // 只有支付成功才处理
    if (trade_status === 'TRADE_SUCCESS') {
      try {
        // 开始事务处理
        
        // 1. 更新订单状态
        const { error: updateOrderError } = await supabase
          .from('zpay_transactions')
          .update({
            status: 'completed',
            trade_no: trade_no,
            notify_count: (orderData.notify_count || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('out_trade_no', out_trade_no)

        if (updateOrderError) {
          console.error('更新订单状态失败:', updateOrderError)
          return new Response('Failed to update order', { status: 500 })
        }

        // 2. 增加用户对话次数
        const { data: conversationData, error: conversationError } = await supabase
          .from('user_conversations')
          .select('*')
          .eq('user_id', orderData.user_id)
          .single()

        if (conversationError) {
          console.error('获取用户对话数据失败:', conversationError)
          return new Response('Failed to get user conversations', { status: 500 })
        }

        const { error: updateConversationError } = await supabase
          .from('user_conversations')
          .update({
            total_conversations: conversationData.total_conversations + orderData.conversations_count,
            paid_conversations: conversationData.paid_conversations + orderData.conversations_count,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', orderData.user_id)

        if (updateConversationError) {
          console.error('更新用户对话次数失败:', updateConversationError)
          return new Response('Failed to update conversations', { status: 500 })
        }

        console.log('支付处理成功:', {
          orderId: out_trade_no,
          userId: orderData.user_id,
          conversations: orderData.conversations_count,
          amount: money
        })

      } catch (error) {
        console.error('支付处理异常:', error)
        return new Response('Payment processing failed', { status: 500 })
      }
    } else {
      console.log('支付状态非成功:', trade_status)
      
      // 更新订单状态为失败
      await supabase
        .from('zpay_transactions')
        .update({
          status: 'failed',
          trade_no: trade_no,
          notify_count: (orderData.notify_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('out_trade_no', out_trade_no)
    }

    // 返回success告诉ZPay已收到通知
    return new Response('success')

  } catch (error) {
    console.error('支付回调处理错误:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

// 支持POST方法（某些支付平台可能使用POST）
export async function POST(request: NextRequest) {
  return GET(request)
}
