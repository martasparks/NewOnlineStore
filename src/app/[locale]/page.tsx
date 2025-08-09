'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import MainNavigation from '@/components/MainNavigation';
import Slider from '@/components/Slider';
import { Loading } from '@/components/ui/Loading';
import { useLoading } from '@hooks/useLoading';

export default function HomePage() {
  const [slides, setSlides] = useState<any[]>([]);
  const { isLoading, withLoading } = useLoading(false);

  const getSlides = async () => {
    const base =
      process.env.NODE_ENV === 'production'
        ? 'https://yourdomain.com'
        : 'http://localhost:3000';

    const res = await fetch(`${base}/api/slider`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch slides');
    return res.json();
  };

  useEffect(() => {
    withLoading(async () => {
      try {
        const slidesData = await getSlides();
        setSlides(slidesData);
      } catch (error) {
        console.error('Error fetching slides:', error);
        setSlides([]);
      }
    });
  }, []);

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
