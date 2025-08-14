'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Pencil, Plus, Save, AlertCircle, CheckCircle2 } from 'lucide-react'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useLoading } from '@hooks/useLoading'
import { useAlert } from '@lib/store/alert'
import ProductDetailsForm from './ProductDetailsForm'
import CategorySelector from './CategorySelector'
import DimensionsForm from './DimensionsForm'
import ImageUploadSection from './ImageUploadSection'
import { Product, Category, Subcategory, ProductDimensions } from './types'
import { ProductValidation } from './ProductValidation'

// Type for validation errors
interface ValidationError {
  field: string
  message: string
}

// Type for API error response
interface APIErrorResponse {
  error: string
  validationErrors?: ValidationError[]
}

// Narrow helper to avoid `any` for optional fields coming from initialData
type WithGroupAndParent = { group_id?: string | number | null; parentSlug?: string | null }

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
    group_id: undefined,
    parentSlug: undefined
  })
  
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  
  const { isLoading, withLoading } = useLoading(false)
  const { setAlert } = useAlert()
  const initializedRef = React.useRef(false)

  const validationErrors = useMemo(() => {
    return ProductValidation.validateProduct(product)
  }, [product])

  const isFormValid = useMemo(() => {
    return validationErrors.length === 0
  }, [validationErrors])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen && !isLoading) {
      onClose()
    }
  }, [onClose, isLoading])

  const resetForm = useCallback(() => {
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
      group_id: undefined,
      parentSlug: undefined,
      category_id: undefined,
      subcategory_id: undefined
    })
  }, [])

    const fetchCategories = useCallback(async () => {
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
  }, [setAlert])

useEffect(() => {
  if (!open) {
    initializedRef.current = false
    return
  }
  if (initializedRef.current) return

  fetchCategories()

  if (initialData) {
    setProduct(prev => {
      if ((prev as Product).id && (initialData as Product).id && (prev as Product).id === (initialData as Product).id) {
        return prev
      }
      return {
        ...initialData,
        category_id:
          initialData.category_id && initialData.category_id.toString().trim() !== ''
            ? initialData.category_id.toString().trim()
            : undefined,
        subcategory_id:
          initialData.subcategory_id && initialData.subcategory_id.toString().trim() !== ''
            ? initialData.subcategory_id.toString().trim()
            : undefined,
        group_id:
          initialData && 'group_id' in initialData && initialData.group_id
            ? initialData.group_id.toString().trim() || undefined
            : undefined,
        parentSlug:
          (initialData as Product & WithGroupAndParent)?.parentSlug && String((initialData as Product & WithGroupAndParent).parentSlug).trim() !== ''
            ? String((initialData as Product & WithGroupAndParent).parentSlug).trim()
            : undefined,
        dimensions: initialData.dimensions || {}
      }
    })
  } else {
    resetForm()
  }

  initializedRef.current = true
}, [open, initialData, fetchCategories, resetForm])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (name === 'group_id') {
      setProduct(prev => ({ 
        ...prev, 
        [name]: value.trim() === '' ? undefined : value.trim()
      }))
      return
    }

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
      setProduct(prev => ({ ...prev, [name]: value }))
    }
    
    if (name === 'name' && !isEdit) {
      const slug = ProductValidation.sanitizeSlug(value)
      setProduct(prev => ({ ...prev, slug }))
      
      setProduct(prev => {
        if (!prev.sku) {
          const sku = ProductValidation.generateSKU(value)
          return { ...prev, sku }
        }
        return prev
      })
    }
  }, [isEdit])

  const handleSwitchChange = useCallback((field: string, value: boolean) => {
    setProduct(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleCategoryChange = useCallback((categoryId: string) => {
    setProduct(prev => ({ 
      ...prev, 
      category_id: categoryId,
      subcategory_id: undefined
    }))
  }, [])

  const handleSubcategoryChange = useCallback((subcategoryId: string | null) => {
    setProduct(prev => ({ 
      ...prev, 
      subcategory_id: subcategoryId || undefined  // Konvertē null uz undefined
    }))
  }, [])

  const handleDimensionChange = useCallback((key: keyof ProductDimensions, value: number | undefined) => {
    setProduct(prev => ({
      ...prev,
      dimensions: {
        ...(prev.dimensions || {}),
        [key]: value
      }
    }))
  }, [])

  const handleWeightChange = useCallback((weight: number) => {
    setProduct(prev => ({ ...prev, weight }))
  }, [])

  const handleImagesChange = useCallback((images: string[]) => {
    setProduct(prev => ({ ...prev, images }))
  }, [])

  const handleGalleryChange = useCallback((gallery: string[]) => {
    setProduct(prev => ({ ...prev, gallery }))
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      setAlert('Lūdzu novērsiet visas kļūdas pirms saglabāšanas', 'error')
      return
    }

    await withLoading(async () => {
      try {
        const method = isEdit ? 'PUT' : 'POST'

        const cleanProduct = {
          ...product,
          group_id: product.group_id && product.group_id.trim() !== '' ? product.group_id.trim() : null,
          subcategory_id: product.subcategory_id && product.subcategory_id.trim() !== '' ? product.subcategory_id.trim() : null,
          category_id: product.category_id && product.category_id.trim() !== '' ? product.category_id.trim() : null
        }

        console.log('Product before cleaning:', {
          subcategory_id: product.subcategory_id,
          category_id: product.category_id
        })
        console.log('Product after cleaning:', {
          subcategory_id: cleanProduct.subcategory_id,
          category_id: cleanProduct.category_id
        })

        console.log('Original product.group_id:', product.group_id)
        console.log('Cleaned group_id:', cleanProduct.group_id)

        const payload = { 
          ...cleanProduct,
          parentSlug: product.parentSlug || undefined 
        }

        console.log('Final payload:', JSON.stringify(payload, null, 2))
        console.log('Request method:', method)
        console.log('Request URL:', '/api/products')

        delete (payload as Record<string, unknown>).groupId

        // Pievienojam papildu headers un labāku error handling
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }

        // Pievienojam origin header development režīmā
        if (typeof window !== 'undefined') {
          headers['Origin'] = window.location.origin
        }

        console.log('Request headers:', headers)

        const res = await fetch('/api/products', {
          method,
          headers,
          body: JSON.stringify(payload),
          credentials: 'same-origin' // Nodrošina, ka cookies tiek nosūtīti
        })

        console.log('Response status:', res.status)
        console.log('Response headers:', Object.fromEntries(res.headers.entries()))

        const data: APIErrorResponse = await res.json()
        console.log('Response data:', data)

        if (!res.ok) {
          // Detalizētāka kļūdas apstrāde
          const errorMessage = data.error || `HTTP ${res.status}: Neizdevās saglabāt produktu`
          const validationErrors = data.validationErrors || []
          
          if (res.status === 403) {
            console.error('403 Forbidden error details:', {
              status: res.status,
              message: errorMessage,
              headers: Object.fromEntries(res.headers.entries()),
              url: '/api/products',
              method
            })
            throw new Error(`Pieejams liegts (403): ${errorMessage}. Pārbaudiet autentifikāciju un admin tiesības.`)
          }
          
          if (validationErrors.length > 0) {
            throw new Error(`Validācijas kļūdas: ${validationErrors.map((e: ValidationError) => e.message).join(', ')}`)
          }
          
          throw new Error(errorMessage)
        }

        setAlert(
          isEdit ? 'Produkts atjaunots veiksmīgi' : 'Produkts izveidots veiksmīgi', 
          'success'
        )
        onSave()
        onClose()
      } catch (error) {
        console.error('Product save error:', error)
        
        // Labāka kļūdas ziņojuma parādīšana lietotājam
        let errorMessage = 'Neizdevās saglabāt produktu'
        
        if (error instanceof Error) {
          errorMessage = error.message
          
          // Specifiskas kļūdas ziņojumi
          if (error.message.includes('403')) {
            errorMessage = 'Nav tiesību veikt šo darbību. Pārbaudiet, vai esat pieteicies kā administrators.'
          } else if (error.message.includes('Network')) {
            errorMessage = 'Tīkla kļūda. Pārbaudiet internetpieslēgumu.'
          } else if (error.message.includes('fetch')) {
            errorMessage = 'Neizdevās nosūtīt pieprasījumu uz serveri.'
          }
        }
        
        setAlert(errorMessage, 'error')
      }
    })
  }, [isFormValid, isEdit, product, setAlert, withLoading, onSave, onClose])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}> {/* ← LABOTS: izmanto stabilizēto callback */}
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
            <ProductDetailsForm
              product={product}
              onChange={handleChange}
              onSwitchChange={handleSwitchChange}
              isEdit={isEdit}
            />

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
                      value={product.group_id ?? ''}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Unikāls grupas ID"
                    />
                  <p className="text-xs text-gray-500 mt-1">
                    Produkti ar vienādu Group ID tiks grupēti kopā kā krāsas varianti
                  </p>
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

            <DimensionsForm
              dimensions={product.dimensions || {}}
              weight={product.weight}
              onDimensionChange={handleDimensionChange}
              onWeightChange={handleWeightChange}
            />

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Attēli</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ImageUploadSection
                  images={product.images}
                  title="Galvenie attēli"
                  onImagesChange={handleImagesChange}
                />
                
                <ImageUploadSection
                  images={product.gallery}
                  title="Galerija"
                  onImagesChange={handleGalleryChange}
                />
              </div>
            </div>

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