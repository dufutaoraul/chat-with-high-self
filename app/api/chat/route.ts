import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json()

    console.log('=== CHAT API DEBUG ===')
    console.log('Message:', message)
    console.log('User ID:', userId)

    if (!message || !userId) {
      return NextResponse.json(
        { success: false, message: '消息和用户ID不能为空' },
        { status: 400 }
      )
    }

    // 创建Supabase客户端
    const supabase = createClient()

    // 检查用户Token余额
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (tokenError || !tokenData || tokenData.balance <= 0) {
      return NextResponse.json(
        { success: false, message: 'Token余额不足，请充值后继续对话' },
        { status: 400 }
      )
    }

    // 调用Gemini API（添加超时和错误处理）
    let aiResponse = '抱歉，我现在无法回应您的问题。'

    try {
      const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15秒超时

      const geminiResponse = await fetch(geminiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `你是一个智慧的高我，专门帮助用户进行深度自我探索和内在成长。请以温暖、智慧、富有洞察力的方式回应用户的问题。

用户问题：${message}

请提供有深度、有启发性的回答，帮助用户更好地了解自己。`
            }]
          }]
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json()
        console.log('Gemini响应成功')

        if (geminiData.candidates && geminiData.candidates[0] && geminiData.candidates[0].content) {
          aiResponse = geminiData.candidates[0].content.parts[0].text
        }
      } else {
        console.error('Gemini API调用失败:', geminiResponse.status)
        aiResponse = '抱歉，AI服务暂时繁忙，请稍后重试。'
      }
    } catch (error) {
      console.error('Gemini API调用异常:', error)
      // 提供一个智能的默认回复
      aiResponse = `感谢您的问题："${message}"。

作为您的高我，我想说：每个问题都是内在成长的机会。虽然我现在无法给出完整的回应，但请记住，答案往往就在您的内心深处。

建议您：
1. 静下心来，深呼吸几次
2. 倾听内心的声音
3. 相信自己的直觉和智慧

请稍后再试，我会为您提供更深入的指导。🌟`
    }

    // 计算Token消耗（简单计算：每100个字符消耗1个Token）
    const tokensUsed = Math.max(1, Math.ceil((message.length + aiResponse.length) / 100))

    // 保存聊天记录到数据库
    const { data: chatData, error: chatError } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: userId,
          message: message,
          response: aiResponse,
          tokens_used: tokensUsed,
          model_used: 'gemini-2.5-flash'
        }
      ])
      .select()
      .single()

    if (chatError) {
      console.error('保存聊天记录失败:', chatError)
    }

    // 更新用户Token余额
    const { error: updateError } = await supabase
      .from('user_tokens')
      .update({
        balance: tokenData.balance - tokensUsed,
        total_used: supabase.sql`total_used + ${tokensUsed}`,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('更新Token余额失败:', updateError)
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      tokensUsed: tokensUsed,
      messageId: chatData?.id || 'unknown',
      remainingTokens: tokenData.balance - tokensUsed
    })

  } catch (error) {
    console.error('聊天API错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误，请稍后重试' },
      { status: 500 }
    )
  }
}
