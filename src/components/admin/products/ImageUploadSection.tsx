'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { useAlert } from '@lib/store/alert'

interface ImageUploadSectionProps {
  images: string[]
  type: 'images' | 'gallery'
  title: string
  onImagesChange: (images: string[]) => void
}

export default function ImageUploadSection({
  images,
  type,
  title,
  onImagesChange
}: ImageUploadSectionProps) {
  const [uploading, setUploading] = useState(false)
  const { setAlert } = useAlert()

  const handleImageUpload = async (files: FileList) => {
    setUploading(true)
    const uploadedUrls: string[] = []
    const errors: string[] = []

    try {
      for (const file of Array.from(files)) {
        // Klienta puses validācija
        if (!file.type.startsWith('image/')) {
          errors.push(`${file.name}: Nav attēla fails`)
          continue
        }

        if (file.size > 10 * 1024 * 1024) {
          errors.push(`${file.name}: Fails pārāk liels (max 10MB)`)
          continue
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'products')

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })

          if (response.ok) {
            const data = await response.json()
            uploadedUrls.push(data.url)
          } else {
            const error = await response.json()
            errors.push(`${file.name}: ${error.error || 'Augšupielādes kļūda'}`)
          }
        } catch (fileError) {
          errors.push(`${file.name}: Tīkla kļūda`)
        }
      }

      // Atjaunojam attēlus
      if (uploadedUrls.length > 0) {
        onImagesChange([...images, ...uploadedUrls])
        const successMessage = uploadedUrls.length === 1 
          ? '1 attēls augšupielādēts' 
          : `${uploadedUrls.length} attēli augšupielādēti`
        setAlert(successMessage, 'success')
      }

      // Rādām kļūdas
      if (errors.length > 0) {
        const errorMessage = errors.length === 1 
          ? errors[0] 
          : `${errors.length} kļūdas augšupielādē`
        setAlert(errorMessage, 'error')
      }

    } catch (error) {
      setAlert('Neizdevās augšupielādēt attēlus', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files)
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-gray-700">{title}</Label>
        <span className="text-xs text-gray-500">
          {images.length} attēl{images.length === 1 ? 's' : 'i'}
        </span>
      </div>

      {/* Upload zonā */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Velciet attēlus šeit vai
            </p>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.multiple = true
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files
                  if (files) handleImageUpload(files)
                }
                input.click()
              }}
            >
              {uploading ? 'Augšupielādē...' : 'Izvēlieties failus'}
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            PNG, JPG, WebP līdz 10MB. Vairāki faili atļauti.
          </p>
        </div>
      </div>

      {/* Attēlu saraksts */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative group bg-gray-50 rounded-lg overflow-hidden aspect-square"
            >
              <img
                src={url}
                alt={`Attēls ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => removeImage(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}