// src/app/[locale]/[categorySlug]/[subcategorySlug]/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, notFound, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import MainNavigation from '@/components/MainNavigation'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'
import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/button'
import { ChevronRight, Grid, List, Filter, X, Loader2 } from 'lucide-react'
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

interface FilterState {
  categories: string[]
  minPrice: number
  maxPrice: number
  inStock: boolean
  featured: boolean
  page: number
}

export default function SubcategoryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [category, setCategory] = useState<Category | null>(null)
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })
  const [sortBy, setSortBy] = useState('name')

  const fetchProducts = useCallback(async (filters?: FilterState, sort?: string) => {
    if (!subcategory) return
    
    const isFiltering = !!filters
    
    if (isFiltering) {
      setFiltering(true)
    }

    try {
      const params = new URLSearchParams()
      
      params.set('subcategory', subcategory.id)
      params.set('status', 'active')
      
      if (filters) {
        if (filters.minPrice > 0) {
          params.set('minPrice', filters.minPrice.toString())
        }
        if (filters.maxPrice < 999999) {
          params.set('maxPrice', filters.maxPrice.toString())
        }
        if (filters.inStock) {
          params.set('inStock', 'true')
        }
        if (filters.featured) {
          params.set('featured', 'true')
        }
        if (filters.page > 1) {
          params.set('page', filters.page.toString())
        }
        params.set('limit', '12')
        if (sort && sort !== 'name') {
          params.set('sort', sort)
        }
      } else {
        const page = searchParams.get('page') || '1'
        const minPrice = searchParams.get('minPrice')
        const maxPrice = searchParams.get('maxPrice')
        const inStock = searchParams.get('inStock')
        const featured = searchParams.get('featured')
        const urlSort = searchParams.get('sort') || 'name'
        
        params.set('page', page)
        params.set('limit', '12')
        if (minPrice && minPrice !== '0') params.set('minPrice', minPrice)
        if (maxPrice && maxPrice !== '999999') params.set('maxPrice', maxPrice)
        if (inStock === 'true') params.set('inStock', inStock)
        if (featured === 'true') params.set('featured', featured)
        params.set('sort', urlSort)
      }

      if (filters) {
        const urlParams = new URLSearchParams()
        if (filters.minPrice > 0) urlParams.set('minPrice', filters.minPrice.toString())
        if (filters.maxPrice < 999999) urlParams.set('maxPrice', filters.maxPrice.toString())
        if (filters.inStock) urlParams.set('inStock', 'true')
        if (filters.featured) urlParams.set('featured', 'true')
        if (filters.page > 1) urlParams.set('page', filters.page.toString())
        if (sort && sort !== 'name') urlParams.set('sort', sort)
        
        const newUrl = urlParams.toString() 
          ? `${window.location.pathname}?${urlParams.toString()}`
          : window.location.pathname
        window.history.replaceState(null, '', newUrl)
      }

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (isFiltering) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }
        
        setProducts(data.products || [])
        setPagination(data.pagination || {
          page: 1,
          limit: 12,
          total: data.products?.length || 0,
          totalPages: 1
        })
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setFiltering(false)
    }
  }, [subcategory, searchParams])

  const handleFilterChange = useCallback((filters: FilterState) => {
    fetchProducts(filters, sortBy)
  }, [fetchProducts, sortBy])

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

  useEffect(() => {
    if (subcategory && !loading) {
      fetchProducts()
    }
  }, [subcategory, loading, fetchProducts])

  useEffect(() => {
    const urlSort = searchParams.get('sort') || 'name'
    setSortBy(urlSort)
  }, [searchParams])

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
          <Link href={`/${params.locale}/kategorijas/${category.slug}`} className="hover:text-gray-700">{category.name}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{subcategory.name}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {subcategory.name}
          </h1>
          <p className="text-gray-600 mb-6">
            {category.name} → {subcategory.name}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`transition-all duration-150 ease-out ${showFilters ? "bg-blue-600 hover:bg-blue-700" : ""}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Slēpt filtrus' : 'Rādīt filtrus'}
                {showFilters && <X className="w-4 h-4 ml-2" />}
              </Button>
              
                <select 
                  value={sortBy}
                  onChange={(e) => {
                    const newSort = e.target.value
                    setSortBy(newSort)
                    
                    const currentFilters = {
                      categories: [],
                      minPrice: parseInt(searchParams.get('minPrice') || '0'),
                      maxPrice: parseInt(searchParams.get('maxPrice') || '999999'), // Mainīts no 1000 uz 999999
                      inStock: searchParams.get('inStock') === 'true',
                      featured: searchParams.get('featured') === 'true',
                      page: 1
                    }
                    
                    fetchProducts(currentFilters, newSort)
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                <option value="name">Pēc nosaukuma</option>
                <option value="price_asc">Pēc cenas (lētākie)</option>
                <option value="price_desc">Pēc cenas (dārgākie)</option>
                <option value="created_at">Pēc datuma</option>
                <option value="featured">Populārākie</option>
              </select>

              {filtering && (
                <div className="flex items-center text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Atjaunina...
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="transition-all duration-200"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="transition-all duration-200"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">

          <div className={`transition-all duration-200 ease-out ${showFilters ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
            <div className={`w-80 transition-transform duration-200 ease-out ${showFilters ? 'translate-x-0' : '-translate-x-full'}`}>
              <ProductFilters 
                onFilterChange={handleFilterChange} 
                isLoading={filtering}
                hideCategories={true}
                subcategoryId={subcategory.id}
              />
            </div>
          </div>

          <div className={`flex-1 min-w-0 transition-all duration-200 ease-out`}>
            <div className={`transition-opacity duration-150 ${filtering ? 'opacity-60' : 'opacity-100'}`}>
              {products.length > 0 ? (
                <>
                  <div className={`
                    transition-all duration-200 ease-out
                    ${viewMode === 'grid' 
                      ? showFilters 
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                        : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                      : 'space-y-4'
                    }
                  `}>
                    {products.map((product, index) => (
                      <div 
                        key={product.id}
                        className="animate-fadeInUp"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <ProductCard
                          product={product}
                          viewMode={viewMode}
                          imageStyle="contain"
                        />
                      </div>
                    ))}
                  </div>

                  {pagination.totalPages > 1 && (
                    <div className="mt-12 flex justify-center">
                      <div className="flex items-center space-x-2">
                      {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={page === pagination.page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const currentFilters = {
                              categories: [],
                              minPrice: parseInt(searchParams.get('minPrice') || '0'),
                              maxPrice: parseInt(searchParams.get('maxPrice') || '999999'), // Mainīts no 1000 uz 999999
                              inStock: searchParams.get('inStock') === 'true',
                              featured: searchParams.get('featured') === 'true',
                              page
                            }
                            handleFilterChange(currentFilters)
                          }}
                          className="transition-all duration-200"
                          disabled={filtering}
                        >
                          {page}
                        </Button>
                      ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nav atrasti produkti
                  </h3>
                  <p className="text-gray-600">
                    Šajā subkategorijā pagaidām nav produktu vai tie neatbilst filtru kritērijiem
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
