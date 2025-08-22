# Supabase密码重置邮件重定向问题故障排除指南

## 问题描述
用户收到密码重置邮件后，点击邮件中的链接被重定向到错误的网站（如AI编程教程网站），而不是应用程序的密码重置确认页面。

## 问题根源
1. **Site URL配置错误** - Supabase Dashboard中的Site URL指向了错误的域名
2. **邮件模板变量错误** - 使用了`{{ .SiteURL }}`而不是`{{ .RedirectTo }}`
3. **Redirect URLs未配置** - 目标URL未添加到允许的重定向URL列表
4. **多数据库混淆** - 使用不同数据库发送邮件和处理用户数据

## 完整解决方案

### 1. Supabase Dashboard配置

#### 步骤1：登录正确的Supabase项目
- 确认登录的是**支付数据库项目** (`tarluhsejlzqmwfiwxkb.supabase.co`)
- 这是配置了邮件发送功能的数据库

#### 步骤2：配置URL设置
导航到 **Authentication > URL Configuration**

**Site URL设置：**
```
生产环境：https://your-actual-domain.com
开发环境：http://localhost:3002
```

**Redirect URLs设置（点击"Add URL"添加）：**
```
https://your-actual-domain.com/reset-password/confirm
http://localhost:3002/reset-password/confirm
https://your-actual-domain.com/auth/callback
http://localhost:3002/auth/callback
```

#### 步骤3：更新邮件模板
导航到 **Authentication > Email Templates > Reset Password**

**原有模板（错误）：**
```html
<h2>重置密码</h2>
<p>请点击下面的链接重置您的密码：</p>
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">重置密码</a>
```

**修正后的模板：**
```html
<h2>重置密码</h2>
<p>请点击下面的链接重置您的密码：</p>
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">重置密码</a>
```

**关键变化：**
- `{{ .SiteURL }}` → `{{ .RedirectTo }}`

### 2. 代码实现修复

#### 在密码重置请求中使用redirectTo参数：
```typescript
const { error, data } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password/confirm`
})
```

#### 确保URL参数正确处理：
```typescript
// 在confirm页面中检查token
useEffect(() => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1))
  const accessToken = hashParams.get('access_token')
  const tokenHash = hashParams.get('token_hash')
  const type = hashParams.get('type')
  
  if (!accessToken && !tokenHash) {
    setError('重置链接无效或已过期')
  }
}, [])
```

### 3. 环境变量检查

确认`.env.local`文件配置：
```env
# 聊天数据库（主应用）
NEXT_PUBLIC_SUPABASE_URL=https://cpcmbkikqftxaxjgedlm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_chat_anon_key

# 支付数据库（邮件发送）
NEXT_PUBLIC_PAYMENT_SUPABASE_URL=https://tarluhsejlzqmwfiwxkb.supabase.co
NEXT_PUBLIC_PAYMENT_SUPABASE_ANON_KEY=your_payment_anon_key
PAYMENT_SUPABASE_SERVICE_ROLE_KEY=your_payment_service_key
```

### 4. 常见问题和解决方案

#### 问题1：邮件中的链接仍然指向错误的网站
**解决方案：**
1. 检查邮件模板是否使用`{{ .RedirectTo }}`
2. 确认Site URL设置为正确的域名
3. 清除浏览器缓存重新测试

#### 问题2：点击链接后显示"无效或过期的令牌"
**解决方案：**
1. 检查Redirect URLs列表是否包含目标URL
2. 确认URL完全匹配（包括结尾斜杠）
3. 检查令牌是否已被使用过（令牌只能使用一次）

#### 问题3：重定向到localhost而不是生产域名
**解决方案：**
1. 在生产环境中设置正确的Site URL
2. 使用`window.location.origin`动态获取当前域名
3. 确保不要硬编码localhost地址

#### 问题4：邮件发送失败
**解决方案：**
1. 检查Supabase项目的邮件配置
2. 确认使用了配置邮件的数据库实例
3. 检查API调用是否使用了正确的密钥

### 5. 测试步骤

#### 本地测试：
1. 启动开发服务器：`npm run dev`
2. 访问：`http://localhost:3002/reset-password-improved`
3. 输入测试邮箱
4. 检查邮件中的链接是否指向`http://localhost:3002/reset-password/confirm`

#### 生产测试：
1. 部署到生产环境
2. 更新Supabase Dashboard中的Site URL为生产域名
3. 测试完整的重置流程

### 6. 验证清单

- [ ] Supabase Dashboard中Site URL设置正确
- [ ] Redirect URLs包含所有必要的URL
- [ ] 邮件模板使用`{{ .RedirectTo }}`
- [ ] 代码中使用了正确的redirectTo参数
- [ ] 环境变量配置正确
- [ ] 密码重置确认页面功能正常
- [ ] 邮件链接指向正确的域名
- [ ] 令牌验证和密码更新功能正常

### 7. 调试工具

使用改进版的重置页面(`/reset-password-improved`)来查看详细的调试信息，包括：
- 使用的数据库URL
- 重定向URL
- API响应
- 错误详情

这个页面提供了完整的故障排除信息，帮助识别具体的配置问题。