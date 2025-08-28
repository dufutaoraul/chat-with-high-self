# 🏗️ 双Supabase数据库架构配置指南

## 📋 **架构概述**

本项目使用双Supabase数据库架构，实现业务分离和数据隔离：

### 🔐 **用户数据库** (`cpcmbkikqftxaxjgedlm.supabase.co`)
**职责**：
- ✅ 用户认证与用户资料
- ✅ 个人资料和设置 
- ✅ 聊天记录和对话历史
- ✅ Token余额管理

### 💰 **支付数据库** (`tarluhsejlzqmwfiwxkb.supabase.co`)
**职责**：
- ✅ 支付订单和交易记录
- ✅ 邮件发送服务
- ✅ 独立的财务数据

## 🔧 **环境变量配置**

### 本地开发 (`.env.local`)
```env
# ===========================================
# 双 Supabase 数据库配置  
# ===========================================

# 主数据库 (用户系统) - 用于认证、邮件、聊天记录
NEXT_PUBLIC_SUPABASE_URL=https://tarluhsejlzqmwfiwxkb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 支付数据库 (支付系统) - 用于支付订单、交易记录  
NEXT_PUBLIC_PAYMENT_SUPABASE_URL=https://cpcmbkikqftxaxjgedlm.supabase.co
NEXT_PUBLIC_PAYMENT_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PAYMENT_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 其他配置...
NEXT_PUBLIC_APP_URL=http://localhost:3001
ZPAY_PID=2025081617254223
ZPAY_KEY=DdKyMklWlUZqk2uw4uXaPdKSZdXGlGl9
GEMINI_API_KEY=AIzaSyBpxjFCkR_sesDOdez-521AzePErXBb6pY
JWT_SECRET=your_jwt_secret_key_here
```

### Vercel生产环境
在Vercel Dashboard → Settings → Environment Variables 中配置：

**必需的环境变量**：
```
NEXT_PUBLIC_SUPABASE_URL=https://tarluhsejlzqmwfiwxkb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=用户数据库的ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=用户数据库的SERVICE_ROLE_KEY

NEXT_PUBLIC_PAYMENT_SUPABASE_URL=https://cpcmbkikqftxaxjgedlm.supabase.co  
NEXT_PUBLIC_PAYMENT_SUPABASE_ANON_KEY=支付数据库的ANON_KEY
PAYMENT_SUPABASE_SERVICE_ROLE_KEY=支付数据库的SERVICE_ROLE_KEY

NEXT_PUBLIC_APP_URL=https://你的vercel域名.vercel.app
ZPAY_PID=2025081617254223
ZPAY_KEY=DdKyMklWlUZqk2uw4uXaPdKSZdXGlGl9
GEMINI_API_KEY=AIzaSyBpxjFCkR_sesDOdez-521AzePErXBb6pY
JWT_SECRET=your_jwt_secret_key_here
```

## 🔑 **获取Supabase密钥**

### 用户数据库密钥 (已有)
- URL: `https://tarluhsejlzqmwfiwxkb.supabase.co`
- ANON_KEY: 已配置 ✅
- SERVICE_ROLE_KEY: 已配置 ✅

### 支付数据库密钥 (需获取)
1. 登录 https://supabase.com/dashboard
2. 进入支付数据库项目 (`cpcmbkikqftxaxjgedlm`)
3. Settings → API → Project URL & API Keys
4. 复制 `anon public` 和 `service_role` 密钥

## 📊 **代码使用指南**

### 客户端使用
```typescript
// 认证、用户信息、聊天记录 → 使用默认客户端
import { createClient } from '../utils/supabase/client'
const supabase = createClient() // 自动使用用户数据库

// 支付查询 → 使用支付客户端
import { createPaymentClient } from '../utils/supabase/payment-client'
const paymentSupabase = createPaymentClient()
```

### 服务端API使用
```typescript
// 用户认证
import { createClient } from '../utils/supabase/server'
const userSupabase = createClient() // 用户数据库

// 支付订单操作
import { paymentAdmin } from '../utils/supabase/admin'
const result = await paymentAdmin.from('zpay_transactions')...
```

## 🔄 **数据流程**

### 用户注册/登录
1. 用户在前端注册 → 用户数据库
2. 邮件验证 → 用户数据库  
3. 用户档案创建 → 用户数据库

### 支付流程
1. 用户选择套餐 → 前端
2. 创建订单 → 支付数据库  
3. 支付成功回调 → 支付数据库
4. Token同步 → 用户数据库

### 聊天功能
1. 用户发送消息 → 用户数据库验证
2. AI回复 → 保存到用户数据库
3. Token扣费 → 用户数据库更新

## 🚨 **重要注意事项**

### 密码重置邮件问题
- **问题**: 线上版本收不到密码重置邮件
- **原因**: Vercel使用了支付数据库（没有邮件配置）
- **解决**: 更新Vercel环境变量使用用户数据库

### 数据同步
- 支付成功后自动同步Token到用户账户
- 失败重试机制确保数据一致性
- 详细日志记录便于问题追踪

### 安全考虑
- 用户认证始终使用用户数据库
- 支付数据与用户数据物理分离
- 使用Service Role Key进行跨数据库操作

## ✅ **配置检查清单**

- [ ] 获取支付数据库的API密钥
- [ ] 更新本地 `.env.local` 文件
- [ ] 配置Vercel环境变量
- [ ] 测试密码重置邮件功能
- [ ] 测试支付和Token同步功能
- [ ] 验证聊天功能正常工作

完成以上配置后，项目将具备完整的双数据库架构能力！