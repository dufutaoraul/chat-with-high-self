import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  console.log('=== AUTH CALLBACK DEBUG ===')
  console.log('Request URL:', request.url)
  console.log('Origin:', origin)
  console.log('Code:', code ? 'Present' : 'Missing')
  console.log('Error:', error)
  console.log('Error Description:', errorDescription)
  console.log('Next:', next)
  console.log('All search params:', Object.fromEntries(searchParams.entries()))

  // 如果URL中直接包含错误信息，立即重定向到错误页面
  if (error) {
    const errorUrl = new URL('/auth/auth-code-error', origin)
    errorUrl.searchParams.set('error', error)
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(errorUrl.toString())
  }

  if (code) {
    // 确保重定向到正确的页面
    const redirectUrl = next === '/' ? '/dashboard' : next
    console.log('Preparing redirect to:', `${origin}${redirectUrl}`)
    let response = NextResponse.redirect(`${origin}${redirectUrl}`)

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

    try {
      console.log('Attempting to exchange code for session...')
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      console.log('Exchange result:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: exchangeError
      })

      if (!exchangeError) {
        console.log('Code exchange successful, redirecting to:', `${origin}${next}`)
        // 成功处理，重定向到目标页面
        return response
      } else {
        // 处理交换代码时的错误
        console.error('Code exchange error:', exchangeError)
        const errorUrl = new URL('/auth/auth-code-error', origin)
        errorUrl.searchParams.set('error', 'code_exchange_failed')
        errorUrl.searchParams.set('error_description', exchangeError.message || '代码交换失败')
        console.log('Redirecting to error page:', errorUrl.toString())
        return NextResponse.redirect(errorUrl.toString())
      }
    } catch (err) {
      console.error('Unexpected error during code exchange:', err)
      const errorUrl = new URL('/auth/auth-code-error', origin)
      errorUrl.searchParams.set('error', 'unexpected_error')
      errorUrl.searchParams.set('error_description', '认证过程中发生意外错误')
      return NextResponse.redirect(errorUrl.toString())
    }
  }

  // 没有代码参数，重定向到错误页面
  const errorUrl = new URL('/auth/auth-code-error', origin)
  errorUrl.searchParams.set('error', 'missing_code')
  errorUrl.searchParams.set('error_description', '缺少认证代码参数')
  return NextResponse.redirect(errorUrl.toString())
}