import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少需要6位' })
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({
      message: '注册成功',
      user: data.user
    })
  } catch (error) {
    console.error('注册错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}