import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

/**
 * Server-side Supabase klients Next.js App Router vidē.
 * - Izmanto @supabase/ssr createServerClient
 * - Pieslēdz next/headers cookies() get/set, lai nodrošinātu sesijas atjaunināšanu
 * - Aizsardzība pret setAll izņēmumiem (RouteHandlers bez atbildes objekta u.c.)
 */
export async function createClient() {
  const cookieStore = await cookies()
  const hdrs = await headers()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Skaidrs kļūdas paziņojums lokālai diagnostikai
    console.error('Supabase env nav konfigurēti: NEXT_PUBLIC_SUPABASE_URL vai NEXT_PUBLIC_SUPABASE_ANON_KEY nav iestatīti.')
    throw new Error('Supabase environment variables are missing')
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Atgriež visus pieejamos cookies
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        // Dažos kontekstos Next var neatļaut set, tāpēc sargājam ar try/catch
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (err) {
          console.error('Failed to set cookies via createServerClient:', cookiesToSet, err)
        }
      },
    },
    // Pēc vēlmes, vari nodot arī headerus (nav obligāti, bet dažos setups palīdz diagnostikā)
    global: {
      headers: {
        'x-forwarded-host': hdrs.get('x-forwarded-host') ?? '',
        'x-forwarded-proto': hdrs.get('x-forwarded-proto') ?? '',
        'x-real-ip': hdrs.get('x-real-ip') ?? '',
      },
    },
  })
}
