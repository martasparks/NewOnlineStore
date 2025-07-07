'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart, 
  Eye,
  Calendar,
  Clock
} from 'lucide-react'

interface DashboardStats {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  recentActivity: Array<{
    id: string
    type: 'order' | 'product' | 'customer'
    message: string
    timestamp: string
  }>
}

const mockStats: DashboardStats = {
  totalProducts: 156,
  totalOrders: 89,
  totalCustomers: 234,
  totalRevenue: 15690,
  recentActivity: [
    {
      id: '1',
      type: 'order',
      message: 'Jauns pasūtījums no Anna Bērziņa',
      timestamp: '2 minūtes atpakaļ'
    },
    {
      id: '2',
      type: 'product',
      message: 'Produkts "Virtuves galds" tika atjaunots',
      timestamp: '15 minūtes atpakaļ'
    },
    {
      id: '3',
      type: 'customer',
      message: 'Jauns klients reģistrējās',
      timestamp: '1 stunda atpakaļ'
    },
    {
      id: '4',
      type: 'order',
      message: 'Pasūtījums #1234 tika pabeigts',
      timestamp: '2 stundas atpakaļ'
    }
  ]
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>(mockStats)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const statCards = [
    {
      title: 'Kopējie produkti',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Pasūtījumi',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Klienti',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-purple-500',
      change: '+15%'
    },
    {
      title: 'Ieņēmumi (€)',
      value: stats.totalRevenue.toLocaleString(),
      icon: TrendingUp,
      color: 'bg-red-500',
      change: '+23%'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-4 h-4" />
      case 'product':
        return <Package className="w-4 h-4" />
      case 'customer':
        return <Users className="w-4 h-4" />
      default:
        return <Eye className="w-4 h-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-green-100 text-green-600'
      case 'product':
        return 'bg-blue-100 text-blue-600'
      case 'customer':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Sveicināti atpakaļ! 👋
            </h1>
            <p className="text-gray-600">
              Šeit ir jūsu veikala pārskats šodienai.
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {currentTime.toLocaleDateString('lv-LV', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">
                {currentTime.toLocaleTimeString('lv-LV')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white`}>
                <card.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {card.change}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {card.value}
              </p>
              <p className="text-sm text-gray-600">
                {card.title}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pēdējās aktivitātes
          </h2>
          <div className="space-y-4">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 mb-1">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Ātras darbības
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors group">
              <Package className="w-8 h-8 text-gray-400 group-hover:text-red-600 mb-2" />
              <p className="text-sm font-medium text-gray-900 group-hover:text-red-600">
                Pievienot produktu
              </p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors group">
              <ShoppingCart className="w-8 h-8 text-gray-400 group-hover:text-red-600 mb-2" />
              <p className="text-sm font-medium text-gray-900 group-hover:text-red-600">
                Skatīt pasūtījumus
              </p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors group">
              <Users className="w-8 h-8 text-gray-400 group-hover:text-red-600 mb-2" />
              <p className="text-sm font-medium text-gray-900 group-hover:text-red-600">
                Klientu saraksts
              </p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors group">
              <TrendingUp className="w-8 h-8 text-gray-400 group-hover:text-red-600 mb-2" />
              <p className="text-sm font-medium text-gray-900 group-hover:text-red-600">
                Apskatīt atskaites
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}