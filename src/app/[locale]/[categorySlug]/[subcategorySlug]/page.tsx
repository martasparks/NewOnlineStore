'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import Header from '@/components/Header'
import MainNavigation from '@/components/MainNavigation'
import ProductCard from '@/components/products/ProductCard'
import { Loading } from '@/components/ui/Loading'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
}

interface Subcategory {
  id: string
  name: string
  slug: string
  category_id: string
  meta_title?: string
  meta_description?: string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
  short_description: string
  sale_price?: number
  stock_quantity?: number
  featured?: boolean
  sku?: string
  navigation_categories?: {
    name: string
    slug: string
  }
}

export default function SubcategoryPage() {
  const params = useParams()
  const [category, setCategory] = useState<Category | null>(null)
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ielādējam kategorijas
        const catsRes = await fetch('/api/navigation/categories')
        const categories = await catsRes.json()
        const foundCategory = categories.find((cat: Category) => cat.slug === params.categorySlug)
        
        if (!foundCategory) {
          notFound()
        }
        setCategory(foundCategory)

        // Ielādējam subkategorijas
        const subsRes = await fetch('/api/navigation/subcategories')
        const subcategories = await subsRes.json()
        const foundSub = subcategories.find((sub: Subcategory) => 
          sub.slug === params.subcategorySlug && sub.category_id === foundCategory.id
        )
        
        if (!foundSub) {
          notFound()
        }
        setSubcategory(foundSub)

        // Ielādējam produktus pēc subcategory_id
        const productsRes = await fetch(`/api/products?subcategory=${foundSub.id}&status=active`)
        const productsData = await productsRes.json()
        setProducts(productsData.products || [])
        
      } catch (error) {
        console.error('Error:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    if (params.categorySlug && params.subcategorySlug) {
      fetchData()
    }
  }, [params.categorySlug, params.subcategorySlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <MainNavigation />
        <Loading variant="spinner" text="Ielādē..." className="py-20" />
      </div>
    )
  }

  if (!category || !subcategory) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <MainNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-700">Sākums</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href={`/${category.slug}`} className="hover:text-gray-700">{category.name}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{subcategory.name}</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {subcategory.name}
        </h1>
        <p className="text-gray-600 mb-8">
          {category.name} → {subcategory.name}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}