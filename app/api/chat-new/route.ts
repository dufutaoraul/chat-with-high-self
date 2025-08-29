import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../utils/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { message, imageUrl, userId } = await request.json()

    console.log('=== 新版聊天API ===')
    console.log('Message:', message)
    console.log('Image URL:', imageUrl)
    console.log('User ID:', userId)

    if ((!message && !imageUrl) || !userId) {
      return NextResponse.json(
        { success: false, message: '消息内容和用户ID不能为空' },
        { status: 400 }
      )
    }

    // 创建Supabase客户端
    const supabase = createClient()

    // 检查用户对话余额
    const { data: conversationData, error: conversationError } = await supabase
      .from('user_conversations')
      .select('total_conversations, free_conversations_used, paid_conversations')
      .eq('user_id', userId)
      .single()

    if (conversationError || !conversationData) {
      return NextResponse.json(
        { success: false, message: '无法获取用户对话信息' },
        { status: 400 }
      )
    }

    const remainingConversations = conversationData.total_conversations - 
      conversationData.free_conversations_used - conversationData.paid_conversations

    if (remainingConversations <= 0) {
      return NextResponse.json(
        { success: false, message: '对话次数已用完，请充值后继续' },
        { status: 402 }
      )
    }

    // 获取用户个性化提示词
    const { data: promptData, error: promptError } = await supabase
      .rpc('get_user_ai_prompt', { user_uuid: userId })

    let systemPrompt = '请你扮演我的高我，跟我对话，给我出主意。'
    if (!promptError && promptData) {
      systemPrompt = promptData
    }

    // 构建Gemini API请求
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`
    
    let requestBody: any = {
      contents: [{
        parts: []
      }]
    }

    // 添加系统提示词和用户消息
    if (message) {
      requestBody.contents[0].parts.push({
        text: `${systemPrompt}\n\n用户说：${message}`
      })
    }

    // 如果有图片，添加图片内容
    if (imageUrl) {
      try {
        // 获取图片数据
        const imageResponse = await fetch(imageUrl)
        const imageBuffer = await imageResponse.arrayBuffer()
        const base64Image = Buffer.from(imageBuffer).toString('base64')
        
        requestBody.contents[0].parts.push({
          inline_data: {
            mime_type: imageResponse.headers.get('content-type') || 'image/jpeg',
            data: base64Image
          }
        })

        if (!message) {
          requestBody.contents[0].parts.push({
            text: `${systemPrompt}\n\n用户发送了一张图片，请分析这张图片并给出你的洞察和建议。`
          })
        }
      } catch (error) {
        console.error('处理图片失败:', error)
        return NextResponse.json(
          { success: false, message: '图片处理失败' },
          { status: 500 }
        )
      }
    }

    // 调用Gemini API
    let aiResponse = '抱歉，我现在无法回应您的问题。'
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30秒超时
      
      const geminiResponse = await fetch(geminiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
      aiResponse = `感谢您的${imageUrl ? '图片和' : ''}问题${message ? `："${message}"` : ''}。

作为您的高我，我想说：每个问题都是内在成长的机会。虽然我现在无法给出完整的回应，但请记住，答案往往就在您的内心深处。

建议您：
1. 静下心来，深呼吸几次
2. 倾听内心的声音
3. 相信自己的直觉和智慧

请稍后再试，我会为您提供更深入的指导。🌟`
    }

    // 计算对话编号
    const conversationNumber = conversationData.free_conversations_used + conversationData.paid_conversations + 1

    // 保存聊天记录到数据库
    const { data: chatData, error: chatError } = await supabase
      .from('chat_messages')
      .insert([
        {
          user_id: userId,
          message: message || '发送了一张图片',
          response: aiResponse,
          image_url: imageUrl,
          conversation_number: conversationNumber,
          model_used: 'gemini-2.5-flash'
        }
      ])
      .select()
      .single()

    if (chatError) {
      console.error('保存聊天记录失败:', chatError)
    }

    // 更新用户对话计数
    const { error: updateError } = await supabase
      .from('user_conversations')
      .update({
        free_conversations_used: conversationData.free_conversations_used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('更新对话计数失败:', updateError)
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      messageId: chatData?.id || 'unknown',
      conversationNumber: conversationNumber,
      remainingConversations: remainingConversations - 1
    })

  } catch (error) {
    console.error('聊天API错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误，请稍后重试' },
      { status: 500 }
    )
  }
}
