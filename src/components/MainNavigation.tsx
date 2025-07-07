"use client"

import React, { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import Link from "next/link"

export default function MainNavigation() {
  const [categories, setCategories] = useState<Category[]>([])
  const [hovered, setHovered] = useState<string | null>(null)

  type Subcategory = {
    id: string
    name: string
    slug: string
    url: string
    icon: string
    meta_title: string
    meta_description: string
    order_index: number
    is_active: boolean
    category_id: string
  }
  
  type Category = {
    id: string
    name: string
    slug: string
    url: string
    meta_title: string
    meta_description: string
    order_index: number
    is_active: boolean
    created_at: string
    updated_at: string
    subitems: Subcategory[]
  }

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/navigation/categories')
      const cats = await res.json()

      const subRes = await fetch('/api/navigation/subcategories')
      const subs = await subRes.json()

      // Piesaisti subcategories pie kategorijām
      const combined = cats.map((cat: any) => ({
        ...cat,
        subitems: subs.filter((s: any) => s.category_id === cat.id)
      }))

      setCategories(combined)
    }

    fetchData()
  }, [])

  return (
    <nav className="bg-white border-t border-gray-200 text-sm relative">
      <div
        className="relative"
        onMouseEnter={() => null}
        onMouseLeave={() => setHovered(null)}
      >
        <div className="max-w-screen-xl mx-auto px-4">
          <ul className="flex items-center h-14 whitespace-nowrap overflow-x-auto">
            {categories.map((cat, index) => (
              <React.Fragment key={cat.name}>
                <li
                  onMouseEnter={() => setHovered(cat.name)}
                  className="relative group px-3 flex-shrink-0"
                >
                  <Link
                    href={cat.url || '#'}
                    className="flex items-center gap-1.5 font-medium text-gray-700 hover:text-red-600 transition-colors duration-200 py-4 text-xs"
                  >
                    {cat.name}
                    {cat.subitems && (
                      <ChevronDown 
                        className={`w-3 h-3 transition-transform duration-200 ${
                          hovered === cat.name ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </Link>
                </li>
                {index < categories.length - 1 && (
                  <li className="flex items-center flex-shrink-0">
                    <div className="w-px h-4 bg-gray-300"></div>
                  </li>
                )}
              </React.Fragment>
            ))}
          </ul>
        </div>

        {hovered && categories.find(cat => cat.name === hovered)?.subitems && (
          <div 
            className="absolute left-0 right-0 top-full bg-white border-t border-gray-200 shadow-xl z-50 transition-all duration-300 ease-in-out opacity-100 visible translate-y-0"
          >
            <div className="max-w-screen-xl mx-auto px-4 py-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {categories.find(cat => cat.name === hovered)?.subitems?.map((item, index) => (
                  <Link
                    key={`${hovered}-${item.name}`}
                    href="#"
                    className="group flex items-center gap-3 p-4 rounded-lg hover:bg-red-50 transition-all duration-200 transform hover:scale-105"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: hovered ? `fadeInUp 0.4s ease-out forwards` : 'none'
                    }}
                  >
                    <div className="text-2xl opacity-70 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-110">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 group-hover:text-red-600 transition-colors duration-200">
                        {item.name}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <Link href="#" className="text-red-600 font-medium hover:text-red-700 transition-colors">
                      🔥 Akcijas produkti
                    </Link>
                    <Link href="#" className="text-red-600 font-medium hover:text-red-700 transition-colors">
                      ⭐ Populārākie
                    </Link>
                    <Link href="#" className="text-red-600 font-medium hover:text-red-700 transition-colors">
                      🆕 Jaunumi
                    </Link>
                  </div>
                  <Link 
                    href="#" 
                    className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium"
                  >
                    Skatīt visu kategoriju →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
