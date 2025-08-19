import crypto from 'crypto'
import { supabaseAdmin } from '../../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { authorization } = req.headers
  const { productId } = req.body

  if (!authorization) {
    return res.status(401).json({ error: '未授权访问' })
  }

  if (!productId) {
    return res.status(400).json({ error: '产品ID不能为空' })
  }

  const token = authorization.replace('Bearer ', '')
  
  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ error: '无效的访问令牌' })
    }

    // 获取产品信息和价格
    const productInfo = getProductInfo(productId)
    if (!productInfo) {
      return res.status(400).json({ error: '无效的产品ID' })
    }

    // 生成订单ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 创建交易记录
    const { error: transactionError } = await supabaseAdmin
      .from('zpay_transactions')
      .insert({
        user_id: user.id,
        order_id: orderId,
        product_id: productId,
        amount: productInfo.price,
        status: 'pending'
      })

    if (transactionError) {
      return res.status(500).json({ error: '创建交易记录失败' })
    }

    // 生成 Zpay 支付参数
    const zpayParams = {
      pid: process.env.ZPAY_PID,
      type: 'alipay', // 或 'wxpay'
      out_trade_no: orderId,
      notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/checkout/providers/zpay/webhook`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      name: productInfo.name,
      money: productInfo.price.toString(),
      clientip: req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1'
    }

    // 生成签名
    const sign = generateZpaySign(zpayParams, process.env.ZPAY_KEY)
    zpayParams.sign = sign
    zpayParams.sign_type = 'MD5'

    // 构建支付URL
    const paymentUrl = `https://api.zpay.com/submit.php?${new URLSearchParams(zpayParams).toString()}`

    return res.status(200).json({
      paymentUrl,
      orderId
    })

  } catch (error) {
    console.error('生成支付URL错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}

function getProductInfo(productId) {
  const products = {
    'tokens_10k': { name: '10,000 对话Token', price: 9.90, tokens: 10000 },
    'tokens_50k': { name: '50,000 对话Token', price: 39.90, tokens: 50000 },
    'tokens_100k': { name: '100,000 对话Token', price: 69.90, tokens: 100000 },
    'monthly_sub': { name: '月度订阅', price: 29.90, type: 'subscription', period: 'monthly' },
    'yearly_sub': { name: '年度订阅', price: 299.90, type: 'subscription', period: 'yearly' }
  }

  return products[productId] || null
}

function generateZpaySign(params, key) {
  // 按字典序排序参数
  const sortedKeys = Object.keys(params).sort()
  const signString = sortedKeys
    .filter(k => k !== 'sign' && k !== 'sign_type' && params[k])
    .map(k => `${k}=${params[k]}`)
    .join('&') + key

  return crypto.createHash('md5').update(signString).digest('hex')
}