'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Pencil, Trash, Languages, Search, Globe, ChevronDown, ChevronRight } from 'lucide-react'
import TranslationModal from '@/components/admin/TranslationModal'
import { useAlert } from '@lib/store/alert'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function TranslationsAdminPage() {
  const { data: translations, mutate } = useSWR('/api/translations', fetcher)
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterNamespace, setFilterNamespace] = useState('')
  const [collapsedLocales, setCollapsedLocales] = useState<Set<string>>(new Set(['lv', 'en', 'ru']))
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

  const toggleLocaleCollapse = (locale: string) => {
    const newCollapsed = new Set(collapsedLocales)
    if (newCollapsed.has(locale)) {
      newCollapsed.delete(locale)
    } else {
      newCollapsed.add(locale)
    }
    setCollapsedLocales(newCollapsed)
  }

  // Filter and group translations
  const filteredTranslations = translations?.filter((t: any) => {
    const matchesSearch = t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.value.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesNamespace = !filterNamespace || t.namespace === filterNamespace
    
    return matchesSearch && matchesNamespace
  }) || []

  // Group by locale with preferred order
  const localeOrder = ['lv', 'en', 'ru']
  const groupedTranslations = localeOrder.reduce((acc, locale) => {
    const localeTranslations = filteredTranslations.filter((t: any) => t.locale === locale)
    if (localeTranslations.length > 0) {
      acc[locale] = localeTranslations.sort((a: any, b: any) => a.key.localeCompare(b.key))
    }
    return acc
  }, {} as Record<string, any[]>)

  // Add any other locales that aren't in the preferred order
  filteredTranslations.forEach((t: any) => {
    if (!localeOrder.includes(t.locale) && !groupedTranslations[t.locale]) {
      groupedTranslations[t.locale] = filteredTranslations
        .filter((tr: any) => tr.locale === t.locale)
        .sort((a: any, b: any) => a.key.localeCompare(b.key))
    }
  })

  const namespaces: string[] = translations 
    ? [...new Set(translations.map((t: any) => t.namespace))]
        .filter((ns): ns is string => typeof ns === 'string' && ns !== '')
    : []

  const getLocaleInfo = (locale: string) => {
    const localeMap: Record<string, { name: string, flag: string, color: string }> = {
      'lv': { name: 'Latviešu', flag: '🇱🇻', color: 'from-red-500 to-red-600' },
      'en': { name: 'English', flag: '🇬🇧', color: 'from-blue-500 to-blue-600' },
      'ru': { name: 'Русский', flag: '🇷🇺', color: 'from-green-500 to-green-600' }
    }
    return localeMap[locale] || { name: locale.toUpperCase(), flag: '🌐', color: 'from-gray-500 to-gray-600' }
  }

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

      {/* Grouped Translations */}
      <div className="space-y-6">
        {Object.entries(groupedTranslations).map(([locale, translations]) => {
          const localeInfo = getLocaleInfo(locale)
          const isCollapsed = collapsedLocales.has(locale)
          
          return (
            <div key={locale} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              {/* Locale Header */}
              <div 
                className={`bg-gradient-to-r ${localeInfo.color} p-6 text-white cursor-pointer`}
                onClick={() => toggleLocaleCollapse(locale)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{localeInfo.flag}</span>
                    <div>
                      <h3 className="text-xl font-bold">{localeInfo.name}</h3>
                      <p className="text-white/80">
                        {translations.length} {translations.length === 1 ? 'tulkojums' : 'tulkojumi'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">
                      {locale.toUpperCase()}
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="w-6 h-6" />
                    ) : (
                      <ChevronDown className="w-6 h-6" />
                    )}
                  </div>
                </div>
              </div>

              {/* Translations Table */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Atslēga</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Namespace</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-gray-900">Tulkojums</th>
                        <th className="px-6 py-4 text-right text-sm font-medium text-gray-900">Darbības</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {translations.map((translation: any) => (
                        <tr key={translation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-mono text-gray-900">
                            {translation.key}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium">
                              {translation.namespace}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                            <div className="truncate" title={translation.value}>
                              {translation.value}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(translation)}
                                className="hover:bg-blue-50 text-blue-600 border-blue-200"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(translation.id)}
                                className="hover:bg-red-50 text-red-600 border-red-200"
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
              )}
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {Object.keys(groupedTranslations).length === 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-12 text-center">
          <Languages className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nav tulkojumu</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterNamespace 
              ? 'Nav atrasts neviens tulkojums ar norādītajiem filtriem'
              : 'Sāciet, pievienojot savu pirmo tulkojumu'
            }
          </p>
          <Button onClick={handleAdd} className="bg-gradient-to-r from-indigo-500 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Pievienot tulkojumu
          </Button>
        </div>
      )}

      <TranslationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSave={mutate}
      />
    </div>
  )
}