'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X, Upload } from 'lucide-react'
import { useAlert } from '@lib/store/alert'

interface ImageUploadSectionProps {
  images: string[]
  title: string
  onImagesChange: (images: string[]) => void
}

export default function ImageUploadSection({
  images,
  title,
  onImagesChange
}: ImageUploadSectionProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { setAlert } = useAlert()

  const handleImageUpload = async (files: FileList) => {
    setUploading(true)
    setUploadProgress(0)
    
    const fileArray = Array.from(files)
    const errors: string[] = []
    
    try {
      // Client-side validation first
      const validFiles = fileArray.filter(file => {
        if (!file.type.startsWith('image/')) {
          errors.push(`${file.name}: Nav attēla fails`)
          return false
        }
        if (file.size > 10 * 1024 * 1024) {
          errors.push(`${file.name}: Fails pārāk liels (max 10MB)`)
          return false
        }
        return true
      })

      if (validFiles.length === 0) {
        setAlert(errors.join(', '), 'error')
        return
      }

      // 🚀 PARALLEL UPLOAD - Upload all files simultaneously
      const uploadPromises = validFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'products')

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
            // Add timeout for faster failure detection
            signal: AbortSignal.timeout(30000) // 30s timeout
          })

          if (response.ok) {
            const data = await response.json()
            setUploadProgress(prev => prev + (100 / validFiles.length))
            return { success: true, url: data.url, fileName: file.name }
          } else {
            const error = await response.json()
            return { 
              success: false, 
              error: `${file.name}: ${error.error || 'Augšupielādes kļūda'}`,
              fileName: file.name 
            }
          }
        } catch {
          return { 
            success: false, 
            error: `${file.name}: Tīkla kļūda vai timeout`,
            fileName: file.name 
          }
        }
      })

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises)
      
      // Separate successful uploads from errors
      const successfulUploads = results
        .filter(result => result.success)
        .map(result => result.url)
        
      const uploadErrors = results
        .filter(result => !result.success)
        .map(result => result.error)

      // Update images with successful uploads
      if (successfulUploads.length > 0) {
        onImagesChange([...images, ...successfulUploads])
        
        const successMessage = successfulUploads.length === 1 
          ? '1 attēls augšupielādēts' 
          : `${successfulUploads.length} attēli augšupielādēti`
        setAlert(successMessage, 'success')
      }

      // Show errors if any
      if (uploadErrors.length > 0) {
        const errorMessage = uploadErrors.length === 1 
          ? uploadErrors[0] ?? 'Kļūda augšupielādē'
          : `${uploadErrors.length} kļūdas augšupielādē`
        setAlert(errorMessage, 'error')
      }

      // Show initial validation errors
      if (errors.length > 0) {
        setAlert(errors.join(', '), 'warning')
      }

    } catch (generalError) {
      console.error('Upload error:', generalError)
      setAlert('Neizdevās augšupielādēt attēlus', 'error')
    } finally {
      setUploading(false)
      setUploadProgress(0)
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

      {/* Upload zona */}
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
              {uploading ? `Augšupielādē... ${Math.round(uploadProgress)}%` : 'Izvēlieties failus'}
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            PNG, JPG, WebP līdz 10MB. Vairāki faili atļauti.
          </p>
          
          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
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
              <Image
                src={url}
                alt={`Attēls ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
                priority={index < 4} // Prioritize first 4 images
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
