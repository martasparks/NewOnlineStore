import { NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'
import { checkRateLimit } from '@lib/rateLimit'

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Pārāk daudz pieprasījumu. Lūdzu, mēģini vēlāk.' },
      { status: 429 }
    )
  }

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

  let supabase
  try {
    supabase = await createClient()
  } catch (_e) {
    return NextResponse.json({ error: 'Servera konfigurācijas kļūda' }, { status: 500 })
  }

  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError) {
    console.error('getUser() error:', sessionError)
  }
  if (!user) {
    return NextResponse.json({ error: 'Nav lietotāja (401). Pieslēdzies un sūti pieprasījumu ar credentials: include.' }, { status: 401 })
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ person_type: personType, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (updateError) {
    console.error('profiles update error:', updateError)
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
