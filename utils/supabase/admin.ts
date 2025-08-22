import { createClient } from '@supabase/supabase-js'

// 用户数据库的管理员客户端
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 支付数据库的管理员客户端
export const paymentAdmin = createClient(
  process.env.NEXT_PUBLIC_PAYMENT_SUPABASE_URL!,
  process.env.PAYMENT_SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)