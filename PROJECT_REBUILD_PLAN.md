# 🚀 与高我对话 - 项目重构方案

## 📋 **问题诊断**

### 当前问题
1. **双数据库冲突**：用户数据分散在两个Supabase数据库中
2. **认证流程断裂**：登录连接主数据库，但用户在支付数据库注册
3. **密码重置失败**：邮件从支付数据库发送，但验证连接主数据库
4. **配置混乱**：环境变量指向不同数据库

### 根本原因
- 项目合并时没有统一数据库架构
- 用户认证和业务数据分离导致数据不一致
- 邮件配置和认证配置在不同数据库

## 🎯 **推荐解决方案：统一数据库架构**

### 方案选择：使用支付数据库作为唯一数据库
**原因**：
- ✅ 支付数据库已配置邮件服务（SMTP）
- ✅ 用户已在支付数据库中注册
- ✅ 避免数据迁移的复杂性
- ✅ 简化架构，降低维护成本

## 🔧 **实施步骤**

### 第一步：更新环境变量配置
```env
# 统一使用支付数据库
NEXT_PUBLIC_SUPABASE_URL=https://tarluhsejlzqmwfiwxkb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcmx1aHNlamx6cW13Zml3eGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MzY5MzIsImV4cCI6MjA3MTAxMjkzMn0.gX4qEBpmPKQ2abUfm7jlrFVwP5zLBiXTkG563Gc8EHc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcmx1aHNlamx6cW13Zml3eGtiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQzNjkzMiwiZXhwIjoyMDcxMDEyOTMyfQ.lpDVbDqit6P8tYiBn6cmQ1_EgppZJ6QMLV7YHTtEWDU

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3005
NEXT_PUBLIC_SITE_URL=http://localhost:3005

# 其他配置保持不变
ZPAY_PID=2025081617254223
ZPAY_KEY=DdKyMklWlUZqk2uw4uXaPdKSZdXGlGl9
GEMINI_API_KEY=AIzaSyBGX5XpZ2_efwnrmfvDF_HpglPj3ZAj1oU
```

### 第二步：数据库表结构统一
在支付数据库中创建缺失的表：

```sql
-- 用户资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 聊天记录表
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  response TEXT,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户Token余额表
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  balance INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own messages" ON chat_messages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tokens" ON user_tokens
  FOR ALL USING (auth.uid() = user_id);
```

### 第三步：Supabase邮件配置
在支付数据库的Authentication设置中：

1. **邮件模板配置**：
   - Reset Password: `<a href="{{ .SiteURL }}/reset-password/confirm#access_token={{ .Token }}&refresh_token={{ .RefreshToken }}&expires_in=3600&token_type=bearer&type=recovery">重置密码</a>`

2. **URL配置**：
   - Site URL: `http://localhost:3005`
   - Redirect URLs: `http://localhost:3005/auth/callback`, `http://localhost:3005/reset-password/confirm`

### 第四步：代码清理
删除所有双数据库相关的代码和配置文件：
- 删除 `DUAL_SUPABASE_SETUP.md`
- 删除支付相关的独立客户端
- 统一所有Supabase调用

## 📊 **新架构优势**

### 简化的数据流
1. **用户注册** → 支付数据库
2. **用户登录** → 支付数据库
3. **密码重置** → 支付数据库（邮件+验证）
4. **聊天功能** → 支付数据库
5. **支付功能** → 支付数据库

### 技术优势
- ✅ 单一数据源，避免数据不一致
- ✅ 邮件服务已配置完成
- ✅ 简化的认证流程
- ✅ 降低维护复杂度
- ✅ 更好的数据安全性

## 🚀 **部署配置**

### 生产环境变量（Vercel）
```env
NEXT_PUBLIC_SUPABASE_URL=https://tarluhsejlzqmwfiwxkb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=支付数据库的ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=支付数据库的SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=https://www.dufutao.asia
NEXT_PUBLIC_SITE_URL=https://www.dufutao.asia
```

### Supabase生产配置
- Site URL: `https://www.dufutao.asia`
- Redirect URLs: `https://www.dufutao.asia/auth/callback`, `https://www.dufutao.asia/reset-password/confirm`

## ✅ **实施检查清单**

- [ ] 更新本地 `.env.local` 文件
- [ ] 在支付数据库中执行SQL创建表
- [ ] 配置Supabase邮件模板和URL
- [ ] 删除双数据库相关代码
- [ ] 测试登录功能
- [ ] 测试密码重置功能
- [ ] 测试聊天功能
- [ ] 测试支付功能
- [ ] 更新Vercel环境变量
- [ ] 部署到生产环境

## 🎯 **预期结果**

实施完成后，您将拥有：
- 🔐 统一的用户认证系统
- 📧 正常工作的密码重置邮件
- 💬 完整的聊天功能
- 💰 集成的支付系统
- 🚀 简化的部署流程

这个方案将彻底解决当前的所有问题，并为未来的功能扩展提供坚实的基础。
