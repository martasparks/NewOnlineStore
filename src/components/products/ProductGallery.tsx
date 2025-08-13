'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  Maximize2,
  X,
  RotateCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductPlaceholder } from '@/components/ui/ProductPlaceholder'

interface ProductGalleryProps {
  images: string[]
  alt: string
  priority?: boolean
}

interface TouchPosition {
  x: number
  y: number
}

export default function ProductGallery({ images, alt, priority = false }: ProductGalleryProps) {
  const [currentImage, setCurrentImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [imageError, setImageError] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [rotation, setRotation] = useState(0)
  
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null)
  const [touchEnd, setTouchEnd] = useState<TouchPosition | null>(null)
  
  const galleryRef = useRef<HTMLDivElement>(null)
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([])

  const hasImages = images && images.length > 0
  const minSwipeDistance = 50

  const nextImage = useCallback(() => {
    if (!hasImages) return
    setCurrentImage((prev) => (prev + 1) % images.length)
    setZoomLevel(1)
    setRotation(0)
  }, [hasImages, images.length])

  const prevImage = useCallback(() => {
    if (!hasImages) return
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length)
    setZoomLevel(1)
    setRotation(0)
  }, [hasImages, images.length])

  const goToImage = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentImage(index)
      setZoomLevel(1)
      setRotation(0)
      setImageError(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }, [images.length])

  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 3))
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 1))
  const resetZoom = () => setZoomLevel(1)

  const rotateImage = () => setRotation(prev => (prev + 90) % 360)

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distanceX = touchStart.x - touchEnd.x
    const distanceY = touchStart.y - touchEnd.y
    const isLeftSwipe = distanceX > minSwipeDistance
    const isRightSwipe = distanceX < -minSwipeDistance
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX)

    if (!isVerticalSwipe) {
      if (isLeftSwipe && images.length > 1) {
        nextImage()
      }
      if (isRightSwipe && images.length > 1) {
        prevImage()
      }
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasImages) return

      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false)
          } else if (isZoomed) {
            setIsZoomed(false)
          }
          break
        case 'ArrowLeft':
          if (images.length > 1) {
            e.preventDefault()
            prevImage()
          }
          break
        case 'ArrowRight':
          if (images.length > 1) {
            e.preventDefault()
            nextImage()
          }
          break
        case 'f':
        case 'F':
          if (!isZoomed) {
            e.preventDefault()
            setIsFullscreen(!isFullscreen)
          }
          break
        case '+':
        case '=':
          if (isZoomed || isFullscreen) {
            e.preventDefault()
            zoomIn()
          }
          break
        case '-':
          if (isZoomed || isFullscreen) {
            e.preventDefault()
            zoomOut()
          }
          break
        case 'r':
        case 'R':
          if (isZoomed || isFullscreen) {
            e.preventDefault()
            rotateImage()
          }
          break
        case '0':
          if (isZoomed || isFullscreen) {
            e.preventDefault()
            resetZoom()
            setRotation(0)
          }
          break
      }
    }

    if (isZoomed || isFullscreen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isZoomed, isFullscreen, hasImages, images.length, nextImage, prevImage])

  useEffect(() => {
    if (thumbnailRefs.current[currentImage]) {
      thumbnailRefs.current[currentImage]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      })
    }
  }, [currentImage])

  const handleImageError = (index: number) => {
    setImageError(prev => new Set([...prev, index]))
  }

  useEffect(() => {
    if (hasImages) {
      const timer = setTimeout(() => setIsLoading(false), 500)
      return () => clearTimeout(timer)
    }
  }, [hasImages])

  if (!hasImages) {
    return (
      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
        <ProductPlaceholder className="w-full h-full" />
      </div>
    )
  }

  return (
    <div ref={galleryRef} className="space-y-4">

      <div 
        className="relative aspect-[4/3] bg-gray-50 rounded-xl overflow-hidden group cursor-pointer"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => setIsZoomed(true)}
      >
        {!imageError.has(currentImage) && images[currentImage] ? (
          <Image
            src={images[currentImage]}
            alt={`${alt} - attēls ${currentImage + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
            className="object-contain object-center transition-transform duration-200 hover:scale-105"
            priority={priority && currentImage === 0}
            onError={() => handleImageError(currentImage)}
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          <ProductPlaceholder className="w-full h-full" />
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
              onClick={(e) => {
                e.stopPropagation()
                prevImage()
              }}
              aria-label="Iepriekšējais attēls"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
              onClick={(e) => {
                e.stopPropagation()
                nextImage()
              }}
              aria-label="Nākamais attēls"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}

        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
          onClick={(e) => {
            e.stopPropagation()
            setIsZoomed(true)
          }}
          aria-label="Palielināt attēlu"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
          onClick={(e) => {
            e.stopPropagation()
            setIsFullscreen(true)
          }}
          aria-label="Pilnekrāna režīms"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>

        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm">
            {currentImage + 1} / {images.length}
          </div>
        )}
      </div>

        {images.length > 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {images.map((image, index) => (
                <button
                  key={`thumb-${index}`}
                  ref={(el) => {
                    thumbnailRefs.current[index] = el
                  }}
                  onClick={() => goToImage(index)}
                  className={`group relative aspect-[4/3] rounded-2xl overflow-hidden transition-all duration-300 ease-out ${
                    index === currentImage
                      ? 'ring-3 ring-blue-500 ring-offset-2 ring-offset-white shadow-lg scale-105'
                      : 'ring-2 ring-gray-200 hover:ring-gray-300 hover:scale-102 hover:shadow-md'
                  }`}
                  aria-label={`Apskatīt attēlu ${index + 1}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50" />
                  
                  {!imageError.has(index) ? (
                    <Image
                      src={image}
                      alt={`${alt} - sīkattēls ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                      className="object-contain p-1 transition-transform duration-300 group-hover:scale-105"
                      quality={90}
                      priority={index < 6}
                      onError={() => handleImageError(index)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <ProductPlaceholder className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  
                  {index === currentImage && (
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 via-transparent to-transparent" />
                  )}
                  
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
                  
                  {index === currentImage && (
                    <div className="absolute bottom-2 right-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm" />
                    </div>
                  )}
                  
                  <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-md font-medium">
                      {index + 1}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
          </div>
        )}

      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="relative max-w-5xl max-h-full w-full h-full flex items-center justify-center">
            {!imageError.has(currentImage) && images[currentImage] ? (
              <div 
                className="relative transition-transform duration-200"
                style={{ 
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }}
              >
                <Image
                  src={images[currentImage]}
                  alt={`${alt} - palielināts attēls`}
                  width={800}
                  height={800}
                  className="max-w-full max-h-full object-contain"
                  onError={() => handleImageError(currentImage)}
                />
              </div>
            ) : (
              <ProductPlaceholder className="w-[600px] h-[600px]" />
            )}
            
            <div className="absolute top-4 left-4 flex space-x-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={zoomOut}
                disabled={zoomLevel <= 1}
                className="bg-white/90 hover:bg-white"
                aria-label="Samazināt"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                onClick={zoomIn}
                disabled={zoomLevel >= 3}
                className="bg-white/90 hover:bg-white"
                aria-label="Palielināt"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                onClick={rotateImage}
                className="bg-white/90 hover:bg-white"
                aria-label="Pagriezt"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsFullscreen(true)}
                className="bg-white/90 hover:bg-white"
                aria-label="Pilnekrāns"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>

            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                  onClick={prevImage}
                  aria-label="Iepriekšējais attēls"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white"
                  onClick={nextImage}
                  aria-label="Nākamais attēls"
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
              variant="secondary"
              className="absolute top-4 right-4 bg-white/90 hover:bg-white"
              onClick={() => {
                setIsZoomed(false)
                setZoomLevel(1)
                setRotation(0)
              }}
              aria-label="Aizvērt"
            >
              <X className="w-4 h-4 mr-2" />
              Aizvērt
            </Button>
          </div>

          <div 
            className="absolute inset-0 -z-10" 
            onClick={() => {
              setIsZoomed(false)
              setZoomLevel(1)
              setRotation(0)
            }}
          />
        </div>
      )}

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {!imageError.has(currentImage) && images[currentImage] ? (
              <div 
                className="relative transition-transform duration-200"
                style={{ 
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transformOrigin: 'center'
                }}
              >
                <Image
                  src={images[currentImage]}
                  alt={`${alt} - pilnekrāna attēls`}
                  width={1200}
                  height={1200}
                  className="max-w-full max-h-full object-contain"
                  onError={() => handleImageError(currentImage)}
                />
              </div>
            ) : (
              <ProductPlaceholder className="w-[800px] h-[800px]" />
            )}

            <div className="absolute top-4 left-4 flex space-x-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={zoomOut}
                disabled={zoomLevel <= 1}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                onClick={zoomIn}
                disabled={zoomLevel >= 3}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="icon"
                onClick={rotateImage}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>

            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white hover:bg-white/30"
                  onClick={prevImage}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white hover:bg-white/30"
                  onClick={nextImage}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </>
            )}

            <div className="absolute top-4 right-4 flex items-center space-x-4">
              {images.length > 1 && (
                <div className="bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                  {currentImage + 1} / {images.length}
                </div>
              )}
              
              <Button
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30"
                onClick={() => {
                  setIsFullscreen(false)
                  setZoomLevel(1)
                  setRotation(0)
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Aizvērt
              </Button>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-4 py-2 rounded-full">
              <span className="hidden md:inline">
                Tastatūra: ← → (navigācija), +/- (tālummaiņa), R (griešana), F (pilnekrāns), ESC (aizvērt)
              </span>
              <span className="md:hidden">
                Velciet pa labi/kreisi navigācijai
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}