'use client'

import { useState, useEffect } from 'react'
import { useLoading } from '@hooks/useLoading';
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createClient } from '../../../lib/supabase/client'
import { useAlert } from '../../../lib/store/alert'
import Header from '@/components/Header'
import MainNavigation from '@/components/MainNavigation'
import {
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Save,
  Lock,
  Settings,
  Bell,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Loading } from '@/components/ui/Loading'

interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'user'
  created_at: string
  updated_at: string
  full_name?: string
  phone?: string
  company?: string
  notifications_enabled?: boolean
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const { setAlert } = useAlert()
  const router = useRouter()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const { isLoading: loading, withLoading } = useLoading(true);
  const [saving, setSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchProfile()
    }
  }, [user, authLoading, router])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        if (error.code === 'PGRST116') {
          await createProfile()
        } else {
          setAlert('Neizdevās ielādēt profilu', 'error')
        }
      } else {
        const profileWithMetadata = {
          ...data,
          full_name: data.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || ''
        }
        setProfile(profileWithMetadata)
      }
    } catch (error) {
      console.error('Profile fetch failed:', error)
      setAlert('Neizdevās ielādēt profilu', 'error')
    } finally {
      // loading tiek pārvaldīts ar useLoading
    }
  }

  const createProfile = async () => {
    if (!user) {
      setAlert('Lietotājs nav atrasts', 'error')
      return
    }

    try {
      const displayName = user.user_metadata?.full_name || 
                         user.user_metadata?.name || 
                         user.user_metadata?.display_name || 
                         ''

      const newProfile = {
        id: user.id,
        email: user.email || '',
        role: 'user' as const,
        full_name: displayName,
        phone: user.user_metadata?.phone || '',
        company: '',
        notifications_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert([newProfile])
        .select()
        .single()

      if (error) throw error

      setProfile(data)
      setAlert('Profils izveidots', 'success')
    } catch (error) {
      console.error('Error creating profile:', error)
      setAlert('Neizdevās izveidot profilu', 'error')
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          company: profile.company || '',
          notifications_enabled: profile.notifications_enabled ?? true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error
      
      if (profile.full_name !== user.user_metadata?.full_name) {
        await supabase.auth.updateUser({
          data: { 
            full_name: profile.full_name,
            name: profile.full_name 
          }
        })
      }
      
      setAlert('Profils atjaunināts veiksmīgi', 'success')
    } catch (error) {
      console.error('Error updating profile:', error)
      setAlert('Neizdevās atjaunināt profilu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert('Jaunās paroles nesakrīt', 'error')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setAlert('Parolei jābūt vismaz 6 simboli garai', 'error')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error
      
      setAlert('Parole nomainīta veiksmīgi', 'success')
      setPasswordData({ newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
    } catch (error) {
      console.error('Error changing password:', error)
      setAlert('Neizdevās nomainīt paroli', 'error')
    } finally {
      setSaving(false)
    }
  }

    if (authLoading || loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <Header />
          <MainNavigation />
          <Loading variant="spinner" text="Ielādē profilu..." className="py-20" />
        </div>
      )
    }

  if (!user) return null

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <MainNavigation />
        <div className="flex items-center justify-center py-20">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Profils nav atrasts</h1>
            <p className="text-gray-600 mb-6">Neizdevās ielādēt jūsu profila informāciju.</p>
            <Button onClick={() => window.location.reload()}>
              Mēģināt vēlreiz
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <MainNavigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-2xl p-8 text-white shadow-xl mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {profile.full_name || 'Lietotājs'}
              </h1>
              <p className="text-red-100 text-lg">{profile.email}</p>
              <p className="text-red-200 text-sm">
                Reģistrēts {new Date(profile.created_at).toLocaleDateString('lv-LV')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <Settings className="w-5 h-5 text-red-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Profila informācija</h2>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                      Pilns vārds
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="full_name"
                        value={profile.full_name || ''}
                        onChange={(e) => setProfile(prev => prev ? {...prev, full_name: e.target.value} : null)}
                        placeholder="Jūsu pilns vārds"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Telefona numurs
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                        placeholder="+371 20000000"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    E-pasta adrese
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="pl-10 bg-gray-50 text-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500">E-pastu nevar mainīt</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                    Uzņēmums (neobligāti)
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="company"
                      value={profile.company || ''}
                      onChange={(e) => setProfile(prev => prev ? {...prev, company: e.target.value} : null)}
                      placeholder="Jūsu uzņēmuma nosaukums"
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saglabā...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Saglabāt izmaiņas
                    </>
                  )}
                </Button>
              </form>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <Lock className="w-5 h-5 text-orange-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Paroles maiņa</h2>
              </div>

              {!showPasswordForm ? (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-orange-600" />
                      <div>
                        <h3 className="font-medium text-orange-800">Jūsu konta drošība</h3>
                        <p className="text-sm text-orange-700">
                          Regulāri mainiet paroli, lai aizsargātu savu kontu
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Mainīt paroli
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new_password" className="text-sm font-medium text-gray-700">
                      Jaunā parole
                    </Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                      placeholder="Ievadiet jauno paroli"
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password" className="text-sm font-medium text-gray-700">
                      Apstiprināt paroli
                    </Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                      placeholder="Ievadiet paroli vēlreiz"
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                    >
                      {saving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Maina...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Saglabāt
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPasswordData({ newPassword: '', confirmPassword: '' })
                      }}
                      disabled={saving}
                    >
                      Atcelt
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-6">

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Konta statuss</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">E-pasts apstiprināts</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Profils aktivizēts</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                <Bell className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Paziņojumi</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">E-pasta paziņojumi</p>
                  <p className="text-xs text-gray-500">Saņemt informāciju par pasūtījumiem</p>
                </div>
                <Switch
                  checked={profile.notifications_enabled ?? true}
                  onCheckedChange={(checked) => {
                    setProfile(prev => prev ? {...prev, notifications_enabled: checked} : null)
                    if (profile && user) {
                      supabase
                        .from('profiles')
                        .update({ notifications_enabled: checked })
                        .eq('id', user.id)
                        .then(() => setAlert('Paziņojumu iestatījumi saglabāti', 'success'))
                    }
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Konta informācija</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Reģistrācijas datums:</span>
                  <p className="font-medium text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString('lv-LV', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Pēdējās izmaiņas:</span>
                  <p className="font-medium text-gray-900">
                    {new Date(profile.updated_at).toLocaleDateString('lv-LV', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}