import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: '邮箱和密码不能为空' })
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return res.status(400).json({ error: '邮箱或密码错误' })
    }

    return res.status(200).json({
      message: '登录成功',
      user: data.user,
      session: data.session
    })
  } catch (error) {
    console.error('登录错误:', error)
    return res.status(500).json({ error: '服务器内部错误' })
  }
}