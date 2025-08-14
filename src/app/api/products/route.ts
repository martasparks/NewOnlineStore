import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'
import { ProductValidation } from '@/components/admin/products/ProductValidation'
import type { SupabaseClient } from '@supabase/supabase-js'

interface User {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

const requestCounts = new Map<string, { count: number; resetTime: number }>()

async function resolveGroupId(
  supabase: SupabaseClient,
  params: { groupId?: string | null; parentSlug?: string | null; parentSku?: string | null }
): Promise<string | null> {
  const { groupId, parentSlug, parentSku } = params

  if (groupId && typeof groupId === 'string' && groupId.trim() !== '') {
    const trimmedGroupId = groupId.trim()
    
    return trimmedGroupId
  }

  if (parentSlug) {
    const { data } = await supabase
      .from('products')
      .select('id, group_id')
      .eq('slug', parentSlug)
      .single()
    if (data) return data.group_id || data.id
  }

  if (parentSku) {
    const { data } = await supabase
      .from('products')
      .select('id, group_id')
      .eq('sku', parentSku)
      .single()
    if (data) return data.group_id || data.id
  }

  return null
}

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || realIp || 'unknown'
}

function checkRateLimit(key: string, maxRequests = 100, windowMs = 60000): boolean {
  const now = Date.now()
  const record = requestCounts.get(key)
  
  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

function validateCSRF(request: NextRequest): boolean {
  const requestedWith = request.headers.get('x-requested-with')
  const origin = request.headers.get('origin')
  
  if (request.method === 'GET') {
      return true
  }

  if (requestedWith !== 'XMLHttpRequest') {
    console.error('CSRF validation failed: Missing X-Requested-With header')
    return false
  }
  
  if (process.env.NODE_ENV === 'production') {
    const allowedOrigins = [process.env.NEXT_PUBLIC_SITE_URL].filter(Boolean)
    if (!origin || !allowedOrigins.includes(origin)) {
      console.error('CSRF validation failed: Invalid origin', { origin, allowedOrigins })
      return false
    }
  }
  
  return true
}

async function checkAdminPermissions(supabase: SupabaseClient): Promise<{ user: User; isAdmin: boolean }> {
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

  return { user: user as User, isAdmin: true }
}

export async function GET(request: NextRequest) {
  try {
    const rateLimitKey = getRateLimitKey(request)
    if (!checkRateLimit(rateLimitKey, 200, 60000)) {
      return NextResponse.json(
        { error: 'Pārāk daudz pieprasījumu. Mēģiniet vēlāk.' }, 
        { status: 429 }
      )
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12'))) // Max 50 items per page
    const admin = searchParams.get('admin') === 'true'

    if (admin) {
      await checkAdminPermissions(supabase)
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        navigation_categories!category_id(id, name, slug),
        navigation_subcategories!subcategory_id(id, name, slug)
      `, { count: 'exact' })

    if (!admin) {
      query = query.eq('status', 'active')
    }

    const search = searchParams.get('search')?.trim().substring(0, 100)
    if (search) {
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&')
      query = query.or(`name.ilike.%${sanitizedSearch}%, description.ilike.%${sanitizedSearch}%`)
    }

    const category = searchParams.get('category')
    if (category && /^[a-zA-Z0-9-]+$/.test(category)) {
      query = query.eq('category_id', category)
    }

    // Filtrēšana pēc subcategory
    const subcategory = searchParams.get('subcategory')
    if (subcategory && /^[a-zA-Z0-9-]+$/.test(subcategory)) {
      query = query.eq('subcategory_id', subcategory)
    }

    const categoriesParam = searchParams.get('categories')
    if (categoriesParam) {
      const categorySlugs = categoriesParam.split(',').filter(slug => 
        slug.trim() && /^[a-zA-Z0-9-]+$/.test(slug.trim())
      )
      
      if (categorySlugs.length > 0) {
        const { data: categoryData, error: categoryError } = await supabase
          .from('navigation_categories')
          .select('id')
          .in('slug', categorySlugs)
        
        if (!categoryError && categoryData && categoryData.length > 0) {
          const categoryIds = categoryData.map(cat => cat.id)
          query = query.in('category_id', categoryIds)
        }
      }
    }

    const groupIdParam = searchParams.get('groupId')
    if (groupIdParam) query = query.eq('group_id', groupIdParam)

    const featured = searchParams.get('featured')
    if (featured === 'true') {
      query = query.eq('featured', true)
    }

    const inStock = searchParams.get('inStock')
    if (inStock === 'true') {
      query = query.gt('stock_quantity', 0)
    }

    const minPrice = parseInt(searchParams.get('minPrice') || '0')
    const maxPrice = parseInt(searchParams.get('maxPrice') || '999999')
    if (minPrice >= 0 && maxPrice > minPrice) {
      query = query.gte('price', minPrice).lte('price', maxPrice)
    }

    const allowedSorts = ['name', 'price_asc', 'price_desc', 'created_at', 'featured']
    const sort = searchParams.get('sort') || 'name'
    
    if (allowedSorts.includes(sort)) {
      switch(sort) {
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
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Database query error:', error)
      return NextResponse.json({ error: 'Datu bāzes kļūda' }, { status: 500 })
    }

    const headers: Record<string, string> = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-Generated-At': new Date().toISOString()
    }

    return NextResponse.json({
      products: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }, { headers })

  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Servera kļūda' }, 
      { status: error instanceof Error && error.message.includes('tiesību') ? 403 : 500 }
    )
  }
}

export async function POST(req: Request) {
  const request = req as NextRequest
  
  try {
    console.log('=== POST REQUEST DEBUG INFO ===')
    console.log('Method:', request.method)
    console.log('Headers (partial):', {
      'x-requested-with': request.headers.get('x-requested-with'),
      'origin': request.headers.get('origin'),
      'content-type': request.headers.get('content-type')
    })
    
    const rateLimitKey = getRateLimitKey(request)
    if (!checkRateLimit(rateLimitKey, 20, 60000)) {
      return NextResponse.json(
        { error: 'Pārāk daudz pieprasījumu. Mēģiniet vēlāk.' }, 
        { status: 429 }
      )
    }

    const csrfValid = validateCSRF(request)
    console.log('POST CSRF validation result:', csrfValid)
    
    if (!csrfValid) {
      console.error('CSRF validation failed for POST request')
      return NextResponse.json({ 
        error: 'Neatļauts pieprasījums - CSRF validācija neizdevās',
        debug: {
          hasXRequestedWith: request.headers.get('x-requested-with') === 'XMLHttpRequest',
          origin: request.headers.get('origin'),
          environment: process.env.NODE_ENV
        }
      }, { status: 403 })
    }

    const supabase = await createClient()
    const { user } = await checkAdminPermissions(supabase)

    const body = await req.json()

    const { group_id, parentSlug, ...rest } = body || {}
    const resolvedGroupId = await resolveGroupId(supabase, { 
      groupId: group_id,
      parentSlug, 
      parentSku: null 
    })

    const validationErrors = ProductValidation.validateProduct(rest)
    if (validationErrors.length > 0) {
      return NextResponse.json({ 
        error: 'Validācijas kļūdas', 
        validationErrors 
      }, { status: 400 })
    }

    if (resolvedGroupId) {
      const { data: groupProduct } = await supabase
        .from('products')
        .select('id, status')
        .eq('group_id', resolvedGroupId)
        .limit(1)
        .maybeSingle()
      const admin = true
      if (!admin && (!groupProduct || groupProduct.status !== 'active')) {
        return NextResponse.json({ error: 'Nederīgs groupId vai produkts nav aktīvs' }, { status: 400 })
      }
    }

    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('slug', rest.slug)
      .single()

    if (existingProduct) {
      return NextResponse.json({ 
        error: 'Produkts ar šādu slug jau eksistē' 
      }, { status: 400 })
    }

    // Nodrošinām pareizu subcategory apstrādi
    const cleanRest = {
      ...rest,
      subcategory_id: rest.subcategory_id === '' || rest.subcategory_id === undefined ? null : rest.subcategory_id,
      category_id: rest.category_id === '' || rest.category_id === undefined ? null : rest.category_id
    }

    const insertPayload = {
      ...cleanRest,
      group_id: resolvedGroupId || null,
      created_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('POST - Insert payload:', {
      category_id: insertPayload.category_id,
      subcategory_id: insertPayload.subcategory_id,
      group_id: insertPayload.group_id,
      name: insertPayload.name
    })

    const { data: createdRows, error } = await supabase
      .from('products')
      .insert([insertPayload])
      .select('id, group_id')

    if (error) {
      console.error('Product creation error:', error)
      return NextResponse.json({ error: 'Neizdevās izveidot produktu' }, { status: 400 })
    }

    const created = createdRows?.[0]
    if (created && !created.group_id) {
      const { error: gErr } = await supabase
        .from('products')
        .update({ group_id: created.id, updated_at: new Date().toISOString() })
        .eq('id', created.id)

      if (gErr) {
        console.error('Group assignment error:', gErr)
      }
    }

    const { data: fullProduct } = await supabase
      .from('products')
      .select(`
        *,
        navigation_categories:category_id(id, name, slug),
        navigation_subcategories:subcategory_id(id, name, slug)
      `)
      .eq('id', created.id)
      .single()

    return NextResponse.json(fullProduct, { status: 201 })

  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Servera kļūda' }, 
      { status: error instanceof Error && error.message.includes('tiesību') ? 403 : 500 }
    )
  }
}

export async function PUT(req: Request) {
  const request = req as NextRequest
  
  try {
    console.log('=== PUT REQUEST DEBUG INFO ===')
    console.log('Method:', request.method)
    console.log('URL:', request.url)
    console.log('Headers:', Object.fromEntries(request.headers.entries()))
    
    const rateLimitKey = getRateLimitKey(request)
    console.log('Rate limit key:', rateLimitKey)
    
    if (!checkRateLimit(rateLimitKey, 30, 60000)) {
      console.log('Rate limit exceeded for key:', rateLimitKey)
      return NextResponse.json(
        { error: 'Pārāk daudz pieprasījumu. Mēģiniet vēlāk.' }, 
        { status: 429 }
      )
    }

    console.log('Rate limit check passed')
    
    const csrfValid = validateCSRF(request)
    console.log('CSRF validation result:', csrfValid)
    
    if (!csrfValid) {
      console.error('CSRF validation failed for PUT request')
      return NextResponse.json({ 
        error: 'Neatļauts pieprasījums - CSRF validācija neizdevās',
        debug: {
          hasXRequestedWith: request.headers.get('x-requested-with') === 'XMLHttpRequest',
          origin: request.headers.get('origin'),
          environment: process.env.NODE_ENV,
          allowedOrigin: process.env.NEXT_PUBLIC_SITE_URL
        }
      }, { status: 403 })
    }

    console.log('CSRF validation passed')

    const supabase = await createClient()
    console.log('Supabase client created')
    
    let adminCheckResult
    try {
      adminCheckResult = await checkAdminPermissions(supabase)
      console.log('Admin permissions check passed:', adminCheckResult)
    } catch (adminError) {
      console.error('Admin permissions check failed:', adminError)
      return NextResponse.json({ 
        error: adminError instanceof Error ? adminError.message : 'Nav admin tiesību',
        debug: {
          step: 'admin_check_failed',
          errorMessage: adminError instanceof Error ? adminError.message : 'Unknown admin error'
        }
      }, { status: 403 })
    }

    let body
    try {
      body = await req.json()
      console.log('Request body parsed:', Object.keys(body))
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      return NextResponse.json({ 
        error: 'Nederīgs JSON formāts',
        debug: { step: 'json_parse_failed' }
      }, { status: 400 })
    }

    const { id } = body

    if (!id || typeof id !== 'string') {
      console.error('Invalid or missing ID:', id)
      return NextResponse.json({ 
        error: 'ID ir obligāts un jābūt string formātā',
        debug: { providedId: id, idType: typeof id }
      }, { status: 400 })
    }

    console.log('Updating product with ID:', id)

    const excludedFields = ['id', 'navigation_categories', 'navigation_subcategories', 'created_at', 'created_by']
    const updateData = Object.fromEntries(
      Object.entries(body).filter(([key]) => !excludedFields.includes(key))
    )

    console.log('Update data fields:', Object.keys(updateData))

    // Pārbaudām, vai produkts eksistē
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, slug')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.error('Error fetching existing product:', fetchError)
      return NextResponse.json({ 
        error: 'Kļūda meklējot produktu',
        debug: { step: 'fetch_existing_product', dbError: fetchError }
      }, { status: 500 })
    }

    if (!existingProduct) {
      console.error('Product not found with ID:', id)
      return NextResponse.json({ 
        error: 'Produkts nav atrasts',
        debug: { step: 'product_not_found', searchedId: id }
      }, { status: 404 })
    }

    console.log('Existing product found:', existingProduct)

    // Pārbaudām slug unikalitāti
    if (updateData.slug && updateData.slug !== existingProduct.slug) {
      const { data: slugExists } = await supabase
        .from('products')
        .select('id')
        .eq('slug', updateData.slug)
        .neq('id', id)
        .single()

      if (slugExists) {
        console.error('Slug already exists:', updateData.slug)
        return NextResponse.json({ 
          error: 'Produkts ar šādu slug jau eksistē',
          debug: { step: 'slug_exists', slug: updateData.slug }
        }, { status: 400 })
      }
    }

    // Pārbaudām group_id
    if (updateData.group_id) {
      const { data: groupExists } = await supabase
        .from('products')
        .select('id')
        .eq('group_id', updateData.group_id)
        .limit(1)
        .single()
        
      if (!groupExists) {
        console.error('Group does not exist:', updateData.group_id)
        return NextResponse.json({ 
          error: 'Norādītā grupa neeksistē',
          debug: { step: 'group_not_exists', groupId: updateData.group_id }
        }, { status: 400 })
      }
    }

    // Nodrošinām, ka subcategory_id tiek pareizi apstrādāts
    const finalUpdateData = {
      ...updateData,
      // Ja subcategory_id ir tukša virkne vai null, iestatām kā null
      subcategory_id: updateData.subcategory_id === '' || updateData.subcategory_id === undefined ? null : updateData.subcategory_id,
      category_id: updateData.category_id === '' || updateData.category_id === undefined ? null : updateData.category_id
    }

    const updatePayload = {
      ...finalUpdateData,
      updated_at: new Date().toISOString()
    }

    console.log('Final update data with subcategory handling:', finalUpdateData)

    console.log('Final update payload:', updatePayload)

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select('*')

    if (error) {
      console.error('Product update error:', error)
      return NextResponse.json({ 
        error: 'Neizdevās atjaunot produktu',
        debug: { step: 'database_update_failed', dbError: error }
      }, { status: 400 })
    }

    console.log('Product updated successfully:', data?.[0]?.id)
    
    return NextResponse.json(data?.[0], {
      headers: {
        'X-Debug-Info': 'Product updated successfully'
      }
    })

  } catch (error) {
    console.error('Products PUT error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    const errorMessage = error instanceof Error ? error.message : 'Servera kļūda'
    const isAuthError = errorMessage.includes('tiesību') || errorMessage.includes('autor')
    
    return NextResponse.json({
      error: errorMessage,
      debug: {
        step: 'general_error',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        timestamp: new Date().toISOString()
      }
    }, { 
      status: isAuthError ? 403 : 500,
      headers: {
        'X-Debug-Error': 'Check server console for details'
      }
    })
  }
}

export async function DELETE(req: Request) {
  const request = req as NextRequest
  
  try {
    console.log('=== DELETE REQUEST DEBUG INFO ===')
    console.log('Method:', request.method)
    
    const rateLimitKey = getRateLimitKey(request)
    if (!checkRateLimit(rateLimitKey, 10, 60000)) {
      return NextResponse.json(
        { error: 'Pārāk daudz pieprasījumu. Mēģiniet vēlāk.' }, 
        { status: 429 }
      )
    }

    const csrfValid = validateCSRF(request)
    console.log('DELETE CSRF validation result:', csrfValid)
    
    if (!csrfValid) {
      console.error('CSRF validation failed for DELETE request')
      return NextResponse.json({ 
        error: 'Neatļauts pieprasījums - CSRF validācija neizdevās',
        debug: {
          hasXRequestedWith: request.headers.get('x-requested-with') === 'XMLHttpRequest',
          origin: request.headers.get('origin'),
          environment: process.env.NODE_ENV
        }
      }, { status: 403 })
    }

    const supabase = await createClient()
    await checkAdminPermissions(supabase)

    const { id } = await req.json()

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'ID ir obligāts' }, { status: 400 })
    }

    const { data: existingProduct } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!existingProduct) {
      return NextResponse.json({ error: 'Produkts nav atrasts' }, { status: 404 })
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Product deletion error:', error)
      return NextResponse.json({ error: 'Neizdevās dzēst produktu' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Produkts "${existingProduct.name}" dzēsts veiksmīgi` 
    })

  } catch (error) {
    console.error('Products DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Servera kļūda' }, 
      { status: error instanceof Error && error.message.includes('tiesību') ? 403 : 500 }
    )
  }
}