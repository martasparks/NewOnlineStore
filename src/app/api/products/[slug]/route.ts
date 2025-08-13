import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug)) {
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
    
    let relatedColors: Array<{
      id: string
      name: string
      slug: string
      images: string[]
      price: number
      sale_price: number | null
      sku: string | null
    }> = []

    if (product?.group_id) {
      const { data: siblings, error: siblingsError } = await supabase
        .from('products')
        .select('id, name, slug, images, price, sale_price, sku')
        .eq('group_id', product.group_id)
        .eq('status', 'active')
        .neq('id', product.id)
        .order('featured', { ascending: false })
        .order('price', { ascending: true })

      if (!siblingsError && siblings) {
        relatedColors = siblings
      }
    }

    return NextResponse.json(
      { ...product, relatedColors }, 
      {
        headers: {
          'X-Content-Type-Options': 'nosniff'
        }
      }
    )

  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { error: 'Servera kļūda' }, 
      { status: 500 }
    )
  }
}