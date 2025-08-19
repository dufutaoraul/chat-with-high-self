import { supabaseAdmin } from '../../../lib/supabase'

export default async function handler(req, res) {
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

    if (req.method === 'POST') {
      // 保存或更新人生蓝图
      const { blueprint } = req.body

      if (!blueprint) {
        return res.status(400).json({ error: '人生蓝图数据不能为空' })
      }

      // 检查用户资料是否存在
      const { data: existingProfile, error: checkError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('检查用户资料错误:', checkError)
        return res.status(500).json({ error: '数据库查询失败' })
      }

      let result
      if (existingProfile) {
        // 更新现有资料
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .update({
            life_blueprint: blueprint,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()

        result = { data, error }
      } else {
        // 创建新资料
        const { data, error } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: user.id,
            life_blueprint: blueprint,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()

        result = { data, error }
      }

      if (result.error) {
        console.error('保存人生蓝图错误:', result.error)
        return res.status(500).json({ error: '保存失败' })
      }

      return res.status(200).json({ 
        message: '人生蓝图保存成功',
        profile: result.data[0]
      })

    } else if (req.method === 'GET') {
      // 获取人生蓝图
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('life_blueprint')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('获取人生蓝图错误:', error)
        return res.status(500).json({ error: '获取失败' })
      }

      return res.status(200).json({
        blueprint: profile?.life_blueprint || null
      })

    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }

  } catch (error) {
    console.error('人生蓝图 API 错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}