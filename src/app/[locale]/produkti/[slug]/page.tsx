'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, notFound } from 'next/navigation'
import Image from 'next/image'
import Head from 'next/head'
import Header from '@/components/Header'
import MainNavigation from '@/components/MainNavigation'
import ProductGallery from '@/components/products/ProductGallery'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  ChevronRight,
  Package,
  Ruler,
  Weight,
  Check,
  AlertCircle,
  Palette,
  Info
} from 'lucide-react'
import Link from 'next/link'

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
  manage_stock: boolean
  featured?: boolean
  images: string[]
  gallery: string[]
  meta_title?: string
  meta_description?: string
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
  relatedColors?: Array<{
    id: string
    name: string
    slug: string
    images: string[]
    price: number
    sale_price?: number
    sku?: string
  }>
  status?: 'active' | 'inactive' | 'draft'
  created_at?: string
  updated_at?: string
}

export default function ProductPage() {
  const params = useParams()
  const slug = params?.slug as string
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  const effectivePrice = useMemo(() => 
    product?.sale_price || product?.price || 0, 
    [product?.sale_price, product?.price]
  )
  
  const hasDiscount = useMemo(() => 
    product?.sale_price && product?.price && product.sale_price < product.price,
    [product?.sale_price, product?.price]
  )
  
  const discountPercent = useMemo(() => 
    hasDiscount && product ? 
      Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0,
    [hasDiscount, product]
  )

  const isOutOfStock = useMemo(() => 
    product?.manage_stock && product.stock_quantity === 0,
    [product?.manage_stock, product?.stock_quantity]
  )

  const isLowStock = useMemo(() => 
    product?.manage_stock && 
    product.stock_quantity > 0 && 
    product.stock_quantity <= 5,
    [product?.manage_stock, product?.stock_quantity]
  )

  const metaTitle = product?.meta_title || `${product?.name} | Marta's Mēbeles`
  const metaDescription = product?.meta_description || product?.short_description || product?.description?.substring(0, 160)

  useEffect(() => {
    if (slug) {
      fetchProduct(slug)
    }
  }, [slug])

  // Produkta lapā pievieno šo useEffect
  useEffect(() => {
    // Klausāmies uz modal state izmaiņām no ProductGallery
    const handleModalChange = (event: CustomEvent) => {
      if (event.detail.isOpen) {
        document.body.setAttribute('data-modal-open', 'true')
        document.body.style.overflow = 'hidden'
      } else {
        document.body.removeAttribute('data-modal-open')
        document.body.style.overflow = 'auto'
      }
    }

    window.addEventListener('gallery-modal-change', handleModalChange as EventListener)
    
    return () => {
      window.removeEventListener('gallery-modal-change', handleModalChange as EventListener)
      document.body.removeAttribute('data-modal-open')
      document.body.style.overflow = 'auto'
    }
  }, [])

  const fetchProduct = async (productSlug: string) => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/products/${productSlug}`)
        
        if (response.status === 404) {
          notFound()
        }
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        setProduct(data)
      } catch (err) {
        console.error('Error fetching product:', err)
        setError(err instanceof Error ? err.message : 'Neizdevās ielādēt produktu')
      } finally {
        setLoading(false)
      }
  }

  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return
    
    const maxQuantity = product.manage_stock ? product.stock_quantity : 999
    const validQuantity = Math.max(1, Math.min(newQuantity, maxQuantity))
    setQuantity(validQuantity)
  }

  const handleAddToCart = async () => {
    if (!product || isOutOfStock || addingToCart) return
    
    setAddingToCart(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setQuantity(1)
    } catch (error) {
      console.error('Error adding to cart:', error)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleWishlistToggle = async () => {
    if (!product) return
    
    try {
      setIsWishlisted(!isWishlisted)
      console.log(`${isWishlisted ? 'Removed from' : 'Added to'} wishlist: ${product.name}`)
    } catch (error) {
      setIsWishlisted(isWishlisted)
      console.error('Error updating wishlist:', error)
    }
  }

  const handleShare = async () => {
    if (!product) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.short_description,
          url: window.location.href
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        console.log('Link copied to clipboard')
      } catch (error) {
        console.error('Error copying to clipboard:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <MainNavigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Loading fullScreen variant="spinner" text="Ielādē produktu..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <MainNavigation />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Kļūda ielādējot produktu</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => fetchProduct(slug)} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Mēģināt vēlreiz
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    notFound()
  }

  return (
    <>
      <Head>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={product.images[0]} />
        <meta property="og:type" content="product" />
        <meta property="product:price:amount" content={effectivePrice.toString()} />
        <meta property="product:price:currency" content="EUR" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL}/produkti/${product.slug}`} />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              "name": product.name,
              "description": product.description,
              "image": product.images,
              "sku": product.sku,
              "brand": {
                "@type": "Brand",
                "name": "Marta's Mēbeles"
              },
             "offers": {
               "@type": "Offer",
               "price": effectivePrice,
               "priceCurrency": "EUR",
               "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
               "seller": {
                 "@type": "Organization",
                 "name": "Marta's Mēbeles"
               }
             },
             "aggregateRating": {
               "@type": "AggregateRating",
               "ratingValue": "4.8",
               "reviewCount": "24"
             }
           })
         }}
       />
     </Head>

      <div className="min-h-screen bg-gray-50">
        <Header />
        <MainNavigation />
        
        {/* Breadcrumb - Cleaner styling */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <nav className="flex items-center space-x-2 text-sm text-gray-500" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-blue-600 transition-colors">Sākums</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/produkti" className="hover:text-blue-600 transition-colors">Produkti</Link>
              {product.navigation_categories && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <Link 
                    href={`/kategorijas/${product.navigation_categories.slug}`} 
                    className="hover:text-blue-600 transition-colors"
                  >
                    {product.navigation_categories.name}
                  </Link>
                </>
              )}
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-900 font-medium" aria-current="page">{product.name}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            
            {/* Image Gallery - Left Side */}
            <div className="xl:col-span-7">
              <div className="sticky top-8">
                <ProductGallery 
                  images={[...product.images, ...product.gallery]}
                  alt={product.name}
                  priority
                />
              </div>
            </div>

            {/* Product Info - Right Side */}
            <div className="xl:col-span-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sticky top-8">
                
                {/* Header Section */}
                <div className="space-y-6">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.featured && (
                      <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1">
                        <Award className="w-3 h-3 mr-1" />
                        Populārs
                      </Badge>
                    )}
                    
                    {hasDiscount && (
                      <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1">
                        -{discountPercent}% ATLAIDE
                      </Badge>
                    )}
                    
                    <Badge 
                      variant={isOutOfStock ? "destructive" : isLowStock ? "secondary" : "default"}
                      className={`px-3 py-1 ${
                        isOutOfStock 
                          ? "bg-red-50 text-red-700 border-red-200" 
                          : isLowStock 
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-green-50 text-green-700 border-green-200"
                      }`}
                    >
                      {isOutOfStock ? (
                        <>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Nav pieejams
                        </>
                      ) : isLowStock ? (
                        <>
                          <Package className="w-3 h-3 mr-1" />
                          Tikai {product.stock_quantity} gab.
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Pieejams
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Title and Rating */}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
                      {product.name}
                    </h1>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">(4.8) • 24 atsauksmes</span>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShare}
                        className="text-gray-400 hover:text-gray-600 p-2"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <p className="text-sm text-gray-500 mt-2 font-mono">SKU: {product.sku}</p>
                  </div>

                  {/* Short Description */}
                  {product.short_description && (
                    <p className="text-gray-700 leading-relaxed text-lg">
                      {product.short_description}
                    </p>
                  )}

                  {/* Color Variants */}
                  {product.relatedColors && product.relatedColors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                        <Palette className="w-4 h-4 mr-2 text-blue-600" />
                        Pieejamās krāsas
                      </h4>
                      <div className="grid grid-cols-3 gap-3">
                        {product.relatedColors.map((color) => (
                          <Link
                            key={color.id}
                            href={`/produkti/${color.slug}`}
                            className={`group relative aspect-4/3 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                              color.slug === product.slug 
                                ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Image
                              src={color.images[0] || '/no-image.png'}
                              alt={color.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                              sizes="80px"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Section */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="space-y-4">
                      {/* Price Display */}
                      <div className="flex items-baseline space-x-3">
                        {hasDiscount ? (
                          <>
                            <span className="text-4xl font-bold text-blue-600">
                              €{product.sale_price?.toFixed(2)}
                            </span>
                            <span className="text-xl text-gray-400 line-through">
                              €{product.price.toFixed(2)}
                            </span>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              Ietaupi €{(product.price - product.sale_price!).toFixed(2)}
                            </Badge>
                          </>
                        ) : (
                          <span className="text-4xl font-bold text-gray-900">
                            €{product.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">Daudzums:</span>
                        <div className="flex items-center border border-gray-300 rounded-lg bg-white">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(quantity - 1)}
                            disabled={quantity <= 1 || isOutOfStock}
                            className="px-3 py-2 rounded-l-lg hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          
                          <input
                            type="number"
                            min="1"
                            max={product.manage_stock ? product.stock_quantity : 999}
                            value={quantity}
                            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                            disabled={isOutOfStock}
                            className="w-16 text-center border-0 focus:ring-0 focus:outline-none py-2"
                          />
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuantityChange(quantity + 1)}
                            disabled={isOutOfStock || (product.manage_stock && quantity >= product.stock_quantity)}
                            className="px-3 py-2 rounded-r-lg hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {product.manage_stock && (
                          <span className="text-sm text-gray-500">
                            ({product.stock_quantity} pieejami)
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <Button
                          onClick={handleAddToCart}
                          disabled={isOutOfStock || addingToCart}
                          className={`flex-1 h-12 text-base font-semibold ${
                            isOutOfStock 
                              ? 'bg-gray-300 cursor-not-allowed text-gray-500' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                          } transition-all duration-200`}
                        >
                          {addingToCart ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Pievieno...
                            </>
                          ) : isOutOfStock ? (
                            'Nav pieejams'
                          ) : (
                            <>
                              <ShoppingCart className="w-5 h-5 mr-2" />
                              Pievienot grozam
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={handleWishlistToggle}
                          className={`h-12 px-4 border-2 ${
                            isWishlisted 
                              ? 'border-red-300 text-red-600 bg-red-50 hover:bg-red-100' 
                              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                          } transition-all duration-200`}
                        >
                          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-600' : ''}`} />
                        </Button>
                      </div>

                      {/* Total Price */}
                      {quantity > 1 && (
                        <div className="pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">Kopā ({quantity} gab.):</span>
                            <span className="text-2xl font-bold text-gray-900">
                              €{(effectivePrice * quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trust Signals */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      {
                        icon: <Truck className="w-5 h-5" />,
                        title: "Bezmaksas piegāde",
                        subtitle: "Virs €50",
                        color: "blue"
                      },
                      {
                        icon: <Shield className="w-5 h-5" />,
                        title: "2 gadu garantija",
                        subtitle: "Pilna garantija",
                        color: "green"
                      },
                      {
                        icon: <RotateCcw className="w-5 h-5" />,
                        title: "30 dienu atgriešana",
                        subtitle: "Bez jautājumiem",
                        color: "purple"
                      }
                    ].map((item, index) => (
                      <div
                        key={index}
                        className={`text-center p-4 rounded-xl border border-gray-100 bg-gradient-to-br ${
                          item.color === 'blue' 
                            ? 'from-blue-50 to-blue-100' 
                            : item.color === 'green'
                              ? 'from-green-50 to-green-100'
                              : 'from-purple-50 to-purple-100'
                        }`}
                      >
                        <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                          item.color === 'blue' 
                            ? 'bg-blue-600 text-white' 
                            : item.color === 'green'
                              ? 'bg-green-600 text-white'
                              : 'bg-purple-600 text-white'
                        }`}>
                          {item.icon}
                        </div>
                        <p className={`font-semibold text-sm ${
                          item.color === 'blue' 
                            ? 'text-blue-900' 
                            : item.color === 'green'
                              ? 'text-green-900'
                              : 'text-purple-900'
                        }`}>
                          {item.title}
                        </p>
                        <p className={`text-xs ${
                          item.color === 'blue' 
                            ? 'text-blue-700' 
                            : item.color === 'green'
                              ? 'text-green-700'
                              : 'text-purple-700'
                        }`}>
                          {item.subtitle}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Section - Full Width Below */}
          <div className="mt-16 space-y-8">
            
            {/* Specifications */}
            {(product.weight || product.dimensions) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Ruler className="w-6 h-6 mr-3 text-blue-600" />
                  Specifikācijas
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {product.dimensions?.length && (
                    <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Garums</p>
                      <p className="text-xl font-bold text-gray-900">{product.dimensions.length} cm</p>
                    </div>
                  )}
                  
                  {product.dimensions?.width && (
                    <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Platums</p>
                      <p className="text-xl font-bold text-gray-900">{product.dimensions.width} cm</p>
                    </div>
                  )}
                  
                  {product.dimensions?.height && (
                    <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Augstums</p>
                      <p className="text-xl font-bold text-gray-900">{product.dimensions.height} cm</p>
                    </div>
                  )}
                  
                  {product.weight && (
                    <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <p className="text-sm text-gray-600 mb-1">Svars</p>
                      <p className="text-xl font-bold text-gray-900 flex items-center justify-center">
                        <Weight className="w-5 h-5 mr-2" />
                        {product.weight} kg
                      </p>
                    </div>
                  )}
                </div>

                {product.dimensions?.length && product.dimensions?.width && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-800 flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      Aizņems aptuveni <strong className="mx-1">{((product.dimensions.length * product.dimensions.width) / 10000).toFixed(2)} m²</strong> no jūsu telpas
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Product Description */}
            {product.description && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Detalizēts apraksts</h3>
                <div 
                  className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}