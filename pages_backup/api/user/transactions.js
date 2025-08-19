import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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

    // 获取用户的交易记录
    const { data: transactions, error } = await supabaseAdmin
      .from('zpay_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: '获取交易记录失败' })
    }

    // 格式化交易记录
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      orderId: transaction.order_id,
      productId: transaction.product_id,
      productName: getProductName(transaction.product_id),
      amount: transaction.amount,
      status: transaction.status,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at
    }))

    return res.status(200).json({
      transactions: formattedTransactions
    })

  } catch (error) {
    console.error('获取交易记录错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}

function getProductName(productId) {
  const products = {
    'tokens_10k': '10,000 对话Token',
    'tokens_50k': '50,000 对话Token',
    'tokens_100k': '100,000 对话Token',
    'monthly_sub': '月度订阅',
    'yearly_sub': '年度订阅'
  }

  return products[productId] || '未知产品'
}