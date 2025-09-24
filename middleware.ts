// @/middleware.ts - Updated version to work with the new system
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isDashboardPage = req.nextUrl.pathname.startsWith('/main/')
    const isRootPath = req.nextUrl.pathname === '/'
    const isApiAuth = req.nextUrl.pathname.startsWith('/api/auth')

    // Allow API auth routes and static files
    if (isApiAuth || req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.startsWith('/favicon')) {
      return NextResponse.next()
    }

    // If user is authenticated and trying to access auth pages or root, redirect to appropriate dashboard
    if (isAuth && (isAuthPage || isRootPath)) {
      const userRole = token?.role as string
      
      let redirectPath = '/main/guest' // default
      if (userRole === 'Admin') {
        redirectPath = '/main/admin'
      } else if (userRole === 'Resident') {
        redirectPath = '/main/user'
      }
      
      return NextResponse.redirect(new URL(redirectPath, req.url))
    }

    // If user is not authenticated and trying to access protected routes, redirect to login
    if (!isAuth && isDashboardPage) {
      const from = req.nextUrl.pathname + req.nextUrl.search
      return NextResponse.redirect(
        new URL(`/auth/login?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // Role-based access control for dashboard routes
    if (isAuth && isDashboardPage) {
      const userRole = token?.role as string

      // If accessing just /main, redirect to role-specific dashboard
      if (req.nextUrl.pathname === '/main') {
        let redirectPath = '/main/guest'
        if (userRole === 'Admin') {
          redirectPath = '/main/admin'
        } else if (userRole === 'Resident') {
          redirectPath = '/main/user'
        }
        return NextResponse.redirect(new URL(redirectPath, req.url))
      }

      // Admin should be redirected away from guest pages
      if (req.nextUrl.pathname.startsWith('/main/guest') && userRole === 'Admin') {
        return NextResponse.redirect(new URL('/main/admin', req.url))
      }

      // Resident should be redirected away from guest pages
      if (req.nextUrl.pathname.startsWith('/main/guest') && userRole === 'Resident') {
        return NextResponse.redirect(new URL('/main/user', req.url))
      }

      // Admin routes - only Admin can access
      if (req.nextUrl.pathname.startsWith('/main/admin') && userRole !== 'Admin') {
        const fallbackPath = userRole === 'Resident' ? '/main/user' : '/main/guest'
        return NextResponse.redirect(new URL(fallbackPath, req.url))
      }

      // User routes - Admin and Resident can access
      if (req.nextUrl.pathname.startsWith('/main/user') &&
          !['Admin', 'Resident'].includes(userRole)) {
        return NextResponse.redirect(new URL('/main/guest', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
    '/main/:path*',
    '/auth/:path*',
  ]
}