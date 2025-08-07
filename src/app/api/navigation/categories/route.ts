import { NextResponse } from 'next/server'
import { createClient } from '../../../../../lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('navigation_categories')
    .select('*')
    .order('order_index')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('navigation_categories')
    .insert([body])
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Neizdevās izveidot kategoriju' }, { status: 500 })
  }

  return NextResponse.json(data[0])
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const body = await req.json()

  if (!body.id) {
    console.error('No ID provided in PUT request')
    return NextResponse.json({ error: 'ID is required for update' }, { status: 400 })
  }

  const { id, ...updateData } = body
  
  const { data, error } = await supabase
    .from('navigation_categories')
    .update(updateData)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Supabase update error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data || data.length === 0) {
    console.error('No data returned after update - record might not exist')
    return NextResponse.json({ error: 'Kategorija nav atrasta vai neizdevās atjaunināt' }, { status: 404 })
  }

  return NextResponse.json(data[0])
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('navigation_categories')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}