import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../utils/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const authorization = request.headers.get('authorization')

    if (!authorization) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: '无效的访问令牌' }, { status: 401 })
    }

    // 查询交易状态
    const { data: transaction, error } = await supabaseAdmin
      .from('zpay_transactions')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', user.id)
      .single()

    if (error || !transaction) {
      return NextResponse.json({ error: '交易记录不存在' }, { status: 404 })
    }

    return NextResponse.json({
      orderId: transaction.order_id,
      status: transaction.status,
      amount: transaction.amount,
      productId: transaction.product_id,
      createdAt: transaction.created_at,
      updatedAt: transaction.updated_at
    })

  } catch (error) {
    console.error('查询支付状态错误:', error)
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 })
  }
}