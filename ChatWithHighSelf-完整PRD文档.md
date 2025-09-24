# ChatWithHighSelf - 完整产品需求文档 (PRD)

## 项目概述

**项目名称**: ChatWithHighSelf  
**项目类型**: AI心理对话平台  
**技术栈**: Next.js 14 + TypeScript + Supabase + Tailwind CSS + Gemini AI  
**部署平台**: Vercel  
**数据库**: Supabase (payment-system 项目)  

## 核心功能需求

### 1. 用户认证系统
- **注册/登录**: 使用Supabase Auth
- **个人资料管理**: 详细的用户画像收集
- **会话管理**: JWT token管理

### 2. 个人画像系统
用户需要填写详细信息：
- 基本信息：年龄、职业、教育背景、家庭状况
- 性格特征：性格类型、价值观、兴趣爱好
- 目标设定：短期目标、长期目标
- 挑战识别：当前面临的挑战、希望改变的方面

### 3. AI对话系统
- **智能对话**: 基于Gemini AI的心理对话
- **个性化回应**: 根据用户画像定制对话内容
- **对话历史**: 保存和管理历史对话
- **多轮对话**: 支持连续的深度对话

### 4. 支付系统
- **付费咨询**: 集成Z-Pay支付网关
- **会话计费**: 按对话次数或时长计费
- **交易记录**: 完整的支付历史

## 技术架构

### 前端架构
```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── chat/
├── profile/
├── payment/
└── dashboard/
```

### 数据库设计

#### 核心表结构
1. **user_profiles**: 用户详细档案
2. **user_conversations**: 对话会话
3. **chat_messages**: 聊天消息
4. **zpay_transactions**: 支付交易记录

### API设计
```
/api/auth/          # 认证相关
/api/chat/          # 聊天功能
/api/profile/       # 用户资料
/api/payment/       # 支付处理
/api/gemini/        # AI对话接口
```

## 环境配置

### 必需的环境变量
```env
# Supabase配置 (payment-system项目)
NEXT_PUBLIC_SUPABASE_URL=https://tarluhsejlzqmwfiwxkb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 应用配置
NEXT_PUBLIC_APP_URL=http://localhost:3005
NEXT_PUBLIC_SITE_URL=http://localhost:3005

# Z-Pay支付配置
ZPAY_PID=2025081617254223
ZPAY_KEY=DdKyMklWlUZqk2uw4uXaPdKSZdXGlGl9

# Gemini AI配置
GEMINI_API_KEY=AIzaSyBGX5XpZ2_efwnrmfvDF_HpglPj3ZAj1oU
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
```

## 已完成的工作

### ✅ 基础架构
- [x] Next.js 14项目初始化
- [x] TypeScript配置
- [x] Tailwind CSS样式系统
- [x] 基础路由结构

### ✅ 认证系统
- [x] Supabase Auth集成
- [x] 登录/注册页面
- [x] 认证中间件
- [x] 会话管理

### ✅ 数据库设计
- [x] 完整的数据库schema设计
- [x] RLS安全策略
- [x] 自动触发器设置

### ✅ 支付系统
- [x] Z-Pay支付网关集成
- [x] 支付API接口
- [x] 交易状态管理

## 待完成的工作

### 🔄 高优先级
1. **数据库部署**: 在payment-system项目中执行database-setup.sql
2. **个人资料页面**: 完整的用户画像收集界面
3. **AI对话核心**: Gemini API集成和对话逻辑
4. **聊天界面**: 实时聊天UI组件

### 🔄 中优先级
5. **对话历史**: 历史对话查看和管理
6. **支付流程**: 完整的付费咨询流程
7. **用户仪表板**: 个人数据概览

### 🔄 低优先级
8. **响应式优化**: 移动端适配
9. **性能优化**: 代码分割和缓存
10. **测试覆盖**: 单元测试和集成测试

## 开发指南

### 本地开发环境设置
```bash
# 1. 克隆项目
git clone <repository-url>
cd ChatWithHighSelf

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑.env.local文件

# 4. 启动开发服务器
npm run dev
```

### 数据库设置
1. 登录Supabase控制台
2. 进入payment-system项目
3. 打开SQL编辑器
4. 执行database-setup.sql文件内容
5. 验证表创建成功

### 部署流程
1. **Vercel部署**:
   - 连接GitHub仓库
   - 配置环境变量
   - 自动部署

2. **域名配置**:
   - 设置自定义域名
   - 配置SSL证书

## 关键文件说明

### 核心配置文件
- `next.config.js`: Next.js配置
- `tailwind.config.js`: 样式配置
- `middleware.ts`: 认证中间件
- `lib/supabase.ts`: 数据库客户端

### 重要组件
- `components/ui/`: 基础UI组件库
- `components/auth/`: 认证相关组件
- `components/chat/`: 聊天相关组件

### API路由
- `app/api/auth/`: 认证API
- `app/api/chat/`: 聊天API
- `app/api/payment/`: 支付API

## 故障排除

### 常见问题
1. **数据库连接失败**: 检查Supabase配置和网络
2. **认证问题**: 验证JWT token和RLS策略
3. **支付失败**: 检查Z-Pay配置和回调URL
4. **AI响应慢**: 优化Gemini API调用

### 调试工具
- Supabase Dashboard: 数据库管理
- Vercel Analytics: 性能监控
- Browser DevTools: 前端调试

## 详细技术实现指南

### AI对话系统实现
```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const { message, conversationId, userProfile } = await request.json();

  // 1. 构建个性化prompt
  const prompt = buildPersonalizedPrompt(userProfile, message);

  // 2. 调用Gemini API
  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GEMINI_API_KEY}`
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  // 3. 保存对话记录
  await saveMessage(conversationId, 'user', message);
  await saveMessage(conversationId, 'assistant', aiResponse);

  return Response.json({ response: aiResponse });
}
```

### 个人资料收集流程
```typescript
// app/profile/page.tsx
const ProfileForm = () => {
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState({
    basicInfo: {},
    personality: {},
    goals: {},
    challenges: {}
  });

  const steps = [
    { component: BasicInfoStep, title: "基本信息" },
    { component: PersonalityStep, title: "性格特征" },
    { component: GoalsStep, title: "目标设定" },
    { component: ChallengesStep, title: "挑战识别" }
  ];

  // 分步骤收集用户信息
};
```

### 支付集成示例
```typescript
// app/api/payment/create/route.ts
export async function POST(request: Request) {
  const { amount, description } = await request.json();

  // 1. 创建支付订单
  const paymentData = {
    pid: ZPAY_PID,
    type: 'alipay',
    out_trade_no: generateOrderId(),
    notify_url: `${SITE_URL}/api/payment/notify`,
    return_url: `${SITE_URL}/payment/success`,
    name: description,
    money: amount,
    sign: generateSign(paymentParams)
  };

  // 2. 保存交易记录
  await supabase.from('zpay_transactions').insert({
    user_id: userId,
    amount,
    status: 'pending',
    transaction_id: paymentData.out_trade_no
  });

  return Response.json({ paymentUrl });
}
```

## 项目文件结构详解

```
ChatWithHighSelf/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # 认证路由组
│   │   ├── login/page.tsx        # 登录页面
│   │   ├── register/page.tsx     # 注册页面
│   │   └── layout.tsx            # 认证布局
│   ├── api/                      # API路由
│   │   ├── auth/                 # 认证API
│   │   ├── chat/                 # 聊天API
│   │   ├── payment/              # 支付API
│   │   └── profile/              # 用户资料API
│   ├── chat/                     # 聊天页面
│   │   ├── page.tsx              # 主聊天界面
│   │   └── [id]/page.tsx         # 特定对话页面
│   ├── profile/                  # 个人资料
│   │   ├── page.tsx              # 资料编辑页面
│   │   └── setup/page.tsx        # 初始设置页面
│   ├── payment/                  # 支付相关
│   │   ├── page.tsx              # 支付页面
│   │   └── success/page.tsx      # 支付成功页面
│   ├── dashboard/                # 用户仪表板
│   │   └── page.tsx              # 数据概览
│   ├── globals.css               # 全局样式
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 首页
├── components/                   # 组件库
│   ├── ui/                       # 基础UI组件
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── auth/                     # 认证组件
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── AuthProvider.tsx
│   ├── chat/                     # 聊天组件
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatHistory.tsx
│   │   └── TypingIndicator.tsx
│   ├── profile/                  # 资料组件
│   │   ├── ProfileForm.tsx
│   │   ├── StepIndicator.tsx
│   │   └── ProfileSummary.tsx
│   └── payment/                  # 支付组件
│       ├── PaymentForm.tsx
│       └── TransactionHistory.tsx
├── lib/                          # 工具库
│   ├── supabase.ts               # Supabase客户端
│   ├── auth.ts                   # 认证工具
│   ├── gemini.ts                 # AI API工具
│   ├── payment.ts                # 支付工具
│   └── utils.ts                  # 通用工具
├── types/                        # TypeScript类型定义
│   ├── auth.ts
│   ├── chat.ts
│   ├── profile.ts
│   └── payment.ts
├── middleware.ts                 # 路由中间件
├── next.config.js                # Next.js配置
├── tailwind.config.js            # Tailwind配置
├── package.json                  # 依赖管理
├── .env.local                    # 环境变量
└── database-setup.sql            # 数据库初始化脚本
```

## 关键实现要点

### 1. 认证流程
- 使用Supabase Auth进行用户管理
- JWT token自动刷新
- 路由级别的权限控制
- 用户状态全局管理

### 2. AI对话优化
- 基于用户画像的个性化prompt
- 对话上下文管理
- 流式响应处理
- 错误重试机制

### 3. 数据安全
- Row Level Security (RLS)策略
- API密钥安全存储
- 用户数据加密
- CORS配置

### 4. 性能优化
- 组件懒加载
- 图片优化
- API响应缓存
- 数据库查询优化

## 测试策略

### 单元测试
```bash
# 安装测试依赖
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# 运行测试
npm run test
```

### 集成测试
- API端点测试
- 数据库操作测试
- 支付流程测试
- 认证流程测试

## 部署检查清单

### 部署前准备
- [ ] 环境变量配置完成
- [ ] 数据库迁移执行
- [ ] API密钥验证
- [ ] 支付回调URL配置
- [ ] 域名DNS设置

### 部署后验证
- [ ] 用户注册/登录功能
- [ ] AI对话功能
- [ ] 支付流程
- [ ] 数据持久化
- [ ] 性能监控

## 联系信息

**项目负责人**: [用户名]
**技术支持**: 通过GitHub Issues
**文档更新**: 2025-01-17

---

**注意**: 此文档应该随着项目进展持续更新。所有新功能和变更都应该在此文档中记录。

## 快速开始指令

### 对于新的AI助手
1. 首先阅读此PRD文档了解项目全貌
2. 检查database-setup.sql是否已在payment-system项目中执行
3. 验证.env.local配置是否正确
4. 运行`npm run dev`启动开发服务器
5. 按照"待完成的工作"部分的优先级开始开发

### 紧急修复流程
1. 检查Vercel部署状态
2. 查看Supabase数据库连接
3. 验证API密钥有效性
4. 检查支付回调配置
