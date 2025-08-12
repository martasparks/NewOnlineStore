'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Folder, Tag } from 'lucide-react'
import { Category, Subcategory } from './types'

interface CategorySelectorProps {
  categoryId?: string
  subcategoryId?: string
  categories: Category[]
  subcategories: Subcategory[]
  onCategoryChange: (categoryId: string) => void
  onSubcategoryChange: (subcategoryId: string | null) => void
}

export default function CategorySelector({
  categoryId,
  subcategoryId,
  categories,
  subcategories,
  onCategoryChange,
  onSubcategoryChange
}: CategorySelectorProps) {
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([])

  useEffect(() => {
    if (categoryId) {
      const filtered = subcategories.filter(sub => sub.category_id === categoryId)
      setFilteredSubcategories(filtered)
      
      // Ja izvēlētā apakškategorija nepieder šai kategorijai, notīrām to
      if (subcategoryId && !filtered.find(sub => sub.id === subcategoryId)) {
        onSubcategoryChange(null)
      }
    } else {
      setFilteredSubcategories([])
      onSubcategoryChange(null)
    }
  }, [categoryId, subcategories, subcategoryId, onSubcategoryChange])

  const selectedCategory = categories.find(cat => cat.id === categoryId)

  return (
    <div className="space-y-6">
      {/* Kategorijas izvēle */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700 flex items-center">
          <Folder className="w-4 h-4 mr-2" />
          Kategorija *
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((category) => (
            <Button
              key={category.id}
              type="button"
              variant={categoryId === category.id ? "default" : "outline"}
              className={`p-4 h-auto justify-start text-left transition-all ${
                categoryId === category.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onCategoryChange(category.id)}
            >
              <div>
                <p className="font-medium">{category.name}</p>
                <p className="text-xs text-gray-500 mt-1">{category.slug}</p>
              </div>
            </Button>
          ))}
        </div>
        {!categoryId && (
          <p className="text-sm text-red-500">Lūdzu izvēlieties kategoriju</p>
        )}
      </div>

      {/* Apakškategorijas izvēle */}
      {categoryId && filteredSubcategories.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Tag className="w-4 h-4 mr-2" />
            Apakškategorija
            <span className="ml-2 text-xs text-gray-500">
              ({selectedCategory?.name})
            </span>
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSubcategories.map((subcategory) => (
              <Button
                key={subcategory.id}
                type="button"
                variant={subcategoryId === subcategory.id ? "default" : "outline"}
                className={`p-3 h-auto justify-start text-left transition-all ${
                  subcategoryId === subcategory.id 
                    ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-200' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onSubcategoryChange(subcategory.id)}
              >
                <div>
                  <p className="font-medium text-sm">{subcategory.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{subcategory.slug}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Nav apakškategoriju ziņojums */}
      {categoryId && filteredSubcategories.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <Tag className="w-4 h-4 inline mr-2" />
            Šai kategorijai nav pievienotas apakškategorijas.
          </p>
        </div>
      )}
    </div>
  )
}