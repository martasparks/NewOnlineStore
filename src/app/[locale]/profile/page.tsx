'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@lib/supabase/client'
import { useAlert } from '@lib/store/alert'
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
  CheckCircle,
  ShoppingCart,
  CreditCard,
  Heart,
  MapPin,
  Eye,
  EyeOff,
  Plus
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

type TabType = 'account' | 'orders' | 'transactions' | 'wishlist' | 'addresses' | 'security'

export default function ProfilePage() {
  const t = useTranslations('Profile')
  const { user, loading: authLoading } = useAuth()
  const { setAlert } = useAlert()
  const router = useRouter()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<TabType>('account')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  const tabs = [
    {
      id: 'account' as TabType,
      name: 'Konta dati',
      icon: User,
      description: 'Pārvaldiet savu profila informāciju'
    },
    {
      id: 'orders' as TabType,
      name: 'Pasūtījumi',
      icon: ShoppingCart,
      description: 'Skatiet savu pasūtījumu vēsturi'
    },
    {
      id: 'transactions' as TabType,
      name: 'Transakcijas',
      icon: CreditCard,
      description: 'Pārskatiet maksājumu vēsturi'
    },
    {
      id: 'wishlist' as TabType,
      name: 'Vēlmju saraksts',
      icon: Heart,
      description: 'Jūsu saglabātie produkti'
    },
    {
      id: 'addresses' as TabType,
      name: 'Adreses',
      icon: MapPin,
      description: 'Pārvaldiet piegādes adreses'
    },
    {
      id: 'security' as TabType,
      name: 'Drošība',
      icon: Shield,
      description: 'Paroles un drošības iestatījumi'
    }
  ]

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/auth/login')
      setProfileLoading(false)
      return
    }

    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const fetchProfile = async () => {
    if (!user) return
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        if ((error as any).code === 'PGRST116') {
          await createProfile()
        } else {
          console.error('Error fetching profile:', error)
          setAlert('Neizdevās ielādēt profilu', 'error')
        }
      } else {
        const profileWithMetadata = {
          ...data,
          full_name:
            data.full_name ||
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            ''
        }
        setProfile(profileWithMetadata)
      }
    } catch (error) {
      console.error('Profile fetch failed:', error)
      setAlert('Neizdevās ielādēt profilu', 'error')
    } finally {
      setProfileLoading(false)
    }
  }

  const createProfile = async () => {
    if (!user) {
      setAlert('Lietotājs nav atrasts', 'error')
      return
    }

    try {
      const displayName =
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        (user.user_metadata?.display_name as string) ||
        ''

      const personType = (user.user_metadata?.personType as string) || 'private'

      const newProfile = {
        id: user.id,
        email: user.email || '',
        role: 'user' as const,
        person_type: personType,
        full_name: displayName,
        phone: (user.user_metadata?.phone as string) || '',
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
    } catch (error: unknown) {
      console.error('Error creating profile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Nezināma kļūda'
      setAlert(`Neizdevās izveidot profilu: ${errorMessage}`, 'error')
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile || !user) return
    if (!profile.full_name) {
      setAlert('Lūdzu, ievadiet savu pilno vārdu', 'error')
      return
    }
    if (profile.full_name.length < 3) {
      setAlert('Pilnam vārdam jābūt vismaz 3 simbolus garam', 'error')
      return
    }
    setSaving(true)
    try {
      const updateData = {
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        company: profile.company || '',
        notifications_enabled: profile.notifications_enabled ?? true,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setProfile(data[0])
        setAlert('Profils atjaunināts veiksmīgi', 'success')
      } else {
        setAlert('Neizdevās atjaunināt profilu', 'error')
      }

      if (profile.full_name && profile.full_name !== (user.user_metadata?.full_name as string)) {
        const { error: authErr } = await supabase.auth.updateUser({
          data: {
            full_name: profile.full_name,
            name: profile.full_name
          }
        })
        if (authErr) {
          console.warn('Auth metadata update failed:', authErr)
        }
      }

    } catch (error: unknown) {
      console.error('Detailed error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Nezināma kļūda'
      setAlert(`Kļūda: ${errorMessage}`, 'error')
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
    } catch (error: unknown) {
      console.error('Error changing password:', error)
      const errorMessage = error instanceof Error ? error.message : 'Neizdevās nomainīt paroli'
      setAlert(errorMessage, 'error')
    } finally {
      setSaving(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-8">
            {/* Profile Information */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <Settings className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Profila informācija</h3>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                      Pilns vārds *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="full_name"
                        value={profile?.full_name || ''}
                        onChange={(e) =>
                          setProfile(prev => (prev ? { ...prev, full_name: e.target.value } : prev))
                        }
                        placeholder="Jūsu pilns vārds"
                        className="pl-12 py-3"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Telefona numurs
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="phone"
                        value={profile?.phone || ''}
                        onChange={(e) =>
                          setProfile(prev => (prev ? { ...prev, phone: e.target.value } : prev))
                        }
                        placeholder="+371 20000000"
                        className="pl-12 py-3"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    E-pasta adrese
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="pl-12 py-3 bg-gray-50 text-gray-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Drošības nolūkos, e-pastu mainīt nav iespējams!<br />Ja tomēr vēlaties nomainīt e-pasta adresi, sazinieties ar mums: info@martasmebeles.lv</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                    Uzņēmums (neobligāti)
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="company"
                      value={profile?.company || ''}
                      onChange={(e) =>
                        setProfile(prev => (prev ? { ...prev, company: e.target.value } : prev))
                      }
                      placeholder="Jūsu uzņēmuma nosaukums"
                      className="pl-12 py-3"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 py-3"
                  size="lg"
                >
                  {saving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saglabā...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Saglabāt izmaiņas
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <Bell className="w-6 h-6 text-indigo-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Paziņojumu iestatījumi</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">E-pasta paziņojumi</p>
                    <p className="text-sm text-gray-600">Saņemt informāciju par pasūtījumiem un piedāvājumiem</p>
                  </div>
                  <Switch
                    checked={profile?.notifications_enabled ?? true}
                    onCheckedChange={async (checked) => {
                      setProfile(prev => (prev ? { ...prev, notifications_enabled: checked } : prev))
                      if (!user) return
                      try {
                        const { error } = await supabase
                          .from('profiles')
                          .update({
                            notifications_enabled: checked,
                            updated_at: new Date().toISOString()
                          })
                          .eq('id', user.id)
                        if (error) throw error
                        setAlert('Paziņojumu iestatījumi saglabāti', 'success')
                      } catch (e) {
                        setProfile(prev => (prev ? { ...prev, notifications_enabled: !checked } : prev))
                        setAlert('Neizdevās saglabāt paziņojumu iestatījumus', 'error')
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'orders':
        return (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nav pasūtījumu</h3>
              <p className="text-gray-600 mb-6">Jūs vēl neesat veikuši nevienu pasūtījumu</p>
              <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600">
                Sākt iepirkšanos
              </Button>
            </div>
          </div>
        )

      case 'transactions':
        return (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nav transakciju</h3>
              <p className="text-gray-600">Jūsu maksājumu vēsture būs redzama šeit</p>
            </div>
          </div>
        )

      case 'wishlist':
        return (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Vēlmju saraksts tukšs</h3>
              <p className="text-gray-600 mb-6">Pievienojiet produktus, kas jums patīk</p>
              <Button className="bg-gradient-to-r from-pink-500 to-pink-600">
                Pārlūkot produktus
              </Button>
            </div>
          </div>
        )

      case 'addresses':
        return (
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <MapPin className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Piegādes adreses</h3>
              </div>
              <Button className="bg-gradient-to-r from-purple-500 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Pievienot adresi
              </Button>
            </div>
            
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nav saglabātu adresu</h3>
              <p className="text-gray-600">Pievienojiet adreses ātrākai pasūtīšanai</p>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-8">
            {/* Password Change */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <Lock className="w-6 h-6 text-orange-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Paroles maiņa</h3>
              </div>

              {!showPasswordForm ? (
                <div className="space-y-6">
                  <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-4">
                      <Shield className="w-6 h-6 text-orange-600 mt-1" />
                      <div>
                        <h4 className="font-semibold text-orange-800 mb-2">Jūsu konta drošība</h4>
                        <p className="text-sm text-orange-700 mb-4">
                          Regulāri mainiet paroli, lai aizsargātu savu kontu. Lietojiet sarežģītu paroli ar burtiem, cipariem un simboliem.
                        </p>
                        <ul className="text-sm text-orange-700 space-y-1">
                          <li>• Vismaz 8 simboli garumā</li>
                          <li>• Lielie un mazie burti</li>
                          <li>• Cipari un simboli</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                    size="lg"
                  >
                    <Lock className="w-5 h-5 mr-2" />
                    Mainīt paroli
                  </Button>
                </div>
              ) : (
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="new_password" className="text-sm font-medium text-gray-700">
                      Jaunā parole *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="new_password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))
                        }
                        placeholder="Ievadiet jauno paroli"
                        className="pl-12 pr-12 py-3"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="confirm_password" className="text-sm font-medium text-gray-700">
                      Apstiprināt paroli *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))
                        }
                        placeholder="Ievadiet paroli vēlreiz"
                        className="pl-12 pr-12 py-3"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 py-3"
                      size="lg"
                    >
                      {saving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Maina...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          Saglabāt jauno paroli
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setPasswordData({ newPassword: '', confirmPassword: '' })
                        setShowPassword(false)
                        setShowConfirmPassword(false)
                      }}
                      disabled={saving}
                      className="px-8"
                      size="lg"
                    >
                      Atcelt
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <Calendar className="w-6 h-6 text-purple-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Konta informācija</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-600 mb-1">Reģistrācijas datums</p>
                  <p className="font-semibold text-purple-900">
                    {profile && new Date(profile.created_at).toLocaleDateString('lv-LV', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 mb-1">Pēdējās izmaiņas</p>
                  <p className="font-semibold text-blue-900">
                    {profile && new Date(profile.updated_at).toLocaleDateString('lv-LV', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (authLoading || profileLoading) {
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl mb-8">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
             <User className="w-12 h-12 text-white" />
           </div>
           <div>
             <h1 className="text-4xl font-bold mb-2">
               {profile.full_name || 'Lietotājs'}
             </h1>
             <p className="text-indigo-100 text-lg mb-1">{profile.email}</p>
             <p className="text-indigo-200 text-sm">
               {t('profile.register.date')} {new Date(profile.created_at).toLocaleDateString('lv-LV')}
             </p>
           </div>
         </div>
       </div>

       {/* Tabs Navigation */}
       <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
         <div className="border-b border-gray-200">
           <nav className="flex overflow-x-auto">
             {tabs.map((tab) => {
               const Icon = tab.icon
               const isActive = activeTab === tab.id
               return (
                 <button
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id)}
                   className={`
                     relative flex items-center space-x-3 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all duration-200
                     ${isActive 
                       ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-600' 
                       : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                     }
                   `}
                 >
                   <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                   <span>{tab.name}</span>
                   {isActive && (
                     <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>
                   )}
                 </button>
               )
             })}
           </nav>
         </div>
         
         {/* Tab Description */}
         <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
           <p className="text-sm text-gray-600">
             {tabs.find(tab => tab.id === activeTab)?.description}
           </p>
         </div>
       </div>

       {/* Tab Content */}
       <div className="mb-8">
         {renderTabContent()}
       </div>
     </div>
   </div>
 )
}