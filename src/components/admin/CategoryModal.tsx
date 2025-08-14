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
import { Switch } from '@/components/ui/switch'
import { Pencil, Trash, Plus, Save, FolderPlus, Tags, Link2, Hash, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLoading } from '@hooks/useLoading';
import { useAlert } from '@lib/store/alert'
import { Loading } from "../ui/Loading"
import { Category, Subcategory } from '@lib/types'

interface CategoryModalProps {
  open: boolean
  onClose: () => void
  initialData?: Category | null
  onSave: () => void
}

export default function CategoryModal({
  open,
  onClose,
  initialData,
  onSave,
}: CategoryModalProps) {
  const isEdit = !!initialData
  const [category, setCategory] = useState({
    id: '',
    name: '',
    slug: '',
    url: '',
    meta_title: '',
    meta_description: '',
    order_index: 0,
    is_active: true,
  })
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [editingSub, setEditingSub] = useState<Subcategory | null>(null)
  const { isLoading, withLoading } = useLoading(false);

  const { setAlert } = useAlert()

  useEffect(() => {
  if (initialData) {
    console.log('Initial data received:', initialData)
    const { subitems, ...rest } = initialData

    if (!rest.id) {
      console.error('No ID found in initial data:', rest)
    }

    setCategory({
      id: rest.id || '',
      name: rest.name || '',
      slug: rest.slug || '',
      url: rest.url || '',
      meta_title: rest.meta_title || '',  // Handle optional
      meta_description: rest.meta_description || '',  // Handle optional
      order_index: rest.order_index || 0,
      is_active: rest.is_active ?? true,
    })
    setSubcategories(subitems || [])
  } else {
      setCategory({
        id: '',
        name: '',
        slug: '',
        url: '',
        meta_title: '',
        meta_description: '',
        order_index: 0,
        is_active: true,
      })
      setSubcategories([])
    }
  }, [initialData, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setCategory((prev) => ({
      ...prev,
      [name]: name === 'order_index' ? parseInt(value) : value,
    }))
  }

  const handleSubChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (!editingSub) return
    setEditingSub((prev) => ({
      ...prev!,
      [name]: name === 'order_index' ? parseInt(value) : value,
    }))
  }

  const handleSaveSub = () => {
    if (!editingSub?.name) return
    if (editingSub.id) {
      fetch('/api/navigation/subcategories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSub),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.id) {
            setAlert('Neizdevās saglabāt apakškategoriju', 'error')
            return
          }
          console.log('Updated subcategory:', data)
        })
        .catch(() => {
          console.error('Error updating subcategory')
          setAlert('Neizdevās atjaunināt apakškategoriju', 'error')
        })
      setSubcategories((subs) =>
        subs.map((s) => (s.id === editingSub.id ? editingSub : s))
      )
    } else {
      setSubcategories((subs) => [...subs, { ...editingSub!, id: undefined }])
    }
    setEditingSub(null)
  }

  const handleDeleteSub = (id?: string) => {
    if (!id) return
    setSubcategories((subs) => subs.filter((s) => s.id !== id))
    fetch('/api/navigation/subcategories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  const handleSubmit = async () => {
    await withLoading(async () => {
      console.log('Submitting category:', category)
      console.log('Is edit mode:', isEdit)
      console.log('Category ID:', category.id)

      if (isEdit && !category.id) {
        setAlert('Kļūda: kategorijas ID nav atrasts', 'error')
        return
      }

      try {
        if (!category.name || !category.slug) {
          setAlert('Lūdzu aizpildiet visus obligātos laukus', 'error')
          return
        }

        // Saglabājam kategoriju
        const res = await fetch('/api/navigation/categories', {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest' // Pievienojam CSRF header
          },
          body: JSON.stringify(category),
        })

        const savedCategory = await res.json()
        console.log('Server response:', savedCategory)

        if (!res.ok) {
          console.error('Error response:', savedCategory)
          setAlert(savedCategory.error || 'Neizdevās saglabāt kategoriju', 'error')
          return
        }

        const catId = savedCategory.id
        if (!catId) {
          setAlert('Kategorijas ID nav atrasts', 'error')
          return
        }

        // Saglabājam subkategorijas
        for (const sub of subcategories) {
          try {
            const method = sub.id ? 'PUT' : 'POST'
            const subResponse = await fetch('/api/navigation/subcategories', {
              method,
              headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest' // Pievienojam CSRF header
              },
              body: JSON.stringify({
                ...sub,
                category_id: catId,
              }),
            })

            const subData = await subResponse.json()
            
            if (!subResponse.ok) {
              console.error('Subcategory save error:', subData)
              setAlert(`Neizdevās saglabāt apakškategoriju "${sub.name}": ${subData.error}`, 'error')
              // Turpinām ar citām subkategorijām
            } else {
              console.log('Subcategory saved:', subData)
            }
          } catch (subError) {
            console.error('Subcategory save exception:', subError)
            setAlert(`Kļūda saglabājot apakškategoriju "${sub.name}"`, 'error')
          }
        }

        setAlert('Saglabāts veiksmīgi', 'success')
        onSave()
        onClose()
      } catch (error) {
        console.error('Submit error:', error)
        setAlert('Neizdevās saglabāt', 'error')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center">
            {isEdit ? (
              <>
                <Pencil className="w-6 h-6 mr-3" />
                Labot kategoriju
              </>
            ) : (
              <>
                <FolderPlus className="w-6 h-6 mr-3" />
                Pievienot kategoriju
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <Tags className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Pamata informācija</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Nosaukums
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={category.name}
                  onChange={handleChange}
                  placeholder="Kategorijas nosaukums"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium text-gray-700">
                  Slug
                </Label>
                <Input
                  id="slug"
                  name="slug"
                  value={category.slug}
                  onChange={handleChange}
                  placeholder="kategorija-slug"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url" className="text-sm font-medium text-gray-700">
                  URL
                </Label>
                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="url"
                    name="url"
                    value={category.url}
                    onChange={handleChange}
                    placeholder="/kategorija"
                    className="w-full pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_index" className="text-sm font-medium text-gray-700">
                  Kārtas numurs
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="order_index"
                    name="order_index"
                    value={category.order_index}
                    onChange={handleChange}
                    type="number"
                    placeholder="0"
                    className="w-full pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={category.is_active}
                onCheckedChange={(checked) => setCategory(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Kategorija ir aktīva
              </Label>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">SEO iestatījumi</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title" className="text-sm font-medium text-gray-700">
                  Meta nosaukums
                </Label>
                <Input
                  id="meta_title"
                  name="meta_title"
                  value={category.meta_title}
                  onChange={handleChange}
                  placeholder="SEO nosaukums"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description" className="text-sm font-medium text-gray-700">
                  Meta apraksts
                </Label>
                <Textarea
                  id="meta_description"
                  name="meta_description"
                  value={category.meta_description}
                  onChange={handleChange}
                  placeholder="SEO apraksts"
                  className="w-full"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FolderPlus className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Apakškategorijas ({subcategories.length})
                </h3>
              </div>
              <Button
                size="sm"
                onClick={() =>
                  setEditingSub({
                    name: '',
                    slug: '',
                    url: '',
                    icon: '',
                    meta_title: '',
                    meta_description: '',
                    order_index: 0,
                    is_active: true,
                  })
                }
                className="bg-gradient-to-r from-purple-500 to-purple-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Pievienot apakškategoriju
              </Button>
            </div>

            {subcategories.length > 0 ? (
              <div className="space-y-3">
                {subcategories.map((sub, index) => (
                  <div
                    key={sub.name + index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{sub.icon || '📁'}</span>
                      <div>
                        <p className="font-medium text-gray-900">{sub.name}</p>
                        <p className="text-sm text-gray-500">{sub.slug}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingSub(sub)}
                        className="hover:bg-blue-50"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteSub(sub.id)}
                        className="hover:bg-red-50 text-red-600"
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderPlus className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">Nav pievienotu apakškategoriju</p>
                <p className="text-sm text-gray-400">Pievienojiet apakškategorijas, lai organizētu saturu</p>
              </div>
            )}

            {editingSub && (
              <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <h4 className="text-lg font-semibold text-purple-900 mb-4">
                  {editingSub.id ? 'Labot apakškategoriju' : 'Pievienot apakškategoriju'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Nosaukums *</Label>
                    <Input
                      name="name"
                      value={editingSub.name}
                      onChange={handleSubChange}
                      placeholder="Apakškategorijas nosaukums"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Slug *</Label>
                    <Input
                      name="slug"
                      value={editingSub.slug}
                      onChange={handleSubChange}
                      placeholder="apakskategorija-slug"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">URL</Label>
                    <Input
                      name="url"
                      value={editingSub.url}
                      onChange={handleSubChange}
                      placeholder="/apakskategorija"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Ikona</Label>
                    <Input
                      name="icon"
                      value={editingSub.icon}
                      onChange={handleSubChange}
                      placeholder="🏷️"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Meta nosaukums</Label>
                    <Input
                      name="meta_title"
                      value={editingSub.meta_title}
                      onChange={handleSubChange}
                      placeholder="SEO nosaukums"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Kārtas numurs</Label>
                    <Input
                      name="order_index"
                      value={editingSub.order_index}
                      onChange={handleSubChange}
                      type="number"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Meta apraksts</Label>
                  <Textarea
                    name="meta_description"
                    value={editingSub.meta_description}
                    onChange={handleSubChange}
                    placeholder="SEO apraksts"
                    rows={2}
                  />
                </div>
                <div className="mt-6 flex gap-3">
                  <Button onClick={handleSaveSub} className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600">
                    <Save className="w-4 h-4 mr-2" />
                    Saglabāt apakškategoriju
                  </Button>
                  <Button variant="outline" onClick={() => setEditingSub(null)}>
                    Atcelt
                  </Button>
                </div>
              </div>
            )}
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
                <Loading size="sm" variant="spinner" />
                Saglabā...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Saglabāt visu
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