#!/bin/bash

echo "🚀 开始部署流程..."

# 检查是否有未提交的更改
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 发现未提交的更改，正在提交..."
    
    # 添加所有更改
    git add .
    
    # 提交更改
    git commit -m "修复认证功能和404错误 - $(date '+%Y-%m-%d %H:%M:%S')"
    
    echo "✅ 更改已提交"
else
    echo "ℹ️ 没有未提交的更改"
fi

# 推送到GitHub
echo "📤 推送到GitHub..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ 成功推送到GitHub"
else
    echo "❌ 推送到GitHub失败"
    exit 1
fi

echo "🎉 部署完成！"
echo ""
echo "📋 接下来的步骤："
echo "1. 访问 https://vercel.com/dashboard"
echo "2. 检查项目是否自动部署"
echo "3. 配置环境变量（如果还没有配置）："
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - NEXT_PUBLIC_APP_URL (设置为您的Vercel域名)"
echo "4. 在Supabase中添加Vercel域名到允许的重定向URL"
echo ""
echo "🔗 本地测试地址: http://localhost:3005/debug-center"
