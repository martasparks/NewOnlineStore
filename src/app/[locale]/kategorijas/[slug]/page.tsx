'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Header from '@/components/Header'
import MainNavigation from '@/components/MainNavigation'
import ProductCard from '@/components/products/ProductCard'
import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/button'
import { ChevronRight, Grid, List, Package } from 'lucide-react'
import Link from 'next/link'
import { ProductPlaceholder } from '@/components/ui/ProductPlaceholder'

interface Category {
  id: string
  name: string
  slug: string
  meta_title?: string
  meta_description?: string
}

interface Product {
  id: string
  name: string
  slug: string
  short_description: string
  price: number
  sale_price?: number
  images: string[]
}

export default function CategoryPage() {
  const t = useTranslations('Kategorijas')
  const params = useParams()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        // Fetch category info
        const categoryRes = await fetch(`/api/navigation/categories`)
        const categories = await categoryRes.json()
        const foundCategory = categories.find((cat: Category) => cat.slug === params.slug)
        
        if (!foundCategory) {
          notFound()
        }
        
        setCategory(foundCategory)

        // Fetch products for this category
        const productsRes = await fetch(`/api/products?category=${foundCategory.id}&sort=${sortBy}`)
        const productsData = await productsRes.json()
        setProducts(productsData.products || [])
        
      } catch (error) {
        console.error('Error fetching category data:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchCategoryData()
    }
  }, [params.slug, sortBy])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <MainNavigation />
        <Loading variant="spinner" text="Ielādē kategoriju..." className="py-20" />
      </div>
    )
  }

  if (!category) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <MainNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-gray-700 transition-colors">{t('cat.page.breadcrumb1')}</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/kategorijas" className="hover:text-gray-700 transition-colors">{t('cat.page.breadcrumb2')}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{category.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {category.name}
          </h1>
            {category.meta_description && (
           <p className="text-lg text-gray-600 max-w-2xl">
             {category.meta_description}
           </p>
         )}
       </div>

       {/* Controls */}
       <div className="flex items-center justify-between mb-6 bg-white rounded-lg p-4 shadow-sm">
         <div className="flex items-center space-x-4">
           <span className="text-sm text-gray-600">
             {products.length} {products.length === 1 ? 'produkts' : 'produkti'}
           </span>
           
           <select 
             value={sortBy} 
             onChange={(e) => setSortBy(e.target.value)}
             className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
           >
             <option value="name">Pēc nosaukuma</option>
             <option value="price">Pēc cenas (augošā)</option>
             <option value="price_desc">Pēc cenas (dilstošā)</option>
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

       {/* Products Grid */}
       {products.length > 0 ? (
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
       ) : (
        <div className="text-center py-12">
          <div className="w-32 h-32 mx-auto mb-4">
            <ProductPlaceholder className="w-full h-full" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Nav produktu šajā kategorijā
          </h3>
          <p className="text-gray-600 mb-6">
            Produkti tiks pievienoti drīzumā
          </p>
          <a href="/produkti">
            <Button>Skatīt visus produktus</Button>
          </a>
        </div>
       )}
     </div>
   </div>
 )
}