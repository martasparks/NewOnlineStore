'use client'
import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Pencil, Plus, Trash, FolderOpen, Settings, Eye, ArrowRight } from 'lucide-react'
import CategoryModal from '@/components/admin/CategoryModal'
import { useAlert } from '@lib/store/alert'
import { Category, Subcategory } from '@lib/types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function NavigationAdminPage() {

  const { data: categories, mutate } = useSWR<Category[]>('/api/navigation/categories', fetcher)
  const { data: subcategories } = useSWR<Subcategory[]>('/api/navigation/subcategories', fetcher)

  const [modalOpen, setModalOpen] = useState(false)
  // `selected` tips tagad ir `Category | null`
  const [selected, setSelected] = useState<Category | null>(null)
  const { setAlert } = useAlert()
  // `combined` tips tagad ir `Category[]`
  const [combined, setCombined] = useState<Category[]>([])

  useEffect(() => {
    if (categories && subcategories) {
      // Izmantojam importētos tipus
      const enriched: Category[] = categories.map((cat: Category) => ({
        ...cat,
        subitems: subcategories.filter((sub: Subcategory) => sub.category_id === cat.id),
      }))
      setCombined(enriched)
    }
  }, [categories, subcategories])

    const handleAdd = () => {
    setSelected(null)
    setModalOpen(true)
  }
  
    // `handleEdit` saņem `Category` tipu
    const handleEdit = (item: Category) => {
      setSelected(item)
      setModalOpen(true)
    }

  const handleDelete = async (id: string) => {
    const confirmed = confirm('Vai tiešām dzēst šo kategoriju?')
    if (!confirmed) return

    const res = await fetch('/api/navigation/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })

    if (res.ok) {
      setAlert('Kategorija dzēsta', 'success')
      mutate()
    } else {
      const err = await res.json()
      setAlert(err.error || 'Neizdevās dzēst', 'error')
    }
  }

  return (
    <div className="space-y-8">

      {/* ... pārējais JSX kods paliek nemainīgs ... */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Settings className="w-8 h-8 mr-3" />
              Navigācijas pārvaldība
            </h1>
            <p className="text-blue-100 text-lg">
              Pārvaldiet savas vietnes kategorijas un apakškategorijas
            </p>
          </div>
          <Button 
            onClick={handleAdd}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Pievienot kategoriju
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{combined.length}</p>
              <p className="text-gray-600 text-sm">Kategorijas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {combined.reduce((acc, cat) => acc + (cat.subitems?.length || 0), 0)}
              </p>
              <p className="text-gray-600 text-sm">Apakškategorijas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {combined.filter(cat => cat.is_active).length}
              </p>
              <p className="text-gray-600 text-sm">Aktīvās</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Kategorijas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {combined.map((cat: Category) => (
            <div key={cat.id} className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{cat.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{cat.meta_title || 'Nav meta nosaukuma'}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${cat.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {cat.subitems?.length || 0} apakškategorijas
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      #{cat.order_index}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(cat)}
                      className="hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(cat.id)}
                      className="hover:bg-red-50 hover:border-red-300 text-red-600"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {cat.subitems && cat.subitems.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Apakškategorijas:</h4>
                    <div className="space-y-2">
                      {cat.subitems.slice(0, 3).map((sub: Subcategory) => (
                        <div key={sub.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-lg">{sub.icon || '📁'}</span>
                          <span className="text-sm text-gray-700 font-medium">{sub.name}</span>
                        </div>
                      ))}
                      {cat.subitems.length > 3 && (
                        <div className="text-center py-2">
                          <span className="text-xs text-gray-500">
                            +{cat.subitems.length - 3} vairāk
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <FolderOpen className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">Nav apakškategoriju</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {combined.length === 0 && !categories && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nav izveidotu kategoriju</h3>
          <p className="text-gray-500 mb-6">Sāciet, pievienojot savu pirmo kategoriju</p>
          <Button onClick={handleAdd} className="bg-gradient-to-r from-blue-500 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Pievienot kategoriju
          </Button>
        </div>
      )}

      <CategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSave={mutate}
      />
    </div>
  )
}
