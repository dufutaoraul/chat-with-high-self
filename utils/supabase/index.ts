// 统一导出所有Supabase客户端
export { createUserClient, createUserAdminClient } from './user-client'
export { createPaymentClient, createPaymentAdminClient } from './payment-client'

// 为了保持向后兼容，默认导出用户客户端
export { createClient } from './client'

// 客户端使用指南：
// 1. 认证、邮件、用户信息、聊天记录 → 使用 createUserClient()
// 2. 支付订单、交易记录 → 使用 createPaymentClient()
// 3. 服务端操作 → 使用对应的 Admin 客户端