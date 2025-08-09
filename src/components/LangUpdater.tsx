'use client';

import { useLocale } from 'next-intl';
import { useEffect } from 'react';

export default function LangUpdater() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
