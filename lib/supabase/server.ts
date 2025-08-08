import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const hdrs = await headers()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase env nav konfigurēti: NEXT_PUBLIC_SUPABASE_URL vai NEXT_PUBLIC_SUPABASE_ANON_KEY nav iestatīti.')
    throw new Error('Supabase environment variables are missing')
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (err) {
          console.error('Failed to set cookies via createServerClient:', cookiesToSet, err)
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
  })
}
