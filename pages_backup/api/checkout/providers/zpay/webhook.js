import crypto from 'crypto'
import { supabaseAdmin } from '../../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  try {
    const {
      pid,
      trade_no,
      out_trade_no,
      type,
      name,
      money,
      trade_status,
      sign,
      sign_type
    } = req.body

    // 验证必要参数
    if (!pid || !trade_no || !out_trade_no || !money || !trade_status || !sign) {
      console.error('Zpay webhook: 缺少必要参数')
      return res.status(400).end()
    }

    // 验证 PID
    if (pid !== process.env.ZPAY_PID) {
      console.error('Zpay webhook: PID 不匹配')
      return res.status(400).end()
    }

    // 验证签名
    const params = { pid, trade_no, out_trade_no, type, name, money, trade_status }
    const expectedSign = generateZpaySign(params, process.env.ZPAY_KEY)
    
    if (sign !== expectedSign) {
      console.error('Zpay webhook: 签名验证失败')
      return res.status(400).end()
    }

    // 查找交易记录
    const { data: transaction, error: findError } = await supabaseAdmin
      .from('zpay_transactions')
      .select('*')
      .eq('order_id', out_trade_no)
      .single()

    if (findError || !transaction) {
      console.error('Zpay webhook: 交易记录不存在', out_trade_no)
      return res.status(404).end()
    }

    // 检查订单状态，防止重复处理
    if (transaction.status === 'completed') {
      console.log('Zpay webhook: 订单已处理', out_trade_no)
      return res.status(200).send('success')
    }

    // 验证金额
    if (parseFloat(money) !== parseFloat(transaction.amount)) {
      console.error('Zpay webhook: 金额不匹配', money, transaction.amount)
      return res.status(400).end()
    }

    // 处理支付成功
    if (trade_status === 'TRADE_SUCCESS') {
      // 更新交易状态
      const { error: updateError } = await supabaseAdmin
        .from('zpay_transactions')
        .update({
          status: 'completed',
          zpay_order_id: trade_no,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', out_trade_no)

      if (updateError) {
        console.error('Zpay webhook: 更新交易状态失败', updateError)
        return res.status(500).end()
      }

      // 发放权益
      await grantUserBenefits(transaction.user_id, transaction.product_id)

      console.log('Zpay webhook: 支付成功处理完成', out_trade_no)
      return res.status(200).send('success')
    }

    // 处理支付失败
    if (trade_status === 'TRADE_CLOSED' || trade_status === 'TRADE_FINISHED') {
      await supabaseAdmin
        .from('zpay_transactions')
        .update({
          status: 'failed',
          zpay_order_id: trade_no,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', out_trade_no)

      console.log('Zpay webhook: 支付失败处理完成', out_trade_no)
      return res.status(200).send('success')
    }

    return res.status(200).send('success')

  } catch (error) {
    console.error('Zpay webhook 处理错误:', error)
    return res.status(500).end()
  }
}

async function grantUserBenefits(userId, productId) {
  try {
    const productInfo = getProductInfo(productId)
    if (!productInfo) {
      throw new Error(`未知的产品ID: ${productId}`)
    }

    if (productInfo.tokens) {
      // Token 充值
      const { data: profile, error: getError } = await supabaseAdmin
        .from('profiles')
        .select('token_balance')
        .eq('id', userId)
        .single()

      if (getError) {
        throw new Error('获取用户档案失败')
      }

      const newBalance = (profile.token_balance || 0) + productInfo.tokens

      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          token_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        throw new Error('更新Token余额失败')
      }

      console.log(`用户 ${userId} Token充值成功: +${productInfo.tokens}, 新余额: ${newBalance}`)

    } else if (productInfo.type === 'subscription') {
      // 订阅服务
      const now = new Date()
      const periodEnd = new Date()
      
      if (productInfo.period === 'monthly') {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      } else if (productInfo.period === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      }

      // 检查是否已有活跃订阅
      const { data: existingSub } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (existingSub) {
        // 续订：从当前订阅结束时间开始计算
        const currentEnd = new Date(existingSub.current_period_end)
        const newEnd = new Date(currentEnd)
        
        if (productInfo.period === 'monthly') {
          newEnd.setMonth(newEnd.getMonth() + 1)
        } else if (productInfo.period === 'yearly') {
          newEnd.setFullYear(newEnd.getFullYear() + 1)
        }

        await supabaseAdmin
          .from('subscriptions')
          .update({
            current_period_end: newEnd.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSub.id)

        console.log(`用户 ${userId} 订阅续期成功，新结束时间: ${newEnd.toISOString()}`)
      } else {
        // 新订阅
        await supabaseAdmin
          .from('subscriptions')
          .insert({
            user_id: userId,
            status: 'active',
            plan_type: productInfo.period,
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString()
          })

        console.log(`用户 ${userId} 新订阅创建成功，结束时间: ${periodEnd.toISOString()}`)
      }
    }

  } catch (error) {
    console.error('发放用户权益失败:', error)
    throw error
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
  const sortedKeys = Object.keys(params).sort()
  const signString = sortedKeys
    .filter(k => k !== 'sign' && k !== 'sign_type' && params[k])
    .map(k => `${k}=${params[k]}`)
    .join('&') + key

  return crypto.createHash('md5').update(signString).digest('hex')
}