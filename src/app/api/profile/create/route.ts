import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'
import { checkRateLimit } from '../../../../../lib/rateLimit'

/**
 * API route profila izveidei/atjaunināšanai pēc reģistrācijas.
 * Nepieciešams autentificēts lietotājs (Supabase sesijas cookies).
 * Biežākais 401 iemesls: fetch bez credentials: 'include' vai nepareizi setots servera Supabase klients.
 */
export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  // 1) Rate limit aizsardzība
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Pārāk daudz pieprasījumu. Lūdzu, mēģini vēlāk.' },
      { status: 429 }
    )
  }

  // 2) Parse body
  let personType: 'private' | 'company' | undefined
  try {
    const body = await req.json()
    personType = body?.personType
  } catch {
    return NextResponse.json({ error: 'Nederīgs pieprasījums' }, { status: 400 })
  }

  if (personType !== 'private' && personType !== 'company') {
    return NextResponse.json({ error: 'Nederīgs profila tips' }, { status: 400 })
  }

  // 3) Supabase servera klients ar cookies sinhronizāciju
  let supabase
  try {
    supabase = await createClient()
  } catch (e) {
    // Env vai init kļūda
    return NextResponse.json({ error: 'Servera konfigurācijas kļūda' }, { status: 500 })
  }

  // 4) Pārbaudām sesiju (auth cookies jābūt klāt)
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError) {
    // Diagnostikai atstājam servera konsolē
    console.error('getUser() error:', sessionError)
  }
  if (!user) {
    // BIEŽĀKAIS GADĪJUMS: fetch no klienta bez credentials: "include" vai cits domēns/subdomēns
    return NextResponse.json({ error: 'Nav lietotāja (401). Pieslēdzies un sūti pieprasījumu ar credentials: include.' }, { status: 401 })
  }

  // 5) Update profila tipu
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ person_type: personType, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    console.error('profiles update error:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // 6) Veiksmīga atbilde
  return NextResponse.json({ success: true })
}
