import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../utils/supabase/server'

// 指定使用 Node.js runtime 而不是 Edge Runtime
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json()

    if (!message || !userId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 创建 Supabase 客户端
    const supabase = createClient()

    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: '用户身份验证失败' },
        { status: 401 }
      )
    }

    // 检查用户Token余额
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('token_balance, free_tokens_used, free_tokens_limit')
      .eq('user_id', userId)
      .single()

    const totalTokens = (profile?.token_balance || 0) + 
                       Math.max(0, (profile?.free_tokens_limit || 100) - (profile?.free_tokens_used || 0))

    if (totalTokens <= 0) {
      return NextResponse.json(
        { error: 'Token余额不足，请充值后继续对话' },
        { status: 402 }
      )
    }

    // 调用 Gemini API
    const geminiResponse = await fetch(
      `${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `作为用户的高我，请以智慧、温暖、深刻的方式回应以下内容。请提供有洞察力的建议和反思：\n\n${message}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    )

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API 错误: ${geminiResponse.status}`)
    }

    const geminiData = await geminiResponse.json()
    const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '抱歉，我现在无法回应。请稍后再试。'

    // 估算Token消耗（简化计算）
    const tokensUsed = Math.ceil((message.length + reply.length) * 1.5)

    // 更新用户Token余额
    if (profile?.token_balance && profile.token_balance > 0) {
      // 优先扣除付费Token
      const newBalance = Math.max(0, profile.token_balance - tokensUsed)
      await supabase
        .from('user_profiles')
        .update({ token_balance: newBalance })
        .eq('user_id', userId)
    } else {
      // 扣除免费Token
      const newFreeUsed = (profile?.free_tokens_used || 0) + tokensUsed
      await supabase
        .from('user_profiles')
        .update({ free_tokens_used: newFreeUsed })
        .eq('user_id', userId)
    }

    // 保存对话记录
    await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        user_message: message,
        ai_response: reply,
        tokens_used: tokensUsed,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      reply,
      tokensUsed,
      success: true
    })

  } catch (error) {
    console.error('对话API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误，请稍后再试' },
      { status: 500 }
    )
  }
}