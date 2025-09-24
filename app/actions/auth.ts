'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/signup?error=邮箱和密码不能为空')
    return
  }

  if (password.length < 6) {
    redirect('/signup?error=密码至少需要6个字符')
    return
  }

  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'}/auth/callback`,
    },
  })

  if (error) {
    console.error('Sign up error:', error)
    redirect(`/signup?error=${encodeURIComponent(error.message)}`)
    return
  }

  if (data.user) {
    revalidatePath('/', 'layout')
    redirect('/signup-success')
    return
  }

  redirect('/signup?error=注册失败，请重试')
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/signin?error=邮箱和密码不能为空')
    return
  }

  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Sign in error:', error)
    redirect(`/signin?error=${encodeURIComponent(error.message)}`)
    return
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
    redirect('/?error=登出失败')
    return
  }

  revalidatePath('/', 'layout')
  redirect('/')
}