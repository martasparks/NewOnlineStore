'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  RefreshCw,
  Search
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
  hideCategories?: boolean
  subcategoryId?: string // Jauns prop subcategory kontekstam
}

export default function ProductFilters({ 
  onFilterChange, 
  isLoading = false, 
  hideCategories = false,
  subcategoryId
}: ProductFiltersProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  
  const [dynamicPriceRange, setDynamicPriceRange] = useState({ min: 0, max: 1000 })
  const [priceRangeLoading, setPriceRangeLoading] = useState(true)
  
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [inStock, setInStock] = useState(false)
  const [featured, setFeatured] = useState(false)
  
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [showPrice, setShowPrice] = useState(true)
  const [showAvailability, setShowAvailability] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  
  const [minPriceInput, setMinPriceInput] = useState('')
  const [maxPriceInput, setMaxPriceInput] = useState('')
  const minInputRef = useRef<HTMLInputElement>(null)
  const maxInputRef = useRef<HTMLInputElement>(null)
  const [isTypingPrice, setIsTypingPrice] = useState(false)

  const debouncedPriceRange = useDebounce(priceRange, 500)

  const visibleCategories = useMemo(() => 
    showAllCategories ? categories : categories.slice(0, 5),
    [categories, showAllCategories]
  )
  
  const hasMoreCategories = categories.length > 5
  
  const activeFiltersCount = useMemo(() => {
    const hasMinPriceFilter = priceRange[0] > dynamicPriceRange.min
    const hasMaxPriceFilter = priceRange[1] < dynamicPriceRange.max
    const hasPriceFilter = hasMinPriceFilter || hasMaxPriceFilter
    
    return selectedCategories.length + 
      (hasPriceFilter ? 1 : 0) +
      (inStock ? 1 : 0) + 
      (featured ? 1 : 0)
  }, [selectedCategories.length, priceRange, dynamicPriceRange, inStock, featured])

  const hasActiveFilters = activeFiltersCount > 0

  const fetchPriceRange = useCallback(async () => {
    setPriceRangeLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('priceRangeOnly', 'true')
      
      if (subcategoryId) {
        params.set('subcategory', subcategoryId)
      }
      
      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      
      const newRange = {
        min: Math.floor(data.minPrice || 0),
        max: Math.ceil(data.maxPrice || 1000)
      }
      
      setDynamicPriceRange(newRange)

      if (!searchParams.has('minPrice') && !searchParams.has('maxPrice')) {
        setPriceRange([newRange.min, newRange.max])
        setMinPriceInput(newRange.min.toString())
        setMaxPriceInput(newRange.max.toString())
      }
      
    } catch (error) {
      console.error('Error fetching price range:', error)
    } finally {
      setPriceRangeLoading(false)
    }
  }, [subcategoryId, searchParams])

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
      minPrice: parseInt(filters.minPrice as string) || dynamicPriceRange.min,
      maxPrice: parseInt(filters.maxPrice as string) || dynamicPriceRange.max,
      inStock: filters.inStock === 'true',
      featured: filters.featured === 'true',
      page: 1
    })
  }, [searchParams, pathname, onFilterChange, dynamicPriceRange])

  const commitPriceToURL = useCallback((range: number[]) => {
    if (isTypingPrice || priceRangeLoading) return
    
    const [minV, maxV] = range
    
    // Pārbaudām vai cenas ir mainījušās no default vērtībām
    if (minV === dynamicPriceRange.min && maxV === dynamicPriceRange.max) {
      return
    }
    
    // Pārbaudām vai dynamic range vispār ir ielādēts
    if (dynamicPriceRange.min === 0 && dynamicPriceRange.max === 1000) {
      return // Vēl nav ielādēts reālais diapazons
    }
    
    setIsUpdating(true)
    
    updateURLWithoutRefresh({
      categories: selectedCategories,
      minPrice: Math.max(dynamicPriceRange.min, Math.floor(minV)).toString(),
      maxPrice: Math.min(dynamicPriceRange.max, Math.ceil(maxV)).toString(),
      inStock: inStock.toString(),
      featured: featured.toString()
    })
    
    setTimeout(() => setIsUpdating(false), 200)
  }, [selectedCategories, inStock, featured, updateURLWithoutRefresh, dynamicPriceRange, isTypingPrice, priceRangeLoading])

  // Input handleri ar manuālu commit
  const handleMinPriceInputChange = (value: string) => {
    setMinPriceInput(value)
    setIsTypingPrice(true)
  }

  const handleMaxPriceInputChange = (value: string) => {
    setMaxPriceInput(value)
    setIsTypingPrice(true)
  }

  const handleMinPriceInputBlur = () => {
    setIsTypingPrice(false)
    const numValue = parseInt(minPriceInput) || dynamicPriceRange.min
    const newMin = Math.max(dynamicPriceRange.min, Math.min(numValue, priceRange[1] - 1))
    setPriceRange([newMin, priceRange[1]])
    setMinPriceInput(newMin.toString())
    
    // Commit uzreiz
    setTimeout(() => {
      commitPriceToURL([newMin, priceRange[1]])
    }, 100)
  }

  const handleMaxPriceInputBlur = () => {
    setIsTypingPrice(false)
    const numValue = parseInt(maxPriceInput) || dynamicPriceRange.max
    const newMax = Math.min(dynamicPriceRange.max, Math.max(numValue, priceRange[0] + 1))
    setPriceRange([priceRange[0], newMax])
    setMaxPriceInput(newMax.toString())
    
    // Commit uzreiz
    setTimeout(() => {
      commitPriceToURL([priceRange[0], newMax])
    }, 100)
  }

  const handleMinPriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      minInputRef.current?.blur()
    }
  }

  const handleMaxPriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      maxInputRef.current?.blur()
    }
  }

  // Fetch kategorijas
  const fetchCategories = useCallback(async () => {
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
  }, [])

  const loadFiltersFromURL = useCallback(() => {
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || []
    
    const hasMinPrice = searchParams.has('minPrice')
    const hasMaxPrice = searchParams.has('maxPrice')
    const hasInStock = searchParams.has('inStock')
    const hasFeatured = searchParams.has('featured')
    
    const minPrice = hasMinPrice 
      ? Math.max(dynamicPriceRange.min, parseInt(searchParams.get('minPrice') || dynamicPriceRange.min.toString()))
      : dynamicPriceRange.min
      
    const maxPrice = hasMaxPrice
      ? Math.min(dynamicPriceRange.max, parseInt(searchParams.get('maxPrice') || dynamicPriceRange.max.toString()))
      : dynamicPriceRange.max

    const stockFilter = hasInStock && searchParams.get('inStock') === 'true'
    const featuredFilter = hasFeatured && searchParams.get('featured') === 'true'

    setSelectedCategories(categories)
    setPriceRange([minPrice, maxPrice])
    setMinPriceInput(minPrice.toString())
    setMaxPriceInput(maxPrice.toString())
    setInStock(stockFilter)
    setFeatured(featuredFilter)
  }, [searchParams, dynamicPriceRange])

  useEffect(() => {
    fetchPriceRange()
  }, [fetchPriceRange])

  useEffect(() => {
    if (!hideCategories) {
      fetchCategories()
    }
  }, [fetchCategories, hideCategories])

  useEffect(() => {
    if (!priceRangeLoading && dynamicPriceRange.min !== 0 && dynamicPriceRange.max !== 1000) {
      loadFiltersFromURL()
    }
  }, [loadFiltersFromURL, priceRangeLoading, dynamicPriceRange])

useEffect(() => {
  if (
    !isTypingPrice && 
    !priceRangeLoading &&
    dynamicPriceRange.min !== 0 && 
    dynamicPriceRange.max !== 1000 &&
    (debouncedPriceRange[0] !== dynamicPriceRange.min || debouncedPriceRange[1] !== dynamicPriceRange.max)
  ) {
    commitPriceToURL(debouncedPriceRange)
  }
}, [debouncedPriceRange, commitPriceToURL, dynamicPriceRange, isTypingPrice, priceRangeLoading])

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
    setPriceRange([dynamicPriceRange.min, dynamicPriceRange.max])
    setMinPriceInput(dynamicPriceRange.min.toString())
    setMaxPriceInput(dynamicPriceRange.max.toString())
    setInStock(false)
    setFeatured(false)
    setIsTypingPrice(false)

    const newUrl = pathname
    window.history.replaceState(null, '', newUrl)
    
    onFilterChange({
      categories: [],
      minPrice: dynamicPriceRange.min,
      maxPrice: dynamicPriceRange.max,
      inStock: false,
      featured: false,
      page: 1
    })
  }

    const resetToDefaults = useCallback(() => {
      if (dynamicPriceRange.min !== 0 || dynamicPriceRange.max !== 1000) {
        setPriceRange([dynamicPriceRange.min, dynamicPriceRange.max])
        setMinPriceInput(dynamicPriceRange.min.toString())
        setMaxPriceInput(dynamicPriceRange.max.toString())
      }
    }, [dynamicPriceRange])

    // Pievienojiet šo useEffect pēc fetchPriceRange useEffect:
    useEffect(() => {
      if (!priceRangeLoading && dynamicPriceRange.min !== 0 && dynamicPriceRange.max !== 1000) {
        // Ja nav URL parametru, iestatām default vērtības
        if (!searchParams.has('minPrice') && !searchParams.has('maxPrice')) {
          resetToDefaults()
        }
      }
    }, [priceRangeLoading, dynamicPriceRange, searchParams, resetToDefaults])

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-200 ${
      isUpdating || isLoading ? 'opacity-75 pointer-events-none' : 'opacity-100'
    }`}>
      
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

      <div className="p-6 space-y-8">
        
        {!hideCategories && (
          <div>
          </div>
        )}

        <div>
          <button
            onClick={() => setShowPrice(!showPrice)}
            className="flex items-center justify-between w-full mb-4 p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Label className="text-lg font-semibold text-gray-900 cursor-pointer">
              Cena
              {(priceRange[0] > dynamicPriceRange.min || priceRange[1] < dynamicPriceRange.max) && (
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
              {priceRangeLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500">Ielādē cenu diapazonu...</span>
                </div>
              ) : (
                <>
                  <div className="px-4">
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={dynamicPriceRange.max}
                      min={dynamicPriceRange.min}
                      step={1}
                      className="w-full"
                      disabled={isUpdating || isLoading}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>€{dynamicPriceRange.min}</span>
                      <span>€{dynamicPriceRange.max}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm text-gray-600 mb-1 block">No (EUR)</Label>
                      <Input
                        ref={minInputRef}
                        type="number"
                        min={dynamicPriceRange.min}
                        max={dynamicPriceRange.max}
                        value={minPriceInput}
                        onChange={(e) => handleMinPriceInputChange(e.target.value)}
                        onBlur={handleMinPriceInputBlur}
                        onKeyDown={handleMinPriceKeyDown}
                        className="text-sm"
                        disabled={isUpdating || isLoading}
                        placeholder={dynamicPriceRange.min.toString()}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600 mb-1 block">Līdz (EUR)</Label>
                      <Input
                        ref={maxInputRef}
                        type="number"
                        min={dynamicPriceRange.min}
                        max={dynamicPriceRange.max}
                        value={maxPriceInput}
                        onChange={(e) => handleMaxPriceInputChange(e.target.value)}
                        onBlur={handleMaxPriceInputBlur}
                        onKeyDown={handleMaxPriceKeyDown}
                        className="text-sm"
                        disabled={isUpdating || isLoading}
                        placeholder={dynamicPriceRange.max.toString()}
                      />
                    </div>
                  </div>
                  
                  {isTypingPrice && (
                    <div className="text-xs text-blue-600 flex items-center justify-center">
                      <Search className="w-3 h-3 mr-1" />
                      Nospiediet Enter vai noklikšķiniet ārpus lauka
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Pieejamības filtri paliek tādi paši... */}
        
        {/* Active Filters Summary ar atjauninātām vērtībām */}
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
              
              {(priceRange[0] > dynamicPriceRange.min || priceRange[1] < dynamicPriceRange.max) && (
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-red-50 hover:border-red-300"
                  onClick={() => {
                    setPriceRange([dynamicPriceRange.min, dynamicPriceRange.max])
                    setMinPriceInput(dynamicPriceRange.min.toString())
                    setMaxPriceInput(dynamicPriceRange.max.toString())
                  }}
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
