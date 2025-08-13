import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale')
  const namespace = searchParams.get('namespace')

  let query = supabase
    .from('translations')
    .select('*')
    .order('namespace', { ascending: true })
    .order('key', { ascending: true })

  if (locale) {
    query = query.eq('locale', locale)
  }

  if (namespace) {
    query = query.eq('namespace', namespace)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { key, locale, value, namespace = 'default' } = body

  if (!key || !locale || typeof value === 'undefined') {
    return NextResponse.json({ error: 'Missing required fields: key, locale, value' }, { status: 400 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return NextResponse.json({ error: `Failed to load profile: ${profileError.message}` }, { status: 500 })
  }

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('translations')
    .upsert({
      key,
      locale,
      value,
      namespace,
      created_by: user.id,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key,locale,namespace' })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data?.[0])
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { id, value } = body

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('translations')
    .update({ 
      value, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data?.[0])
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('translations')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
