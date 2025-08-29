import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/client'
import crypto from 'crypto'

// 套餐配置
const PACKAGES = {
  'basic_100': {
    name: '基础包',
    conversations: 100,
    price: 9.90,
    description: '100次对话'
  },
  'standard_500': {
    name: '标准包',
    conversations: 500,
    price: 29.90,
    description: '500次对话'
  }
}

// ZPay签名生成函数
function generateSign(params: Record<string, any>, key: string): string {
  // 过滤空值和签名相关字段
  const filteredParams: Record<string, string> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '' && k !== 'sign' && k !== 'sign_type') {
      filteredParams[k] = String(v)
    }
  }

  // 按键名排序
  const sortedKeys = Object.keys(filteredParams).sort()
  
  // 拼接字符串
  const paramStr = sortedKeys.map(k => `${k}=${filteredParams[k]}`).join('&')
  
  // 加上密钥并MD5加密
  const signStr = paramStr + key
  return crypto.createHash('md5').update(signStr).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const { packageType, userId } = await request.json()

    console.log('=== 创建支付订单 ===')
    console.log('Package Type:', packageType)
    console.log('User ID:', userId)

    if (!packageType || !userId) {
      return NextResponse.json(
        { success: false, message: '套餐类型和用户ID不能为空' },
        { status: 400 }
      )
    }

    // 验证套餐类型
    const packageInfo = PACKAGES[packageType as keyof typeof PACKAGES]
    if (!packageInfo) {
      return NextResponse.json(
        { success: false, message: '无效的套餐类型' },
        { status: 400 }
      )
    }

    // 创建Supabase客户端
    const supabase = createClient()

    // 验证用户是否存在
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { success: false, message: '用户认证失败' },
        { status: 401 }
      )
    }

    // 生成订单号
    const outTradeNo = `chat_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    // 获取环境变量
    const zpayPid = process.env.ZPAY_PID
    const zpayKey = process.env.ZPAY_KEY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!zpayPid || !zpayKey || !appUrl) {
      return NextResponse.json(
        { success: false, message: '支付配置错误' },
        { status: 500 }
      )
    }

    // 保存订单到数据库
    const { data: orderData, error: orderError } = await supabase
      .from('zpay_transactions')
      .insert([
        {
          user_id: userId,
          out_trade_no: outTradeNo,
          package_type: packageType,
          conversations_count: packageInfo.conversations,
          amount: packageInfo.price,
          status: 'pending',
          payment_method: 'alipay'
        }
      ])
      .select()
      .single()

    if (orderError) {
      console.error('保存订单失败:', orderError)
      return NextResponse.json(
        { success: false, message: '创建订单失败' },
        { status: 500 }
      )
    }

    // 构建ZPay支付参数
    const paymentParams = {
      pid: zpayPid,
      type: 'alipay',
      out_trade_no: outTradeNo,
      notify_url: `${appUrl}/api/payment/webhook`,
      return_url: `${appUrl}/payment/success?order=${outTradeNo}`,
      name: packageInfo.name,
      money: packageInfo.price.toString(),
      sign_type: 'MD5'
    }

    // 生成签名
    const sign = generateSign(paymentParams, zpayKey)

    // 构建支付URL
    const zpayGateway = 'https://zpayz.cn/submit.php'
    const finalParams = new URLSearchParams({ ...paymentParams, sign })
    const paymentUrl = `${zpayGateway}?${finalParams.toString()}`

    console.log('支付URL生成成功:', paymentUrl)

    return NextResponse.json({
      success: true,
      paymentUrl: paymentUrl,
      orderId: outTradeNo,
      packageInfo: packageInfo
    })

  } catch (error) {
    console.error('创建支付订单错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}
