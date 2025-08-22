import { createClient } from '@supabase/supabase-js'

// 支付数据库客户端 - 用于支付订单、交易记录
export const createPaymentClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_PAYMENT_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_PAYMENT_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// 支付数据库管理员客户端
export const createPaymentAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_PAYMENT_SUPABASE_URL!,
    process.env.PAYMENT_SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}