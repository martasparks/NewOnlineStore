import { createClient } from '../../../../../lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '../../../../../lib/rateLimit'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Pārāk daudz pieprasījumu. Lūdzu, mēģini vēlāk.' }, { status: 429 })
  }

  const { personType } = await req.json()
  const supabase = await createClient()

  const { data: { user }, error: sessionError } = await supabase.auth.getUser()
  if (sessionError || !user) {
    return NextResponse.json({ error: 'Nav lietotāja' }, { status: 401 })
  }

  const { error } = await supabase
    .from('profiles')
    .update({ person_type: personType })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}