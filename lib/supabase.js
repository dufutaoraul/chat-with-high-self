import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// 检查是否为占位符值
const isConfigured = supabaseUrl !== 'https://placeholder.supabase.co' && 
                    supabaseAnonKey !== 'placeholder-anon-key'

// 客户端 Supabase 实例（用于前端）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 服务端 Supabase 实例（用于 API 路由）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// 导出配置状态
export const isSupabaseConfigured = isConfigured
