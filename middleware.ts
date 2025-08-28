import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from './utils/supabase/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // API路径和静态资源直接通过
  if (pathname.startsWith('/api/') || 
      pathname.startsWith('/_next/') ||
      pathname.includes('.') ||
      pathname === '/favicon.ico') {
    return NextResponse.next()
  }
  
  // 首页和公开路径完全不做认证检查
  const publicPaths = [
    '/',
    '/signin',
    '/signup',
    '/signup-success',
    '/auth/callback',
    '/auth/auth-code-error',
    '/reset-password',
    '/pricing'
  ]
  
  // 如果是公开路径，直接通过，不做任何认证检查
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }
  
  // 只对明确需要认证的路径进行检查
  const protectedPaths = [
    '/dashboard',
    '/profile',
    '/chat'
  ]
  
  // 只有访问受保护路径时才检查认证
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    try {
      const supabase = createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        const redirectUrl = new URL('/signin', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Middleware auth check failed:', error)
      const redirectUrl = new URL('/signin', request.url)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
