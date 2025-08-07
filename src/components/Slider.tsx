'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface Slide {
  show_text: boolean
  id: string
  title: string
  subtitle: string
  description: string
  button_text: string
  button_url: string
  image_desktop: string
  image_mobile: string
  order_index: number
  is_active: boolean
}

interface SliderProps {
  slides: Slide[]
}

export default function Slider({ slides }: SliderProps) {
  const [windowWidth, setWindowWidth] = useState<number | null>(null)

  useEffect(() => {
    setWindowWidth(window.innerWidth)

    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!slides || slides.length === 0) return null

  return (
    <div className="relative w-full h-[300px] md:h-[800px] overflow-hidden">
      {slides.map((slide, index) => {
        const imageSrc =
          windowWidth !== null && windowWidth < 768
            ? slide.image_mobile
            : slide.image_desktop

        return (
          <div
            key={slide.id}
            className="absolute top-0 left-0 w-full h-full transition-opacity duration-1000"
            style={{ opacity: index === 0 ? 1 : 0 }}
          >
            <Image
              src={imageSrc}
              alt={slide.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority={index === 0}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
            />

            {slide.show_text !== false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/40 px-4 text-center">
                <p className="text-sm md:text-base">{slide.subtitle}</p>
                <h2 className="text-xl md:text-3xl font-bold">{slide.title}</h2>
                <p className="text-sm md:text-base mt-2 max-w-xl">{slide.description}</p>
                {slide.button_text && slide.button_url && (
                <a
                    href={slide.button_url}
                    className="mt-4 inline-block bg-white text-black px-4 py-2 rounded"
                >
                    {slide.button_text}
                </a>
                )}
            </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
