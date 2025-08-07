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
import { Pencil, Plus, Save, Image, FileText, Link2, Hash, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useLoading } from '@hooks/useLoading';
import { useAlert } from '../../lib/store/alert'

interface Slide {
  id?: string
  title: string
  subtitle: string
  description: string
  button_text: string
  button_url: string
  image_desktop: string
  image_mobile: string
  order_index: number
  is_active: boolean
  show_text: boolean
}

interface SliderModalProps {
  open: boolean
  onClose: () => void
  initialData?: Slide | null
  onSave: () => void
}

export default function SliderModal({
  open,
  onClose,
  initialData,
  onSave,
}: SliderModalProps) {
  const isEdit = !!initialData
  const [slide, setSlide] = useState<Slide>({
    title: '',
    subtitle: '',
    description: '',
    button_text: '',
    button_url: '',
    image_desktop: '',
    image_mobile: '',
    order_index: 0,
    is_active: true,
    show_text: true,
  })
  const { isLoading, withLoading } = useLoading(true);

  const { setAlert } = useAlert()

  const handleImageUpload = async (file: File, type: "desktop" | "mobile") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "slider");

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      setSlide(prev => ({
        ...prev,
        [type === "desktop" ? "image_desktop" : "image_mobile"]: data.url,
      }));
    } else {
      setAlert(data.error || "Neizdevās augšupielādēt attēlu", "error");
    }
  };

  useEffect(() => {
    if (initialData) {
      setSlide({
        id: initialData.id || '',
        title: initialData.title || '',
        subtitle: initialData.subtitle || '',
        description: initialData.description || '',
        button_text: initialData.button_text || '',
        button_url: initialData.button_url || '',
        image_desktop: initialData.image_desktop || '',
        image_mobile: initialData.image_mobile || '',
        order_index: initialData.order_index || 0,
        is_active: initialData.is_active ?? true,
        show_text: initialData.show_text ?? true,
      })
    } else {
      setSlide({
        title: '',
        subtitle: '',
        description: '',
        button_text: '',
        button_url: '',
        image_desktop: '',
        image_mobile: '',
        order_index: 0,
        is_active: true,
        show_text: true,
      })
    }
  }, [initialData, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSlide((prev) => ({
      ...prev,
      [name]: name === 'order_index' ? parseInt(value) : value,
    }))
  }

  const handleSubmit = async () => {
    await withLoading(async () => {
      try {
        const method = isEdit ? 'PUT' : 'POST'
        const res = await fetch('/api/slider', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slide),
        })

        const data = await res.json()

        if (!res.ok) {
          setAlert(data.error || 'Neizdevās saglabāt slaidu', 'error')
          return
        }

        setAlert('Slaids saglabāts veiksmīgi', 'success')
        onSave()
        onClose()
      } catch (error) {
        setAlert('Neizdevās saglabāt slaidu', 'error')
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
                Labot slaidu
              </>
            ) : (
              <>
                <Plus className="w-6 h-6 mr-3" />
                Pievienot slaidu
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Satura informācija</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Galvenais virsraksts *
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={slide.title}
                  onChange={handleChange}
                  placeholder="Galvenais virsraksts"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle" className="text-sm font-medium text-gray-700">
                  Apakšvirsraksts
                </Label>
                <Input
                  id="subtitle"
                  name="subtitle"
                  value={slide.subtitle}
                  onChange={handleChange}
                  placeholder="Apakšvirsraksts"
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                Apraksts
              </Label>
              <Textarea
                id="description"
                name="description"
                value={slide.description}
                onChange={handleChange}
                placeholder="Slaida apraksts"
                className="w-full"
                rows={3}
              />
            </div>

            <div className="mt-6 flex items-center space-x-2">
              <Switch
                id="show_text"
                checked={slide.show_text}
                onCheckedChange={(checked) => setSlide(prev => ({ ...prev, show_text: checked }))}
              />
              <Label htmlFor="show_text" className="text-sm font-medium text-gray-700">
                Rādīt tekstu uz attēla
              </Label>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <Link2 className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Pogas iestatījumi</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="button_text" className="text-sm font-medium text-gray-700">
                  Pogas teksts
                </Label>
                <Input
                  id="button_text"
                  name="button_text"
                  value={slide.button_text}
                  onChange={handleChange}
                  placeholder="Uzzināt vairāk"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="button_url" className="text-sm font-medium text-gray-700">
                  Pogas saite
                </Label>
                <Input
                  id="button_url"
                  name="button_url"
                  value={slide.button_url}
                  onChange={handleChange}
                  placeholder="/produkti"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <Image className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Attēlu iestatījumi</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div className="space-y-2">
              <Label>Attēls (Desktop)</Label>
              <Input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "desktop");
              }} />
              {slide.image_desktop && (
                <img src={slide.image_desktop} alt="Desktop preview" className="mt-2 rounded max-h-40" />
              )}
            </div>

            <div className="space-y-2">
              <Label>Attēls (Mobile)</Label>
              <Input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, "mobile");
              }} />
              {slide.image_mobile && (
                <img src={slide.image_mobile} alt="Mobile preview" className="mt-2 rounded max-h-40" />
              )}
            </div>

            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-4">
              <Eye className="w-5 h-5 text-orange-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Displeja iestatījumi</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_index" className="text-sm font-medium text-gray-700">
                  Kārtas numurs
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="order_index"
                    name="order_index"
                    value={slide.order_index}
                    onChange={handleChange}
                    type="number"
                    placeholder="0"
                    className="w-full pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-6">
                <Switch
                  id="is_active"
                  checked={slide.is_active}
                  onCheckedChange={(checked) => setSlide(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Slaids ir aktīvs
                </Label>
              </div>
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
                Saglabāt slaidu
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