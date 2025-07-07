// src/app/admin/slider/page.tsx
'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash } from 'lucide-react'
import SliderModal from '../../../components/SliderModal'
import { useAlert } from '../../../../lib/store/alert'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function SliderAdminPage() {
  const { data, mutate } = useSWR('/api/slider', fetcher)
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sākumlapas slaideris</h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Pievienot slaidu
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.map((slide: any) => (
          <div key={slide.id} className="bg-white p-4 border rounded-md shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-semibold text-lg">{slide.title}</h2>
                <p className="text-sm text-gray-500">{slide.subtitle}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handleEdit(slide)}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="destructive" size="icon" onClick={() => handleDelete(slide.id)}>
                  <Trash className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <img src={slide.image_desktop} className="w-1/2 rounded-md border object-cover max-h-32" />
              <img src={slide.image_mobile} className="w-1/2 rounded-md border object-cover max-h-32" />
            </div>
          </div>
        ))}
      </div>

      <SliderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={selected}
        onSave={mutate}
      />
    </div>
  )
}
