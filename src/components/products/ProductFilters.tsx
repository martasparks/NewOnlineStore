'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { X, Filter } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  productCount?: number
}

interface ProductFiltersProps {
  onFilterChange: () => void
}

export default function ProductFilters({ onFilterChange }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [inStock, setInStock] = useState(false)
  const [featured, setFeatured] = useState(false)

  useEffect(() => {
    fetchCategories()
    loadFiltersFromURL()
  }, [])

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

  const updateURL = (filters: Record<string, string | string[]>) => {
    const params = new URLSearchParams(searchParams)
    
    // Dzēšam esošos filtrus
    params.delete('categories')
    params.delete('minPrice')
    params.delete('maxPrice')
    params.delete('inStock')
    params.delete('featured')
    params.delete('page') // Reset page when filtering

    // Pievienojam jaunos filtrus
    Object.entries(filters).forEach(([key, value]) => {
      if (value && (Array.isArray(value) ? value.length > 0 : value !== '0')) {
        params.set(key, Array.isArray(value) ? value.join(',') : value.toString())
      }
    })

    router.push(`?${params.toString()}`)
    onFilterChange()
  }

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const newCategories = checked 
      ? [...selectedCategories, categoryId]
      : selectedCategories.filter(id => id !== categoryId)
    
    setSelectedCategories(newCategories)
    updateURL({
      categories: newCategories,
      minPrice: priceRange[0].toString(),
      maxPrice: priceRange[1].toString(),
      inStock: inStock.toString(),
      featured: featured.toString()
    })
  }

  const handlePriceChange = (newRange: number[]) => {
    setPriceRange(newRange)
    updateURL({
      categories: selectedCategories,
      minPrice: newRange[0].toString(),
      maxPrice: newRange[1].toString(),
      inStock: inStock.toString(),
      featured: featured.toString()
    })
  }

  const clearAllFilters = () => {
    setSelectedCategories([])
    setPriceRange([0, 1000])
    setInStock(false)
    setFeatured(false)
    router.push(window.location.pathname)
    onFilterChange()
  }

  const hasActiveFilters = selectedCategories.length > 0 || 
    priceRange[0] > 0 || 
    priceRange[1] < 1000 || 
    inStock || 
    featured

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filtri
        </h3>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Notīrīt
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Kategorijas */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Kategorijas
          </Label>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={(checked) => 
                    handleCategoryChange(category.id, checked as boolean)
                  }
                />
                <Label 
                  htmlFor={`category-${category.id}`}
                  className="text-sm text-gray-700 cursor-pointer flex-1"
                >
                  {category.name}
                  {category.productCount && (
                    <span className="text-gray-400 ml-1">({category.productCount})</span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Cenu diapazons */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Cena (€)
          </Label>
          <div className="space-y-4">
            <Slider
              value={priceRange}
              onValueChange={handlePriceChange}
              min={0}
              max={1000}
              step={10}
              className="w-full"
            />
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={priceRange[0]}
                onChange={(e) => handlePriceChange([parseInt(e.target.value) || 0, priceRange[1]])}
                className="w-20 text-sm"
                min={0}
                max={priceRange[1]}
              />
              <span className="text-gray-500">-</span>
              <Input
                type="number"
                value={priceRange[1]}
                onChange={(e) => handlePriceChange([priceRange[0], parseInt(e.target.value) || 1000])}
                className="w-20 text-sm"
                min={priceRange[0]}
                max={1000}
              />
            </div>
          </div>
        </div>

        {/* Pieejamība */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Pieejamība
          </Label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="in-stock"
                checked={inStock}
                onCheckedChange={(checked) => {
                  setInStock(checked as boolean)
                  updateURL({
                    categories: selectedCategories,
                    minPrice: priceRange[0].toString(),
                    maxPrice: priceRange[1].toString(),
                    inStock: (checked as boolean).toString(),
                    featured: featured.toString()
                  })
                }}
              />
              <Label htmlFor="in-stock" className="text-sm text-gray-700 cursor-pointer">
                Tikai pieejamie
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={featured}
                onCheckedChange={(checked) => {
                  setFeatured(checked as boolean)
                  updateURL({
                    categories: selectedCategories,
                    minPrice: priceRange[0].toString(),
                    maxPrice: priceRange[1].toString(),
                    inStock: inStock.toString(),
                    featured: (checked as boolean).toString()
                  })
                }}
              />
              <Label htmlFor="featured" className="text-sm text-gray-700 cursor-pointer">
                Populārie produkti
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}