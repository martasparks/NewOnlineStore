'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectSeparator
} from '@/components/ui/select'
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

  // Grupējam subkategorijas pēc kategorijām hierarchiskam attēlojumam
  const groupedSubcategories = categories.map(category => ({
    category,
    subcategories: subcategories.filter(sub => sub.category_id === category.id)
  })).filter(group => group.subcategories.length > 0)

  return (
    <div className="space-y-6">
      {/* Kategorijas izvēle ar Select */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700 flex items-center">
          <Folder className="w-4 h-4 mr-2" />
          Kategorija *
        </Label>
        <Select value={categoryId || ''} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Izvēlieties kategoriju..." />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{category.name}</span>
                  <span className="text-xs text-gray-500">({category.slug})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!categoryId && (
          <p className="text-sm text-red-500">Lūdzu izvēlieties kategoriju</p>
        )}
      </div>

      {/* Apakškategorijas izvēle ar hierarchisku Select */}
      {categoryId && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 flex items-center">
            <Tag className="w-4 h-4 mr-2" />
            Apakškategorija
            <span className="ml-2 text-xs text-gray-500">
              ({selectedCategory?.name})
            </span>
          </Label>
          <Select 
            value={subcategoryId || ''} 
            onValueChange={(value: string) => {
              onSubcategoryChange(value.trim() === '' ? null : value)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Izvēlieties apakškategoriju (nav obligāti)..." />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              {/* Opcija "Nav apakškategorijas" */}
              <SelectItem value="">
                <span className="text-gray-500 italic">Nav apakškategorijas</span>
              </SelectItem>
              
              <SelectSeparator />
              
              {/* Hierarchisks attēlojums */}
              {groupedSubcategories.map((group) => (
                <div key={group.category.id}>
                  {/* Kategorijas nosaukums kā label */}
                  <SelectLabel className="text-xs uppercase text-gray-600 font-bold tracking-wider">
                    {group.category.name}
                  </SelectLabel>
                  
                  {/* Šīs kategorijas subkategorijas ar atkāpi */}
                  {group.subcategories.map((subcategory) => (
                    <SelectItem 
                      key={subcategory.id} 
                      value={subcategory.id}
                      className="pl-6"
                      disabled={group.category.id !== categoryId}
                    >
                      <div className="flex items-center space-x-2">
                        <span className={group.category.id === categoryId ? 'font-medium' : 'text-gray-400'}>
                          {subcategory.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({subcategory.slug})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                  
                  {/* Atdalītājs starp kategorijām */}
                  {group !== groupedSubcategories[groupedSubcategories.length - 1] && (
                    <SelectSeparator />
                  )}
                </div>
              ))}
              
              {/* Ja nav apakškategoriju vispār */}
              {groupedSubcategories.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Nav izveidotas apakškategorijas
                </div>
              )}
            </SelectContent>
          </Select>
          
          {/* Informācija par izvēlēto apakškategoriju */}
          {subcategoryId && filteredSubcategories.length > 0 && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  Izvēlēta: <strong>{filteredSubcategories.find(sub => sub.id === subcategoryId)?.name}</strong>
                </span>
              </div>
            </div>
          )}
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
