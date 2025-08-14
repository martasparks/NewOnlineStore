import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

// Pievienojam admin pārbaudes funkciju
async function checkAdminPermissions(supabase: SupabaseClient) {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('Auth error:', authError)
    throw new Error('Neautorizēts lietotājs')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Profile fetch error:', profileError)
    throw new Error('Nav admin tiesību')
  }

  if (profile?.role !== 'admin') {
    console.error('User role check failed:', { userId: user.id, role: profile?.role })
    throw new Error('Nav admin tiesību')
  }

  return user
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const admin = searchParams.get('admin')

  // Ja ir admin parametrs, pārbaudam tiesības
  if (admin === 'true') {
    try {
      await checkAdminPermissions(supabase)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Nav admin tiesību' }, 
        { status: 403 }
      )
    }
  }
  
  const { data, error } = await supabase
    .from('navigation_subcategories')
    .select('*')
    .order('order_index')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    await checkAdminPermissions(supabase)
    
    const body = await req.json()
    console.log('Creating subcategory:', body)

    // Validējam obligātos laukus
    if (!body.name || !body.slug) {
      return NextResponse.json({ 
        error: 'Nosaukums un slug ir obligāti' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('navigation_subcategories')
      .insert([body])
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json(data?.[0])
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Servera kļūda' }, 
      { status: error instanceof Error && error.message.includes('tiesību') ? 403 : 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createClient()
    await checkAdminPermissions(supabase)
    
    const body = await req.json()

    if (!body.id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const { id, ...updateData } = body
    console.log('Updating subcategory:', id, updateData)

    const { data, error } = await supabase
      .from('navigation_subcategories')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json(data?.[0])
  } catch (error) {
    console.error('PUT error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Servera kļūda' }, 
      { status: error instanceof Error && error.message.includes('tiesību') ? 403 : 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = await createClient()
    await checkAdminPermissions(supabase)
    
    const { id } = await req.json()

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const { error } = await supabase
      .from('navigation_subcategories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Servera kļūda' }, 
      { status: error instanceof Error && error.message.includes('tiesību') ? 403 : 500 }
    )
  }
}