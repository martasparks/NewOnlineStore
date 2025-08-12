'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import MainNavigation from '@/components/MainNavigation';
import Slider from '@/components/Slider';
import { Loading } from '@/components/ui/Loading';
import { useLoading } from '@hooks/useLoading';

// Izmanto Slider komponenta tipu
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

// Pievieno tipu API atbildei
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

export default function HomePage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const { isLoading, withLoading } = useLoading(false);

  const fetchSlides = useCallback(async () => {
    try {
      const base =
        process.env.NODE_ENV === 'production'
          ? 'https://yourdomain.com'
          : 'http://localhost:3000';

      const res = await fetch(`${base}/api/slider`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch slides');
      const slidesData: SlideApiResponse[] = await res.json();

      // Pielāgo datus, lai atbilstu Slider prasībām
      const adaptedSlides: Slide[] = slidesData.map((slide: SlideApiResponse) => ({
        ...slide,
        show_text: slide.show_text ?? true, // Pārveido undefined uz true
        subtitle: slide.subtitle || '',     // Pārveido undefined uz tukšu string
        description: slide.description || '',
        button_text: slide.button_text || '',
        button_url: slide.button_url || ''
      }));

      setSlides(adaptedSlides);
    } catch (error) {
      console.error('Error fetching slides:', error);
      setSlides([]);
    }
  }, []);

  useEffect(() => {
    withLoading(fetchSlides);
  }, [withLoading, fetchSlides]);

  if (isLoading) {
    return (
      <Loading
        fullScreen
        variant="spinner"
        text="Lūdzu, uzgaidiet. Ielādējam..."
      />
    );
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