import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')
  const category = searchParams.get('category')
  const categories = searchParams.get('categories')
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const inStock = searchParams.get('inStock')
  const featured = searchParams.get('featured')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort') || 'name'
  const admin = searchParams.get('admin') === 'true'

  let query = supabase
    .from('products')
    .select(`
      *,
      navigation_categories!category_id(id, name, slug),
      navigation_subcategories!subcategory_id(id, name, slug)
    `)

  if (!admin) {
    query = query.eq('status', 'active')
  }

  // Filtri
  if (category) {
    query = query.eq('category_id', category)
  }
  
  if (categories) {
    const categorySlugs = categories.split(',')
    query = query.in('navigation_categories.slug', categorySlugs)
  }
  
  if (minPrice) {
    query = query.gte('price', parseInt(minPrice))
  }
  
  if (maxPrice) {
    query = query.lte('price', parseInt(maxPrice))
  }
  
  if (inStock === 'true') {
    query = query.gt('stock_quantity', 0)
  }
  
  if (featured === 'true') {
    query = query.eq('featured', true)
  }
  
  if (search) {
    query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`)
  }

  switch(sort) {
    case 'name':
      query = query.order('name', { ascending: true })
      break
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'created_at':
      query = query.order('created_at', { ascending: false })
      break
    case 'featured':
      query = query.order('featured', { ascending: false }).order('name', { ascending: true })
      break
    default:
      query = query.order('name', { ascending: true })
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Database query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    products: data || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit)
    }
  }, {
    headers: {
      'Cache-Control': admin ? 'no-cache' : 'public, s-maxage=60, stale-while-revalidate=300'
    }
  })
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  
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

  const { data, error } = await supabase
    .from('products')
    .update({
      ...updateData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')

  if (error) {
    console.error('Supabase update error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data?.[0])
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  
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