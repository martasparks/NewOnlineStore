'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Header from '@/components/Header'
import MainNavigation from '@/components/MainNavigation'
import ProductCard from '@/components/products/ProductCard'
import ProductFilters from '@/components/products/ProductFilters'
import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/button'
import { Grid, List, Filter } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  price: number
  sale_price?: number
  images: string[]
  navigation_categories?: {
    name: string
    slug: string
  }
}

export default function ProductsPage() {
  const t = useTranslations('Produkti')
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      
      // Iegūstam filtrus no URL
      const page = searchParams.get('page') || '1'
      const category = searchParams.get('category')
      const search = searchParams.get('search')
      const sort = searchParams.get('sort') || 'name'
      
      params.set('page', page)
      params.set('limit', '12')
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      params.set('sort', sort)

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      if (response.ok) {
        setProducts(data.products)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

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
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtri
              </Button>
              
              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="name">Pēc nosaukuma</option>
                <option value="price">Pēc cenas</option>
                <option value="created_at">Pēc datuma</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 flex-shrink-0">
              <ProductFilters onFilterChange={fetchProducts} />
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {products.length > 0 ? (
              <>
                <div className={`
                  ${viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
                    : 'space-y-4'
                  }
                `}>
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-12 flex justify-center">
                    <div className="flex items-center space-x-2">
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={page === pagination.page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => {
                            const params = new URLSearchParams(searchParams)
                            params.set('page', page.toString())
                            window.history.pushState(null, '', `?${params}`)
                            fetchProducts()
                          }}
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
  )
}