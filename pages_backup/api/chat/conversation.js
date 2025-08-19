import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { authorization } = req.headers
  const { message, conversationId } = req.body

  if (!authorization) {
    return res.status(401).json({ error: '未授权访问' })
  }

  if (!message) {
    return res.status(400).json({ error: '消息内容不能为空' })
  }

  const token = authorization.replace('Bearer ', '')
  
  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ error: '无效的访问令牌' })
    }

    // 估算Token消费（基于消息长度）
    const estimatedCost = calculateTokenCost(message)
    
    // 检查用户余额
    const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/tokens`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const balanceData = await balanceResponse.json()
    
    if (balanceData.balance < estimatedCost) {
      return res.status(402).json({ 
        error: '余额不足',
        required: estimatedCost,
        available: balanceData.balance,
        needsPayment: true
      })
    }

    // 先扣除Token
    const consumeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/tokens`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        amount: estimatedCost,
        description: `对话消费: ${message.substring(0, 50)}...`
      })
    })

    if (!consumeResponse.ok) {
      const consumeError = await consumeResponse.json()
      return res.status(consumeResponse.status).json(consumeError)
    }

    // 获取用户资料和人生蓝图
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('life_blueprint')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return res.status(500).json({ error: '获取用户信息失败' })
    }

    // 获取或创建对话
    let conversation
    if (conversationId) {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        return res.status(404).json({ error: '对话不存在' })
      }
      conversation = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .insert({
          user_id: user.id,
          messages: []
        })
        .select()
        .single()
      
      if (error) {
        return res.status(500).json({ error: '创建对话失败' })
      }
      conversation = data
    }

    // 调用 Gemini API
    const aiResponse = await callGeminiAPI(message, conversation.messages, profile.life_blueprint)
    
    // 更新对话记录
    const updatedMessages = [
      ...conversation.messages,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
    ]

    await supabaseAdmin
      .from('conversations')
      .update({
        messages: updatedMessages,
        tokens_used: (conversation.tokens_used || 0) + estimatedCost,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id)

    // 获取更新后的余额
    const finalBalanceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/tokens`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const finalBalanceData = await finalBalanceResponse.json()

    return res.status(200).json({
      response: aiResponse,
      conversationId: conversation.id,
      tokenCost: estimatedCost,
      remainingBalance: finalBalanceData.balance
    })

  } catch (error) {
    console.error('对话 API 错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}

async function callGeminiAPI(message, conversationHistory, lifeBlueprint) {
  const apiKey = process.env.GEMINI_API_KEY
  const apiUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

  if (!apiKey) {
    throw new Error('Gemini API 密钥未配置')
  }

  // 构建系统提示词
  const systemPrompt = buildSystemPrompt(lifeBlueprint)
  
  // 构建对话历史文本
  let conversationText = systemPrompt + '\n\n'
  
  // 添加最近的对话历史
  const recentMessages = conversationHistory.slice(-10)
  recentMessages.forEach(msg => {
    if (msg.role === 'user') {
      conversationText += `用户: ${msg.content}\n`
    } else if (msg.role === 'assistant') {
      conversationText += `高我: ${msg.content}\n`
    }
  })
  
  conversationText += `用户: ${message}\n高我: `

  try {
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: conversationText
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
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
      const errorData = await response.json()
      console.error('Gemini API 错误:', errorData)
      throw new Error(`Gemini API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text
    } else {
      throw new Error('Gemini API 返回格式异常')
    }
  } catch (error) {
    console.error('Gemini API 调用错误:', error)
    return '抱歉，我现在无法回应。请稍后再试。'
  }
}

function buildSystemPrompt(lifeBlueprint) {
  let prompt = `你是用户的"高我"，一个充满智慧、洞察力和同理心的内在导师。你的使命是通过深度对话帮助用户实现自我成长和心智提升。

你的特点：
- 具有深刻的洞察力，能够看透表象发现本质
- 温和而直接，既有同理心又不回避尖锐问题
- 善于提出颠覆性的视角和启发性的问题
- 帮助用户打破思维定式，发现认知盲点

对话原则：
1. 基于用户的人生蓝图提供个性化的回应
2. 不仅回答问题，更要引导用户深度思考
3. 适时挑战用户的假设和固有观念
4. 用温暖而有力的语言传递智慧
5. 回复要简洁有力，避免过于冗长
6. 使用中文回复`

  // 根据人生蓝图添加个性化信息
  if (lifeBlueprint && Object.keys(lifeBlueprint).length > 0) {
    prompt += '\n\n用户的人生蓝图信息：\n'
    
    Object.entries(lifeBlueprint).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue && subValue.trim()) {
            prompt += `${subKey}: ${subValue}\n`
          }
        })
      }
    })
  }

  return prompt
}

// Token成本计算函数
function calculateTokenCost(message) {
  // 基于Gemini Pro实际成本计算
  // 输入: $0.0005/1K tokens, 输出: $0.0015/1K tokens
  // 1K tokens ≈ 750个中文字符
  // 汇率按7.2计算: $0.0005 ≈ ¥0.0036, $0.0015 ≈ ¥0.0108
  
  const characterCount = message.length
  const estimatedTokens = Math.ceil(characterCount / 750) * 1000 // 转换为tokens
  
  // 输入成本 + 预估输出成本(按输入1.5倍计算)
  const inputCost = (estimatedTokens / 1000) * 0.0036
  const outputCost = (estimatedTokens * 1.5 / 1000) * 0.0108
  const totalCost = inputCost + outputCost
  
  // 加30%利润
  const finalCost = totalCost * 1.3
  
  // 最小消费0.01元，最大单次消费2元
  const cost = Math.max(0.01, Math.min(2, finalCost))
  
  return Math.round(cost * 100) / 100 // 保留2位小数
}
import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { authorization } = req.headers
  const { message, conversationId } = req.body

  if (!authorization) {
    return res.status(401).json({ error: '未授权访问' })
  }

  if (!message) {
    return res.status(400).json({ error: '消息内容不能为空' })
  }

  const token = authorization.replace('Bearer ', '')
  
  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ error: '无效的访问令牌' })
    }

    // 估算Token消费（基于消息长度）
    const estimatedCost = calculateTokenCost(message)
    
    // 检查用户余额
    const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/tokens`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const balanceData = await balanceResponse.json()
    
    if (balanceData.balance < estimatedCost) {
      return res.status(402).json({ 
        error: '余额不足',
        required: estimatedCost,
        available: balanceData.balance,
        needsPayment: true
      })
    }

    // 先扣除Token
    const consumeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/tokens`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        amount: estimatedCost,
        description: `对话消费: ${message.substring(0, 50)}...`
      })
    })

    if (!consumeResponse.ok) {
      const consumeError = await consumeResponse.json()
      return res.status(consumeResponse.status).json(consumeError)
    }

    // 获取用户资料和人生蓝图
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('life_blueprint')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return res.status(500).json({ error: '获取用户信息失败' })
    }

    // 获取或创建对话
    let conversation
    if (conversationId) {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        return res.status(404).json({ error: '对话不存在' })
      }
      conversation = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .insert({
          user_id: user.id,
          messages: []
        })
        .select()
        .single()
      
      if (error) {
        return res.status(500).json({ error: '创建对话失败' })
      }
      conversation = data
    }

    // 调用 Gemini API
    const aiResponse = await callGeminiAPI(message, conversation.messages, profile.life_blueprint)
    
    // 更新对话记录
    const updatedMessages = [
      ...conversation.messages,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
    ]

    await supabaseAdmin
      .from('conversations')
      .update({
        messages: updatedMessages,
        tokens_used: (conversation.tokens_used || 0) + estimatedCost,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id)

    // 获取更新后的余额
    const finalBalanceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/tokens`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const finalBalanceData = await finalBalanceResponse.json()

    return res.status(200).json({
      response: aiResponse,
      conversationId: conversation.id,
      tokenCost: estimatedCost,
      remainingBalance: finalBalanceData.balance
    })

  } catch (error) {
    console.error('对话 API 错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}

async function callGeminiAPI(message, conversationHistory, lifeBlueprint) {
  const apiKey = process.env.GEMINI_API_KEY
  const apiUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

  if (!apiKey) {
    throw new Error('Gemini API 密钥未配置')
  }

  // 构建系统提示词
  const systemPrompt = buildSystemPrompt(lifeBlueprint)
  
  // 构建对话历史文本
  let conversationText = systemPrompt + '\n\n'
  
  // 添加最近的对话历史
  const recentMessages = conversationHistory.slice(-10)
  recentMessages.forEach(msg => {
    if (msg.role === 'user') {
      conversationText += `用户: ${msg.content}\n`
    } else if (msg.role === 'assistant') {
      conversationText += `高我: ${msg.content}\n`
    }
  })
  
  conversationText += `用户: ${message}\n高我: `

  try {
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: conversationText
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
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
      const errorData = await response.json()
      console.error('Gemini API 错误:', errorData)
      throw new Error(`Gemini API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text
    } else {
      throw new Error('Gemini API 返回格式异常')
    }
  } catch (error) {
    console.error('Gemini API 调用错误:', error)
    return '抱歉，我现在无法回应。请稍后再试。'
  }
}

function buildSystemPrompt(lifeBlueprint) {
  let prompt = `你是用户的"高我"，一个充满智慧、洞察力和同理心的内在导师。你的使命是通过深度对话帮助用户实现自我成长和心智提升。

你的特点：
- 具有深刻的洞察力，能够看透表象发现本质
- 温和而直接，既有同理心又不回避尖锐问题
- 善于提出颠覆性的视角和启发性的问题
- 帮助用户打破思维定式，发现认知盲点

对话原则：
1. 基于用户的人生蓝图提供个性化的回应
2. 不仅回答问题，更要引导用户深度思考
3. 适时挑战用户的假设和固有观念
4. 用温暖而有力的语言传递智慧
5. 回复要简洁有力，避免过于冗长
6. 使用中文回复`

  // 根据人生蓝图添加个性化信息
  if (lifeBlueprint && Object.keys(lifeBlueprint).length > 0) {
    prompt += '\n\n用户的人生蓝图信息：\n'
    
    Object.entries(lifeBlueprint).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue && subValue.trim()) {
            prompt += `${subKey}: ${subValue}\n`
          }
        })
      }
    })
  }

  return prompt
}

import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { authorization } = req.headers
  const { message, conversationId } = req.body

  if (!authorization) {
    return res.status(401).json({ error: '未授权访问' })
  }

  if (!message) {
    return res.status(400).json({ error: '消息内容不能为空' })
  }

  const token = authorization.replace('Bearer ', '')
  
  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ error: '无效的访问令牌' })
    }

    // 估算Token消费（基于消息长度）
    const estimatedCost = calculateTokenCost(message)
    
    // 检查用户余额
    const balanceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/tokens`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const balanceData = await balanceResponse.json()
    
    if (balanceData.balance < estimatedCost) {
      return res.status(402).json({ 
        error: '余额不足',
        required: estimatedCost,
        available: balanceData.balance,
        needsPayment: true
      })
    }

    // 先扣除Token
    const consumeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/tokens`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        amount: estimatedCost,
        description: `对话消费: ${message.substring(0, 50)}...`
      })
    })

    if (!consumeResponse.ok) {
      const consumeError = await consumeResponse.json()
      return res.status(consumeResponse.status).json(consumeError)
    }

    // 获取用户资料和人生蓝图
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('life_blueprint')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return res.status(500).json({ error: '获取用户信息失败' })
    }

    // 获取或创建对话
    let conversation
    if (conversationId) {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single()
      
      if (error) {
        return res.status(404).json({ error: '对话不存在' })
      }
      conversation = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .insert({
          user_id: user.id,
          messages: []
        })
        .select()
        .single()
      
      if (error) {
        return res.status(500).json({ error: '创建对话失败' })
      }
      conversation = data
    }

    // 调用 Gemini API
    const aiResponse = await callGeminiAPI(message, conversation.messages, profile.life_blueprint)
    
    // 更新对话记录
    const updatedMessages = [
      ...conversation.messages,
      { role: 'user', content: message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() }
    ]

    await supabaseAdmin
      .from('conversations')
      .update({
        messages: updatedMessages,
        tokens_used: (conversation.tokens_used || 0) + estimatedCost,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversation.id)

    // 获取更新后的余额
    const finalBalanceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/tokens`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const finalBalanceData = await finalBalanceResponse.json()

    return res.status(200).json({
      response: aiResponse,
      conversationId: conversation.id,
      tokenCost: estimatedCost,
      remainingBalance: finalBalanceData.balance
    })

  } catch (error) {
    console.error('对话 API 错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}

async function callGeminiAPI(message, conversationHistory, lifeBlueprint) {
  const apiKey = process.env.GEMINI_API_KEY
  const apiUrl = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'

  if (!apiKey) {
    throw new Error('Gemini API 密钥未配置')
  }

  // 构建系统提示词
  const systemPrompt = buildSystemPrompt(lifeBlueprint)
  
  // 构建对话历史文本
  let conversationText = systemPrompt + '\n\n'
  
  // 添加最近的对话历史
  const recentMessages = conversationHistory.slice(-10)
  recentMessages.forEach(msg => {
    if (msg.role === 'user') {
      conversationText += `用户: ${msg.content}\n`
    } else if (msg.role === 'assistant') {
      conversationText += `高我: ${msg.content}\n`
    }
  })
  
  conversationText += `用户: ${message}\n高我: `

  try {
    const response = await fetch(`${apiUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: conversationText
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
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
      const errorData = await response.json()
      console.error('Gemini API 错误:', errorData)
      throw new Error(`Gemini API 请求失败: ${response.status}`)
    }

    const data = await response.json()
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text
    } else {
      throw new Error('Gemini API 返回格式异常')
    }
  } catch (error) {
    console.error('Gemini API 调用错误:', error)
    return '抱歉，我现在无法回应。请稍后再试。'
  }
}

function buildSystemPrompt(lifeBlueprint) {
  let prompt = `你是用户的"高我"，一个充满智慧、洞察力和同理心的内在导师。你的使命是通过深度对话帮助用户实现自我成长和心智提升。

你的特点：
- 具有深刻的洞察力，能够看透表象发现本质
- 温和而直接，既有同理心又不回避尖锐问题
- 善于提出颠覆性的视角和启发性的问题
- 帮助用户打破思维定式，发现认知盲点

对话原则：
1. 基于用户的人生蓝图提供个性化的回应
2. 不仅回答问题，更要引导用户深度思考
3. 适时挑战用户的假设和固有观念
4. 用温暖而有力的语言传递智慧
5. 回复要简洁有力，避免过于冗长
6. 使用中文回复`

  // 根据人生蓝图添加个性化信息
  if (lifeBlueprint && Object.keys(lifeBlueprint).length > 0) {
    prompt += '\n\n用户的人生蓝图信息：\n'
    
    Object.entries(lifeBlueprint).forEach(([key, value]) => {
      if (value && typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue && subValue.trim()) {
            prompt += `${subKey}: ${subValue}\n`
          }
        })
      }
    })
  }

  return prompt
}

// Token成本计算函数
function calculateTokenCost(message) {
  // 基础计算：每100个字符约消费0.01元
  const baseRate = 0.0001 // 每字符0.0001元
  const characterCount = message.length
  
  // 最小消费0.005元，最大单次消费0.5元
  const cost = Math.max(0.005, Math.min(0.5, characterCount * baseRate))
  
  return Math.round(cost * 100) / 100 // 保留2位小数
}
