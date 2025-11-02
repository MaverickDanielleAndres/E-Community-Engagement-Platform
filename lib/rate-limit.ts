import { NextRequest } from 'next/server'

// Rate limiting storage (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string // Custom key generator
}

export function isRateLimited(
  request: NextRequest,
  config: RateLimitConfig = { windowMs: 5 * 60 * 1000, maxRequests: 5 }
): boolean {
  const now = Date.now()
  const key = config.keyGenerator ? config.keyGenerator(request) : getClientIP(request)
  const limit = rateLimitMap.get(key)

  if (!limit || now > limit.resetTime) {
    // Reset limit
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs })
    return false
  }

  if (limit.count >= config.maxRequests) {
    return true
  }

  limit.count++
  return false
}

export function getClientIP(request: NextRequest): string {
  return request.ip || request.headers.get('x-forwarded-for') || 'unknown'
}

// Specific rate limit configurations for different endpoints
export const rateLimitConfigs = {
  messaging: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30 // 30 messages per minute
  },
  uploads: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // 10 uploads per minute
  },
  contacts: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5 // 5 contact requests per 5 minutes
  },
  reactions: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 reactions per minute
  }
}
