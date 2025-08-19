import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log('中间件收到的 Cookies:', request.cookies.getAll());
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

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

  // 获取用户信息
  const { data: { user } } = await supabase.auth.getUser()
  
  const { pathname } = request.nextUrl

  // 如果用户未登录且访问受保护的路径，重定向到登录页
  if (!user && pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // 如果用户已登录且访问登录/注册页面，重定向到仪表板
  if (user && (pathname === '/signin' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}
