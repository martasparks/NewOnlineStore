"use client"

import React, { useState } from "react"
import { ChevronDown } from "lucide-react"
import Link from "next/link"

const categories = [
  {
    name: "AKCIJAS",
    link: "#",
  },
  {
    name: "VIRTUVE",
    link: "#",
    subitems: [
      { name: "Virtuves skapīši", icon: "🏠" },
      { name: "Virtuves galdi", icon: "🪑" },
      { name: "Krēsli", icon: "🪑" },
      { name: "Virtuves tehnika", icon: "🔧" },
      { name: "Aksesuāri", icon: "✨" },
    ]
  },
  {
    name: "SKAPJI",
    link: "#",
    subitems: [
      { name: "Bīdāmie skapji", icon: "🚪" },
      { name: "Garderobes", icon: "👔" },
      { name: "Apģērbu skapji", icon: "👗" },
      { name: "Apavu skapīši", icon: "👠" },
    ]
  },
  {
    name: "MĪKSTĀS MĒBELES",
    link: "#",
    subitems: [
      { name: "Dīvāni", icon: "🛋️" },
      { name: "Stūra dīvāni", icon: "🛋️" },
      { name: "Gultas", icon: "🛏️" },
      { name: "Krēsli", icon: "🪑" },
      { name: "Pufi", icon: "🪑" },
    ]
  },
  {
    name: "VIESISTABA",
    link: "#",
    subitems: [
      { name: "TV galdi", icon: "📺" },
      { name: "Vitrīnas", icon: "🏠" },
      { name: "Plaukti", icon: "📚" },
      { name: "Žurnālu galdiņi", icon: "☕" },
    ]
  },
  {
    name: "GUĻAMISTABA",
    link: "#",
    subitems: [
      { name: "Gultas", icon: "🛏️" },
      { name: "Naktiņgaldiņi", icon: "💡" },
      { name: "Skapji", icon: "🚪" },
      { name: "Tualetes galdiņi", icon: "💄" },
    ]
  },
  {
    name: "PRIEKŠNAMS",
    link: "#",
    subitems: [
      { name: "Priekšnami", icon: "🏠" },
      { name: "Apavu skapīši", icon: "👠" },
      { name: "Pakaramie", icon: "🧥" },
    ]
  },
  {
    name: "BĒRNISTABA",
    link: "#",
    subitems: [
      { name: "Gultas bērniem", icon: "🛏️" },
      { name: "Rakstāmgaldi", icon: "✏️" },
      { name: "Skapji", icon: "🚪" },
      { name: "Spēļu zona", icon: "🎮" },
    ]
  },
  {
    name: "BIROJS",
    link: "#",
    subitems: [
      { name: "Biroja krēsli", icon: "💺" },
      { name: "Galdi", icon: "🪑" },
      { name: "Plaukti", icon: "📚" },
      { name: "Uzglabāšana", icon: "📋" },
    ]
  },
  {
    name: "MAZULIM",
    link: "#",
    subitems: [
      { name: "Bērnu gultiņas", icon: "👶" },
      { name: "Aksesuāri", icon: "✨" },
      { name: "Barošanas krēsli", icon: "🍼" },
    ]
  },
  {
    name: "DĀRZA MĒBELES",
    link: "#",
    subitems: [
      { name: "Komplekti", icon: "🌿" },
      { name: "Krēsli", icon: "🪑" },
      { name: "Galdi", icon: "🪑" },
      { name: "Atpūtas mēbeles", icon: "☀️" },
    ]
  }
]

export default function MainNavigation() {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <nav className="bg-white border-t border-gray-200 text-sm relative">
      <div className="max-w-screen-xl mx-auto px-4">
        <ul className="flex items-center h-14 whitespace-nowrap overflow-x-auto">
          {categories.map((cat, index) => (
            <React.Fragment key={cat.name}>
              <li
                onMouseEnter={() => setHovered(cat.name)}
                onMouseLeave={() => setHovered(null)}
                className="relative group px-3 flex-shrink-0"
              >
                <Link
                  href={cat.link}
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
              {/* Separator - show only between items, not after last one */}
              {index < categories.length - 1 && (
                <li className="flex items-center flex-shrink-0">
                  <div className="w-px h-4 bg-gray-300"></div>
                </li>
              )}
            </React.Fragment>
          ))}
        </ul>
      </div>

      {/* Full Width Mega Menu */}
      <div 
        className={`absolute left-0 right-0 top-full bg-white border-t border-gray-200 shadow-xl z-50 transition-all duration-300 ease-in-out ${
          hovered && categories.find(cat => cat.name === hovered)?.subitems
            ? 'opacity-100 visible translate-y-0' 
            : 'opacity-0 invisible -translate-y-4'
        }`}
        onMouseEnter={() => setHovered(hovered)}
        onMouseLeave={() => setHovered(null)}
      >
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {hovered && categories.find(cat => cat.name === hovered)?.subitems?.map((item, index) => (
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
          
          {/* Bottom section with featured/special items */}
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

      {/* CSS Animation Keyframes - removed */}
    </nav>
  )
}