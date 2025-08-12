'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Header from '@/components/Header'
import MainNavigation from '@/components/MainNavigation'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'
import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/button'
import { Grid, List, Filter, X, Loader2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  price: number
  sale_price?: number
  images: string[]
  stock_quantity?: number
  manage_stock?: boolean
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

export default function ProductsPage() {
  const t = useTranslations('Produkti')
  const searchParams = useSearchParams()
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
  useEffect(() => {
    const urlSort = searchParams.get('sort') || 'name'
    setSortBy(urlSort)
  }, [searchParams])

const fetchProducts = useCallback(async (filters?: FilterState, sort?: string) => {
  const isFiltering = !!filters
  
  if (isFiltering) {
    setFiltering(true)
  } else {
    setLoading(true)
  }

  try {
    const params = new URLSearchParams()
    
    if (filters) {
      if (filters.categories && filters.categories.length > 0) {
        params.set('categories', filters.categories.join(','))
      }
      if (filters.minPrice > 0) {
        params.set('minPrice', filters.minPrice.toString())
      }
      if (filters.maxPrice < 1000) {
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
      if (sort && sort !== 'name') {
        params.set('sort', sort)
      }
      if (params.toString()) {
        const newUrl = `${window.location.pathname}?${params.toString()}`
        window.history.replaceState(null, '', newUrl)
      } else {
        window.history.replaceState(null, '', window.location.pathname)
      }     
    } else {
      const page = searchParams.get('page') || '1'
      const category = searchParams.get('category')
      const search = searchParams.get('search')
      const categories = searchParams.get('categories')
      const minPrice = searchParams.get('minPrice')
      const maxPrice = searchParams.get('maxPrice')
      const inStock = searchParams.get('inStock')
      const featured = searchParams.get('featured')
      const urlSort = searchParams.get('sort') || 'name'
      
      params.set('page', page)
      params.set('limit', '12')
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      if (categories) params.set('categories', categories)
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      if (inStock) params.set('inStock', inStock)
      if (featured) params.set('featured', featured)
      params.set('sort', urlSort)
    }

    const response = await fetch(`/api/products?${params}`)
    const data = await response.json()

    if (response.ok) {
      if (isFiltering) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      setProducts(data.products)
      setPagination(data.pagination)
    }
  } catch (error) {
    console.error('Error fetching products:', error)
  } finally {
    setLoading(false)
    setFiltering(false)
  }
}, [searchParams, sortBy])



  // Handle filter changes without page refresh
  const handleFilterChange = useCallback((filters: FilterState) => {
    fetchProducts(filters, sortBy)
  }, [fetchProducts, sortBy])

  useEffect(() => {
    fetchProducts()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <MainNavigation />
        <Loading variant="spinner" text="Ielādē produktus..." className="py-20" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <MainNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('products.title')}
          </h1>
          
          {/* Filters & Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={`transition-all duration-150 ease-out ${showFilters ? "bg-blue-600 hover:bg-blue-700" : ""}`}
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Slēpt filtrus' : 'Rādīt filtrus'}
                <div className={`transition-transform duration-150 ease-out ${showFilters ? 'rotate-0' : 'rotate-0'}`}>
                  {showFilters ? <X className="w-4 h-4 ml-2" /> : null}
                </div>
              </Button>
              
              <select 
                value={sortBy}
                onChange={(e) => {
                  const newSort = e.target.value
                  setSortBy(newSort)
                  
                  const currentFilters = {
                    categories: searchParams.get('categories')?.split(',') || [],
                    minPrice: parseInt(searchParams.get('minPrice') || '0'),
                    maxPrice: parseInt(searchParams.get('maxPrice') || '1000'),
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

              {/* Filtering indicator */}
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
          {/* Filters Sidebar */}
          <div className={`transition-all duration-200 ease-out ${showFilters ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
            <div className={`w-80 transition-transform duration-200 ease-out ${showFilters ? 'translate-x-0' : '-translate-x-full'}`}>
              <ProductFilters onFilterChange={handleFilterChange} />
            </div>
          </div>

          {/* Products Grid */}
          <div className={`flex-1 min-w-0 transition-all duration-200 ease-out ${showFilters ? 'ml-0' : 'ml-0'}`}>
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

                  {/* Pagination */}
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
                                categories: searchParams.get('categories')?.split(',') || [],
                                minPrice: parseInt(searchParams.get('minPrice') || '0'),
                                maxPrice: parseInt(searchParams.get('maxPrice') || '1000'),
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
                    Mēģiniet mainīt filtrus vai meklēšanas kritērijus
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
