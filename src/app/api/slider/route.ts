import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const admin = searchParams.get('admin')

  let query = supabase
    .from('homepage_slider')
    .select('*')
    .order('order_index')

  if (!admin) {
    query = query.eq('is_active', true)
  }
  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('homepage_slider')
    .insert([body])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data?.[0])
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  if (!body.id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  const { data, error } = await supabase
    .from('homepage_slider')
    .update(body)
    .eq('id', body.id)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data?.[0])
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { id } = await req.json()

  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  const { error } = await supabase
    .from('homepage_slider')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}