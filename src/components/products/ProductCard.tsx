'use client'

import { useState, memo, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Heart, 
  ShoppingCart, 
  Star,
  Eye,
  Tag,
  TrendingUp
} from 'lucide-react'
import { ProductPlaceholder } from '../ui/ProductPlaceholder'

interface Product {
  id: string
  name: string
  slug: string
  short_description: string
  price: number
  sale_price?: number
  images: string[]
  stock_quantity?: number
  featured?: boolean
  sku?: string
  navigation_categories?: {
    name: string
    slug: string
  }
}

interface ProductCardProps {
  product: Product
  viewMode?: 'grid' | 'list'
  priority?: boolean
  imageStyle?: 'cover' | 'contain'
  onAddToCart?: (productId: string) => void
  onWishlistToggle?: (productId: string, inWishlist: boolean) => void
}

const ProductCard = memo(function ProductCard({ 
  product, 
  viewMode = 'grid',
  priority = false,
  imageStyle = 'cover',
  onAddToCart,
  onWishlistToggle
}: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const effectivePrice = product.sale_price || product.price
  const hasDiscount = product.sale_price && product.sale_price < product.price
  const discountPercent = hasDiscount ? Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0
  const isOutOfStock = product.stock_quantity !== undefined && product.stock_quantity === 0
  const isLowStock = product.stock_quantity !== undefined && product.stock_quantity > 0 && product.stock_quantity <= 5
  
  const mainImage: string | undefined = product.images?.[0]

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '50px' }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isOutOfStock || isLoading) return
    
    setIsLoading(true)
    try {
      await onAddToCart?.(product.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const newWishlistState = !isWishlisted
    setIsWishlisted(newWishlistState)
    
    try {
      await onWishlistToggle?.(product.id, newWishlistState)
    } catch (error) {
      // Revert on error
      setIsWishlisted(!newWishlistState)
    }
  }

  const productUrl = `/produkti/${product.slug}`

  if (viewMode === 'list') {
    return (
      <article ref={cardRef} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
        <div className="flex">
          {/* Product Image */}
          <div className="aspect-[4/3] w-48 h-48 flex-shrink-0 relative overflow-hidden">
            <Link href={productUrl} className="block w-full h-full">
              {isVisible && !imageError && mainImage ? (
                <Image
                  src={mainImage}
                  alt={`${product.name} - produkta attēls`}
                  fill
                  sizes="(max-width: 768px) 192px, 192px"
                  className={`object-${imageStyle} group-hover:scale-105 transition-transform duration-300`}
                  priority={priority}
                  onError={() => setImageError(true)}
                />
              ) : (
                <ProductPlaceholder className="w-full h-full" />
              )}
              
              {/* Badges */}
              <div className="absolute top-3 left-3 space-y-2">
                {product.featured && (
                  <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Populārs
                  </Badge>
                )}
                {hasDiscount && (
                  <Badge variant="destructive" className="bg-red-500">
                    -{discountPercent}%
                  </Badge>
                )}
                {isOutOfStock && (
                  <Badge variant="secondary" className="bg-gray-500 text-white">
                    Nav pieejams
                  </Badge>
                )}
                {isLowStock && !isOutOfStock && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Pēdējie {product.stock_quantity}
                  </Badge>
                )}
              </div>

              {/* Wishlist Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm hover:bg-white opacity-0 group-hover:opacity-100 transition-all duration-200"
                onClick={handleWishlistToggle}
                aria-label={isWishlisted ? "Noņemt no vēlmju saraksta" : "Pievienot vēlmju sarakstam"}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </Button>
            </Link>
          </div>

          {/* Product Details */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <Link href={productUrl} className="block group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    {product.navigation_categories && (
                      <p className="text-sm text-gray-500 mt-1">
                        {product.navigation_categories.name}
                      </p>
                    )}
                  </div>
                </div>
                
                {product.short_description && (
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                    {product.short_description}
                  </p>
                )}
              </Link>

              {/* Price and Stock Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-baseline space-x-3">
                  {hasDiscount ? (
                    <>
                      <span className="text-xl font-bold text-red-600">
                        €{product.sale_price?.toFixed(2)}
                      </span>
                      <span className="text-lg text-gray-500 line-through">
                        €{product.price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-xl font-bold text-gray-900">
                      €{product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                
                {product.sku && (
                  <p className="text-xs text-gray-500 font-mono">SKU: {product.sku}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || isLoading}
                className={`flex-1 ${isOutOfStock ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                aria-label={`Pievienot ${product.name} iepirkumu grozam`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="w-4 h-4 mr-2" />
                )}
                {isOutOfStock ? 'Nav pieejams' : 'Pirkt'}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                asChild
                aria-label={`Apskatīt ${product.name} detaļas`}
              >
                <Link href={productUrl}>
                  <Eye className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </article>
    )
  }

  // Grid mode (default)
  return (
    <article ref={cardRef} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Product Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Link href={productUrl} className="block w-full h-full">
          {isVisible && !imageError && mainImage ? (
            <Image
              src={mainImage}
              alt={`${product.name} - produkta attēls`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-${imageStyle} group-hover:scale-105 transition-transform duration-300`}
              priority={priority}
              onError={() => setImageError(true)}
            />
          ) : (
            <ProductPlaceholder className="w-full h-full" />
          )}
        </Link>

        {/* Badges pa kreisi */}
        <div className="absolute top-3 left-3 space-y-2 flex flex-col items-start">
          {product.featured && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
              <TrendingUp className="w-3 h-3 mr-1" />
              Populārs
            </Badge>
          )}
          {hasDiscount && (
            <Badge variant="destructive" className="bg-red-500">
              -{discountPercent}%
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="secondary" className="bg-gray-500 text-white">
              Nav pieejams
            </Badge>
          )}
        </div>

        <div className="absolute top-3 right-3 space-y-2 flex flex-col items-end">
          {isLowStock && !isOutOfStock && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Atlikusi tikai <strong>{product.stock_quantity}</strong> prece
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm hover:bg-white opacity-0 group-hover:opacity-100 transition-all duration-200"
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? "Noņemt no vēlmju saraksta" : "Pievienot vēlmju sarakstam"}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </Button>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isLoading}
            className={`w-full ${isOutOfStock ? 'bg-gray-400' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
            size="sm"
            aria-label={`Pievienot ${product.name} iepirkumu grozam`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <ShoppingCart className="w-4 h-4 mr-2" />
            )}
            {isOutOfStock ? 'Nav pieejams' : 'Pirkt'}
          </Button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4">
        <Link href={productUrl} className="block group">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-tight mb-2">
            {product.name}
          </h3>
          
          {product.navigation_categories && (
            <p className="text-sm text-gray-500 mb-2">
              {product.navigation_categories.name}
            </p>
          )}
          
          {product.short_description && (
            <p className="text-gray-600 text-sm line-clamp-2 mb-3 leading-relaxed">
              {product.short_description}
            </p>
          )}
        </Link>

        {/* Price */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline space-x-2">
            {hasDiscount ? (
              <>
                <span className="text-xl font-bold text-red-600">
                  €{product.sale_price?.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  €{product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-gray-900">
                €{product.price.toFixed(2)}
              </span>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Apskatīt ${product.name} detaļas`}
          >
            <Link href={productUrl}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {product.sku && (
          <p className="text-xs text-gray-500 font-mono mt-2">SKU: {product.sku}</p>
        )}
      </div>
    </article>
  )
})

export default ProductCard