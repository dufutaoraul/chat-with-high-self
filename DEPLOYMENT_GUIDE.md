# 部署指南 - ChatWithHighSelf

## 🎯 部署目标
将主网站部署到 `www.dufutao.asia`，支付系统迁移到 `payment.dufutao.asia`

## 📋 部署步骤

### 阶段一：Vercel部署主网站 ✅
1. **GitHub仓库已准备完成**
   - 仓库地址：https://github.com/dufutaoraul/chat-with-high-self.git
   - 代码已推送完成

2. **在Vercel上部署**
   - 登录 Vercel
   - 点击 "Add New... -> Project"
   - 选择 `chat-with-high-self` 仓库
   - 导入并部署

### 阶段二：域名重新分配
1. **解绑主域名**
   - 进入 Vercel payment-system 项目
   - Settings -> Domains
   - 移除 `www.dufutao.asia`

2. **绑定到主网站**
   - 进入新部署的主网站项目
   - Settings -> Domains
   - 添加 `www.dufutao.asia`

### 阶段三：支付系统子域名配置
1. **在Vercel添加子域名**
   - payment-system 项目 -> Settings -> Domains
   - 添加 `payment.dufutao.asia`

2. **阿里云DNS配置**
   - 记录类型: CNAME
   - 主机记录: payment
   - 记录值: cname.vercel-dns.com

### 阶段四：环境变量配置
1. **主网站环境变量**（在Vercel中设置）
   ```
   NEXT_PUBLIC_APP_URL=https://www.dufutao.asia
   NEXT_PUBLIC_SUPABASE_URL=https://tarluhsejlzqmwfiwxkb.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ZPAY_PID=2025081617254223
   ZPAY_KEY=DdKyMklWlUZqk2uw4uXaPdKSZdXGlGl9
   GEMINI_API_KEY=AIzaSyBpxjFCkR_sesDOdez-521AzePErXBb6pY
   GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
   JWT_SECRET=your_jwt_secret_key_here
   ```

2. **支付系统环境变量更新**
   - 将 `NEXT_PUBLIC_APP_URL` 改为 `https://payment.dufutao.asia`
   - 重新部署支付系统

## 🔧 已完成的技术修复
- ✅ 修复首页按钮延迟问题
- ✅ 创建专业聊天界面替换管理员控制台
- ✅ 修复Token API数据库兼容性
- ✅ 创建对话API支持Gemini 2.5 Pro
- ✅ 重新设计支付页面（基于真实成本计算）

## 🌐 最终访问地址
- **主网站**: https://www.dufutao.asia
- **支付系统**: https://payment.dufutao.asia

## 📞 技术支持
如遇到部署问题，请检查：
1. DNS解析是否生效（可能需要等待几分钟）
2. Vercel环境变量是否正确设置
3. 支付系统的回调地址是否更新