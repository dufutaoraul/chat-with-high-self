import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  const { method } = req
  const { authorization } = req.headers

  if (!authorization) {
    return res.status(401).json({ error: '未授权访问' })
  }

  const token = authorization.replace('Bearer ', '')
  
  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ error: '无效的访问令牌' })
    }

    switch (method) {
      case 'GET':
        return await getUserProfile(req, res, user.id)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('用户档案 API 错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}

async function getUserProfile(req, res, userId) {
  try {
    // 获取用户基本信息
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      return res.status(500).json({ error: '获取用户档案失败' })
    }

    // 获取订阅信息
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    // 获取统计信息
    const { data: conversations } = await supabaseAdmin
      .from('conversations')
      .select('id, tokens_used, created_at')
      .eq('user_id', userId)

    const { data: insights } = await supabaseAdmin
      .from('insights')
      .select('id')
      .eq('user_id', userId)

    // 计算统计数据
    const totalConversations = conversations?.length || 0
    const totalTokensUsed = conversations?.reduce((sum, conv) => sum + (conv.tokens_used || 0), 0) || 0
    const totalInsights = insights?.length || 0

    // 计算本月数据
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthlyConversations = conversations?.filter(conv => 
      new Date(conv.created_at) >= monthStart
    ).length || 0

    // 计算连续使用天数
    const conversationDates = conversations?.map(conv => 
      new Date(conv.created_at).toDateString()
    ) || []
    const uniqueDates = [...new Set(conversationDates)].sort().reverse()
    
    let streakDays = 0
    const today = new Date().toDateString()
    
    if (uniqueDates.includes(today)) {
      streakDays = 1
      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i-1])
        const nextDate = new Date(uniqueDates[i])
        const diffDays = (currentDate - nextDate) / (1000 * 60 * 60 * 24)
        
        if (diffDays === 1) {
          streakDays++
        } else {
          break
        }
      }
    }

    // 计算人生蓝图完成度
    const blueprint = profile.life_blueprint || {}
    const blueprintProgress = calculateBlueprintProgress(blueprint)

    return res.status(200).json({
      profile: {
        id: profile.id,
        email: profile.email,
        tokenBalance: profile.token_balance || 0,
        createdAt: profile.created_at
      },
      subscription: subscription ? {
        status: subscription.status,
        planType: subscription.plan_type,
        currentPeriodEnd: subscription.current_period_end
      } : null,
      stats: {
        totalConversations,
        totalTokensUsed,
        totalInsights,
        monthlyConversations,
        streakDays,
        blueprintProgress
      },
      blueprint
    })

  } catch (error) {
    console.error('获取用户档案错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}

function calculateBlueprintProgress(blueprint) {
  const modules = {
    journey: ['childhood', 'education', 'turning_points'],
    career: ['work_philosophy', 'achievements', 'failures', 'skills'],
    relationships: ['family', 'intimate', 'social', 'embarrassing'],
    health: ['physical', 'mental', 'energy'],
    values: ['core_values', 'life_goals', 'mindset']
  }

  let totalFields = 0
  let completedFields = 0

  Object.entries(modules).forEach(([moduleKey, fields]) => {
    const moduleData = blueprint[moduleKey] || {}
    fields.forEach(field => {
      totalFields++
      if (moduleData[field] && moduleData[field].trim().length > 0) {
        completedFields++
      }
    })
  })

  return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0
}