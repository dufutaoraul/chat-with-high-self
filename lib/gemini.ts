interface UserProfile {
  age?: number
  occupation?: string
  education_level?: string
  personality_type?: string
  values?: string[]
  interests?: string[]
  short_term_goals?: string[]
  long_term_goals?: string[]
  current_challenges?: string[]
  communication_style?: string
  preferred_feedback_style?: string
  motivation_factors?: string[]
}

export function buildPersonalizedPrompt(profile: UserProfile | null, userMessage: string): string {
  let systemPrompt = `你是一个智慧的AI心理对话伙伴，专门帮助用户进行自我反思和成长。你的角色是用户的"高我"——一个更智慧、更有洞察力的自己。

核心原则：
1. 以温暖、理解和支持的语气回应
2. 提供深度的洞察和反思性问题
3. 帮助用户发现内在智慧和解决方案
4. 避免直接给出答案，而是引导用户自己思考
5. 保持积极正面的态度，同时诚实面对挑战

回应风格：
- 使用第二人称"你"来称呼用户
- 语言温暖而有深度
- 适当使用比喻和启发性问题
- 长度适中，不要过于冗长`

  // 如果有用户资料，添加个性化信息
  if (profile) {
    systemPrompt += `\n\n关于这位用户的信息：`
    
    if (profile.age) {
      systemPrompt += `\n- 年龄：${profile.age}岁`
    }
    
    if (profile.occupation) {
      systemPrompt += `\n- 职业：${profile.occupation}`
    }
    
    if (profile.personality_type) {
      systemPrompt += `\n- 性格类型：${profile.personality_type}`
    }
    
    if (profile.values && profile.values.length > 0) {
      systemPrompt += `\n- 核心价值观：${profile.values.join('、')}`
    }
    
    if (profile.interests && profile.interests.length > 0) {
      systemPrompt += `\n- 兴趣爱好：${profile.interests.join('、')}`
    }
    
    if (profile.short_term_goals && profile.short_term_goals.length > 0) {
      systemPrompt += `\n- 短期目标：${profile.short_term_goals.join('、')}`
    }
    
    if (profile.long_term_goals && profile.long_term_goals.length > 0) {
      systemPrompt += `\n- 长期目标：${profile.long_term_goals.join('、')}`
    }
    
    if (profile.current_challenges && profile.current_challenges.length > 0) {
      systemPrompt += `\n- 当前挑战：${profile.current_challenges.join('、')}`
    }
    
    if (profile.communication_style) {
      systemPrompt += `\n- 沟通偏好：${profile.communication_style}`
    }
    
    if (profile.preferred_feedback_style) {
      systemPrompt += `\n- 反馈偏好：${profile.preferred_feedback_style}`
    }
    
    if (profile.motivation_factors && profile.motivation_factors.length > 0) {
      systemPrompt += `\n- 激励因素：${profile.motivation_factors.join('、')}`
    }
    
    systemPrompt += `\n\n请根据这些信息，以个性化的方式回应用户的问题和需求。`
  }
  
  systemPrompt += `\n\n用户的消息：${userMessage}\n\n请以高我的身份，给出深度而有洞察力的回应：`
  
  return systemPrompt
}

export async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    const response = await fetch(process.env.GEMINI_API_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY!
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API')
    }

    return data.candidates[0].content.parts[0].text
    
  } catch (error) {
    console.error('Gemini API调用失败:', error)
    
    // 返回一个友好的错误回复
    return '抱歉，我现在无法回应你的消息。请稍后再试，或者检查网络连接。作为你的高我，我想提醒你：有时候技术上的小问题也是让我们练习耐心和适应性的机会。'
  }
}