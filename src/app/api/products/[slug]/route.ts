import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const resolvedParams = await params
    
    if (!resolvedParams || !resolvedParams.slug) {
      return NextResponse.json({ error: 'Slug parameter is required' }, { status: 400 })
    }
    
    const { slug } = resolvedParams
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        navigation_categories!category_id(id, name, slug),
        navigation_subcategories!subcategory_id(id, name, slug)
      `)
      .eq('slug', slug)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })
  } catch (err) {
    console.error('Route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}