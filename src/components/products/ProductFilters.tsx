'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  productCount?: number
}

interface ProductFiltersProps {
  onFilterChange: (filters: any) => void
}

export default function ProductFilters({ onFilterChange }: ProductFiltersProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [inStock, setInStock] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [showPrice, setShowPrice] = useState(true)
  const [showAvailability, setShowAvailability] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val))

  const visibleCategories = showAllCategories ? categories : categories.slice(0, 5)
  const hasMoreCategories = categories.length > 5

  const updateURLWithoutRefresh = useCallback((filters: Record<string, string | string[]>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    params.delete('categories')
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('inStock')
    params.delete('featured')
    params.delete('page')

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

  const commitPriceToURL = useCallback((range: number[]) => {
    const [minV, maxV] = range
    setIsUpdating(true)
    
    setTimeout(() => {
      updateURLWithoutRefresh({
        categories: selectedCategories,
        minPrice: clamp(Math.floor(minV), 0, 100000).toString(),
        maxPrice: clamp(Math.ceil(maxV), 0, 100000).toString(),
        inStock: inStock.toString(),
        featured: featured.toString()
      })
      setIsUpdating(false)
    }, 300) // Debounce price changes
  }, [selectedCategories, inStock, featured, updateURLWithoutRefresh])

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    loadFiltersFromURL()
  }, [searchParams])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/navigation/categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const loadFiltersFromURL = () => {
    const categories = searchParams.get('categories')?.split(',') || []
    const minPrice = parseInt(searchParams.get('minPrice') || '0')
    const maxPrice = parseInt(searchParams.get('maxPrice') || '1000')
    const stockFilter = searchParams.get('inStock') === 'true'
    const featuredFilter = searchParams.get('featured') === 'true'

    setSelectedCategories(categories)
    setPriceRange([minPrice, maxPrice])
    setInStock(stockFilter)
    setFeatured(featuredFilter)
  }

  const handleCategoryChange = (categorySlug: string, checked: boolean) => {
    const newCategories = checked 
      ? [...selectedCategories, categorySlug]
      : selectedCategories.filter(slug => slug !== categorySlug)
    
    setSelectedCategories(newCategories)
    setIsUpdating(true)
    
    setTimeout(() => {
      updateURLWithoutRefresh({
        categories: newCategories,
        minPrice: priceRange[0].toString(),
        maxPrice: priceRange[1].toString(),
        inStock: inStock.toString(),
        featured: featured.toString()
      })
      setIsUpdating(false)
    }, 100)
  }

  const handlePriceChange = (newRange: number[]) => {
    setPriceRange(newRange)
  }

  const handlePriceCommit = (finalRange: number[]) => {
    setPriceRange(finalRange)
    commitPriceToURL(finalRange)
  }

  const handleCheckboxChange = (type: 'inStock' | 'featured', checked: boolean) => {
    if (type === 'inStock') {
      setInStock(checked)
    } else {
      setFeatured(checked)
    }
    
    setIsUpdating(true)
    
    setTimeout(() => {
      updateURLWithoutRefresh({
        categories: selectedCategories,
        minPrice: priceRange[0].toString(),
        maxPrice: priceRange[1].toString(),
        inStock: type === 'inStock' ? checked.toString() : inStock.toString(),
        featured: type === 'featured' ? checked.toString() : featured.toString()
      })
      setIsUpdating(false)
    }, 100)
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, 1000])
    setInStock(false)
    setFeatured(false)
    setIsUpdating(true)
    
    setTimeout(() => {
      window.history.replaceState(null, '', pathname)
      onFilterChange({
        categories: [],
        minPrice: 0,
        maxPrice: 1000,
        inStock: false,
        featured: false,
        page: 1
      })
      setIsUpdating(false)
    }, 100)
  }

  const hasActiveFilters = selectedCategories.length > 0 || 
    priceRange[0] > 0 || 
    priceRange[1] < 1000 || 
    inStock || 
    featured

  const activeFiltersCount = 
    selectedCategories.length + 
    (priceRange[0] > 0 || priceRange[1] < 1000 ? 1 : 0) +
    (inStock ? 1 : 0) + 
    (featured ? 1 : 0)

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-opacity duration-200 ${isUpdating ? 'opacity-75' : 'opacity-100'}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="w-6 h-6 mr-3 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">
              Filtri
            </h3>
            {activeFiltersCount > 0 && (
              <span className="ml-5 bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400 transition-all duration-200"
              disabled={isUpdating}
            >
              <X className="w-4 h-4" />
                Notīrīt
            </Button>
          )}
        </div>
      </div>

      {/* Filters Content */}
      <div className="p-6 space-y-8">
        {/* Kategorijas */}
        <div>
          <Label className="text-lg font-semibold text-gray-900 mb-4 block">
            Kategorijas
            {selectedCategories.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium transition-all duration-200">
                {selectedCategories.length}
              </span>
            )}
          </Label>
          
          <div className="space-y-3">
            {visibleCategories.map((category) => (
              <div key={category.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-all duration-200">
                <Checkbox
                  id={`category-${category.slug}`}  // mainīts uz slug
                  checked={selectedCategories.includes(category.slug)}  // pārbauda slug
                  onCheckedChange={(checked) => 
                    handleCategoryChange(category.slug, checked as boolean)  // sūta slug
                  }
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 transition-all duration-200"
                  disabled={isUpdating}
                />
                <Label 
                  htmlFor={`category-${category.slug}`}  // mainīts uz slug
                  className="text-sm text-gray-700 cursor-pointer flex-1 font-medium"
                >
                  {category.name}
                  {category.productCount !== undefined && (
                    <span className="text-gray-400 font-normal">({category.productCount})</span>
                  )}
                </Label>
              </div>
            ))}
            
            {hasMoreCategories && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center mt-3 transition-all duration-200 hover:bg-blue-50 px-2 py-1 rounded"
              >
                {showAllCategories ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Rādīt mazāk
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Rādīt vairāk ({categories.length - 5})
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Cenu diapazons */}
        <div>
          <button
            onClick={() => setShowPrice(!showPrice)}
            className="flex items-center justify-between w-full mb-4 text-left hover:bg-gray-50 p-2 rounded transition-colors duration-200"
          >
            <Label className="text-md font-semibold text-gray-900 cursor-pointer">
              Cenu diapazons
              {(priceRange[0] > 0 || priceRange[1] < 1000) && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                  €{priceRange[0]}-€{priceRange[1]}
                </span>
              )}
            </Label>
            <div className="transition-transform duration-200" style={{ transform: showPrice ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </div>
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ${showPrice ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-6">
              <div className="px-2 py-4">
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceChange}
                  onValueCommit={handlePriceCommit}
                  min={0}
                  max={1000}
                  step={10}
                  className="w-full"
                  color="#2563eb"
                  disabled={isUpdating}
                />
                <div className="flex justify-between mt-3 text-xs text-gray-500">
                  <span>€0</span>
                  <span>€1000</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">No</Label>
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => {
                      const v = parseInt(e.target.value || '0', 10)
                      setPriceRange([clamp(v, 0, priceRange[1]), priceRange[1]])
                    }}
                    onBlur={() => handlePriceCommit(priceRange)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handlePriceCommit(priceRange) }}
                    className="text-sm transition-all duration-200"
                    min={0}
                    max={priceRange[1]}
                    placeholder="0"
                    disabled={isUpdating}
                  />
                </div>
                <div className="flex items-center justify-center pt-6">
                  <span className="text-gray-400 font-medium">—</span>
                </div>
                <div className="flex-1">
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">Līdz</Label>
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => {
                      const v = parseInt(e.target.value || '1000', 10)
                      setPriceRange([priceRange[0], clamp(v, priceRange[0], 1000)])
                    }}
                    onBlur={() => handlePriceCommit(priceRange)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handlePriceCommit(priceRange) }}
                    className="text-sm transition-all duration-200"
                    min={priceRange[0]}
                    max={1000}
                    placeholder="1000"
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pieejamība */}
        <div>
          <button
            onClick={() => setShowAvailability(!showAvailability)}
            className="flex items-center justify-between w-full mb-4 text-left hover:bg-gray-50 p-2 rounded transition-colors duration-200"
          >
            <Label className="text-lg font-semibold text-gray-900 cursor-pointer">
              Pieejamība un īpašības
              {(inStock || featured) && (
                <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                  {(inStock ? 1 : 0) + (featured ? 1 : 0)}
                </span>
              )}
            </Label>
            <div className="transition-transform duration-200" style={{ transform: showAvailability ? 'rotate(180deg)' : 'rotate(0deg)' }}>
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </div>
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ${showAvailability ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200">
                <Checkbox
                  id="in-stock"
                  checked={inStock}
                  onCheckedChange={(checked) => handleCheckboxChange('inStock', checked as boolean)}
                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 transition-all duration-200"
                  disabled={isUpdating}
                />
                <Label htmlFor="in-stock" className="text-sm text-gray-700 cursor-pointer font-medium flex-1">
                  Tikai pieejamie produkti
                  <span className="block text-xs text-gray-500 mt-1">Rādīt tikai tos produktus, kas ir noliktavā</span>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200">
                <Checkbox
                  id="featured"
                  checked={featured}
                  onCheckedChange={(checked) => handleCheckboxChange('featured', checked as boolean)}
                  className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600 transition-all duration-200"
                  disabled={isUpdating}
                />
                <Label htmlFor="featured" className="text-sm text-gray-700 cursor-pointer font-medium flex-1">
                  Populārie produkti
                  <span className="block text-xs text-gray-500 mt-1">Mūsu ieteicamie un populārākie produkti</span>
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
