import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  // Query parametri
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')
  const category = searchParams.get('category')
  const featured = searchParams.get('featured')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') || 'name'
  const order = searchParams.get('order') || 'asc'
  const admin = searchParams.get('admin') === 'true'

  let query = supabase
    .from('products')
    .select(`
      *,
      navigation_categories!category_id(id, name, slug),
      navigation_subcategories!subcategory_id(id, name, slug)
    `)
    .order('created_at', { ascending: false })

  // Ja nav admin mode, rādām tikai aktīvos
  if (!admin) {
    query = query.eq('status', 'active')
  }

  // Filtri
  if (category) {
    query = query.eq('category_id', category)
  }
  
  if (featured === 'true') {
    query = query.eq('featured', true)
  }
  
  if (search) {
    query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`)
  }

  // Sortēšana
  if (sort === 'price_desc') {
    query = query.order('price', { ascending: false })
  } else if (sort === 'price') {
    query = query.order('price', { ascending: true })
  } else {
    query = query.order(sort, { ascending: order === 'asc' })
  }

  // Paginācija
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    products: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }, {
    headers: {
      'Cache-Control': admin ? 'no-cache' : 'public, s-maxage=60, stale-while-revalidate=300'
    }
  })
}

// Pievienojam PUT un DELETE metodes
export async function PUT(req: Request) {
  const supabase = await createClient()
  
  // Pārbaudam admin tiesības
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  
  // Izņemam JOIN laukus un read-only laukus
  const { 
    id, 
    navigation_categories, 
    navigation_subcategories, 
    created_at,
    created_by,
    ...updateData 
  } = body

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  console.log('Clean update data:', updateData) // Debug

  const { data, error } = await supabase
    .from('products')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*') // Vienkāršs select bez JOIN

  if (error) {
    console.error('Supabase update error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data?.[0])
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  
  // Pārbaudam admin tiesības
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await req.json()

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  
  // Pārbaudam admin tiesības
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  
  const { data, error } = await supabase
    .from('products')
    .insert([{
      ...body,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select(`
      *,
      navigation_categories:category_id(id, name, slug),
      navigation_subcategories:subcategory_id(id, name, slug)
    `)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data?.[0])
}