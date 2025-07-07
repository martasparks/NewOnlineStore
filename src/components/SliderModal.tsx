'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useAlert } from '../../lib/store/alert'
import { Checkbox } from '@/components/ui/checkbox'

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
    show_text?: boolean
}

interface SliderModalProps {
  open: boolean
  onClose: () => void
  initialData?: Slide | null
  onSave: () => void
}

export default function SliderModal({ open, onClose, initialData, onSave }: SliderModalProps) {
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
    show_text: true,
  })  
  const { setAlert } = useAlert()

  useEffect(() => {
    if (initialData) {
      setSlide(initialData)
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
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSlide((prev) => ({ ...prev, [name]: name === 'order_index' ? +value : value }))
  }

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlide(prev => ({ ...prev, show_text: e.target.checked }))
  }

  const handleSubmit = async () => {
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

    setAlert('Slaids saglabāts', 'success')
    onSave()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Labot slaidu' : 'Pievienot slaidu'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
        <label className="flex items-center gap-2">
        <input type="checkbox" checked={slide.show_text} onChange={handleCheckbox} />
            Rādīt tekstu uz attēla
        </label>
          <Input name="title" value={slide.title} onChange={handleChange} placeholder="Virsraksts" />
          <Input name="subtitle" value={slide.subtitle} onChange={handleChange} placeholder="Virsraksts 2" />
          <Input name="description" value={slide.description} onChange={handleChange} placeholder="Apraksts" />
          <Input name="button_text" value={slide.button_text} onChange={handleChange} placeholder="Pogas teksts" />
          <Input name="button_url" value={slide.button_url} onChange={handleChange} placeholder="Pogas links" />
          <Input name="image_desktop" value={slide.image_desktop} onChange={handleChange} placeholder="Desktop attēla URL" />
          <Input name="image_mobile" value={slide.image_mobile} onChange={handleChange} placeholder="Mobile attēla URL" />
          <Input name="order_index" value={slide.order_index} onChange={handleChange} type="number" placeholder="Kārtas numurs" />
        </div>

        <div className="pt-4">
          <Button onClick={handleSubmit} className="w-full">
            Saglabāt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}