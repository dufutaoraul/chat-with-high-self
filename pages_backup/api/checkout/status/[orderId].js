import { supabaseAdmin } from '../../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { authorization } = req.headers
  const { orderId } = req.query

  if (!authorization) {
    return res.status(401).json({ error: '未授权访问' })
  }

  if (!orderId) {
    return res.status(400).json({ error: '订单ID不能为空' })
  }

  const token = authorization.replace('Bearer ', '')
  
  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ error: '无效的访问令牌' })
    }

    // 查询订单状态
    const { data: transaction, error } = await supabaseAdmin
      .from('zpay_transactions')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return res.status(404).json({ error: '订单不存在' })
    }

    return res.status(200).json({
      orderId: transaction.order_id,
      status: transaction.status,
      amount: transaction.amount,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at
    })

  } catch (error) {
    console.error('查询订单状态错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}