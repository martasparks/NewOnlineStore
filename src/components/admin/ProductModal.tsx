'use client'

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Pencil, Plus, Save, Package, X, Image as ImageIcon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLoading } from '@hooks/useLoading'
import { useAlert } from '@lib/store/alert'

interface Product {
  id?: string
  name: string
  slug: string
  description: string
  short_description: string
  price: number
  sale_price?: number
  sku: string
  stock_quantity: number
  manage_stock: boolean
  status: 'active' | 'inactive' | 'draft'
  featured: boolean
  images: string[]
  gallery: string[]
  meta_title: string
  meta_description: string
  weight?: number
  dimensions?: { length?: number; width?: number; height?: number }
  category_id?: string
  subcategory_id?: string
}

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
  const [product, setProduct] = useState<Product>({
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
    dimensions: {}
  })
  
  const [categories, setCategories] = useState<any[]>([])
  const [subcategories, setSubcategories] = useState<any[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const { isLoading, withLoading } = useLoading(false)
  const { setAlert } = useAlert()

  useEffect(() => {
    if (open) {
      fetchCategories()
      if (initialData) {
        setProduct({
          ...initialData,
          dimensions: initialData.dimensions || {}
        })
      } else {
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
          dimensions: {}
        })
      }
    }
  }, [initialData, open])

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
      
      setCategories(categoriesData)
      setSubcategories(subcategoriesData)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
  const { name, value, type } = e.target
  
  if (type === 'number') {
    if (name.startsWith('dimensions.')) {
      const dimensionKey = name.split('.')[1] as 'length' | 'width' | 'height'
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
  
  // Auto-generate slug from name
  if (name === 'name' && !isEdit) {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    setProduct(prev => ({ ...prev, slug }))
  }
}

  const handleImageUpload = async (files: FileList, type: 'images' | 'gallery') => {
    setUploadingImages(true)
    const uploadedUrls: string[] = []
    const errors: string[] = []

    try {
      for (const file of Array.from(files)) {
        // Klienta puses validācija
        if (!file.type.startsWith('image/')) {
          errors.push(`${file.name}: Nav attēla fails`)
          continue
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit for products
          errors.push(`${file.name}: Fails pārāk liels (max 10MB)`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'products') // Specific folder for products

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })

          if (response.ok) {
            const data = await response.json()
            uploadedUrls.push(data.url)
          } else {
            const error = await response.json()
            errors.push(`${file.name}: ${error.error || 'Augšupielādes kļūda'}`)
          }
        } catch (fileError) {
          errors.push(`${file.name}: Tīkla kļūda`)
        }
      }

      // Update state with successfully uploaded images
      if (uploadedUrls.length > 0) {
        setProduct(prev => ({
          ...prev,
          [type]: [...prev[type], ...uploadedUrls]
        }))
        
        const successMessage = uploadedUrls.length === 1 
          ? '1 attēls augšupielādēts' 
          : `${uploadedUrls.length} attēli augšupielādēti`
        setAlert(successMessage, 'success')
      }

      // Show errors if any
      if (errors.length > 0) {
        const errorMessage = errors.length === 1 
          ? errors[0] 
          : `${errors.length} kļūdas augšupielādē`
        setAlert(errorMessage, 'error')
      }

    } catch (error) {
      setAlert('Neizdevās augšupielādēt attēlus', 'error')
    } finally {
      setUploadingImages(false)
    }
  }

  // Drag & Drop functionality
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent, type: 'images' | 'gallery') => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files, type)
    }
  }

  const removeImage = (index: number, type: 'images' | 'gallery') => {
    setProduct(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    await withLoading(async () => {
      try {
        if (!product.name || !product.slug || !product.price) {
          setAlert('Lūdzu aizpildiet visus obligātos laukus', 'error')
          return
        }

        const method = isEdit ? 'PUT' : 'POST'
        const res = await fetch('/api/products', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product),
        })

        const data = await res.json()

        if (!res.ok) {
          setAlert(data.error || 'Neizdevās saglabāt produktu', 'error')
          return
        }

        setAlert('Produkts saglabāts veiksmīgi', 'success')
        onSave()
        onClose()
      } catch (error) {
        setAlert('Neizdevās saglabāt produktu', 'error')
      }
    })
  }

  const filteredSubcategories = subcategories.filter(
    sub => sub.category_id === product.category_id
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            {isEdit ? (
              <>
                <Pencil className="w-6 h-6 mr-3" />
                Labot produktu
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 mr-3" />
                Pievienot produktu
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Pamata informācija */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <Package className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Pamata informācija</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Produkta nosaukums *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  placeholder="Produkta nosaukums"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium text-gray-700">
                  URL slug *
                </Label>
                <Input
                  id="slug"
                  name="slug"
                  value={product.slug}
                  onChange={handleChange}
                  placeholder="produkta-slug"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku" className="text-sm font-medium text-gray-700">
                  SKU
                </Label>
                <Input
                  id="sku"
                  name="sku"
                  value={product.sku}
                  onChange={handleChange}
                  placeholder="SKU-12345"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Statuss
                </Label>
                <select
                  id="status"
                  name="status"
                  value={product.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Aktīvs</option>
                  <option value="inactive">Neaktīvs</option>
                  <option value="draft">Melnraksts</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="short_description" className="text-sm font-medium text-gray-700">
                Īss apraksts
              </Label>
              <Textarea
                id="short_description"
                name="short_description"
                value={product.short_description}
                onChange={handleChange}
                placeholder="Īss produkta apraksts..."
                className="w-full"
                rows={2}
              />
            </div>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Pilns apraksts
              </Label>
              <Textarea
                id="description"
                name="description"
                value={product.description}
                onChange={handleChange}
                placeholder="Detalizēts produkta apraksts..."
                className="w-full"
                rows={4}
              />
            </div>
            
            <div className="mt-6 flex items-center space-x-2">
              <Switch
                id="featured"
                checked={product.featured}
                onCheckedChange={(checked) => setProduct(prev => ({ ...prev, featured: checked }))}
              />
              <Label htmlFor="featured" className="text-sm font-medium text-gray-700">
                Populārs produkts
              </Label>
            </div>
          </div>

          {/* Kategorijas */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategorijas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id" className="text-sm font-medium text-gray-700">
                  Galvenā kategorija
                </Label>
                <select
                  id="category_id"
                  name="category_id"
                  value={product.category_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Izvēlieties kategoriju</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subcategory_id" className="text-sm font-medium text-gray-700">
                  Apakškategorija
                </Label>
                <select
                  id="subcategory_id"
                  name="subcategory_id"
                  value={product.subcategory_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!product.category_id}
                >
                  <option value="">Izvēlieties apakškategoriju</option>
                  {filteredSubcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Cenas un krājumi */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cenas un krājumi</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                  Parastā cena (€) *
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sale_price" className="text-sm font-medium text-gray-700">
                  Akcijas cena (€)
                </Label>
                <Input
                  id="sale_price"
                  name="sale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={product.sale_price || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stock_quantity" className="text-sm font-medium text-gray-700">
                  Krājumi (gab.)
                </Label>
                <Input
                  id="stock_quantity"
                  name="stock_quantity"
                  type="number"
                  min="0"
                  value={product.stock_quantity}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full"
                  disabled={!product.manage_stock}
                />
              </div>
            </div>
            
            <div className="mt-4 flex items-center space-x-2">
              <Switch
                id="manage_stock"
                checked={product.manage_stock}
                onCheckedChange={(checked) => setProduct(prev => ({ ...prev, manage_stock: checked }))}
              />
              <Label htmlFor="manage_stock" className="text-sm font-medium text-gray-700">
                Pārvaldīt krājumus
              </Label>
            </div>
          </div>

          {/* Attēli */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Produkta attēli</h3>
            
          {/* Galvenie attēli */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Galvenie attēli
            </Label>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {product.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Produkta attēls ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={() => removeImage(index, 'images')}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Galvenais
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                uploadingImages 
                  ? 'border-blue-300 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'images')}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files, 'images')}
                className="hidden"
                id="main-images"
                disabled={uploadingImages}
              />
              <label htmlFor="main-images" className="cursor-pointer block">
                {uploadingImages ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-blue-600">Augšupielādē attēlus...</span>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">
                      Noklikšķiniet vai velciet attēlus šeit
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WebP līdz 10MB
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>
            
            {/* Galerijas attēli */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Galerijas attēli
              </Label>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {product.gallery.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Galerijas attēls ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => removeImage(index, 'gallery')}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files, 'gallery')}
                  className="hidden"
                  id="gallery-images"
                  disabled={uploadingImages}
                />
                <label htmlFor="gallery-images" className="cursor-pointer">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    {uploadingImages ? 'Augšupielādē...' : 'Noklikšķiniet vai velciet attēlus šeit'}
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* SEO un papildu info */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">SEO un papildu informācija</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title" className="text-sm font-medium text-gray-700">
                  Meta nosaukums
                </Label>
                <Input
                  id="meta_title"
                  name="meta_title"
                  value={product.meta_title}
                  onChange={handleChange}
                  placeholder="SEO nosaukums"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="meta_description" className="text-sm font-medium text-gray-700">
                  Meta apraksts
                </Label>
                <Textarea
                  id="meta_description"
                  name="meta_description"
                  value={product.meta_description}
                  onChange={handleChange}
                  placeholder="SEO apraksts"
                  className="w-full"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
                    Svars (kg)
                  </Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.01"
                    min="0"
                    value={product.weight || ''}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Garums (cm)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={product.dimensions?.length?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setProduct(prev => ({
                        ...prev,
                        dimensions: {
                          ...(prev.dimensions || {}),
                          length: value ? parseFloat(value) : undefined
                        }
                      }))
                    }}
                    placeholder="0"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Platums (cm)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={product.dimensions?.width?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setProduct(prev => ({
                        ...prev,
                        dimensions: {
                          ...(prev.dimensions || {}),
                          width: value ? parseFloat(value) : undefined
                        }
                      }))
                    }}
                    placeholder="0"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Augstums (cm)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={product.dimensions?.height?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value
                      setProduct(prev => ({
                        ...prev,
                        dimensions: {
                          ...(prev.dimensions || {}),
                          height: value ? parseFloat(value) : undefined
                        }
                      }))
                    }}
                    placeholder="0"
                    className="w-full"
                  />
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || uploadingImages}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saglabā...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Saglabāt produktu
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading || uploadingImages}
            size="lg"
          >
            Atcelt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}