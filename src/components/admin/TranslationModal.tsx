'use client'

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Plus, Save, Languages, Globe, Type, Trash2, Copy } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLoading } from '@hooks/useLoading'
import { useAlert } from '@lib/store/alert'

interface Translation {
  id?: string
  key: string
  locale: string
  value: string
  namespace: string
}

interface TranslationEntry {
  key: string
  value: string
}

interface TranslationModalProps {
  open: boolean
  onClose: () => void
  initialData?: Translation | null
  onSave: () => void
}

export default function TranslationModal({
  open,
  onClose,
  initialData,
  onSave,
}: TranslationModalProps) {
  const isEdit = !!initialData
  const [translation, setTranslation] = useState<Translation>({
    key: '',
    locale: 'lv',
    value: '',
    namespace: 'Header',
  })
  
  // For multiple entries mode
  const [multipleMode, setMultipleMode] = useState(false)
  const [entries, setEntries] = useState<TranslationEntry[]>([
    { key: '', value: '' }
  ])
  
  const { isLoading, withLoading } = useLoading(false)
  const { setAlert } = useAlert()

  const namespaceOptions = [
    'Headeris',
    'Navigācija', 
    'Slideris',
    'Footeris',
    'Profils',
    'Produkti',
    'Kategorijas',
    'Grozs',
    'Bez nosaukuma'
  ]

  useEffect(() => {
    if (initialData) {
      setTranslation(initialData)
      setMultipleMode(false)
    } else {
      setTranslation({
        key: '',
        locale: 'lv',
        value: '',
        namespace: 'Header',
      })
      setEntries([{ key: '', value: '' }])
      setMultipleMode(false)
    }
  }, [initialData, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setTranslation((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEntryChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEntries = [...entries]
    newEntries[index] = { ...newEntries[index], [field]: value }
    setEntries(newEntries)
  }

  const addEntry = () => {
    setEntries([...entries, { key: '', value: '' }])
  }

  const removeEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(entries.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async () => {
    await withLoading(async () => {
      try {
        if (isEdit) {
          // Single edit mode
          const res = await fetch('/api/translations', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(translation),
          })
          
          const data = await res.json()
          if (!res.ok) {
            setAlert(data.error || 'Neizdevās saglabāt tulkojumu', 'error')
            return
          }
          
          setAlert('Tulkojums saglabāts veiksmīgi', 'success')
        } else {
          // Add mode - can be single or multiple
          const translationsToAdd = multipleMode 
            ? entries.filter(entry => entry.key && entry.value).map(entry => ({
                key: entry.key,
                locale: translation.locale,
                value: entry.value,
                namespace: translation.namespace
              }))
            : [translation]

          let successCount = 0
          let errorCount = 0

          for (const trans of translationsToAdd) {
            const res = await fetch('/api/translations', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(trans),
            })

            if (res.ok) {
              successCount++
            } else {
              errorCount++
            }
          }

          if (successCount > 0) {
            setAlert(
              `${successCount} tulkojumi pievienoti${errorCount > 0 ? `, ${errorCount} neizdevās` : ''}`,
              errorCount > 0 ? 'warning' : 'success'
            )
          } else {
            setAlert('Neizdevās pievienot tulkojumus', 'error')
            return
          }
        }

        onSave()
        onClose()
      } catch (error) {
        setAlert('Neizdevās saglabāt tulkojumu', 'error')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold flex items-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {isEdit ? (
              <>
                <Pencil className="w-8 h-8 mr-4 text-indigo-600" />
                Labot tulkojumu
              </>
            ) : (
              <>
                <Plus className="w-8 h-8 mr-4 text-indigo-600" />
                Pievienot tulkojumu
              </>
            )}
          </DialogTitle>
          <p className="text-gray-600 text-lg mt-2">
            {isEdit 
              ? 'Rediģējiet esošā tulkojuma informāciju' 
              : 'Pievienojiet jaunu tulkojumu vai vairākus tulkojumus vienlaicīgi'
            }
          </p>
        </DialogHeader>

        <div className="space-y-8 mt-6">
          {/* Mode Toggle (only for add mode) */}
          {!isEdit && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Pievienošanas režīms</h3>
                  <p className="text-sm text-gray-600">
                    Izvēlieties, vai pievienot vienu vai vairākus tulkojumus
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={!multipleMode ? "default" : "outline"}
                    onClick={() => setMultipleMode(false)}
                    size="sm"
                  >
                    Viens tulkojums
                  </Button>
                  <Button
                    variant={multipleMode ? "default" : "outline"}
                    onClick={() => setMultipleMode(true)}
                    size="sm"
                  >
                    Vairāki tulkojumi
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Basic Settings */}
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center mb-6">
              <Languages className="w-6 h-6 text-indigo-600 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Pamata iestatījumi</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="locale" className="text-sm font-medium text-gray-700 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Valoda *
                </Label>
                <select
                  id="locale"
                  name="locale"
                  value={translation.locale}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  disabled={isEdit}
                >
                  <option value="lv">🇱🇻 Latviešu (LV)</option>
                  <option value="en">🇬🇧 English (EN)</option>
                  <option value="ru">🇷🇺 Русский (RU)</option>
                </select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="namespace" className="text-sm font-medium text-gray-700">
                  Namespace *
                </Label>
                <select
                  id="namespace"
                  name="namespace"
                  value={translation.namespace}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  disabled={isEdit}
                >
                  {namespaceOptions.map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Translation Content */}
          {!multipleMode ? (
            // Single translation mode
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-6">
                <Type className="w-6 h-6 text-green-600 mr-3" />
                <h3 className="text-xl font-semibold text-gray-900">Tulkojuma saturs</h3>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="key" className="text-sm font-medium text-gray-700">
                    Atslēga *
                  </Label>
                  <div className="relative">
                    <Type className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="key"
                      name="key"
                      value={translation.key}
                      onChange={handleChange}
                      placeholder="logo.text, search.placeholder, buttons.login..."
                      className="pl-12 py-3 text-base"
                      disabled={isEdit}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Piemēram: logo.text, search.placeholder, buttons.login
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="value" className="text-sm font-medium text-gray-700">
                    Tulkojums *
                  </Label>
                  <Textarea
                    id="value"
                    name="value"
                    value={translation.value}
                    onChange={handleChange}
                    placeholder="Ievadiet tulkojumu..."
                    className="w-full py-3 text-base"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Multiple translations mode
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Copy className="w-6 h-6 text-purple-600 mr-3" />
                  <h3 className="text-xl font-semibold text-gray-900">Vairāki tulkojumi</h3>
                </div>
                <Button
                  onClick={addEntry}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Pievienot vēl
                </Button>
              </div>

              <div className="space-y-4">
                {entries.map((entry, index) => (
                  <div key={index} className="flex gap-4 items-end p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Atslēga #{index + 1}
                      </Label>
                      <Input
                        value={entry.key}
                        onChange={(e) => handleEntryChange(index, 'key', e.target.value)}
                        placeholder="logo.text"
                        className="bg-white"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Tulkojums #{index + 1}
                      </Label>
                      <Input
                        value={entry.value}
                        onChange={(e) => handleEntryChange(index, 'value', e.target.value)}
                        placeholder="MartasMēbeles"
                        className="bg-white"
                      />
                    </div>
                    {entries.length > 1 && (
                      <Button
                        onClick={() => removeEntry(index)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  💡 <strong>Padoms:</strong> Visi tulkojumi tiks pievienoti ar iepriekš izvēlēto valodu un namespace.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-4 pt-8 border-t border-gray-200 mt-8">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 py-3 text-lg font-medium"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Saglabā...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-3" />
                {isEdit 
                  ? 'Saglabāt izmaiņas' 
                  : multipleMode 
                    ? `Pievienot ${entries.filter(e => e.key && e.value).length} tulkojumus`
                    : 'Pievienot tulkojumu'
                }
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            Atcelt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}