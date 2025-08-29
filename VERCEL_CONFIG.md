# Vercel 环境变量配置指南

## 🔧 必需的环境变量

请在Vercel项目设置 -> Environment Variables中添加以下变量：

### 主数据库配置
```
NEXT_PUBLIC_SUPABASE_URL=https://cpcmbkikqftxaxjgedlm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwY21ia2lrcWZ0eGF4amdlZGxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MzI5NTYsImV4cCI6MjA3MTAwODk1Nn0.5C5YgM63q1YMrlslZGomtT4H59CmA8J5jVgD9LFTPtM
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwY21ia2lrcWZ0eGF4amdlZGxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQzMjk1NiwiZXhwIjoyMDcxMDA4OTU2fQ.am-FIJobFiGgtjkvpIYb6h7piWs5zH6-VG6khFSncKY
```

### 支付数据库配置
```
NEXT_PUBLIC_PAYMENT_SUPABASE_URL=https://tarluhsejlzqmwfiwxkb.supabase.co
NEXT_PUBLIC_PAYMENT_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcmx1aHNlamx6cW13Zml3eGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0MzY5MzIsImV4cCI6MjA3MTAxMjkzMn0.gX4qEBpmPKQ2abUfm7jlrFVwP5zLBiXTkG563Gc8EHc
PAYMENT_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhcmx1aHNlamx6cW13Zml3eGtiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQzNjkzMiwiZXhwIjoyMDcxMDEyOTMyfQ.lpDVbDqit6P8tYiBn6cmQ1_EgppZJ6QMLV7YHTtEWDU
```

### 应用配置
```
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
```

### 支付配置
```
ZPAY_PID=2025081617254223
ZPAY_KEY=DdKyMklWlUZqk2uw4uXaPdKSZdXGlGl9
```

### AI配置
```
GEMINI_API_KEY=AIzaSyBGX5XpZ2_efwnrmfvDF_HpglPj3ZAj1oU
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
```

## 🔧 Supabase URL Configuration

在Supabase项目设置中，需要添加以下重定向URL：

### Authentication -> URL Configuration

**Site URL:**
```
https://your-vercel-domain.vercel.app
```

**Redirect URLs:**
```
https://your-vercel-domain.vercel.app/auth/callback
https://your-vercel-domain.vercel.app/auth/callback?next=/reset-password/confirm
https://your-vercel-domain.vercel.app/auth/callback?next=/dashboard
```

## 📧 SMTP配置 (重要)

根据教程，生产环境必须配置自己的SMTP服务：

1. 进入Supabase -> Authentication -> Settings -> SMTP Settings
2. 配置您的邮件服务商（如163邮箱、Resend等）
3. 填入SMTP服务器信息和授权密码

## ⚠️ 常见问题

1. **邮件链接404**: 确保Supabase中的重定向URL包含您的Vercel域名
2. **认证失败**: 检查环境变量是否正确设置
3. **CORS错误**: 确保Supabase项目设置中的Site URL正确

## 🧪 测试步骤

1. 部署到Vercel后，访问 `https://your-domain.vercel.app/test-auth-flow`
2. 测试注册、登录、密码重置功能
3. 检查邮件中的链接是否正确跳转
