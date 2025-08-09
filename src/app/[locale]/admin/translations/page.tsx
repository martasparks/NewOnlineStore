'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash, Languages, Search, Globe } from 'lucide-react'
import TranslationModal from '@/components/admin/TranslationModal'
import { useAlert } from '@lib/store/alert'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TranslationsAdminPage() {
  const { data: translations, mutate } = useSWR('/api/translations', fetcher)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLocale, setFilterLocale] = useState('')
  const [filterNamespace, setFilterNamespace] = useState('')
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
    if (!confirm('Vai tiešām dzēst šo tulkojumu?')) return

    const res = await fetch('/api/translations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })

    if (res.ok) {
      setAlert('Tulkojums dzēsts', 'success')
      mutate()
    } else {
      const err = await res.json()
      setAlert(err.error || 'Kļūda dzēšot tulkojumu', 'error')
    }
  }

  // Filter translations
  const filteredTranslations = translations?.filter((t: any) => {
    const matchesSearch = t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.value.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLocale = !filterLocale || t.locale === filterLocale
    const matchesNamespace = !filterNamespace || t.namespace === filterNamespace
    
    return matchesSearch && matchesLocale && matchesNamespace
  }) || []

    const namespaces: string[] = translations 
    ? [...new Set(translations.map((t: any) => t.namespace))]
        .filter((ns): ns is string => typeof ns === 'string' && ns !== '')
    : []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              <Languages className="w-8 h-8 mr-3" />
              Tulkojumu pārvaldība
            </h1>
            <p className="text-indigo-100 text-lg">
              Pārvaldiet vietnes tulkojumus dažādās valodās
            </p>
          </div>
          <Button 
            onClick={handleAdd}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Pievienot tulkojumu
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Meklēt tulkojumus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={filterLocale}
            onChange={(e) => setFilterLocale(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Visas valodas</option>
            <option value="lv">Latviešu</option>
            <option value="en">English</option>
            <option value="ru">Русский</option>
          </select>

          <select
            value={filterNamespace}
            onChange={(e) => setFilterNamespace(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Visi namespace</option>
                {namespaces.map((ns) => (
                <option key={ns} value={ns}>{ns}</option>
                ))}
          </select>
        </div>
      </div>

      {/* Translations Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Atslēga</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Valoda</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Namespace</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Tulkojums</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-900">Darbības</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTranslations.map((translation: any) => (
                <tr key={translation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                    {translation.key}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">
                        {translation.locale.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {translation.namespace}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {translation.value}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(translation)}
                        className="hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(translation.id)}
                        className="hover:bg-red-50 text-red-600"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTranslations.length === 0 && (
          <div className="text-center py-12">
            <Languages className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nav tulkojumu</h3>
            <p className="text-gray-500 mb-6">Sāciet, pievienojot savu pirmo tulkojumu</p>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Pievienot tulkojumu
            </Button>
          </div>
        )}
      </div>

      <TranslationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSave={mutate}
      />
    </div>
  )
}
