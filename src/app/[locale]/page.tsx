'use client';

import { useMemo } from 'react';
import Header from '@/components/Header';
import MainNavigation from '@/components/MainNavigation';
import Slider from '@/components/Slider';
import { Loading } from '@/components/ui/Loading';
import useSWR from 'swr';

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

interface SlideApiResponse {
  show_text?: boolean
  id: string
  title: string
  subtitle?: string
  description?: string
  button_text?: string
  button_url?: string
  image_desktop: string
  image_mobile: string
  order_index: number
  is_active: boolean
}

// Fast fetcher function
const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch slides')
  return res.json()
})

export default function HomePage() {
  // SWR instead of manual fetch
  const { data: slidesData, error } = useSWR<SlideApiResponse[]>(
    '/api/slider',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds cache
    }
  )

  // Memoize adapted slides
  const slides = useMemo(() => {
    if (!slidesData) return []
    
    return slidesData.map((slide: SlideApiResponse): Slide => ({
      ...slide,
      show_text: slide.show_text ?? true,
      subtitle: slide.subtitle || '',
      description: slide.description || '',
      button_text: slide.button_text || '',
      button_url: slide.button_url || ''
    }))
  }, [slidesData])

  // Don't show loading for now - will add back when needed
  // if (!slidesData && !error) {
  //   return (
  //     <Loading
  //       fullScreen
  //       variant="spinner"
  //       text="Lūdzu, uzgaidiet. Ielādējam..."
  //     />
  //   );
  // }

  // Error state - show page anyway with empty slides
  if (error) {
    console.error('Error fetching slides:', error)
  }

  return (
    <div>
      <Header />
      <MainNavigation />
      <Slider slides={slides} />
      <main className="px-4 md:px-8 mt-8" />
    </div>
  );
}