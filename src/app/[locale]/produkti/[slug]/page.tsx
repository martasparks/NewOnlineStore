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
  Palette
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

     <div className="min-h-screen bg-white">
       <Header />
       <MainNavigation />
       
       <div className="max-w-7xl mx-auto px-4 py-8">
         <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
           <Link href="/" className="hover:text-gray-700 transition-colors">Sākums</Link>
           <ChevronRight className="w-4 h-4" />
           <Link href="/produkti" className="hover:text-gray-700 transition-colors">Produkti</Link>
           {product.navigation_categories && (
             <>
               <ChevronRight className="w-4 h-4" />
               <Link 
                 href={`/kategorijas/${product.navigation_categories.slug}`} 
                 className="hover:text-gray-700 transition-colors"
               >
                 {product.navigation_categories.name}
               </Link>
             </>
           )}
           <ChevronRight className="w-4 h-4" />
           <span className="text-gray-900 font-medium" aria-current="page">{product.name}</span>
         </nav>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

           <div className="lg:sticky lg:top-8 lg:h-fit">
             <ProductGallery 
               images={[...product.images, ...product.gallery]}
               alt={product.name}
               priority
             />
           </div>

           <div className="space-y-8">

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
                         Palikuši tikai {product.stock_quantity} gab.
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

               {product.short_description && (
                 <p className="text-lg text-gray-700 leading-relaxed">
                   {product.short_description}
                 </p>
               )}

              {product.relatedColors && (
                <div className="mt-6">
                  {product.relatedColors.length > 0 ? (
                    <>
                      <h4 className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2">
                        <Palette className="w-4 h-4 mr-1 text-red-500" />
                        Pieejamās krāsas:
                      </h4>
                      <div className="flex space-x-2">
                        {product.relatedColors.map((color) => (
                          <Link
                            key={color.id}
                            href={`/produkti/${color.slug}`}
                            aria-current={color.slug === product.slug ? 'true' : undefined}
                            className={`border rounded-lg overflow-hidden relative w-28 aspect-[4/3] group
                              ${color.slug === product.slug ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-gray-400'}`}
                          >
                            <Image
                              src={color.images[0] || '/no-image.png'}
                              alt={`${color.name}${color.sku ? ` (SKU: ${color.sku})` : ''}`}
                              fill
                              className="object-cover group-hover:brightness-75 transition-all duration-200"
                              sizes="96px"
                              quality={90}
                            />
                              <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <span className="bg-black text-white text-xs px-1 py-1 rounded-t text-center leading-tight max-w-full">
                                  {color.name}
                                </span>
                              </div>
                          </Link>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: <Truck className="w-6 h-6 text-white" />,
                    title: "Bezmaksas piegāde",
                    subtitle: "Pasūtījumiem virs €50",
                    bg: "bg-blue-50",
                    iconBg: "bg-blue-600",
                    titleColor: "text-blue-900",
                    subtitleColor: "text-blue-700",
                  },
                  {
                    icon: <Shield className="w-6 h-6 text-white" />,
                    title: "2 gadu garantija",
                    subtitle: "Pilna kvalitātes garantija",
                    bg: "bg-green-50",
                    iconBg: "bg-green-600",
                    titleColor: "text-green-900",
                    subtitleColor: "text-green-700",
                  },
                  {
                    icon: <RotateCcw className="w-6 h-6 text-white" />,
                    title: "30 dienu atgriešana",
                    subtitle: "Bez jautājumiem",
                    bg: "bg-purple-50",
                    iconBg: "bg-purple-600",
                    titleColor: "text-purple-900",
                    subtitleColor: "text-purple-700",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex flex-col items-center text-center p-6 rounded-xl shadow-sm ${item.bg}`}
                  >
                    <div
                      className={`w-14 h-14 ${item.iconBg} rounded-full flex items-center justify-center mb-3`}
                    >
                      {item.icon}
                    </div>
                    <p className={`font-semibold text-lg ${item.titleColor}`}>{item.title}</p>
                    <p className={`text-sm ${item.subtitleColor}`}>{item.subtitle}</p>
                  </div>
                ))}
              </div>

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

                  {product.dimensions?.length && product.dimensions?.width && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <Package className="w-4 h-4 inline mr-1" />
                        Mēbele aizņems (aptuveni): <strong>{((product.dimensions.length * product.dimensions.width) / 10000).toFixed(2)} m²</strong> no Jūsu telpas
                      </p>
                    </div>
                  )}
               </div>
             )}

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