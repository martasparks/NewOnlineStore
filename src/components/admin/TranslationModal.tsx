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
import { Pencil, Plus, Save, Languages, Globe, Type } from 'lucide-react'
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
    namespace: 'default',
  })
  const { isLoading, withLoading } = useLoading(false)
  const { setAlert } = useAlert()

  useEffect(() => {
    if (initialData) {
      setTranslation(initialData)
    } else {
      setTranslation({
        key: '',
        locale: 'lv',
        value: '',
        namespace: 'default',
      })
    }
  }, [initialData, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setTranslation((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    await withLoading(async () => {
      try {
        const method = isEdit ? 'PUT' : 'POST'
        const res = await fetch('/api/translations', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(translation),
        })

        const data = await res.json()

        if (!res.ok) {
          setAlert(data.error || 'Neizdevās saglabāt tulkojumu', 'error')
          return
        }

        setAlert('Tulkojums saglabāts veiksmīgi', 'success')
        onSave()
        onClose()
      } catch (error) {
        setAlert('Neizdevās saglabāt tulkojumu', 'error')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            {isEdit ? (
              <>
                <Pencil className="w-6 h-6 mr-3" />
                Labot tulkojumu
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 mr-3" />
                Pievienot tulkojumu
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <Languages className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Tulkojuma informācija</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="key" className="text-sm font-medium text-gray-700">
                  Atslēga *
                </Label>
                <div className="relative">
                  <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="key"
                    name="key"
                    value={translation.key}
                    onChange={handleChange}
                    placeholder="Header.search.placeholder"
                    className="pl-10"
                    disabled={isEdit}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locale" className="text-sm font-medium text-gray-700">
                  Valoda *
                </Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    id="locale"
                    name="locale"
                    value={translation.locale}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isEdit}
                  >
                    <option value="lv">Latviešu (LV)</option>
                    <option value="en">English (EN)</option>
                    <option value="ru">Русский (RU)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="namespace" className="text-sm font-medium text-gray-700">
                Namespace
              </Label>
              <Input
                id="namespace"
                name="namespace"
                value={translation.namespace}
                onChange={handleChange}
                placeholder="Header, Footer, Admin..."
                disabled={isEdit}
              />
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="value" className="text-sm font-medium text-gray-700">
                Tulkojums *
              </Label>
              <Textarea
                id="value"
                name="value"
                value={translation.value}
                onChange={handleChange}
                placeholder="Ievadiet tulkojumu..."
                className="w-full"
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Saglabā...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Saglabāt tulkojumu
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            size="lg"
          >
            Atcelt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
