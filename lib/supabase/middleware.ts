import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to homepage with auth param if not authenticated
  const protectedRoutes = [
    '/dashboard',
    '/team',
    '/attendance',
    '/timetable',
    '/meetings',
    '/finances',
    '/uploads',
    '/announcements',
  ]

  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('auth', 'signin')
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect anyone visiting /auth/login or /auth/sign-up to homepage with auth popup
  if (request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/sign-up')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    // Determine which auth mode based on the path
    const authMode = request.nextUrl.pathname.includes('sign-up') ? 'signup' : 'signin'
    url.searchParams.set('auth', authMode)
    // If user is authenticated, redirect to dashboard instead
    if (user) {
      url.pathname = '/dashboard'
      url.searchParams.delete('auth')
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
