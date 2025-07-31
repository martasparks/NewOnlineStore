'use client'

import Header from '@/components/Header'
import MainNavigation from '@/components/MainNavigation'

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <MainNavigation />
      <main>
        {children}
      </main>
    </div>
  )
}
