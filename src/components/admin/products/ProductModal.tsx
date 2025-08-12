'use client'

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pencil, Plus, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLoading } from '@hooks/useLoading'
import { useAlert } from '@lib/store/alert'

// Importējam mūsu jaunos komponentus
import ProductDetailsForm from './ProductDetailsForm'
import CategorySelector from './CategorySelector'
import DimensionsForm from './DimensionsForm'
import ImageUploadSection from './ImageUploadSection'
import { Product, Category, Subcategory, ProductDimensions, ValidationError } from './types'
import { ProductValidation } from './ProductValidation'

interface ProductModalProps {
  open: boolean
  onClose: () => void
  initialData?: Product | null
  onSave: () => void
}

export default function ProductModal({
  open,
  onClose,
  initialData,
  onSave,
}: ProductModalProps) {
  const isEdit = !!initialData
  
  // State pārvaldība
  const [product, setProduct] = useState<Product & { group_id?: string; parentSlug?: string }>({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    price: 0,
    sku: '',
    stock_quantity: 0,
    manage_stock: true,
    status: 'active',
    featured: false,
    images: [],
    gallery: [],
    meta_title: '',
    meta_description: '',
    weight: 0,
    dimensions: {},
    group_id: '',
    parentSlug: undefined
  })
  
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isFormValid, setIsFormValid] = useState(false)
  
  const { isLoading, withLoading } = useLoading(false)
  const { setAlert } = useAlert()
  const initializedRef = React.useRef(false)

  // Inicializācija — izpilda vienu reizi katrā atvēršanas ciklā
  useEffect(() => {
    if (!open) {
      initializedRef.current = false
      return
    }
    if (initializedRef.current) return

    fetchCategories()

    if (initialData) {
      setProduct(prev => {
        // Ja jau ielādēts tas pats ieraksts, neatjauninām
        // @ts-ignore
        if ((prev as any).id && (initialData as any).id && (prev as any).id === (initialData as any).id) {
          return prev
        }
        return {
          ...initialData,
          dimensions: initialData.dimensions || {}
        }
      })
    } else {
      // Tikai sākotnējai atvēršanai
      resetForm()
    }

    initializedRef.current = true
  }, [open, initialData])

  // Validācija katru reizi, kad product mainās
  useEffect(() => {
    const errors = ProductValidation.validateProduct(product)
    setValidationErrors(errors)
    setIsFormValid(errors.length === 0)
  }, [product])

  // Funkcijas
  const resetForm = () => {
    setProduct({
      name: '',
      slug: '',
      description: '',
      short_description: '',
      price: 0,
      sku: '',
      stock_quantity: 0,
      manage_stock: true,
      status: 'active',
      featured: false,
      images: [],
      gallery: [],
      meta_title: '',
      meta_description: '',
      weight: 0,
      dimensions: {},
      group_id: '',
      parentSlug: undefined
    })
    setValidationErrors([])
  }

  const fetchCategories = async () => {
    try {
      const [categoriesRes, subcategoriesRes] = await Promise.all([
        fetch('/api/navigation/categories'),
        fetch('/api/navigation/subcategories')
      ])
      
      if (categoriesRes.ok && subcategoriesRes.ok) {
        const [categoriesData, subcategoriesData] = await Promise.all([
          categoriesRes.json(),
          subcategoriesRes.json()
        ])
        
        setCategories(categoriesData)
        setSubcategories(subcategoriesData)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setAlert('Neizdevās ielādēt kategorijas', 'error')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'number') {
      if (name.startsWith('dimensions.')) {
        const dimensionKey = name.split('.')[1] as keyof ProductDimensions
        setProduct(prev => ({
          ...prev,
          dimensions: {
            ...(prev.dimensions || {}),
            [dimensionKey]: value ? parseFloat(value) : undefined
          }
        }))
      } else {
        setProduct(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
      }
    } else {
      // handle parentSlug as a normal string field
      setProduct(prev => ({ ...prev, [name]: value }))
    }
    
    // Auto-generate slug no nosaukuma (tikai jauniem produktiem)
    if (name === 'name' && !isEdit) {
      const slug = ProductValidation.sanitizeSlug(value)
      setProduct(prev => ({ ...prev, slug }))
      
      // Auto-generate SKU ja nav aizpildīts
      if (!product.sku) {
        const sku = ProductValidation.generateSKU(value)
        setProduct(prev => ({ ...prev, sku }))
      }
    }
  }

  const handleSwitchChange = (field: string, value: boolean) => {
    setProduct(prev => ({ ...prev, [field]: value }))
  }

  const handleCategoryChange = (categoryId: string) => {
    setProduct(prev => ({ 
      ...prev, 
      category_id: categoryId,
      subcategory_id: '' // Reset subcategory kad mainām kategoriju
    }))
  }

  const handleSubcategoryChange = (subcategoryId: string) => {
    setProduct(prev => ({ ...prev, subcategory_id: subcategoryId }))
  }

  const handleDimensionChange = (key: keyof ProductDimensions, value: number | undefined) => {
    setProduct(prev => ({
      ...prev,
      dimensions: {
        ...(prev.dimensions || {}),
        [key]: value
      }
    }))
  }

  const handleWeightChange = (weight: number) => {
    setProduct(prev => ({ ...prev, weight }))
  }

  const handleImagesChange = (images: string[]) => {
    setProduct(prev => ({ ...prev, images }))
  }

  const handleGalleryChange = (gallery: string[]) => {
    setProduct(prev => ({ ...prev, gallery }))
  }

  const handleSubmit = async () => {
    // Pārbaudām validāciju pirms sūtīšanas
    if (!isFormValid) {
      setAlert('Lūdzu novērsiet visas kļūdas pirms saglabāšanas', 'error')
      return
    }

    await withLoading(async () => {
      try {
        const method = isEdit ? 'PUT' : 'POST'
        // include parentSlug in payload, but only as undefined if empty
        const payload = { ...product, parentSlug: product.parentSlug || undefined }
        const res = await fetch('/api/products', {
          method,
          headers: { 
            'Content-Type': 'application/json',
            // Pievienojam CSRF aizsardzību
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(payload),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Neizdevās saglabāt produktu')
        }

        setAlert(
          isEdit ? 'Produkts atjaunots veiksmīgi' : 'Produkts izveidots veiksmīgi', 
          'success'
        )
        onSave()
        onClose()
      } catch (error) {
        console.error('Product save error:', error)
        setAlert(
          error instanceof Error ? error.message : 'Neizdevās saglabāt produktu', 
          'error'
        )
      }
    })
  }

  const getFieldError = (fieldName: string): string | undefined => {
    return validationErrors.find(error => error.field === fieldName)?.message
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-6xl max-h-[95vh] flex flex-col">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold flex items-center">
            {isEdit ? (
              <>
                <Pencil className="w-6 h-6 mr-3 text-blue-600" />
                Labot produktu
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 mr-3 text-green-600" />
                Pievienot produktu
              </>
            )}
          </DialogTitle>
          
          {/* Validācijas statuss */}
          <div className="flex items-center mt-2">
            {isFormValid ? (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                <span className="text-sm">Forma ir derīga</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">{validationErrors.length} kļūda(s)</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 overflow-y-auto">
          <div className="space-y-8 py-6">
            {/* Produkta detaļas */}
            <ProductDetailsForm
              product={product}
              onChange={handleChange}
              onSwitchChange={handleSwitchChange}
              isEdit={isEdit}
            />

            {/* Kategoriju izvēle */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategorijas</h3>
              <CategorySelector
                categoryId={product.category_id}
                subcategoryId={product.subcategory_id}
                categories={categories}
                subcategories={subcategories}
                onCategoryChange={handleCategoryChange}
                onSubcategoryChange={handleSubcategoryChange}
              />
            </div>

            {/* Produktu grupēšana */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Produkta grupēšana (krāsas varianti)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="group_id">
                    Group ID (UUID)
                  </label>
                  <input
                    type="text"
                    id="group_id"
                    name="group_id"
                    value={product.group_id || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Unikāls ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="parentSlug">
                    Galvenā produkta slug
                  </label>
                  <input
                    type="text"
                    id="parentSlug"
                    name="parentSlug"
                    value={product.parentSlug || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ja šis ir galvenais produkts, atstājiet tukšu"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ja šis ir pirmais šīs grupas produkts, atstājiet tukšu un tas kļūs par galveno.
                  </p>
                </div>
              </div>
            </div>

            {/* Izmēri un svars */}
            <DimensionsForm
              dimensions={product.dimensions || {}}
              weight={product.weight}
              onDimensionChange={handleDimensionChange}
              onWeightChange={handleWeightChange}
            />

            {/* Attēli */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Attēli</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ImageUploadSection
                  images={product.images}
                  type="images"
                  title="Galvenie attēli"
                  onImagesChange={handleImagesChange}
                />
                
                <ImageUploadSection
                  images={product.gallery}
                  type="gallery"
                  title="Galerija"
                  onImagesChange={handleGalleryChange}
                />
              </div>
            </div>

            {/* Validācijas kļūdu parādīšana */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <h4 className="text-lg font-semibold text-red-900">Nepieciešami labojumi</h4>
                </div>
                <ul className="space-y-2">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start">
                      <span className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      <span><strong>{error.field}:</strong> {error.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer ar pogām */}
        <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {isEdit ? 'Labojat esošu produktu' : 'Veidojat jaunu produktu'}
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Atcelt
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !isFormValid}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {isLoading ? (
                'Saglabā...'
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEdit ? 'Atjaunot' : 'Izveidot'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}