import crypto from 'crypto'
import { createServiceClient } from './supabase'

const ZPAY_PID = process.env.ZPAY_PID!
const ZPAY_KEY = process.env.ZPAY_KEY!
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

export interface PaymentOrder {
  orderId: string
  amount: number
  description: string
  userId: string
}

export interface ZPayTransaction {
  id: string
  user_id: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  payment_method?: string
  transaction_id: string
  description?: string
  created_at: string
  updated_at: string
}

export const generateOrderId = (): string => {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const generateSign = (params: Record<string, any>): string => {
  // 按键名排序
  const sortedKeys = Object.keys(params).sort()
  
  // 构建签名字符串
  const signString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('&') + ZPAY_KEY

  // MD5加密
  return crypto.createHash('md5').update(signString).digest('hex')
}

export const createPaymentOrder = async (order: PaymentOrder) => {
  const supabase = createServiceClient()
  
  // 构建支付参数
  const paymentParams = {
    pid: ZPAY_PID,
    type: 'alipay',
    out_trade_no: order.orderId,
    notify_url: `${SITE_URL}/api/payment/notify`,
    return_url: `${SITE_URL}/payment/success`,
    name: order.description,
    money: order.amount.toFixed(2)
  }

  // 生成签名
  const sign = generateSign(paymentParams)
  
  // 保存交易记录
  const { data: transaction, error } = await supabase
    .from('zpay_transactions')
    .insert({
      user_id: order.userId,
      amount: order.amount,
      status: 'pending',
      transaction_id: order.orderId,
      description: order.description,
      payment_method: 'alipay'
    })
    .select()
    .single()

  if (error) {
    throw new Error('创建交易记录失败')
  }

  // 构建支付URL
  const paymentUrl = `https://api.zpay.com/pay?${new URLSearchParams({
    ...paymentParams,
    sign
  }).toString()}`

  return {
    transaction,
    paymentUrl
  }
}

export const verifyPaymentNotification = (params: Record<string, any>): boolean => {
  const { sign, ...otherParams } = params
  const calculatedSign = generateSign(otherParams)
  return sign === calculatedSign
}

export const updateTransactionStatus = async (
  transactionId: string, 
  status: ZPayTransaction['status']
) => {
  const supabase = createServiceClient()
  
  const { error } = await supabase
    .from('zpay_transactions')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('transaction_id', transactionId)

  if (error) {
    throw new Error('更新交易状态失败')
  }
}