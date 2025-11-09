import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { isRateLimited, rateLimitConfigs } from '@/lib/rate-limit'

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://localhost:3000',
  process.env.NEXTAUTH_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
].filter(Boolean)

// Middleware for messaging routes
export async function messagingMiddleware(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // CORS preflight handling
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    const origin = request.headers.get('origin') || ''
    response.headers.set('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : allowedOrigins[0] || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    return response
  }

  // CSRF protection: Check origin for state-changing requests
  const origin = request.headers.get('origin')
  const isAllowedOrigin = allowedOrigins.includes(origin || '')
  if (!isAllowedOrigin && (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE')) {
    return NextResponse.json({ error: 'CSRF protection: Invalid origin' }, { status: 403 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    addCorsHeaders(response, request)
    return response
  }

  // Enforce community membership checks
  const supabase = getSupabaseServerClient()
  const { data: userCommunity, error: communityError } = await supabase
    .from('community_members')
    .select('community_id, role')
    .eq('user_id', session.user.id)
    .single()

  if (communityError || !userCommunity) {
    const response = NextResponse.json({ error: 'Community membership required' }, { status: 403 })
    addCorsHeaders(response, request)
    return response
  }

  // Allow admins to message members from admin panel
  // The conversation route itself handles the logic for admin messaging restrictions

  // Apply rate limiting based on endpoint
  const pathname = request.nextUrl.pathname
  if (pathname.includes('/messages') && request.method === 'POST') {
    if (isRateLimited(request, rateLimitConfigs.messaging)) {
      const response = NextResponse.json(
        { error: 'Too many messages. Please wait before sending another message.' },
        { status: 429 }
      )
      addCorsHeaders(response, request)
      return response
    }
  }

  if (pathname.includes('/attachments/upload-token') && request.method === 'POST') {
    if (isRateLimited(request, rateLimitConfigs.uploads)) {
      const response = NextResponse.json(
        { error: 'Too many uploads. Please wait before uploading another file.' },
        { status: 429 }
      )
      addCorsHeaders(response, request)
      return response
    }
  }

  if (pathname.includes('/contacts') && request.method === 'POST') {
    if (isRateLimited(request, rateLimitConfigs.contacts)) {
      const response = NextResponse.json(
        { error: 'Too many contact requests. Please wait before adding another contact.' },
        { status: 429 }
      )
      addCorsHeaders(response, request)
      return response
    }
  }

  if (pathname.includes('/reactions') && request.method === 'POST') {
    if (isRateLimited(request, rateLimitConfigs.reactions)) {
      const response = NextResponse.json(
        { error: 'Too many reactions. Please wait before adding another reaction.' },
        { status: 429 }
      )
      addCorsHeaders(response, request)
      return response
    }
  }

  const response = await handler()
  addCorsHeaders(response, request)
  return response
}

// Helper function to add CORS headers
function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin')
  const allowedOrigin = allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0]
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
}
