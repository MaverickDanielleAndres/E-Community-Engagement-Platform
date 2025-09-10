// @/middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isDashboardPage = req.nextUrl.pathname.startsWith('/mainapp')
    const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth')

    // Allow API auth routes
    if (isApiAuth) {
      return NextResponse.next()
    }

    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (isAuth && isAuthPage) {
      return NextResponse.redirect(new URL('/mainapp/dashboard', req.url))
    }

    // If user is not authenticated and trying to access protected routes, redirect to login
    if (!isAuth && isDashboardPage) {
      const from = req.nextUrl.pathname + req.nextUrl.search
      return NextResponse.redirect(
        new URL(`/auth/login?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow all requests to pass through to the middleware function above
        // The actual auth check happens in the middleware function
        return true
      },
    },
  }
)

// Protect these routes
export const config = {
  matcher: [
    '/mainapp/:path*',    // Protect all mainapp routes
    '/auth/:path*',       // Handle auth redirects
    '/api/protected/:path*', // Protect API routes if needed
  ]
}