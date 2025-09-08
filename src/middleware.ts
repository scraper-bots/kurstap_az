import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authService } from '@/lib/auth'

// Force middleware to run in Node.js runtime instead of Edge runtime
export const runtime = 'nodejs'

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/interview',
  '/profile',
  '/settings',
  '/payment'
]

// Define auth routes (redirect if already authenticated)
const authRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password'
]

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/terms',
  '/privacy',
  '/contact',
  '/cookies',
  '/careers',
  '/blog',
  '/api/webhooks',
  '/api/users/credits',
  '/api/payments',
  '/api/health',
  '/api/debug',
  '/manifest.json'
]

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const sessionId = request.cookies.get('bir-guru-session')?.value


  // Check if user is authenticated
  let isAuthenticated = false
  let user = null

  if (sessionId) {
    try {
      user = await authService.getUserFromSession(sessionId)
      isAuthenticated = !!user
    } catch {
      // Invalid session, clear cookie
      const response = NextResponse.next()
      response.cookies.set('bir-guru-session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      })
      return response
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect routes that require authentication
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // Store the intended destination for redirect after login
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Add user info to request headers for API routes
  if (isAuthenticated && user) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', user.id)
    requestHeaders.set('x-user-email', user.email)
    requestHeaders.set('x-user-role', user.role)

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication endpoints)
     * - api/webhook (webhook endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api/auth|api/webhook|_next/static|_next/image|favicon.ico).*)',
  ],
}