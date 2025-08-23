# 🎯 Supabase配置修复指南

## 📋 问题确认

根据邮件链接分析：
- **邮件链接**: `https://tarluhsejlzqmwfiwxkb.supabase.co/auth/v1/verify?token=...&redirect_to=https://www.dufutao.asia`
- **实际需要**: 重定向到 `https://www.dufutao.asia/reset-password/confirm`

## 🔧 需要修复的配置

### 方案一：修改支付系统Supabase的Site URL（推荐）

1. **登录支付系统的Supabase项目**
   - 项目：`tarluhsejlzqmwfiwxkb`（从邮件链接可以看出）
   - 进入：Authentication > URL Configuration

2. **修改Site URL**
   ```
   当前值: https://www.dufutao.asia
   修改为: https://www.dufutao.asia/reset-password/confirm
   ```

3. **保存更改**

### 方案二：修改代码中的redirectTo（备选）

如果不想改Site URL，则需要修改密码重置代码：

```typescript
// 在 app/reset-password/page.tsx 中
const { error, data } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `https://www.dufutao.asia/reset-password/confirm`  // 硬编码完整URL
})
```

## ⚡ 快速测试

修改后，重新发送密码重置邮件，邮件链接应该变为：
```
https://tarluhsejlzqmwfiwxkb.supabase.co/auth/v1/verify?token=...&redirect_to=https://www.dufutao.asia/reset-password/confirm
```

## 🎯 AI助手提示词

如果需要其他AI助手帮助，请使用以下提示词：

---

**提示词：**

```
我的Next.js应用的密码重置功能有问题。用户收到的重置邮件中的链接重定向到错误的路径。

当前问题：
- 邮件链接：https://tarluhsejlzqmwfiwxkb.supabase.co/auth/v1/verify?token=xxx&redirect_to=https://www.dufutao.asia
- 期望链接：应该重定向到 https://www.dufutao.asia/reset-password/confirm

Supabase配置截图显示：
- Site URL设置为：https://www.dufutao.asia
- Redirect URLs包含：https://www.dufutao.asia/reset-password/confirm

问题：邮件中的redirect_to参数使用的是Site URL而不是具体的重置页面路径。

请问应该如何配置Supabase才能让密码重置邮件正确重定向到确认页面？

选项：
1. 修改Supabase的Site URL为完整的重置确认页面路径
2. 在代码中强制指定完整的redirectTo URL
3. 其他解决方案

请提供具体的配置步骤。
```

---

## ✅ 验证步骤

1. 修改Supabase配置后
2. 重新申请密码重置
3. 检查新邮件中的链接是否指向 `/reset-password/confirm`
4. 点击链接测试是否能正常访问重置页面

## 🚨 注意事项

- 确认修改的是**支付系统的Supabase项目**（tarluhsejlzqmwfiwxkb）
- 不是主数据库的Supabase项目
- 因为代码中使用支付数据库发送邮件（第19行：`process.env.NEXT_PUBLIC_PAYMENT_SUPABASE_URL`）