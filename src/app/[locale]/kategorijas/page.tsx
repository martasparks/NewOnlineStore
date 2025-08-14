'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import MainNavigation from '@/components/MainNavigation'
import { Loading } from '@/components/ui/Loading'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Grid3X3, 
  List,
  Package,
  ArrowRight,
  Tag,
  ChevronRight,
  TrendingUp,
  Eye
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  url: string
  meta_title?: string
  meta_description?: string
  order_index: number
  is_active: boolean
  productCount?: number
  subitems?: Subcategory[]
}

interface Subcategory {
  id: string
  name: string
  slug: string
  url: string
  icon?: string
  productCount?: number
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetchCategories()
  }, [])

const fetchCategories = async () => {
  try {
    const [categoriesRes, subcategoriesRes] = await Promise.all([
      fetch('/api/navigation/categories'),
      fetch('/api/navigation/subcategories')
    ])
    
    const [categoriesData, subcategoriesData] = await Promise.all([
      categoriesRes.json(),
      subcategoriesRes.json()
    ])

    // Apvienojam kategorijas ar apakškategorijām
    const enrichedCategories = categoriesData.map((cat: Category) => ({
      ...cat,
      subitems: subcategoriesData.filter((sub: { category_id: string }) => 
        sub.category_id === cat.id
      ),
      productCount: Math.floor(Math.random() * 50) + 5 // Placeholder - vēlāk no DB
    }))

    setCategories(enrichedCategories.filter((cat: Category) => cat.is_active))
  } catch (error) {
    console.error('Error fetching categories:', error)
  } finally {
    setLoading(false)
  }
}

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.meta_description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <MainNavigation />
        <Loading variant="spinner" text="Ielādē kategorijas..." className="py-20" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <MainNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gray-700 transition-colors">
            Sākums
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Kategorijas</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Produktu kategorijas
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Atrodiet tieši to, ko meklējat mūsu plašajā produktu kategoriju klāstā
          </p>
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Meklēt kategorijas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 py-3 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {filteredCategories.length} {filteredCategories.length === 1 ? 'kategorija' : 'kategorijas'}
              </span>
              
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-none border-0"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-none border-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Kopā kategorijas</p>
                <p className="text-3xl font-bold">{categories.length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Kopā produkti</p>
                <p className="text-3xl font-bold">
                  {categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Populārākā</p>
                <p className="text-lg font-bold">
                  {categories.sort((a, b) => (b.productCount || 0) - (a.productCount || 0))[0]?.name || '-'}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid/List */}
        {filteredCategories.length > 0 ? (
          <div className={`
            ${viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' 
              : 'space-y-6'
            }
          `}>
            {filteredCategories.map((category) => (
              <CategoryCard 
                key={category.id} 
                category={category} 
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nav atrastu kategoriju
            </h3>
            <p className="text-gray-600 mb-6">
              Mēģiniet mainīt meklēšanas kritērijus
            </p>
            <Button 
              onClick={() => setSearchTerm('')}
              variant="outline"
            >
              Notīrīt meklēšanu
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Category Card Component
interface CategoryCardProps {
  category: Category
  viewMode: 'grid' | 'list'
}

function CategoryCard({ category, viewMode }: CategoryCardProps) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
        {/* Galvenā kategorija - bez Link wrapper */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 flex-1">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
              {category.name.charAt(0)}
            </div>
            
            <div className="flex-1">
              <Link href={`/kategorijas/${category.slug}`}>
                <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                  {category.name}
                </h3>
              </Link>
              
              {/* Subkategorijas ar atsevišķiem linkiem */}
              {category.subitems && category.subitems.length > 0 && (
                <div className="space-y-2 mb-3">
                  {category.subitems.slice(0, 3).map((sub) => (
                    <Link key={sub.id} href={`/${category.slug}/${sub.slug}`}>
                      <div className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{sub.name}</span>
                      </div>
                    </Link>
                  ))}
                  {category.subitems.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{category.subitems.length - 3} vairāk
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Package className="w-4 h-4" />
                  <span>{category.productCount || 0} produkti</span>
                </div>
                {category.subitems && category.subitems.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Tag className="w-4 h-4" />
                    <span>{category.subitems.length} apakškategorijas</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Link href={`/kategorijas/${category.slug}`}>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              <ArrowRight className="w-4 h-4 mr-2" />
              Skatīt
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Galvenā kategorija header */}
      <Link href={`/kategorijas/${category.slug}`}>
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white relative overflow-hidden cursor-pointer">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="relative">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold mb-4">
              {category.name.charAt(0)}
            </div>
            <h3 className="text-xl font-bold mb-2">
              {category.name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-blue-100">
              <div className="flex items-center space-x-1">
                <Package className="w-4 h-4" />
                <span>{category.productCount || 0}</span>
              </div>
              {category.subitems && category.subitems.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Tag className="w-4 h-4" />
                  <span>{category.subitems.length}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Subkategorijas saturs */}
      <div className="p-6">
        {category.meta_description && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {category.meta_description}
          </p>
        )}

        {/* Subkategorijas ar atsevišķiem linkiem */}
        {category.subitems && category.subitems.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">
              Apakškategorijas:
            </h4>
            <div className="space-y-2">
              {category.subitems.slice(0, 3).map((sub) => (
                <Link key={sub.id} href={`/${category.slug}/${sub.slug}`}>
                  <div className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 cursor-pointer p-2 rounded hover:bg-blue-50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>{sub.name}</span>
                  </div>
                </Link>
              ))}
              {category.subitems.length > 3 && (
                <div className="text-sm text-gray-500">
                  +{category.subitems.length - 3} vairāk
                </div>
              )}
            </div>
          </div>
        )}

        {/* View galvenās kategorijas poga */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Link href={`/kategorijas/${category.slug}`}>
            <div className="flex items-center justify-between cursor-pointer hover:text-blue-600">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Eye className="w-4 h-4" />
                <span>Skatīt kategoriju</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}