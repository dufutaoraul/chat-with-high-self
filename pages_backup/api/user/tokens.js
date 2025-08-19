import { createClient } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: '方法不允许' })
  }

  const supabase = createClient()
  
  // 获取用户认证信息
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: '未授权访问' })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: '用户认证失败' })
  }

  if (req.method === 'GET') {
    // 获取用户Token余额
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('token_balance, free_trial_used, total_spent')
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      // 计算可用余额（包含免费试用）
      const freeTrialRemaining = profile.free_trial_used ? 0 : 1.00 // 1元免费试用
      const totalBalance = (profile.token_balance || 0) + freeTrialRemaining

      return res.status(200).json({
        balance: totalBalance,
        paidBalance: profile.token_balance || 0,
        freeTrialRemaining,
        freeTrialUsed: profile.free_trial_used || false,
        totalSpent: profile.total_spent || 0
      })
    } catch (error) {
      console.error('获取Token余额失败:', error)
      return res.status(500).json({ error: '服务器错误' })
    }
  }

  if (req.method === 'POST') {
    // 消费Token
    const { amount, description } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '消费金额必须大于0' })
    }

    try {
      // 获取当前用户余额
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('token_balance, free_trial_used, total_spent')
        .eq('user_id', user.id)
        .single()

      if (profileError) throw profileError

      const currentBalance = profile.token_balance || 0
      const freeTrialUsed = profile.free_trial_used || false
      const freeTrialRemaining = freeTrialUsed ? 0 : 1.00

      const totalAvailable = currentBalance + freeTrialRemaining

      // 检查余额是否足够
      if (totalAvailable < amount) {
        return res.status(402).json({ 
          error: '余额不足',
          required: amount,
          available: totalAvailable,
          needsPayment: true
        })
      }

      // 计算消费分配
      let newBalance = currentBalance
      let newFreeTrialUsed = freeTrialUsed
      let usedFromFreeTrial = 0

      if (!freeTrialUsed && amount > 0) {
        // 优先使用免费试用额度
        usedFromFreeTrial = Math.min(amount, 1.00)
        const remainingAmount = amount - usedFromFreeTrial
        
        if (usedFromFreeTrial > 0) {
          newFreeTrialUsed = true
        }
        
        if (remainingAmount > 0) {
          newBalance = currentBalance - remainingAmount
        }
      } else {
        // 使用付费余额
        newBalance = currentBalance - amount
      }

      // 更新用户余额
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          token_balance: newBalance,
          free_trial_used: newFreeTrialUsed,
          total_spent: (profile.total_spent || 0) + amount
        })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // 记录消费记录
      const { error: logError } = await supabase
        .from('token_transactions')
        .insert({
          user_id: user.id,
          type: 'consume',
          amount: -amount,
          description: description || '对话消费',
          balance_after: newBalance + (newFreeTrialUsed ? 0 : 1.00),
          free_trial_used: usedFromFreeTrial
        })

      if (logError) throw logError

      return res.status(200).json({
        success: true,
        consumed: amount,
        newBalance: newBalance + (newFreeTrialUsed ? 0 : 1.00),
        usedFromFreeTrial
      })

    } catch (error) {
      console.error('Token消费失败:', error)
      return res.status(500).json({ error: '服务器错误' })
    }
  }
}