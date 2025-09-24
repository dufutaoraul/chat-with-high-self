import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { buildPersonalizedPrompt, callGeminiAPI } from '../../../lib/gemini'
import { generateConversationTitle } from '../../../lib/utils'

// Inline getUserProfile function
async function getUserProfile(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export async function POST(request: NextRequest) {
  try {
    // 创建 Supabase 客户端
    let response = NextResponse.json({ success: true })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: '未授权访问' },
        { status: 401 }
      )
    }

    const { message, conversationId } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      )
    }

    // supabase 客户端已在上面创建
    let currentConversationId = conversationId

    // 如果没有对话ID，创建新对话
    if (!currentConversationId) {
      const title = generateConversationTitle(message)
      
      const { data: conversation, error: conversationError } = await supabase
        .from('user_conversations')
        .insert({
          user_id: user.id,
          title
        })
        .select()
        .single()

      if (conversationError) {
        throw conversationError
      }

      currentConversationId = conversation.id
    }

    // 保存用户消息
    const { error: userMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: currentConversationId,
        user_id: user.id,
        role: 'user',
        content: message
      })

    if (userMessageError) {
      throw userMessageError
    }

    // 获取用户资料用于个性化
    const profile = await getUserProfile(supabase, user.id)

    // 构建个性化prompt并调用AI
    const prompt = buildPersonalizedPrompt(profile, message)
    const aiResponse = await callGeminiAPI(prompt)

    // 保存AI回复
    const { error: aiMessageError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: currentConversationId,
        user_id: user.id,
        role: 'assistant',
        content: aiResponse
      })

    if (aiMessageError) {
      throw aiMessageError
    }

    return NextResponse.json({
      response: aiResponse,
      conversationId: currentConversationId
    })

  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: '对话失败，请稍后重试' },
      { status: 500 }
    )
  }
}
