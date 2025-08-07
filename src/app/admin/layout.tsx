'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { createClient } from '../../../lib/supabase/client'
import { useLoading } from '@hooks/useLoading';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  User,
  Bell,
  AlertTriangle
} from 'lucide-react'
import { Loading } from '@/components/ui/Loading'

const navItems = [
  { name: 'Pārskats', href: '/admin', icon: LayoutDashboard },
  { name: 'Navigācija', href: '/admin/navigation', icon: Settings },
  { name: 'Slaideris', href: '/admin/slider', icon: Package },
  { name: 'Produkti', href: '/admin/products', icon: Package },
  { name: 'Pasūtījumi', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Klienti', href: '/admin/customers', icon: Users },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const { isLoading, withLoading } = useLoading(true);
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      const checkUserRole = async () => {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

          if (error) {
            if (error.code === 'PGRST116' || error.message.includes('No rows')) {
              console.log('User profile not found, creating default profile...')
              
              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([{
                  id: user.id,
                  email: user.email,
                  role: 'user'
                }])
                .select()
                .single()

              if (insertError) {
                console.error('Error creating user profile:', insertError)
                setUserRole('user')
              } else {
                setUserRole(newProfile.role)
              }
            } else {
              console.error('Error fetching user role:', error)
              setHasError(true)
              setUserRole('user')
            }
          } else {
            setUserRole(profile.role)
          }

          const finalRole = profile?.role || 'user'
          if (finalRole !== 'admin') {
            router.push('/auth/unauthorized')
            return
          }

        } catch (error) {
          console.error('Role check failed:', error)
          setHasError(true)
          setUserRole('user')
        } finally {
          setRoleLoading(false)
        }
      }

      checkUserRole()
    }
  }, [user, loading, router, supabase])

  if (loading || roleLoading || isLoading) {
    return <Loading fullScreen variant="spinner" text="Lūdzu, uzgaidiet. Ielādējam..." />
  }

  if (!user) return null

  if (hasError && userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Datubāzes kļūda</h1>
          <p className="text-gray-600 mb-6">
            Nevar pārbaudīt lietotāja tiesības. Lūdzu, sazinieties ar administratoru.
          </p>
          <div className="space-y-3">
            <Button onClick={signOut} className="w-full">
              Iziet no konta
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Uz sākumlapu
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Nav piekļuves</h1>
          <p className="text-gray-600 mb-6">Jums nav administratora tiesību šai lapai.</p>
          <div className="space-y-3">
            <Link href="/">
              <Button className="w-full">
                Uz sākumlapu
              </Button>
            </Link>
            <Button onClick={signOut} variant="outline" className="w-full">
              Mainīt kontu
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Admin Panelis</h1>
                  <p className="text-sm text-gray-500">Veikala pārvaldības sistēma</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Bell className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    {userRole === 'admin' ? 'Administrator' : userRole || 'Lietotājs'}
                  </p>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={signOut} 
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Iziet
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6">
          <div className="flex space-x-8 overflow-x-auto">
            {navItems.map(({ name, href, icon: Icon }) => (
              <Link
                key={name}
                href={href}
                className="flex items-center space-x-2 px-4 py-4 text-gray-600 hover:text-emerald-600 hover:border-emerald-600 border-b-2 border-transparent transition-all duration-200 whitespace-nowrap group"
              >
                <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}