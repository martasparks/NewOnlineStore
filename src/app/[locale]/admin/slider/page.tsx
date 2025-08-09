'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash, Image, Settings, Eye, ArrowRight, Monitor, Smartphone } from 'lucide-react'
import SliderModal from '@/components/admin/SliderModal'
import { useAlert } from '@lib/store/alert'
//import { useLoading } from '../../../../hooks/useLoading';
//import { Loading } from '@/components/ui/Loading';

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function SliderAdminPage() {

  //const { isLoading, withLoading } = useLoading(true);
  //if (isLoading) {
  //  return <Loading fullScreen variant="spinner" text="Lūdzu, uzgaidiet. Ielādējam..." />;
  //}

  const { data: slides, mutate } = useSWR('/api/slider?admin=true', fetcher)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const { setAlert } = useAlert()

  const handleAdd = () => {
    setSelected(null)
    setModalOpen(true)
  }

  const handleEdit = (item: any) => {
    setSelected(item)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Vai tiešām dzēst šo slaidu?')) return

    const res = await fetch('/api/slider', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if (res.ok) {
      setAlert('Slaids dzēsts', 'success')
      mutate()
    } else {
      const err = await res.json()
      setAlert(err.error || 'Kļūda dzēšot slaidu', 'error')
    }
  }

  const activeSlides = slides?.filter((slide: any) => slide.is_active) || []
  const inactiveSlides = slides?.filter((slide: any) => !slide.is_active) || []

  return (
    <div className="space-y-8">

      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Image className="w-8 h-8 mr-3" />
              Sākumlapas slaideris
            </h1>
            <p className="text-purple-100 text-lg">
              Pārvaldiet sākumlapas slaiderus un to saturu
            </p>
          </div>
          <Button 
            onClick={handleAdd}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Pievienot slaidu
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Image className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{slides?.length || 0}</p>
              <p className="text-gray-600 text-sm">Kopā slaidi</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{activeSlides.length}</p>
              <p className="text-gray-600 text-sm">Aktīvie</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{inactiveSlides.length}</p>
              <p className="text-gray-600 text-sm">Neaktīvie</p>
            </div>
          </div>
        </div>
      </div>

      {activeSlides.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Eye className="w-5 h-5 mr-2 text-emerald-600" />
            Aktīvie slaidi
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeSlides.map((slide: any) => (
              <div key={slide.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">

                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 border-b border-emerald-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{slide.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{slide.subtitle}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                        #{slide.order_index}
                      </span>
                      {slide.show_text && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          Ar tekstu
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(slide)}
                        className="hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(slide.id)}
                        className="hover:bg-red-50 hover:border-red-300 text-red-600"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">

                    {slide.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{slide.description}</p>
                    )}

                    {slide.button_text && slide.button_url && (
                      <div className="flex items-center space-x-2 text-sm">
                        <ArrowRight className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-600 font-medium">{slide.button_text}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-600">{slide.button_url}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Monitor className="w-3 h-3" />
                          <span>Desktop</span>
                        </div>
                        <div className="relative w-full h-20 bg-gray-100 rounded-lg overflow-hidden border">
                          <img
                            src={slide.image_desktop}
                            alt="Desktop preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const sibling = e.currentTarget.nextElementSibling as HTMLElement | null
                              if (sibling) sibling.style.display = 'flex'
                            }}
                          />
                          <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                            Nav attēla
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Smartphone className="w-3 h-3" />
                          <span>Mobile</span>
                        </div>
                        <div className="relative w-full h-20 bg-gray-100 rounded-lg overflow-hidden border">
                          <img
                            src={slide.image_mobile}
                            alt="Mobile preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const sibling = e.currentTarget.nextElementSibling as HTMLElement | null
                              if (sibling) sibling.style.display = 'flex'
                            }}
                          />
                          <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                            Nav attēla
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inactiveSlides.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-gray-500" />
            Neaktīvie slaidi
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {inactiveSlides.map((slide: any) => (
              <div key={slide.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden opacity-75">

                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{slide.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{slide.subtitle}</p>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Neaktīvs
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(slide)}
                        className="hover:bg-blue-50 hover:border-blue-300"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(slide.id)}
                        className="hover:bg-red-50 hover:border-red-300 text-red-600"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">

                    {slide.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{slide.description}</p>
                    )}

                    {slide.button_text && slide.button_url && (
                      <div className="flex items-center space-x-2 text-sm">
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 font-medium">{slide.button_text}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-500">{slide.button_url}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Monitor className="w-3 h-3" />
                          <span>Desktop</span>
                        </div>
                        <div className="relative w-full h-20 bg-gray-100 rounded-lg overflow-hidden border">
                          <img
                            src={slide.image_desktop}
                            alt="Desktop preview"
                            className="w-full h-full object-cover opacity-75"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const sibling = e.currentTarget.nextElementSibling as HTMLElement | null
                              if (sibling) sibling.style.display = 'flex'
                            }}
                          />
                          <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                            Nav attēla
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Smartphone className="w-3 h-3" />
                          <span>Mobile</span>
                        </div>
                        <div className="relative w-full h-20 bg-gray-100 rounded-lg overflow-hidden border">
                          <img
                            src={slide.image_mobile}
                            alt="Mobile preview"
                            className="w-full h-full object-cover opacity-75"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const sibling = e.currentTarget.nextElementSibling as HTMLElement | null
                              if (sibling) sibling.style.display = 'flex'
                            }}
                          />
                          <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                            Nav attēla
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-700 text-center">
                        ⚠️ Šis slaids nav aktīvs un netiks rādīts sākumlapā
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!slides || slides.length === 0) && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nav izveidotu slaidu</h3>
          <p className="text-gray-500 mb-6">Sāciet, pievienojot savu pirmo slaidu</p>
          <Button onClick={handleAdd} className="bg-gradient-to-r from-purple-500 to-pink-600">
            <Plus className="w-4 h-4 mr-2" />
            Pievienot slaidu
          </Button>
        </div>
      )}

      <SliderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSave={mutate}
      />
    </div>
  )
}