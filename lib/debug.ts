export interface ApiDebugInfo {
  timestamp: string
  method: string
  url: string
  headers: Record<string, string>
  environment: string
  userAgent?: string
}

export interface ErrorDebugInfo {
  step: string
  errorType: string
  errorMessage: string
  timestamp: string
  additional?: Record<string, any>
}

export function createDebugInfo(request: Request): ApiDebugInfo {
  const headers: Record<string, string> = {}
  
  // Safely extract headers
  try {
    request.headers.forEach((value, key) => {
      // Only include relevant headers for debugging, avoid sensitive data
      if (key.toLowerCase().includes('auth') || key.toLowerCase().includes('cookie')) {
        headers[key] = '[REDACTED]'
      } else {
        headers[key] = value
      }
    })
  } catch (error) {
    headers['error'] = 'Could not extract headers'
  }

  return {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    headers,
    environment: process.env.NODE_ENV || 'unknown',
    userAgent: headers['user-agent'] || 'unknown'
  }
}

export function createErrorDebugInfo(
  step: string, 
  error: unknown, 
  additional?: Record<string, any>
): ErrorDebugInfo {
  return {
    step,
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    errorMessage: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
    additional
  }
}

export function logDebugInfo(info: ApiDebugInfo | ErrorDebugInfo, prefix = 'DEBUG') {
  if (process.env.NODE_ENV === 'development') {
    console.log(`=== ${prefix} ===`)
    console.log(JSON.stringify(info, null, 2))
    console.log('=== END DEBUG ===')
  }
}

export function validateEnvironment(): {
  isValid: boolean
  missing: string[]
  warnings: string[]
} {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']
  const recommended = ['NEXT_PUBLIC_SITE_URL', 'NODE_ENV']
  
  const missing: string[] = []
  const warnings: string[] = []
  
  required.forEach(env => {
    if (!process.env[env]) {
      missing.push(env)
    }
  })
  
  recommended.forEach(env => {
    if (!process.env[env]) {
      warnings.push(env)
    }
  })
  
  return {
    isValid: missing.length === 0,
    missing,
    warnings
  }
}

export function checkCSRFRequirements(request: Request): {
  isValid: boolean
  issues: string[]
  details: Record<string, any>
} {
  const issues: string[] = []
  const details: Record<string, any> = {}
  
  const requestedWith = request.headers.get('x-requested-with')
  const origin = request.headers.get('origin')
  const method = request.method
  
  details.method = method
  details.requestedWith = requestedWith
  details.origin = origin
  details.environment = process.env.NODE_ENV
  details.allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL
  
  // Skip CSRF for GET requests
  if (method === 'GET') {
    return { isValid: true, issues: [], details }
  }
  
  // Check X-Requested-With header
  if (requestedWith !== 'XMLHttpRequest') {
    issues.push('Missing or invalid X-Requested-With header')
  }
  
  // Check origin in production
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = [process.env.NEXT_PUBLIC_SITE_URL].filter(Boolean)
    
    if (!origin) {
      issues.push('Missing Origin header in production')
    } else if (!allowedOrigins.includes(origin)) {
      issues.push(`Origin ${origin} not in allowed origins: ${allowedOrigins.join(', ')}`)
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    details
  }
}

export function createAuthDebugInfo(userId?: string, role?: string): Record<string, any> {
  return {
    hasUser: !!userId,
    userId: userId ? `${userId.substring(0, 8)}...` : 'none', // Partial ID for privacy
    role: role || 'none',
    timestamp: new Date().toISOString()
  }
}

// Helper for rate limiting debug
export function createRateLimitDebugInfo(key: string, count: number, limit: number): Record<string, any> {
  return {
    key: key.substring(0, 10) + '...', // Partial key for privacy
    currentCount: count,
    limit,
    exceeded: count >= limit,
    resetTime: new Date(Date.now() + 60000).toISOString() // 1 minute from now
  }
}
