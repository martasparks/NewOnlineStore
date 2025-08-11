'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductPlaceholder } from '@/components/ui/ProductPlaceholder'

interface ProductGalleryProps {
  images: string[]
  alt: string
}

export default function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [currentImage, setCurrentImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isZoomed) {
      if (e.key === 'Escape') {
        setIsZoomed(false)
      } else if (e.key === 'ArrowLeft') {
        prevImage()
      } else if (e.key === 'ArrowRight') {
        nextImage()
      }
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [isZoomed])

  const hasImages = images && images.length > 0

  if (!hasImages || imageError) {
    return (
      <div className="aspect-square rounded-lg overflow-hidden">
        <ProductPlaceholder className="w-full h-full" />
      </div>
    )
  }

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="space-y-4">

      <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden group">
        {!imageError ? (
          <Image
            src={images[currentImage]}
            alt={`${alt} - attēls ${currentImage + 1}`}
            fill
            className="object-contain object-center cursor-zoom-in"
            onClick={() => setIsZoomed(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <ProductPlaceholder className="w-full h-full" />
        )}

        {images.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm"
              onClick={prevImage}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm"
              onClick={nextImage}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="icon"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm"
          onClick={() => setIsZoomed(true)}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
            {currentImage + 1} / {images.length}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentImage(index)
                setImageError(false)
              }}
              className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                index === currentImage 
                  ? 'border-red-500 ring-2 ring-red-200' 
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <Image
                src={image}
                alt={`${alt} - sīkattēls ${index + 1}`}
                fill
                className="object-contain bg-gray-50"
                onError={() => setImageError(true)}
              />
            </button>
          ))}
        </div>
      )}

      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {!imageError ? (
              <Image
                src={images[currentImage]}
                alt={`${alt} - palielināts attēls`}
                width={800}
                height={800}
                className="max-w-full max-h-full object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <ProductPlaceholder className="w-[800px] h-[800px]" />
            )}
            
            {images.length > 1 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}
            
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-full">
                {currentImage + 1} / {images.length}
              </div>
            )}
            
            <Button
              variant="outline"
              className="absolute top-4 right-4 bg-white/90 hover:bg-white"
              onClick={() => setIsZoomed(false)}
            >
              Aizvērt
            </Button>
          </div>

          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => setIsZoomed(false)}
          />
        </div>
      )}

    </div>
  )
}