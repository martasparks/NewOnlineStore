import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

export async function createClient() {
  try {
    const cookieStore = await cookies()
    const hdrs = await headers()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables:', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
        environment: process.env.NODE_ENV
      })
      throw new Error('Supabase environment variables are missing')
    }

    console.log('Creating Supabase server client with URL:', supabaseUrl.substring(0, 30) + '...')

    return createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            try {
              const allCookies = cookieStore.getAll()
              console.log('Retrieved cookies count:', allCookies.length)
              return allCookies
            } catch (error) {
              console.error('Error getting cookies:', error)
              return []
            }
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
              console.log('Set cookies count:', cookiesToSet.length)
            } catch (error) {
              console.error('Error setting cookies:', error)
            }
          },
        },
        global: {
          headers: {
            'x-forwarded-host': hdrs.get('x-forwarded-host') ?? '',
            'x-forwarded-proto': hdrs.get('x-forwarded-proto') ?? '',
            'x-real-ip': hdrs.get('x-real-ip') ?? '',
          },
        },
      }
    )
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    throw new Error(`Supabase client creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
