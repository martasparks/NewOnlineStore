'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { notFound } from 'next/navigation'
import Header from '@/components/Header'
import MainNavigation from '@/components/MainNavigation'
import ProductGallery from '@/components/products/ProductGallery'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/Loading'
import { 
  Heart, 
  ShoppingCart, 
  Truck, 
  Shield, 
  Minus,
  Plus,
  Star,
  Share2,
  RotateCcw,
  Award,
  Check,
  ChevronRight,
  Package
} from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  short_description: string
  price: number
  sale_price?: number
  sku: string
  stock_quantity: number
  images: string[]
  gallery: string[]
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  navigation_categories?: {
    name: string
    slug: string
  }
  product_attribute_values?: Array<{
    value: string
    product_attributes: {
      name: string
      type: string
      options: string[]
    }
  }>
}

export default function ProductPage() {
  const t = useTranslations('Produkti')
  const params = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({})
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.slug}`)
        
        if (response.status === 404) {
          notFound()
        }
        
        if (response.ok) {
          const data = await response.json()
          setProduct(data)
        }
      } catch (error) {
        console.error('Error fetching product:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchProduct()
    }
  }, [params.slug])

  const handleAddToCart = () => {
    console.log('Add to cart:', {
      productId: product?.id,
      quantity,
      attributes: selectedAttributes
    })
  }

  const handleShare = async () => {
    if (navigator.share && product) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <MainNavigation />
        <Loading variant="spinner" text="Ielādē produktu..." className="py-20" />
      </div>
    )
  }

  if (!product) {
    notFound()
  }

  const effectivePrice = product.sale_price || product.price
  const hasDiscount = product.sale_price && product.sale_price < product.price
  const discountPercent = hasDiscount ? Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <MainNavigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <a href="/" className="hover:text-gray-700 transition-colors">Sākums</a>
          <ChevronRight className="w-4 h-4" />
          <a href="/produkti" className="hover:text-gray-700 transition-colors">Produkti</a>
          {product.navigation_categories && (
            <>
              <ChevronRight className="w-4 h-4" />
              <a href={`/kategorijas/${product.navigation_categories.slug}`} className="hover:text-gray-700 transition-colors">
                {product.navigation_categories.name}
              </a>
            </>
          )}
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Product Gallery */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <ProductGallery 
              images={[...product.images, ...product.gallery]}
              alt={product.name}
            />
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            {/* Product Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                    {product.name}
                  </h1>
                  <div className="flex items-center space-x-4 mt-3">
                    <p className="text-gray-600">SKU: {product.sku}</p>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">(4.8) 24 atsauksmes</span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>

              {/* Short Description */}
              {product.short_description && (
                <p className="text-lg text-gray-600 leading-relaxed">
                  {product.short_description}
                </p>
              )}
            </div>

            {/* Price Section */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  €{effectivePrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-2xl text-gray-500 line-through">
                      €{product.price.toFixed(2)}
                    </span>
                    <span className="bg-red-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                {product.stock_quantity > 0 ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">
                      Pieejams ({product.stock_quantity} gab.)
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-red-700 font-medium">Nav pieejams</span>
                  </>
                )}
              </div>
            </div>

            {/* Attributes */}
            {product.product_attribute_values && product.product_attribute_values.length > 0 && (
              <div className="space-y-6">
                {product.product_attribute_values.map((attr, index) => (
                  <div key={index}>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      {attr.product_attributes?.name || 'Unknown attribute'}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {(attr.product_attributes?.options || []).map((option) => (
                        <button
                          key={option}
                          onClick={() => setSelectedAttributes(prev => ({
                            ...prev,
                            [attr.product_attributes?.name || '']: option
                          }))}
                          className={`px-6 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            selectedAttributes[attr.product_attributes?.name || ''] === option
                              ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Daudzums
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="px-4 py-3 border-0 rounded-none hover:bg-gray-100"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-6 py-3 text-lg font-semibold bg-gray-50 min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= product.stock_quantity}
                      className="px-4 py-3 border-0 rounded-none hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  size="lg"
                  disabled={product.stock_quantity < 1}
                >
                  <ShoppingCart className="w-6 h-6 mr-3" />
                  {product.stock_quantity > 0 ? 'Pievienot grozam' : 'Nav pieejams'}
                </Button>
                
                <Button
                  variant="outline"
                  className={`w-full border-2 py-4 text-lg font-semibold rounded-xl transition-all duration-200 ${
                    isWishlisted 
                      ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                      : 'border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                  }`}
                  size="lg"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                >
                  <Heart className={`w-6 h-6 mr-3 ${isWishlisted ? 'fill-current' : ''}`} />
                  {isWishlisted ? 'Noņemt no vēlmju saraksta' : 'Pievienot vēlmju sarakstam'}
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ko jūs iegūstat</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Bezmaksas piegāde</p>
                    <p className="text-sm text-gray-600">Pasūtījumiem virs €50</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">2 gadu garantija</p>
                    <p className="text-sm text-gray-600">Pilna ražotāja garantija</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">30 dienu atgriešana</p>
                    <p className="text-sm text-gray-600">Bez jautājumiem</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Kvalitatīvs produkts</p>
                    <p className="text-sm text-gray-600">Pārbaudīts un apstiprināts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-20">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {[
                { id: 'description', label: 'Apraksts', icon: Package },
                { id: 'specs', label: 'Specifikācijas', icon: Award },
                { id: 'reviews', label: 'Atsauksmes (24)', icon: Star }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="py-12">
            {activeTab === 'description' && (
              <div className="max-w-4xl">
                {product.description ? (
                  <div 
                    className="prose prose-lg max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-gray-600">Nav pieejams detalizēts apraksts.</p>
                )}
              </div>
            )}

            {activeTab === 'specs' && (
              <div className="max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-900">Produkta informācija</h3>
                    <dl className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <dt className="font-medium text-gray-600">SKU:</dt>
                        <dd className="text-gray-900">{product.sku}</dd>
                      </div>
                      {product.weight && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <dt className="font-medium text-gray-600">Svars:</dt>
                          <dd className="text-gray-900">{product.weight} kg</dd>
                        </div>
                      )}
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <dt className="font-medium text-gray-600">Pieejamība:</dt>
                        <dd className="text-gray-900">{product.stock_quantity} gab.</dd>
                      </div>
                    </dl>
                  </div>
                  
                  {product.dimensions && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900">Izmēri</h3>
                      <dl className="space-y-3">
                        {product.dimensions.length && (
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="font-medium text-gray-600">Garums:</dt>
                            <dd className="text-gray-900">{product.dimensions.length} cm</dd>
                          </div>
                        )}
                        {product.dimensions.width && (
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="font-medium text-gray-600">Platums:</dt>
                            <dd className="text-gray-900">{product.dimensions.width} cm</dd>
                          </div>
                        )}
                        {product.dimensions.height && (
                          <div className="flex justify-between py-2 border-b border-gray-100">
                            <dt className="font-medium text-gray-600">Augstums:</dt>
                            <dd className="text-gray-900">{product.dimensions.height} cm</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="max-w-4xl">
                <div className="text-center py-12">
                  <Star className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Atsauksmes drīzumā</h3>
                  <p className="text-gray-600">Atsauksmju sistēma tiks pievienota drīzumā</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}