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

    // Allow all API routes and static files
    if (req.nextUrl.pathname.startsWith('/api') || req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.startsWith('/favicon')) {
      return NextResponse.next()
    }

    // If user is authenticated and trying to access auth pages, redirect to appropriate dashboard
    // Allow access to root (landing page) even for authenticated users
    if (isAuth && isAuthPage) {
      const userStatus = token?.status as string
      const userRole = token?.role as string
      
      // Status-based redirects for auth pages
      if (userStatus === 'unverified') {
        return NextResponse.redirect(new URL('/id-verification', req.url))
      }
      if (userStatus === 'pending') {
        return NextResponse.redirect(new URL('/main/guest/waiting', req.url))
      }
      if (userStatus === 'rejected') {
        return NextResponse.redirect(new URL('/auth/login?error=rejected', req.url))
      }
      
      // For approved users, redirect based on role
      let redirectPath = '/main/guest/waiting' // default
      if (userRole === 'Admin') {
        redirectPath = '/main/admin'
      } else if (userRole === 'Resident') {
        redirectPath = '/main/user'
      }
      
      return NextResponse.redirect(new URL(redirectPath, req.url))
    }

    // If user is not authenticated and trying to access protected routes, redirect to login
    // EXCEPT for guest pages which should be accessible without authentication
    if (!isAuth && isDashboardPage && !req.nextUrl.pathname.startsWith('/main/guest')) {
      const from = req.nextUrl.pathname + req.nextUrl.search
      return NextResponse.redirect(
        new URL(`/auth/login?from=${encodeURIComponent(from)}`, req.url)
      )
    }

    // Status-based redirects (after authentication but before role checks)
    if (isAuth && isDashboardPage) {
      const userStatus = token?.status as string

      // Status-based redirects for unverified/pending/rejected
      if (userStatus === 'unverified' && !req.nextUrl.pathname.startsWith('/id-verification')) {
        return NextResponse.redirect(new URL('/id-verification', req.url))
      }

      if (userStatus === 'pending' && !req.nextUrl.pathname.startsWith('/main/guest/waiting')) {
        return NextResponse.redirect(new URL('/main/guest/waiting', req.url))
      }

      if (userStatus === 'rejected') {
        return NextResponse.redirect(new URL('/auth/login?error=rejected', req.url))
      }
    }

    // Role-based access control for dashboard routes (only for approved users)
    if (isAuth && isDashboardPage) {
      const userStatus = token?.status as string
      const userRole = token?.role as string

      // For pending/unverified users, treat as guest: allow /main/guest/*, redirect from others
      if (userStatus === 'pending' || userStatus === 'unverified') {
        if (req.nextUrl.pathname === '/main') {
          return NextResponse.redirect(new URL('/main/guest/waiting', req.url))
        }
        if (req.nextUrl.pathname.startsWith('/main/guest')) {
          return NextResponse.next() // Allow access to guest pages
        }
        if (req.nextUrl.pathname.startsWith('/main/admin') || req.nextUrl.pathname.startsWith('/main/user')) {
          return NextResponse.redirect(new URL('/main/guest/waiting', req.url))
        }
      }

      // For approved users, apply role-based checks
      if (userStatus === 'approved') {
        // If accessing just /main, redirect to role-specific dashboard
        if (req.nextUrl.pathname === '/main') {
          let redirectPath = '/main/guest/waiting'
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
          const fallbackPath = userRole === 'Resident' ? '/main/user' : '/main/guest/waiting'
          return NextResponse.redirect(new URL(fallbackPath, req.url))
        }

        // User routes - Admin and Resident can access
        if (req.nextUrl.pathname.startsWith('/main/user') &&
            !['Admin', 'Resident'].includes(userRole)) {
          return NextResponse.redirect(new URL('/main/guest/waiting', req.url))
        }
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