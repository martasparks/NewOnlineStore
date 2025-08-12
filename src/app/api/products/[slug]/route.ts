import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Nepareizs produkta identifikators' }, 
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: product, error } = await supabase
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
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Produkts nav atrasts' }, 
          { status: 404 }
        )
      }
      
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Datu bāzes kļūda' }, 
        { status: 500 }
      )
    }

    // Add view tracking (optional)
    try {
      await supabase.rpc('increment_product_views', { 
        product_id: product.id 
      })
    } catch (viewError) {
      // Non-critical error, don't fail the request
      console.log('View tracking failed:', viewError)
    }

    return NextResponse.json(product, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Content-Type-Options': 'nosniff'
      }
    })

  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { error: 'Servera kļūda' }, 
      { status: 500 }
    )
  }
}