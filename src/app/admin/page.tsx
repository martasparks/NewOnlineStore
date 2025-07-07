'use client'
import { useAuth } from '@/contexts/AuthContext'
import { 
  TrendingUp, 
  Package, 
  Users, 
  ShoppingCart,
  Eye,
  Calendar,
  ArrowUpRight,
  Activity
} from 'lucide-react'

export default function AdminHome() {
  const { user } = useAuth()

  const stats = [
    {
      title: 'Kopējie pasūtījumi',
      value: '2,847',
      change: '+12.5%',
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Aktīvie produkti',
      value: '163',
      change: '+8.2%',
      icon: Package,
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      title: 'Klienti',
      value: '1,429',
      change: '+15.3%',
      icon: Users,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Šodienas apmeklējumi',
      value: '892',
      change: '+23.1%',
      icon: Eye,
      color: 'from-orange-500 to-orange-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sveicināti atpakaļ! 👋</h1>
            <p className="text-emerald-100 text-lg">
              Laipni lūdzam atpakaļ, <span className="font-semibold">{user?.email}</span>. 
              Šeit jūs varat pārvaldīt sava veikala saturu un sekot līdzi statistikai.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <Calendar className="w-12 h-12 text-white/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center text-emerald-600 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                {stat.change}
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Ātrās darbības</h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200">
              <span className="text-blue-900 font-medium">Pievienot jaunu produktu</span>
              <ArrowUpRight className="w-4 h-4 text-blue-600" />
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg hover:from-emerald-100 hover:to-emerald-200 transition-all duration-200">
              <span className="text-emerald-900 font-medium">Skatīt jaunos pasūtījumus</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-200">
              <span className="text-purple-900 font-medium">Pārvaldīt klientus</span>
              <ArrowUpRight className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Jaunākie pasūtījumi</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {[
              { id: '#2847', customer: 'Jānis Bērziņš', amount: '€89.99', status: 'Procesā' },
              { id: '#2846', customer: 'Anna Liepa', amount: '€156.50', status: 'Pabeigts' },
              { id: '#2845', customer: 'Māris Ozols', amount: '€73.25', status: 'Nosūtīts' },
            ].map((order, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div>
                  <p className="font-medium text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-600">{order.customer}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{order.amount}</p>
                  <p className="text-xs text-emerald-600">{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}