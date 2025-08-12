'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, notFound } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
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
  Palette
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

  // SEO Meta data
  const metaTitle = product?.meta_title || `${product?.name} | Marta's Mēbeles`
  const metaDescription = product?.meta_description || product?.short_description || product?.description?.substring(0, 160)

  useEffect(() => {
    if (slug) {
      fetchProduct(slug)
    }
  }, [slug])

  const fetchProduct = async (productSlug: string) => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/products/${productSlug}`)
        
        if (response.status === 404) {
          notFound()
          return
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
      // TODO: Implement cart API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      // Success feedback
      console.log(`Added ${quantity}x ${product.name} to cart`)
      
      // Reset quantity after successful add
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
      // TODO: Implement wishlist API call
      console.log(`${isWishlisted ? 'Removed from' : 'Added to'} wishlist: ${product.name}`)
    } catch (error) {
      // Revert on error
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
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href)
        // TODO: Show toast notification
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
    return null
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
        
        {/* JSON-LD Structured Data */}
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

     <div className="min-h-screen bg-white">
       <Header />
       <MainNavigation />
       
       <div className="max-w-7xl mx-auto px-4 py-8">
         {/* Breadcrumbs */}
         <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
           <a href="/" className="hover:text-gray-700 transition-colors">Sākums</a>
           <ChevronRight className="w-4 h-4" />
           <a href="/produkti" className="hover:text-gray-700 transition-colors">Produkti</a>
           {product.navigation_categories && (
             <>
               <ChevronRight className="w-4 h-4" />
               <a 
                 href={`/kategorijas/${product.navigation_categories.slug}`} 
                 className="hover:text-gray-700 transition-colors"
               >
                 {product.navigation_categories.name}
               </a>
             </>
           )}
           <ChevronRight className="w-4 h-4" />
           <span className="text-gray-900 font-medium" aria-current="page">{product.name}</span>
         </nav>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
           {/* Product Gallery */}
           <div className="lg:sticky lg:top-8 lg:h-fit">
             <ProductGallery 
               images={[...product.images, ...product.gallery]}
               alt={product.name}
               priority
             />
           </div>

           {/* Product Information */}
           <div className="space-y-8">
             {/* Product Header */}
             <div className="space-y-4">
               <div className="flex items-start justify-between">
                 <div className="flex-1">
                   <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                     {product.name}
                   </h1>
                   
                   <div className="flex items-center space-x-4 mt-3">
                     <p className="text-gray-600 font-mono text-sm">SKU: {product.sku}</p>
                     <div className="flex items-center space-x-1">
                       {[...Array(5)].map((_, i) => (
                         <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                       ))}
                       <span className="text-sm text-gray-600 ml-2">(4.8) 24 atsauksmes</span>
                     </div>
                   </div>

                   {/* Status Badges */}
                   <div className="flex items-center space-x-3 mt-4">
                     {product.featured && (
                       <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                         <Award className="w-3 h-3 mr-1" />
                         Populārs
                       </Badge>
                     )}
                     
                     {hasDiscount && (
                       <Badge variant="destructive" className="bg-red-500">
                         -{discountPercent}% ATLAIDE
                       </Badge>
                     )}
                     
                     {isOutOfStock ? (
                       <Badge variant="secondary" className="bg-red-100 text-red-800">
                         <AlertCircle className="w-3 h-3 mr-1" />
                         Nav pieejams
                       </Badge>
                     ) : isLowStock ? (
                       <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                         <Package className="w-3 h-3 mr-1" />
                         Tikai {product.stock_quantity} gab.
                       </Badge>
                     ) : (
                       <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                         <Check className="w-3 h-3 mr-1" />
                         Pieejams
                       </Badge>
                     )}
                   </div>
                 </div>
                 
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={handleShare}
                   className="text-gray-400 hover:text-gray-600"
                   aria-label="Dalīties ar produktu"
                 >
                   <Share2 className="w-5 h-5" />
                 </Button>
               </div>

               {/* Short Description */}
               {product.short_description && (
                 <p className="text-lg text-gray-700 leading-relaxed">
                   {product.short_description}
                 </p>
               )}

               {/* Related Colors */}
              {product.relatedColors && (
                <div className="mt-4">
                  {product.relatedColors.length > 0 ? (
                    <>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        <Palette className="w-4 h-4 mr-1 inline text-gray-500" />
                        Pieejamās krāsas:
                      </h4>
                      <div className="flex space-x-2">
                        {product.relatedColors.map((color) => (
                          <a
                            key={color.id}
                            href={`/produkti/${color.slug}`}
                            aria-current={color.slug === product.slug ? 'true' : undefined}
                            className={`border rounded-lg overflow-hidden w-16 h-16 flex items-center justify-center 
                              ${color.slug === product.slug ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-400'}`}
                            title={`${color.name}${color.sku ? ` (SKU: ${color.sku})` : ''}`}
                          >
                            <Image
                              src={color.images[0] || '/no-image.png'}
                              alt={`${color.name}${color.sku ? ` (SKU: ${color.sku})` : ''}`}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          </a>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center flex-start gap-2">
                        <Palette className="w-5 h-5 text-red-500" />
                        <span className="text-md">Pieejamās krāsas:</span>
                      </h4>
                      <p className="text-gray-600 text-sm">Šī prece ir pieejama tikai vienā krāsā.</p>
                    </>
                  )}
                </div>
              )}

             </div>

             {/* Pricing */}
             <div className="bg-gray-50 rounded-xl p-6">
               <div className="flex items-baseline justify-between mb-4">
                 <div className="flex items-baseline space-x-3">
                   {hasDiscount ? (
                     <>
                       <span className="text-3xl font-bold text-red-600">
                         €{product.sale_price?.toFixed(2)}
                       </span>
                       <span className="text-xl text-gray-500 line-through">
                         €{product.price.toFixed(2)}
                       </span>
                       <Badge variant="destructive" className="text-xs">
                         Ietaupi €{(product.price - product.sale_price!).toFixed(2)}
                       </Badge>
                     </>
                   ) : (
                     <span className="text-3xl font-bold text-gray-900">
                       €{product.price.toFixed(2)}
                     </span>
                   )}
                 </div>
               </div>

               {/* Quantity Selector */}
               <div className="flex items-center space-x-4 mb-6">
                 <div className="flex items-center space-x-3">
                   <span className="text-sm font-medium text-gray-700">Daudzums:</span>
                   <div className="flex items-center border border-gray-300 rounded-lg">
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleQuantityChange(quantity - 1)}
                       disabled={quantity <= 1 || isOutOfStock}
                       className="px-3 py-1"
                       aria-label="Samazināt daudzumu"
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
                       className="w-16 text-center border-0 focus:ring-0 focus:outline-none"
                       aria-label="Produkta daudzums"
                     />
                     
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => handleQuantityChange(quantity + 1)}
                       disabled={
                         isOutOfStock || 
                         (product.manage_stock && quantity >= product.stock_quantity)
                       }
                       className="px-3 py-1"
                       aria-label="Palielināt daudzumu"
                     >
                       <Plus className="w-4 h-4" />
                     </Button>
                   </div>
                 </div>

                 {product.manage_stock && (
                   <span className="text-sm text-gray-600">
                     ({product.stock_quantity} pieejami)
                   </span>
                 )}
               </div>

               {/* Action Buttons */}
               <div className="flex space-x-4">
                 <Button
                   onClick={handleAddToCart}
                   disabled={isOutOfStock || addingToCart}
                   className={`flex-1 h-12 text-lg ${
                     isOutOfStock 
                       ? 'bg-gray-400 cursor-not-allowed' 
                       : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                   }`}
                   aria-label={`Pievienot ${quantity} ${product.name} iepirkumu grozam`}
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
                   className={`h-12 px-6 ${
                     isWishlisted 
                       ? 'border-red-500 text-red-500 hover:bg-red-50' 
                       : 'hover:bg-gray-50'
                   }`}
                   aria-label={isWishlisted ? 'Noņemt no vēlmju saraksta' : 'Pievienot vēlmju sarakstam'}
                 >
                   <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500' : ''}`} />
                 </Button>
               </div>

               {/* Total Price */}
               {quantity > 1 && (
                 <div className="mt-4 pt-4 border-t border-gray-200">
                   <div className="flex justify-between items-center">
                     <span className="text-gray-700">Kopā ({quantity} gab.):</span>
                     <span className="text-xl font-bold text-gray-900">
                       €{(effectivePrice * quantity).toFixed(2)}
                     </span>
                   </div>
                 </div>
               )}
             </div>

             {/* Product Features */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                 <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                   <Truck className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <p className="font-semibold text-blue-900">Bezmaksas piegāde</p>
                   <p className="text-sm text-blue-700">Pasūtījumiem virs €50</p>
                 </div>
               </div>
               
               <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                 <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                   <Shield className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <p className="font-semibold text-green-900">2 gadu garantija</p>
                   <p className="text-sm text-green-700">Pilna kvalitātes garantija</p>
                 </div>
               </div>
               
               <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                 <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                   <RotateCcw className="w-5 h-5 text-white" />
                 </div>
                 <div>
                   <p className="font-semibold text-purple-900">30 dienu atgriešana</p>
                   <p className="text-sm text-purple-700">Bez jautājumiem</p>
                 </div>
               </div>
             </div>

             {/* Product Specifications */}
             {(product.weight || product.dimensions) && (
               <div className="bg-white border border-gray-200 rounded-xl p-6">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                   <Ruler className="w-5 h-5 mr-2 text-gray-600" />
                   Specifikācijas
                 </h3>
                 
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {product.dimensions?.length && (
                     <div className="text-center p-3 bg-gray-50 rounded-lg">
                       <p className="text-sm text-gray-600">Garums</p>
                       <p className="font-semibold text-gray-900">{product.dimensions.length} cm</p>
                     </div>
                   )}
                   
                   {product.dimensions?.width && (
                     <div className="text-center p-3 bg-gray-50 rounded-lg">
                       <p className="text-sm text-gray-600">Platums</p>
                       <p className="font-semibold text-gray-900">{product.dimensions.width} cm</p>
                     </div>
                   )}
                   
                   {product.dimensions?.height && (
                     <div className="text-center p-3 bg-gray-50 rounded-lg">
                       <p className="text-sm text-gray-600">Augstums</p>
                       <p className="font-semibold text-gray-900">{product.dimensions.height} cm</p>
                     </div>
                   )}
                   
                   {product.weight && (
                     <div className="text-center p-3 bg-gray-50 rounded-lg">
                       <p className="text-sm text-gray-600">Svars</p>
                       <p className="font-semibold text-gray-900 flex items-center justify-center">
                         <Weight className="w-4 h-4 mr-1" />
                         {product.weight} kg
                       </p>
                     </div>
                   )}
                 </div>

                 {/* Volume calculation */}
                 {product.dimensions?.length && product.dimensions?.width && product.dimensions?.height && (
                   <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                     <p className="text-sm text-blue-700">
                       <Package className="w-4 h-4 inline mr-1" />
                       Tilpums: {((product.dimensions.length * product.dimensions.width * product.dimensions.height) / 1000000).toFixed(3)} m³
                     </p>
                   </div>
                 )}
               </div>
             )}

             {/* Product Description */}
             {product.description && (
               <div className="bg-white border border-gray-200 rounded-xl p-6">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4">Apraksts</h3>
                 <div 
                   className="prose max-w-none text-gray-700 leading-relaxed"
                   dangerouslySetInnerHTML={{ __html: product.description }}
                 />
               </div>
             )}
           </div>
         </div>
       </div>
     </div>
   </>
 )
}