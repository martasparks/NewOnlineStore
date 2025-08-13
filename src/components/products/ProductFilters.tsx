'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { useDebounce } from '@hooks/useDebounce'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { 
  X, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  productCount?: number
}

interface FilterState {
  categories: string[]
  minPrice: number
  maxPrice: number
  inStock: boolean
  featured: boolean
  page: number
}

interface ProductFiltersProps {
  onFilterChange: (filters: FilterState) => void
  isLoading?: boolean
}

export default function ProductFilters({ onFilterChange, isLoading = false }: ProductFiltersProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // State management
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [inStock, setInStock] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [showPrice, setShowPrice] = useState(true)
  const [showAvailability, setShowAvailability] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  // Debounced price range pentru a evita multiple requests
  const debouncedPriceRange = useDebounce(priceRange, 500)

  // Computed values
  const visibleCategories = useMemo(() => 
    showAllCategories ? categories : categories.slice(0, 5),
    [categories, showAllCategories]
  )
  
  const hasMoreCategories = categories.length > 5
  
  const activeFiltersCount = useMemo(() => 
    selectedCategories.length + 
    (priceRange[0] > 0 ? 1 : 0) + 
    (priceRange[1] < 1000 ? 1 : 0) +
    (inStock ? 1 : 0) + 
    (featured ? 1 : 0),
    [selectedCategories.length, priceRange, inStock, featured]
  )

  const hasActiveFilters = activeFiltersCount > 0

  const updateURLWithoutRefresh = useCallback((filters: Record<string, string | string[]>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    const filterKeys = ['categories', 'minPrice', 'maxPrice', 'inStock', 'featured', 'page']
    filterKeys.forEach(key => params.delete(key))

    Object.entries(filters).forEach(([key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : value !== '0')) {
        params.set(key, Array.isArray(value) ? value.join(',') : value.toString())
      }
    })

    const currentSort = searchParams.get('sort')
    if (currentSort) {
      params.set('sort', currentSort)
    }

    const newUrl = `${pathname}?${params.toString()}`
    window.history.replaceState(null, '', newUrl)
    
    onFilterChange({
      categories: Array.isArray(filters.categories) ? filters.categories : 
                 (filters.categories ? [filters.categories] : []),
      minPrice: parseInt(filters.minPrice as string) || 0,
      maxPrice: parseInt(filters.maxPrice as string) || 1000,
      inStock: filters.inStock === 'true',
      featured: filters.featured === 'true',
      page: 1
    })
  }, [searchParams, pathname, onFilterChange])

  // Price range commitment with debouncing
  const commitPriceToURL = useCallback((range: number[]) => {
    const [minV, maxV] = range
    setIsUpdating(true)
    
    updateURLWithoutRefresh({
      categories: selectedCategories,
      minPrice: Math.max(0, Math.floor(minV)).toString(),
      maxPrice: Math.min(10000, Math.ceil(maxV)).toString(),
      inStock: inStock.toString(),
      featured: featured.toString()
    })
    
    setTimeout(() => setIsUpdating(false), 200)
  }, [selectedCategories, inStock, featured, updateURLWithoutRefresh])

  // Effects
  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    loadFiltersFromURL()
  }, [searchParams, loadFiltersFromURL])

  // Debounced price update
  useEffect(() => {
    if (debouncedPriceRange[0] !== 0 || debouncedPriceRange[1] !== 1000) {
      commitPriceToURL(debouncedPriceRange)
    }
  }, [debouncedPriceRange, commitPriceToURL])

  // Category fetching with error handling
  const fetchCategories = async () => {
    setCategoriesLoading(true)
    setCategoriesError(null)
    
    try {
      const response = await fetch('/api/navigation/categories')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategoriesError(error instanceof Error ? error.message : 'Neizdevās ielādēt kategorijas')
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Load filters from URL
  const loadFiltersFromURL = useCallback(() => {
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
    const minPrice = Math.max(0, parseInt(searchParams.get('minPrice') || '0'))
    const maxPrice = Math.min(10000, parseInt(searchParams.get('maxPrice') || '1000'))
    const stockFilter = searchParams.get('inStock') === 'true'
    const featuredFilter = searchParams.get('featured') === 'true'

    setSelectedCategories(categories)
    setPriceRange([minPrice, maxPrice])
    setInStock(stockFilter)
    setFeatured(featuredFilter)
  }, [searchParams])

  // Category change handler
  const handleCategoryChange = (categorySlug: string, checked: boolean) => {
    const newCategories = checked 
      ? [...selectedCategories, categorySlug]
      : selectedCategories.filter(slug => slug !== categorySlug)
    
    setSelectedCategories(newCategories)
    
    updateURLWithoutRefresh({
      categories: newCategories,
      minPrice: priceRange[0].toString(),
      maxPrice: priceRange[1].toString(),
      inStock: inStock.toString(),
      featured: featured.toString()
    })
  }

  // Stock filter handler
  const handleStockChange = (checked: boolean) => {
    setInStock(checked)
    
    updateURLWithoutRefresh({
      categories: selectedCategories,
      minPrice: priceRange[0].toString(),
      maxPrice: priceRange[1].toString(),
      inStock: checked.toString(),
      featured: featured.toString()
    })
  }

  // Featured filter handler
  const handleFeaturedChange = (checked: boolean) => {
    setFeatured(checked)
    
    updateURLWithoutRefresh({
      categories: selectedCategories,
      minPrice: priceRange[0].toString(),
      maxPrice: priceRange[1].toString(),
      inStock: inStock.toString(),
      featured: checked.toString()
    })
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, 1000])
    setInStock(false)
    setFeatured(false)
    
    // PILNĪGS URL clear:
    const newUrl = pathname
    window.history.replaceState(null, '', newUrl)
    
    onFilterChange({
      categories: [],
      minPrice: 0,
      maxPrice: 1000,
      inStock: false,
      featured: false,
      page: 1
    })
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-200 ${
      isUpdating || isLoading ? 'opacity-75 pointer-events-none' : 'opacity-100'
    }`}>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="w-6 h-6 mr-3 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Filtri</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-3 bg-blue-600">
                {activeFiltersCount}
              </Badge>
            )}
            {(isUpdating || isLoading) && (
              <Loader2 className="w-4 h-4 ml-3 animate-spin text-blue-600" />
            )}
          </div>
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              disabled={isUpdating || isLoading}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
            >
              <X className="w-4 h-4 mr-1" />
              Notīrīt
            </Button>
          )}
        </div>
      </div>

      {/* Filters Content */}
      <div className="p-6 space-y-8">
        
        {/* Kategorijas */}
        <div>
          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="flex items-center justify-between w-full mb-4 p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Label className="text-lg font-semibold text-gray-900 cursor-pointer">
              Kategorijas
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCategories.length}
                </Badge>
              )}
            </Label>
            {hasMoreCategories && (
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
                showAllCategories ? 'rotate-180' : ''
              }`} />
            )}
          </button>
          
          {/* Categories Loading State */}
          {categoriesLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Ielādē kategorijas...</span>
            </div>
          )}

          {/* Categories Error State */}
          {categoriesError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Kļūda ielādējot kategorijas</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{categoriesError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCategories}
                className="mt-2 text-red-700 border-red-300 hover:bg-red-50"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Mēģināt vēlreiz
              </Button>
            </div>
          )}

          {/* Categories List */}
          {!categoriesLoading && !categoriesError && (
            <div className="space-y-3">
              {visibleCategories.map((category) => (
                <div key={category.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <Checkbox
                    id={`category-${category.slug}`}
                    checked={selectedCategories.includes(category.slug)}
                    onCheckedChange={(checked) => 
                      handleCategoryChange(category.slug, checked as boolean)
                    }
                    disabled={isUpdating || isLoading}
                  />
                  <Label 
                    htmlFor={`category-${category.slug}`}
                    className="flex-1 cursor-pointer font-medium text-gray-700 hover:text-gray-900"
                  >
                    {category.name}
                    {category.productCount !== undefined && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({category.productCount})
                      </span>
                    )}
                  </Label>
                </div>
              ))}
              
              {hasMoreCategories && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="w-full mt-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  {showAllCategories ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Rādīt mazāk
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      Rādīt visas ({categories.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Cenas diapazons */}
        <div>
          <button
            onClick={() => setShowPrice(!showPrice)}
            className="flex items-center justify-between w-full mb-4 p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Label className="text-lg font-semibold text-gray-900 cursor-pointer">
              Cena
              {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                <Badge variant="secondary" className="ml-2">
                  €{priceRange[0]} - €{priceRange[1]}
                </Badge>
              )}
            </Label>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
              showPrice ? 'rotate-180' : ''
            }`} />
          </button>
          
          {showPrice && (
            <div className="space-y-4">
              <div className="px-4">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={1000}
                  min={0}
                  step={10}
                  className="w-full"
                  disabled={isUpdating || isLoading}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">No (EUR)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    value={priceRange[0]}
                    onChange={(e) => {
                      const value = Math.max(0, parseInt(e.target.value) || 0)
                      setPriceRange([value, priceRange[1]])
                    }}
                    className="text-sm"
                    disabled={isUpdating || isLoading}
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-1 block">Līdz (EUR)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    value={priceRange[1]}
                    onChange={(e) => {
                      const value = Math.min(1000, parseInt(e.target.value) || 1000)
                      setPriceRange([priceRange[0], value])
                    }}
                    className="text-sm"
                    disabled={isUpdating || isLoading}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pieejamība */}
        <div>
          <button
            onClick={() => setShowAvailability(!showAvailability)}
            className="flex items-center justify-between w-full mb-4 p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Label className="text-lg font-semibold text-gray-900 cursor-pointer">
              Pieejamība
              {(inStock || featured) && (
                <Badge variant="secondary" className="ml-2">
                  {[inStock && 'Pieejams', featured && 'Populārs'].filter(Boolean).join(', ')}
                </Badge>
              )}
            </Label>
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${
              showAvailability ? 'rotate-180' : ''
            }`} />
          </button>
          
          {showAvailability && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  id="inStock"
                  checked={inStock}
                  onCheckedChange={handleStockChange}
                  disabled={isUpdating || isLoading}
                />
                <Label htmlFor="inStock" className="cursor-pointer font-medium text-gray-700">
                  Tikai pieejamie produkti
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Checkbox
                  id="featured"
                  checked={featured}
                  onCheckedChange={handleFeaturedChange}
                  disabled={isUpdating || isLoading}
                />
                <Label htmlFor="featured" className="cursor-pointer font-medium text-gray-700">
                  Populārie produkti
                </Label>
              </div>
            </div>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Aktīvie filtri:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Notīrīt visus
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedCategories.map(slug => {
                const category = categories.find(c => c.slug === slug)
                return category ? (
                  <Badge
                    key={slug}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-red-50 hover:border-red-300"
                    onClick={() => handleCategoryChange(slug, false)}
                  >
                    {category.name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ) : null
              })}
              
              {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-red-50 hover:border-red-300"
                  onClick={() => setPriceRange([0, 1000])}
                >
                  €{priceRange[0]} - €{priceRange[1]}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              
              {inStock && (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-red-50 hover:border-red-300"
                  onClick={() => handleStockChange(false)}
                >
                  Pieejams
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              
              {featured && (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-red-50 hover:border-red-300"
                  onClick={() => handleFeaturedChange(false)}
                >
                  Populārs
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}