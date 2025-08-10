// src/components/products/ProductCard.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { 
  Heart, 
  ShoppingCart, 
  Star,
  Eye,
  Tag
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
}

interface ProductCardProps {
  product: Product
  viewMode?: 'grid' | 'list'
}

export default function ProductCard({ product, viewMode = 'grid' }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const effectivePrice = product.sale_price || product.price
  const hasDiscount = product.sale_price && product.sale_price < product.price
  const discountPercent = hasDiscount ? Math.round(((product.price - product.sale_price!) / product.price) * 100) : 0
  
  const mainImage = product.images?.[0] || '/placeholder-product.jpg'

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Add to cart:', product.id)
    // TODO: Implement cart functionality
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsWishlisted(!isWishlisted)
    // TODO: Implement wishlist functionality
  }

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="flex">
          {/* Product Image */}
          <div className="w-48 h-48 flex-shrink-0 relative overflow-hidden">
            <Link href={`/produkti/${product.slug}`}>
              {!imageError ? (
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={() => setImageError(true)}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              ) : (
                <ProductPlaceholder className="w-full h-full" />
              )}
            </Link>
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {hasDiscount && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{discountPercent}%
                </span>
              )}
              {product.featured && (
                <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  TOP
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                size="sm"
                variant="outline"
                className="w-10 h-10 rounded-full bg-white shadow-lg border-0"
                onClick={handleWishlistToggle}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </Button>
              
              <Link href={`/produkti/${product.slug}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-10 h-10 rounded-full bg-white shadow-lg border-0"
                >
                  <Eye className="w-4 h-4 text-gray-600" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <Link href={`/produkti/${product.slug}`}>
                <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>
              
              {product.short_description && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {product.short_description}
                </p>
              )}

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="text-sm text-gray-500 ml-2">(4.8)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {/* Price */}
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  €{effectivePrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-gray-500 line-through">
                    €{product.price.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Add to Cart */}
              <Button
                onClick={handleAddToCart}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={product.stock_quantity === 0}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {product.stock_quantity === 0 ? 'Nav pieejams' : 'Grozā'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden">
        <Link href={`/produkti/${product.slug}`}>
          {!imageError ? (
            <Image
              src={mainImage}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Tag className="w-8 h-8 text-gray-500" />
                </div>
                <p className="text-sm text-gray-500">Nav attēla</p>
              </div>
            </div>
          )}
        </Link>
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {hasDiscount && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              -{discountPercent}%
            </span>
          )}
          {product.featured && (
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              TOP
            </span>
          )}
          {product.stock_quantity === 0 && (
            <span className="bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              Nav pieejams
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            size="sm"
            variant="outline"
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border-0 hover:bg-white"
            onClick={handleWishlistToggle}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </Button>
          
          <Link href={`/produkti/${product.slug}`}>
            <Button
              size="sm"
              variant="outline"
              className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border-0 hover:bg-white"
            >
              <Eye className="w-4 h-4 text-gray-600" />
            </Button>
          </Link>
        </div>

        {/* Quick Add to Cart */}
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            disabled={product.stock_quantity === 0}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {product.stock_quantity === 0 ? 'Nav pieejams' : 'Pievienot grozam'}
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6">
        <Link href={`/produkti/${product.slug}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        
        {product.short_description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {product.short_description}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center space-x-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          ))}
          <span className="text-xs text-gray-500 ml-1">(4.8)</span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">
              €{effectivePrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                €{product.price.toFixed(2)}
              </span>
            )}
          </div>
          
          {product.stock_quantity !== undefined && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              product.stock_quantity > 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {product.stock_quantity > 0 ? `${product.stock_quantity} gab.` : 'Nav pieejams'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}